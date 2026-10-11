-- CreateEnum
CREATE TYPE "StatusServicoCatalogo" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'INATIVO');

-- AlterEnum
ALTER TYPE "TipoObjetoAprovacao" ADD VALUE 'SERVICO';

-- CreateTable
CREATE TABLE "CategoriaServico" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CategoriaServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaServico" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DisciplinaServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "categoriaId" UUID NOT NULL,
    "disciplinaId" UUID,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "status" "StatusServicoCatalogo" NOT NULL DEFAULT 'PENDENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaServico_empresaId_id_key" ON "CategoriaServico"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaServico_empresaId_nome_key" ON "CategoriaServico"("empresaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaServico_empresaId_id_key" ON "DisciplinaServico"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaServico_empresaId_nome_key" ON "DisciplinaServico"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "Servico_empresaId_status_ativo_idx" ON "Servico"("empresaId", "status", "ativo");

-- CreateIndex
CREATE INDEX "Servico_empresaId_categoriaId_idx" ON "Servico"("empresaId", "categoriaId");

-- CreateIndex
CREATE INDEX "Servico_empresaId_disciplinaId_idx" ON "Servico"("empresaId", "disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Servico_empresaId_id_key" ON "Servico"("empresaId", "id");

-- AddForeignKey
ALTER TABLE "CategoriaServico" ADD CONSTRAINT "CategoriaServico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DisciplinaServico" ADD CONSTRAINT "DisciplinaServico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_empresaId_categoriaId_fkey" FOREIGN KEY ("empresaId", "categoriaId") REFERENCES "CategoriaServico"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_empresaId_disciplinaId_fkey" FOREIGN KEY ("empresaId", "disciplinaId") REFERENCES "DisciplinaServico"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
