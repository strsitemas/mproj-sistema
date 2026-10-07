import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  logAviso,
  logErro,
  logInfo,
  type ContextoLog,
} from "@/lib/auditoria/logger";
import {
  autenticarUsuario,
  type EntradaLogin,
} from "@/lib/auth/login";
import {
  exigirOrigemPermitida,
  ErroOrigemRequisicao,
} from "@/lib/auth/origem";
import {
  gravarCookieSessao,
  removerCookieSessao,
} from "@/lib/auth/cookie";
import { revogarSessao } from "@/lib/auth/sessao";
import { consumirTentativaLogin } from "@/lib/auth/limite-login";
import { limparLimitesLoginExpirados } from "@/lib/auth/limpeza-limite-login";

export const runtime = "nodejs";

const MAXIMO_CORPO_BYTES = 4096;

class ErroEntradaLogin extends Error {
  constructor(readonly status: 400 | 413 | 415) {
    super("EntradaLoginInvalida");
    this.name = "ErroEntradaLogin";
  }
}

function responder(
  contexto: ContextoLog,
  status: number,
  mensagem?: string,
  esperaSegundos?: number,
): NextResponse {
  const resposta = NextResponse.json(
    {
      ok: status === 200,
      mensagem,
      requisicaoId: contexto.requisicaoId,
    },
    { status },
  );

  resposta.headers.set("Cache-Control", "no-store");
  resposta.headers.set("X-Request-Id", contexto.requisicaoId);

  if (esperaSegundos !== undefined) {
    resposta.headers.set("Retry-After", String(esperaSegundos));
  }

  return resposta;
}

async function lerEntrada(
  request: Request,
  contexto: ContextoLog,
): Promise<EntradaLogin> {
  const tipo = request.headers.get("content-type")
    ?.split(";")[0].trim().toLowerCase();

  if (tipo !== "application/json") {
    throw new ErroEntradaLogin(415);
  }

  const tamanhoDeclarado = request.headers.get("content-length");

  if (
    tamanhoDeclarado !== null &&
    (!/^\d+$/.test(tamanhoDeclarado) ||
      Number(tamanhoDeclarado) > MAXIMO_CORPO_BYTES)
  ) {
    throw new ErroEntradaLogin(413);
  }

  if (!request.body) throw new ErroEntradaLogin(400);

  const leitor = request.body.getReader();
  const partes: Uint8Array[] = [];
  let tamanho = 0;

  try {
    while (true) {
      const parte = await leitor.read();
      if (parte.done) break;

      tamanho += parte.value.byteLength;

      if (tamanho > MAXIMO_CORPO_BYTES) {
        try {
          await leitor.cancel();
        } catch (erro) {
          logErro(contexto, "LOGIN_CANCELAMENTO_CORPO_FALHOU", erro);
        }

        throw new ErroEntradaLogin(413);
      }

      partes.push(parte.value);
    }
  } finally {
    leitor.releaseLock();
  }

  let dados: unknown;

  try {
    const texto = new TextDecoder("utf-8", { fatal: true })
      .decode(Buffer.concat(partes));
    dados = JSON.parse(texto);
  } catch {
    throw new ErroEntradaLogin(400);
  }

  if (typeof dados !== "object" || dados === null || Array.isArray(dados)) {
    throw new ErroEntradaLogin(400);
  }

  const entrada = dados as Record<string, unknown>;

  if (
    typeof entrada.email !== "string" ||
    typeof entrada.senha !== "string" ||
    typeof entrada.empresaSlug !== "string" ||
    entrada.email.length > 254 ||
    entrada.senha.length > 256 ||
    entrada.empresaSlug.length > 100
  ) {
    throw new ErroEntradaLogin(400);
  }

  const email = entrada.email.trim().toLowerCase();
  const empresaSlug = entrada.empresaSlug.trim().toLowerCase();
  const tamanhoSenha = Array.from(entrada.senha).length;

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(empresaSlug) ||
    tamanhoSenha < 1 ||
    tamanhoSenha > 128
  ) {
    throw new ErroEntradaLogin(400);
  }

  return { email, senha: entrada.senha, empresaSlug };
}

export async function POST(request: Request): Promise<NextResponse> {
  const ctx: ContextoLog = {
    requisicaoId: randomUUID(),
    operacao: "LOGIN_HTTP",
    modulo: "autenticacao",
  };

  logInfo(ctx, "LOGIN_REQUISICAO_RECEBIDA");

  try {
    exigirOrigemPermitida(request, ctx);

    const entrada = await lerEntrada(request, ctx);
    const limite = await consumirTentativaLogin(entrada.email, ctx);

    if (!limite.permitido) {
      return responder(
        ctx,
        429,
        "Muitas tentativas. Aguarde antes de tentar novamente.",
        limite.tentarNovamenteEmSegundos,
      );
    }

    // Limpeza limitada a 100 registros por chamada permitida.
    // Sua falha é propagada antes de criar uma sessão.
    await limparLimitesLoginExpirados(ctx);

    const resultado = await autenticarUsuario(entrada, ctx);

    if (!resultado) {
      return responder(
        ctx,
        401,
        "Não foi possível entrar com os dados informados.",
      );
    }

    const identidade: ContextoLog = {
      ...ctx,
      empresaId: resultado.empresaId,
      usuarioId: resultado.usuarioId,
      entidadeId: resultado.sessaoId,
    };

    const resposta = responder(ctx, 200);

    try {
      await gravarCookieSessao(
        resultado.token,
        resultado.expiraEm,
        identidade,
      );
    } catch (erro) {
      logErro(identidade, "LOGIN_GRAVACAO_COOKIE_FALHOU", erro);

      try {
        const revogada = await revogarSessao(resultado.token, identidade);

        if (!revogada) {
          logAviso(
            identidade,
            "LOGIN_COMPENSACAO_SEM_ALTERACAO",
            "AUTH_REVOGACAO_NAO_CONFIRMADA",
          );
        }
      } catch (erroRevogacao) {
        logErro(
          identidade,
          "LOGIN_COMPENSACAO_SESSAO_FALHOU",
          erroRevogacao,
        );
      }

      try {
        await removerCookieSessao(identidade);
      } catch (erroRemocao) {
        logErro(
          identidade,
          "LOGIN_REMOCAO_COOKIE_APOS_FALHA_FALHOU",
          erroRemocao,
        );
      }

      throw erro;
    }

    logInfo(identidade, "LOGIN_HTTP_CONCLUIDO");
    return resposta;
  } catch (erro) {
    if (erro instanceof ErroOrigemRequisicao) {
      return responder(ctx, 403, "Requisição não permitida.");
    }

    if (erro instanceof ErroEntradaLogin) {
      logAviso(ctx, "LOGIN_HTTP_ENTRADA_RECUSADA", "AUTH_ENTRADA_INVALIDA");

      return responder(
        ctx,
        erro.status,
        "Formato da requisição inválido.",
      );
    }

    logErro(ctx, "LOGIN_HTTP_FALHOU", erro);

    return responder(
      ctx,
      503,
      "Não foi possível entrar agora. Tente novamente mais tarde.",
    );
  }
}
