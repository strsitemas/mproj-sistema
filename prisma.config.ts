import { existsSync } from "node:fs";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Variáveis já definidas pelo ambiente têm prioridade.
// Em publicação, as credenciais serão fornecidas pelo ambiente.
if (existsSync(".env.local")) {
  const resultado = config({
    path: ".env.local",
    override: false,
    quiet: true,
  });

  if (resultado.error) {
    console.error(JSON.stringify({
      nivel: "ERROR",
      evento: "CONFIGURACAO_AMBIENTE_FALHOU",
      operacao: "CARREGAR_AMBIENTE_PRISMA",
    }));

    throw new Error("Falha ao carregar o ambiente local do Prisma.");
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || undefined,
  },
});
