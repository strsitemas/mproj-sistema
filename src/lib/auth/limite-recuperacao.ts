import { createHmac } from "node:crypto";
import { executarNoBanco } from "../db/prisma";
import { logAviso, type ContextoLog } from "../auditoria/logger";

export type ResultadoLimiteRecuperacao = Readonly<{
  permitido: boolean;
  tentarNovamenteEmSegundos: number;
}>;

type Contador = {
  tentativas: number;
  esperaSegundos: number;
};

/**
 * Executar antes de consultar se o usuário existe.
 * Usa a tabela existente, com namespace exclusivo da recuperação.
 * Conta solicitações independentemente de cadastro ou resultado do envio.
 * Falha técnica impede continuar a operação.
 */
export async function consumirTentativaRecuperacao(
  emailRecebido: string,
  contexto: ContextoLog,
): Promise<ResultadoLimiteRecuperacao> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "CONTROLAR_TENTATIVAS_RECUPERACAO",
    modulo: "autenticacao",
    dependencia: "BANCO",
  };

  return executarNoBanco(ctx, async (prisma) => {
    if (
      typeof emailRecebido !== "string" ||
      emailRecebido.length > 254
    ) {
      throw new Error("EntradaLimiteRecuperacaoInvalida");
    }

    const email = emailRecebido.trim().toLowerCase();

    if (
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/
        .test(email)
    ) {
      throw new Error("EntradaLimiteRecuperacaoInvalida");
    }

    const segredo = process.env.LOGIN_RATE_LIMIT_SECRET;

    if (!segredo || !/^[0-9a-f]{64}$/.test(segredo)) {
      throw new Error("ConfiguracaoLimiteRecuperacaoInvalida");
    }

    const chaveSecreta = Buffer.from(segredo, "hex");

    function proteger(tipo: string, valor: string): string {
      return createHmac("sha256", chaveSecreta)
        .update(JSON.stringify(["mproj-recuperacao-v1", tipo, valor]))
        .digest("hex");
    }

    async function consumir(
      chaveHash: string,
      limite: number,
      janelaSegundos: number,
    ): Promise<Contador> {
      const linhas = await prisma.$queryRaw<Contador[]>`
        INSERT INTO public."LimiteTentativaLogin" AS atual (
          "chaveHash",
          "inicioJanela",
          "fimJanela",
          "tentativas",
          "atualizadoEm"
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
        throw new Error("ContadorRecuperacaoInconsistente");
      }

      return contador;
    }

    try {
      // Limita também a criação de contadores para e-mails diferentes.
      const geral = await consumir(
        proteger("geral", "recuperacao"),
        30,
        60,
      );

      if (geral.tentativas > 30) {
        logAviso(
          ctx,
          "RECUPERACAO_LIMITE_GERAL_ATINGIDO",
          "AUTH_TENTATIVAS_EXCEDIDAS",
        );

        return {
          permitido: false,
          tentarNovamenteEmSegundos: geral.esperaSegundos,
        };
      }

      // Um único limite por e-mail, mesmo em empresas diferentes.
      const individual = await consumir(
        proteger("email", email),
        3,
        30 * 60,
      );

      if (individual.tentativas > 3) {
        logAviso(
          ctx,
          "RECUPERACAO_LIMITE_EMAIL_ATINGIDO",
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
      chaveSecreta.fill(0);
    }
  });
}
