import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  logAviso,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";
import { lerSessaoAtual } from "./cookie";
import type { SessaoAutenticada } from "./sessao";

export type AcessoPagina = Readonly<{
  sessao: SessaoAutenticada;
  contexto: ContextoLog;
}>;

/**
 * Usar no servidor, antes de consultar dados de uma página protegida.
 * Identidade e empresa são obtidas da sessão validada no banco.
 * Não substitui a autorização por módulo, perfil e alcance.
 * Serviços e rotas também deverão verificar seu próprio acesso.
 */
export async function exigirSessaoPagina(): Promise<AcessoPagina> {
  const ctx: ContextoLog = {
    requisicaoId: randomUUID(),
    operacao: "AUTENTICAR_PAGINA",
    modulo: "autenticacao",
  };

  // Falhas técnicas são registradas pelos serviços e propagadas.
  // Não convertê-las em ausência de sessão.
  const sessao = await lerSessaoAtual(ctx);

  if (!sessao) {
    logAviso(
      ctx,
      "PAGINA_ACESSO_SEM_SESSAO_VALIDA",
      "AUTH_SESSAO_OBRIGATORIA",
    );

    redirect("/login");
  }

  const contexto: ContextoLog = {
    ...ctx,
    empresaId: sessao.empresaId,
    usuarioId: sessao.usuarioId,
    entidadeId: sessao.sessaoId,
  };

  logInfo(contexto, "PAGINA_SESSAO_CONFIRMADA");

  return { sessao, contexto };
}
