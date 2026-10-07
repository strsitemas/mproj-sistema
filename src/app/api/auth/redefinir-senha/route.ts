import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  logAviso,
  logErro,
  logInfo,
  type ContextoLog,
} from "@/lib/auditoria/logger";
import {
  exigirOrigemPermitida,
  ErroOrigemRequisicao,
} from "@/lib/auth/origem";
import {
  redefinirSenha,
  type EntradaRedefinicaoSenha,
} from "@/lib/auth/redefinir-senha";
import { consumirTentativaRedefinicao } from "@/lib/auth/limite-redefinicao";
import { limparLimitesLoginExpirados } from "@/lib/auth/limpeza-limite-login";

export const runtime = "nodejs";

const MAXIMO_CORPO_BYTES = 4096;

class ErroEntradaRedefinicao extends Error {
  constructor(
    readonly status: 400 | 413 | 415,
    readonly mensagemPublica = "Formato da requisição inválido.",
  ) {
    super("EntradaRedefinicaoInvalida");
    this.name = "ErroEntradaRedefinicao";
  }
}

function responder(
  contexto: ContextoLog,
  status: number,
  mensagem: string,
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
): Promise<EntradaRedefinicaoSenha> {
  const tipo = request.headers.get("content-type")
    ?.split(";")[0].trim().toLowerCase();

  if (tipo !== "application/json") {
    throw new ErroEntradaRedefinicao(415);
  }

  const declarado = request.headers.get("content-length");

  if (
    declarado !== null &&
    (!/^\d+$/.test(declarado) ||
      Number(declarado) > MAXIMO_CORPO_BYTES)
  ) {
    throw new ErroEntradaRedefinicao(413);
  }

  if (!request.body) throw new ErroEntradaRedefinicao(400);

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
          logErro(contexto, "REDEFINICAO_CANCELAMENTO_CORPO_FALHOU", erro);
        }

        throw new ErroEntradaRedefinicao(413);
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
    throw new ErroEntradaRedefinicao(400);
  }

  if (
    typeof dados !== "object" ||
    dados === null ||
    Array.isArray(dados)
  ) {
    throw new ErroEntradaRedefinicao(400);
  }

  const entrada = dados as Record<string, unknown>;

  if (
    typeof entrada.token !== "string" ||
    !/^[0-9a-f]{64}$/.test(entrada.token)
  ) {
    throw new ErroEntradaRedefinicao(
      400,
      "Link inválido. Solicite uma nova recuperação de acesso.",
    );
  }

  if (
    typeof entrada.novaSenha !== "string" ||
    typeof entrada.confirmacaoSenha !== "string" ||
    entrada.novaSenha.length > 256 ||
    entrada.confirmacaoSenha.length > 256
  ) {
    throw new ErroEntradaRedefinicao(400);
  }

  const quantidade = Array.from(entrada.novaSenha).length;

  if (quantidade < 15 || quantidade > 128) {
    throw new ErroEntradaRedefinicao(
      400,
      "A nova senha deve ter entre 15 e 128 caracteres.",
    );
  }

  // Preserva espaços e caracteres Unicode.
  if (entrada.novaSenha !== entrada.confirmacaoSenha) {
    throw new ErroEntradaRedefinicao(
      400,
      "A confirmação da senha não confere.",
    );
  }

  return {
    token: entrada.token,
    novaSenha: entrada.novaSenha,
  };
}

/**
 * Token e senhas vêm exclusivamente do corpo do POST.
 * A redefinição não cria uma sessão nem faz login automático.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ctx: ContextoLog = {
    requisicaoId: randomUUID(),
    operacao: "REDEFINIR_SENHA_HTTP",
    modulo: "autenticacao",
  };

  logInfo(ctx, "REDEFINICAO_REQUISICAO_RECEBIDA");

  try {
    exigirOrigemPermitida(request, ctx);

    const entrada = await lerEntrada(request, ctx);
    const limite = await consumirTentativaRedefinicao(entrada.token, ctx);

    if (!limite.permitido) {
      return responder(
        ctx,
        429,
        "Muitas tentativas. Aguarde antes de tentar novamente.",
        limite.tentarNovamenteEmSegundos,
      );
    }

    await limparLimitesLoginExpirados(ctx);

    const alterada = await redefinirSenha(entrada, ctx);

    if (!alterada) {
      return responder(
        ctx,
        400,
        "Este link está inválido, expirou ou já foi utilizado. Solicite uma nova recuperação de acesso.",
      );
    }

    logInfo(ctx, "REDEFINICAO_HTTP_CONCLUIDA");

    return responder(
      ctx,
      200,
      "Senha alterada com sucesso. Entre novamente com sua nova senha.",
    );
  } catch (erro) {
    if (erro instanceof ErroOrigemRequisicao) {
      return responder(ctx, 403, "Requisição não permitida.");
    }

    if (erro instanceof ErroEntradaRedefinicao) {
      logAviso(
        ctx,
        "REDEFINICAO_HTTP_ENTRADA_RECUSADA",
        "AUTH_ENTRADA_INVALIDA",
      );

      return responder(ctx, erro.status, erro.mensagemPublica);
    }

    logErro(ctx, "REDEFINICAO_HTTP_FALHOU", erro);

    return responder(
      ctx,
      503,
      "Não foi possível concluir a alteração agora. Tente novamente mais tarde.",
    );
  }
}
