import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  logErro,
  logInfo,
  type ContextoLog,
} from "@/lib/auditoria/logger";
import {
  exigirOrigemPermitida,
  ErroOrigemRequisicao,
} from "@/lib/auth/origem";
import {
  lerTokenSessao,
  removerCookieSessao,
} from "@/lib/auth/cookie";
import { revogarSessao } from "@/lib/auth/sessao";

export const runtime = "nodejs";

function responder(
  contexto: ContextoLog,
  status: number,
  mensagem?: string,
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
  return resposta;
}

/**
 * Não recebe token ou identidade no corpo da requisição.
 * O token vem exclusivamente do cookie.
 * Revogação e auditoria são executadas pelo serviço na mesma transação.
 * Falha de banco impede declarar o logout como concluído.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ctx: ContextoLog = {
    requisicaoId: randomUUID(),
    operacao: "LOGOUT_HTTP",
    modulo: "autenticacao",
  };

  logInfo(ctx, "LOGOUT_REQUISICAO_RECEBIDA");

  try {
    exigirOrigemPermitida(request, ctx);

    const token = await lerTokenSessao(ctx);
    const revogada = await revogarSessao(token, ctx);

    // Também limpa cookies de sessões ausentes, expiradas
    // ou já revogadas. Falhas técnicas do serviço são propagadas.
    await removerCookieSessao(ctx);

    logInfo(
      ctx,
      revogada
        ? "LOGOUT_HTTP_CONCLUIDO"
        : "LOGOUT_HTTP_CONCLUIDO_SEM_NOVA_REVOGACAO",
    );

    return responder(ctx, 200);
  } catch (erro) {
    if (erro instanceof ErroOrigemRequisicao) {
      return responder(ctx, 403, "Requisição não permitida.");
    }

    logErro(ctx, "LOGOUT_HTTP_FALHOU", erro);

    return responder(
      ctx,
      503,
      "Não foi possível concluir a saída agora. Tente novamente.",
    );
  }
}
