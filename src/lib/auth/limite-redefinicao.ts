import { createHmac } from "node:crypto";
import { executarNoBanco } from "../db/prisma";
import { logAviso, type ContextoLog } from "../auditoria/logger";

export type ResultadoLimiteRedefinicao = Readonly<{
  permitido: boolean;
  tentarNovamenteEmSegundos: number;
}>;

type Contador = {
  tentativas: number;
  esperaSegundos: number;
};

/**
 * Chamar antes de consultar o token e derivar a nova senha.
 * Compartilha a infraestrutura, com namespace próprio.
 * Não armazena token, senha ou identificador em texto aberto.
 * Falhas técnicas impedem prosseguir com a redefinição.
 */
export async function consumirTentativaRedefinicao(
  token: string,
  contexto: ContextoLog,
): Promise<ResultadoLimiteRedefinicao> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "CONTROLAR_TENTATIVAS_REDEFINICAO",
    modulo: "autenticacao",
    dependencia: "BANCO",
  };

  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
    throw new Error("EntradaLimiteRedefinicaoInvalida");
  }

  return executarNoBanco(ctx, async (prisma) => {
    const segredo = process.env.LOGIN_RATE_LIMIT_SECRET;

    if (!segredo || !/^[0-9a-f]{64}$/.test(segredo)) {
      logAviso(
        ctx,
        "CONFIGURACAO_LIMITE_REDEFINICAO_INVALIDA",
        "AUTH_LIMITE_CONFIGURACAO",
      );
      throw new Error("ConfiguracaoLimiteRedefinicaoInvalida");
    }

    const chave = Buffer.from(segredo, "hex");

    function identificar(tipo: string, valor: string): string {
      return createHmac("sha256", chave)
        .update(JSON.stringify(["mproj-redefinicao-v1", tipo, valor]))
        .digest("hex");
    }

    async function consumir(
      chaveHash: string,
      limite: number,
      janelaSegundos: number,
    ): Promise<Contador> {
      const linhas = await prisma.$queryRaw<Contador[]>`
        INSERT INTO public."LimiteTentativaLogin" AS atual (
          "chaveHash", "inicioJanela", "fimJanela",
          "tentativas", "atualizadoEm"
        )
        VALUES (
          ${chaveHash},
          statement_timestamp(),
          statement_timestamp() +
            (${janelaSegundos}::integer * interval '1 second'),
          1,
          statement_timestamp()
        )
        ON CONFLICT ("chaveHash") DO UPDATE SET
          "inicioJanela" = CASE
            WHEN atual."fimJanela" <= EXCLUDED."inicioJanela"
              THEN EXCLUDED."inicioJanela"
            ELSE atual."inicioJanela"
          END,
          "fimJanela" = CASE
            WHEN atual."fimJanela" <= EXCLUDED."inicioJanela"
              THEN EXCLUDED."fimJanela"
            ELSE atual."fimJanela"
          END,
          "tentativas" = CASE
            WHEN atual."fimJanela" <= EXCLUDED."inicioJanela"
              THEN 1
            ELSE LEAST(atual."tentativas" + 1, ${limite + 1}::integer)
          END,
          "atualizadoEm" = EXCLUDED."atualizadoEm"
        RETURNING
          "tentativas",
          GREATEST(
            1,
            CEIL(EXTRACT(
              EPOCH FROM ("fimJanela" - statement_timestamp())
            ))::integer
          ) AS "esperaSegundos"
      `;

      const contador = linhas[0];

      if (
        linhas.length !== 1 ||
        !contador ||
        !Number.isInteger(contador.tentativas) ||
        contador.tentativas < 1 ||
        contador.tentativas > limite + 1 ||
        !Number.isInteger(contador.esperaSegundos) ||
        contador.esperaSegundos < 1
      ) {
        throw new Error("ContadorRedefinicaoInconsistente");
      }

      return contador;
    }

    try {
      // Primeiro limita a quantidade de identificadores criados.
      const geral = await consumir(
        identificar("geral", "redefinicao"),
        30,
        60,
      );

      if (geral.tentativas > 30) {
        logAviso(
          ctx,
          "REDEFINICAO_LIMITE_GERAL_ATINGIDO",
          "AUTH_TENTATIVAS_EXCEDIDAS",
        );

        return {
          permitido: false,
          tentarNovamenteEmSegundos: geral.esperaSegundos,
        };
      }

      const individual = await consumir(
        identificar("token", token),
        5,
        15 * 60,
      );

      if (individual.tentativas > 5) {
        logAviso(
          ctx,
          "REDEFINICAO_LIMITE_LINK_ATINGIDO",
          "AUTH_TENTATIVAS_EXCEDIDAS",
        );

        return {
          permitido: false,
          tentarNovamenteEmSegundos: individual.esperaSegundos,
        };
      }

      return {
        permitido: true,
        tentarNovamenteEmSegundos: 0,
      };
    } finally {
      chave.fill(0);
    }
  });
}
