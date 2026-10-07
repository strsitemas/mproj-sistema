import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import {
  executarComLog,
  logErro,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";

type EstadoBanco = {
  prisma: PrismaClient;
  pool: Pool;
};

const globalBanco = globalThis as typeof globalThis & {
  mprojBanco?: EstadoBanco;
};

let bancoProcesso: EstadoBanco | undefined;

function criarEstadoBanco(): EstadoBanco {
  const contexto: ContextoLog = {
    requisicaoId: randomUUID(),
    operacao: "INICIALIZAR_CLIENTE_PRISMA",
    modulo: "infraestrutura",
    dependencia: "BANCO",
  };

  let pool: Pool | undefined;

  try {
    if (typeof window !== "undefined") {
      throw new Error("ClienteBancoExclusivoDoServidor");
    }

    const conexao = process.env.DATABASE_URL;
    if (!conexao) {
      throw new Error("DatabaseUrlAusente");
    }

    const url = new URL(conexao);
    if (
      !["postgresql:", "postgres:"].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length <= 1
    ) {
      throw new Error("DatabaseUrlInvalida");
    }

    pool = new Pool({
      connectionString: conexao,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      application_name: "mproj-aplicacao",
    });

    // Falhas de clientes ociosos não pertencem a uma requisição ativa.
    // Recebem um identificador próprio, sem registrar a conexão ou SQL.
    pool.on("error", (erro: Error) => {
      logErro(
        {
          requisicaoId: randomUUID(),
          operacao: "MONITORAR_POOL_POSTGRESQL",
          modulo: "infraestrutura",
          dependencia: "BANCO",
        },
        "POOL_POSTGRESQL_FALHOU",
        erro,
      );
    });

    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({
      adapter,
      log: [],
    });

    // Criar o cliente não comprova conexão com o banco.
    // A conexão será utilizada pelas operações reais dos serviços.
    logInfo(contexto, "CLIENTE_PRISMA_CRIADO");

    return { prisma, pool };
  } catch (erro: unknown) {
    logErro(contexto, "INICIALIZACAO_PRISMA_FALHOU", erro);

    if (pool) {
      void pool.end().catch((erroEncerramento: unknown) => {
        logErro(
          contexto,
          "ENCERRAMENTO_POOL_APOS_FALHA_FALHOU",
          erroEncerramento,
        );
      });
    }

    throw erro;
  }
}

function obterPrisma(): PrismaClient {
  if (typeof window !== "undefined") {
    throw new Error("ClienteBancoExclusivoDoServidor");
  }

  const existente = bancoProcesso ?? globalBanco.mprojBanco;
  if (existente) {
    return existente.prisma;
  }

  const estado = criarEstadoBanco();
  bancoProcesso = estado;

  // Evita novos pools a cada recarga dos módulos em desenvolvimento.
  if (process.env.NODE_ENV !== "production") {
    globalBanco.mprojBanco = estado;
  }

  return estado.prisma;
}

/**
 * Ponto de entrada das operações reais dos serviços.
 * O contexto deve vir da requisição autenticada no servidor.
 * Não recebe nem registra senhas, SQL, argumentos ou resultados.
 * Erros são registrados e propagados ao chamador.
 *
 * Não concede autorização nem adiciona filtros de empresa.
 * Esses controles pertencem ao serviço que executa a operação.
 * Transações devem ser abertas dentro do callback quando necessárias.
 */
export async function executarNoBanco<T>(
  contexto: ContextoLog,
  executar: (prisma: PrismaClient) => Promise<T>,
): Promise<T> {
  return executarComLog(
    { ...contexto, dependencia: "BANCO" },
    async () => executar(obterPrisma()),
  );
}
