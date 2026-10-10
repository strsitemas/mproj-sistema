import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { lerSessaoAtual } from "@/lib/auth/cookie";
import {
  exigirOrigemPermitida,
  ErroOrigemRequisicao,
} from "@/lib/auth/origem";
import {
  logAviso,
  logErro,
  logInfo,
  type ContextoLog,
} from "@/lib/auditoria/logger";
import { cadastrarPropostaComercial } from "@/lib/propostas-comerciais/servico";

export const runtime = "nodejs";

const LIMITE_CORPO = 64 * 1024;

function responder(
  ctx: ContextoLog,
  status: number,
  dados: Record<string, unknown>,
): NextResponse {
  const resposta = NextResponse.json(
    { ...dados, requisicaoId: ctx.requisicaoId },
    { status },
  );

  resposta.headers.set("Cache-Control", "no-store");
  resposta.headers.set("X-Request-Id", ctx.requisicaoId);

  return resposta;
}

async function lerCorpo(request: Request): Promise<unknown> {
  const tipo = request.headers.get("content-type")
    ?.split(";")[0].trim().toLowerCase();

  if (tipo !== "application/json") {
    throw new Error("TipoConteudoInvalido");
  }

  const tamanhoDeclarado = request.headers.get("content-length");

  if (
    tamanhoDeclarado !== null &&
    (!/^\d+$/.test(tamanhoDeclarado) ||
      !Number.isSafeInteger(Number(tamanhoDeclarado)) ||
      Number(tamanhoDeclarado) > LIMITE_CORPO)
  ) {
    throw new Error("CorpoMuitoGrande");
  }

  if (!request.body) {
    throw new Error("CorpoInvalido");
  }

  const leitor = request.body.getReader();
  const partes: Uint8Array[] = [];
  let tamanho = 0;

  try {
    while (true) {
      const parte = await leitor.read();

      if (parte.done) break;

      tamanho += parte.value.byteLength;

      if (tamanho > LIMITE_CORPO) {
        try {
          await leitor.cancel();
        } catch {
          // O limite continua sendo aplicado mesmo se o cancelamento falhar.
        }

        throw new Error("CorpoMuitoGrande");
      }

      partes.push(parte.value);
    }
  } finally {
    leitor.releaseLock();
  }

  try {
    const texto = new TextDecoder("utf-8", { fatal: true })
      .decode(Buffer.concat(partes));

    return JSON.parse(texto) as unknown;
  } catch {
    throw new Error("CorpoInvalido");
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const ctx: ContextoLog = {
    requisicaoId: randomUUID(),
    operacao: "CADASTRAR_PROPOSTA_COMERCIAL_HTTP",
    modulo: "propostas-comerciais",
  };

  logInfo(ctx, "CADASTRO_PROPOSTA_HTTP_RECEBIDO");

  try {
    exigirOrigemPermitida(request, ctx);

    const sessao = await lerSessaoAtual(ctx);

    if (!sessao) {
      logAviso(
        ctx,
        "CADASTRO_PROPOSTA_SESSAO_INVALIDA",
        "AUTH_SESSAO_INVALIDA",
      );

      return responder(ctx, 401, {
        ok: false,
        mensagem: "Sessão inválida.",
      });
    }

    const entrada = await lerCorpo(request);
    const proposta = await cadastrarPropostaComercial(
      sessao,
      ctx,
      entrada,
    );

    logInfo(
      {
        ...ctx,
        empresaId: sessao.empresaId,
        usuarioId: sessao.usuarioId,
        entidadeId: proposta.id,
      },
      "CADASTRO_PROPOSTA_HTTP_CONCLUIDO",
    );

    return responder(ctx, 201, {
      ok: true,
      proposta,
    });
  } catch (erro) {
    if (erro instanceof ErroOrigemRequisicao) {
      return responder(ctx, 403, {
        ok: false,
        mensagem: "Origem não permitida.",
      });
    }

    if (erro instanceof Error && erro.message === "AcessoNegado") {
      return responder(ctx, 403, {
        ok: false,
        mensagem: "Acesso negado.",
      });
    }

    if (erro instanceof Error && erro.message === "TipoConteudoInvalido") {
      return responder(ctx, 415, {
        ok: false,
        mensagem: "Utilize application/json.",
      });
    }

    if (erro instanceof Error && erro.message === "CorpoMuitoGrande") {
      return responder(ctx, 413, {
        ok: false,
        mensagem: "Requisição muito grande.",
      });
    }

    if (erro instanceof Error && erro.message === "CorpoInvalido") {
      logAviso(
        ctx,
        "CADASTRO_PROPOSTA_ENTRADA_INVALIDA",
        "HTTP_ENTRADA_INVALIDA",
      );

      return responder(ctx, 400, {
        ok: false,
        mensagem: "Corpo da requisição inválido.",
      });
    }

    if (
      erro instanceof Error &&
      erro.message === "ClientePropostaNaoEncontrado"
    ) {
      return responder(ctx, 404, {
        ok: false,
        mensagem: "Cliente não encontrado ou indisponível.",
      });
    }

    if (
      erro instanceof Error &&
      (
        erro.message === "DadosPropostaInvalidos" ||
        erro.message === "CampoPropostaNaoPermitido" ||
        erro.message.startsWith("CampoPropostaInvalido:") ||
        erro.message === "ClientePropostaInvalido" ||
        erro.message === "ItensPropostaInvalidos"
      )
    ) {
      logAviso(
        ctx,
        "CADASTRO_PROPOSTA_DADOS_INVALIDOS",
        "HTTP_ENTRADA_INVALIDA",
      );

      return responder(ctx, 400, {
        ok: false,
        mensagem: "Dados da proposta inválidos.",
      });
    }

    logErro(ctx, "CADASTRO_PROPOSTA_HTTP_FALHOU", erro);

    return responder(ctx, 503, {
      ok: false,
      mensagem: "Não foi possível cadastrar a proposta comercial.",
    });
  }
}