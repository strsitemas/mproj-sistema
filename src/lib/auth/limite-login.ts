import { createHmac } from "node:crypto";
import { executarNoBanco } from "../db/prisma";
import { logAviso, type ContextoLog } from "../auditoria/logger";

export type ResultadoLimiteLogin = Readonly<{
  permitido: boolean;
  tentarNovamenteEmSegundos: number;
}>;

type ContadorLogin = {
  tentativas: number;
  esperaSegundos: number;
};

const LIMITE_EMAIL = 5;
const JANELA_EMAIL_SEGUNDOS = 15 * 60;
const LIMITE_GERAL = 100;
const JANELA_GERAL_SEGUNDOS = 60;

/**
 * Conta chamadas antes da verificação da senha, inclusive as bem-sucedidas.
 * Não consulta se o usuário existe.
 * Falhas técnicas são propagadas: a rota não deverá continuar o login.
 * O controle só estará ativo quando a rota chamar este serviço.
 */
export async function consumirTentativaLogin(
  emailRecebido: string,
  contexto: ContextoLog,
): Promise<ResultadoLimiteLogin> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "CONTROLAR_TENTATIVAS_LOGIN",
    modulo: "autenticacao",
    dependencia: "BANCO",
  };

  return executarNoBanco(ctx, async (prisma) => {
    if (
      typeof emailRecebido !== "string" ||
      emailRecebido.length > 254
    ) {
      logAviso(ctx, "LIMITE_LOGIN_ENTRADA_INVALIDA", "AUTH_ENTRADA_INVALIDA");
      throw new Error("EntradaLimiteLoginInvalida");
    }

    const email = emailRecebido.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logAviso(ctx, "LIMITE_LOGIN_ENTRADA_INVALIDA", "AUTH_ENTRADA_INVALIDA");
      throw new Error("EntradaLimiteLoginInvalida");
    }

    const segredo = process.env.LOGIN_RATE_LIMIT_SECRET;

    if (!segredo || !/^[0-9a-f]{64}$/.test(segredo)) {
      logAviso(
        ctx,
        "CONFIGURACAO_LIMITE_LOGIN_INVALIDA",
        "AUTH_LIMITE_CONFIGURACAO",
      );
      throw new Error("ConfiguracaoLimiteLoginInvalida");
    }

    const chaveSecreta = Buffer.from(segredo, "hex");

    function protegerIdentificador(tipo: string, valor: string): string {
      return createHmac("sha256", chaveSecreta)
        .update(JSON.stringify(["mproj-login-v1", tipo, valor]))
        .digest("hex");
    }

    async function consumir(
      chaveHash: string,
      limite: number,
      janelaSegundos: number,
    ): Promise<ContadorLogin> {
      // O relógio é do banco. EXCLUDED contém o início desta operação.
      // O contador satura em limite + 1, evitando crescimento ilimitado.
      const linhas = await prisma.$queryRaw<ContadorLogin[]>`
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
        logAviso(
          ctx,
          "CONTADOR_LOGIN_INCONSISTENTE",
          "AUTH_LIMITE_INTEGRIDADE",
        );
        throw new Error("ContadorLoginInconsistente");
      }

      return contador;
    }

    try {
      // O limite geral vem primeiro para limitar também a criação
      // de registros para endereços diferentes.
      const geral = await consumir(
        protegerIdentificador("geral", "autenticacao"),
        LIMITE_GERAL,
        JANELA_GERAL_SEGUNDOS,
      );

      if (geral.tentativas > LIMITE_GERAL) {
        logAviso(
          ctx,
          "LOGIN_LIMITE_GERAL_ATINGIDO",
          "AUTH_TENTATIVAS_EXCEDIDAS",
        );

        return {
          permitido: false,
          tentarNovamenteEmSegundos: geral.esperaSegundos,
        };
      }

      const individual = await consumir(
        protegerIdentificador("email", email),
        LIMITE_EMAIL,
        JANELA_EMAIL_SEGUNDOS,
      );

      if (individual.tentativas > LIMITE_EMAIL) {
        logAviso(
          ctx,
          "LOGIN_LIMITE_EMAIL_ATINGIDO",
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
