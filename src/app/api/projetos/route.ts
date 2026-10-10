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
import { cadastrarProjeto } from "@/lib/projetos/servico";

export const runtime = "nodejs";

const LIMITE_CORPO = 4096;

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
          throw new Error("FalhaCancelamentoCorpo");
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
    operacao: "CADASTRAR_PROJETO_HTTP",
    modulo: "projetos",
  };

  logInfo(ctx, "CADASTRO_PROJETO_HTTP_RECEBIDO");

  try {
    exigirOrigemPermitida(request, ctx);

    const sessao = await lerSessaoAtual(ctx);

    if (!sessao) {
      logAviso(ctx, "CADASTRO_PROJETO_SESSAO_INVALIDA", "AUTH_SESSAO_INVALIDA");

      return responder(ctx, 401, {
        ok: false,
        mensagem: "Sessão inválida.",
      });
    }

    const entrada = await lerCorpo(request);
    const projeto = await cadastrarProjeto(sessao, ctx, entrada);

    logInfo(
      {
        ...ctx,
        empresaId: sessao.empresaId,
        usuarioId: sessao.usuarioId,
        entidadeId: projeto.id,
      },
      "CADASTRO_PROJETO_HTTP_CONCLUIDO",
    );

    return responder(ctx, 201, {
      ok: true,
      projeto,
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

    if (
      erro instanceof Error &&
      (
        erro.message === "CorpoInvalido" ||
        erro.message === "DadosProjetoInvalidos" ||
        erro.message === "CamposProjetoNaoPermitidos" ||
        erro.message === "ClienteProjetoInvalido" ||
        erro.message === "NomeProjetoInvalido" ||
        erro.message === "DescricaoProjetoInvalida"
      )
    ) {
      logAviso(ctx, "CADASTRO_PROJETO_ENTRADA_INVALIDA", "HTTP_ENTRADA_INVALIDA");

      return responder(ctx, 400, {
        ok: false,
        mensagem: "Dados do projeto inválidos.",
      });
    }

    if (
      erro instanceof Error &&
      erro.message === "ClienteProjetoNaoEncontrado"
    ) {
      return responder(ctx, 404, {
        ok: false,
        mensagem: "Cliente não encontrado ou indisponível.",
      });
    }

    logErro(ctx, "CADASTRO_PROJETO_HTTP_FALHOU", erro);

    return responder(ctx, 503, {
      ok: false,
      mensagem: "Não foi possível cadastrar o projeto.",
    });
  }
}