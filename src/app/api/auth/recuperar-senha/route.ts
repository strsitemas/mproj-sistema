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
import { solicitarRecuperacao } from "@/lib/auth/solicitar-recuperacao";
import { consumirTentativaRecuperacao } from "@/lib/auth/limite-recuperacao";
import { limparLimitesLoginExpirados } from "@/lib/auth/limpeza-limite-login";

export const runtime = "nodejs";

const MAXIMO_CORPO_BYTES = 4096;

class ErroEntradaRecuperacao extends Error {
  constructor(readonly status: 400 | 413 | 415) {
    super("EntradaRecuperacaoInvalida");
    this.name = "ErroEntradaRecuperacao";
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
      ok: status === 202,
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
): Promise<{ email: string; empresaSlug: string }> {
  const tipo = request.headers.get("content-type")
    ?.split(";")[0].trim().toLowerCase();

  if (tipo !== "application/json") {
    throw new ErroEntradaRecuperacao(415);
  }

  const declarado = request.headers.get("content-length");

  if (
    declarado !== null &&
    (!/^\d+$/.test(declarado) ||
      Number(declarado) > MAXIMO_CORPO_BYTES)
  ) {
    throw new ErroEntradaRecuperacao(413);
  }

  if (!request.body) throw new ErroEntradaRecuperacao(400);

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
          logErro(contexto, "RECUPERACAO_CANCELAMENTO_CORPO_FALHOU", erro);
        }

        throw new ErroEntradaRecuperacao(413);
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
    throw new ErroEntradaRecuperacao(400);
  }

  if (
    typeof dados !== "object" ||
    dados === null ||
    Array.isArray(dados)
  ) {
    throw new ErroEntradaRecuperacao(400);
  }

  const entrada = dados as Record<string, unknown>;

  if (
    typeof entrada.email !== "string" ||
    typeof entrada.empresaSlug !== "string" ||
    entrada.email.length > 254 ||
    entrada.empresaSlug.length > 100
  ) {
    throw new ErroEntradaRecuperacao(400);
  }

  const email = entrada.email.trim().toLowerCase();
  const empresaSlug = entrada.empresaSlug.trim().toLowerCase();

  if (
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/
      .test(email) ||
    !/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(empresaSlug)
  ) {
    throw new ErroEntradaRecuperacao(400);
  }

  return { email, empresaSlug };
}

/**
 * Não recebe senha, token ou identidade de usuário.
 * A resposta não informa se existe cadastro para os dados recebidos.
 * Aceitação da solicitação não confirma entrega do e-mail.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ctx: ContextoLog = {
    requisicaoId: randomUUID(),
    operacao: "RECUPERAR_SENHA_HTTP",
    modulo: "autenticacao",
  };

  logInfo(ctx, "RECUPERACAO_REQUISICAO_RECEBIDA");

  try {
    exigirOrigemPermitida(request, ctx);

    const entrada = await lerEntrada(request, ctx);

    // Antes de consultar a existência do usuário ou enviar e-mail.
    const limite = await consumirTentativaRecuperacao(entrada.email, ctx);

    if (!limite.permitido) {
      return responder(
        ctx,
        429,
        "Muitas tentativas. Aguarde antes de tentar novamente.",
        limite.tentarNovamenteEmSegundos,
      );
    }

    // A limpeza atende também os contadores de recuperação.
    await limparLimitesLoginExpirados(ctx);
    await solicitarRecuperacao(entrada, ctx);

    logInfo(ctx, "RECUPERACAO_HTTP_PROCESSADA");

    return responder(
      ctx,
      202,
      "Se os dados corresponderem a um cadastro ativo, você receberá um e-mail com as instruções de recuperação.",
    );
  } catch (erro) {
    if (erro instanceof ErroOrigemRequisicao) {
      return responder(ctx, 403, "Requisição não permitida.");
    }

    if (erro instanceof ErroEntradaRecuperacao) {
      logAviso(
        ctx,
        "RECUPERACAO_HTTP_ENTRADA_RECUSADA",
        "AUTH_ENTRADA_INVALIDA",
      );

      return responder(
        ctx,
        erro.status,
        "Formato da requisição inválido.",
      );
    }

    logErro(ctx, "RECUPERACAO_HTTP_FALHOU", erro);

    return responder(
      ctx,
      503,
      "Não foi possível processar a solicitação agora. Tente novamente mais tarde.",
    );
  }
}
