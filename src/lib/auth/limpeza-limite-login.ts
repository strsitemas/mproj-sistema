import { executarNoBanco } from "../db/prisma";
import {
  logAviso,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";

/**
 * Remove até 100 contadores expirados.
 * Uso interno; não disponibilizar como endpoint público.
 * Não remove sessões, usuários ou eventos de auditoria.
 * Falhas são registradas e propagadas.
 */
export async function limparLimitesLoginExpirados(
  contexto: ContextoLog,
): Promise<number> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "LIMPAR_LIMITES_LOGIN_EXPIRADOS",
    modulo: "autenticacao",
    dependencia: "BANCO",
  };

  return executarNoBanco(ctx, async (prisma) => {
    const removidos = await prisma.$executeRaw`
      WITH expirados AS (
        SELECT "chaveHash"
          FROM public."LimiteTentativaLogin"
         WHERE "fimJanela" <= statement_timestamp()
         ORDER BY "fimJanela", "chaveHash"
         LIMIT 100
         FOR UPDATE SKIP LOCKED
      )
      DELETE FROM public."LimiteTentativaLogin" AS atual
      USING expirados
      WHERE atual."chaveHash" = expirados."chaveHash"
        AND atual."fimJanela" <= statement_timestamp()
    `;

    if (
      !Number.isInteger(removidos) ||
      removidos < 0 ||
      removidos > 100
    ) {
      logAviso(
        ctx,
        "LIMPEZA_LOGIN_QUANTIDADE_INCONSISTENTE",
        "AUTH_LIMITE_INTEGRIDADE",
      );
      throw new Error("QuantidadeLimpezaLoginInconsistente");
    }

    if (removidos > 0) {
      logInfo(ctx, "CONTADORES_LOGIN_EXPIRADOS_REMOVIDOS");
    }

    return removidos;
  });
}
