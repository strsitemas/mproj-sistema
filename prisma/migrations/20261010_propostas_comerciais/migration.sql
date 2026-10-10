-- CreateEnum
CREATE TYPE "StatusPropostaComercial" AS ENUM ('RASCUNHO', 'ENVIADA', 'APROVADA', 'REJEITADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "PropostaComercial" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "projetoId" UUID,
    "codigo" VARCHAR(80) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "status" "StatusPropostaComercial" NOT NULL DEFAULT 'RASCUNHO',
    "moeda" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "valorTotalCentavos" BIGINT NOT NULL DEFAULT 0,
    "aprovadoPorVinculoId" UUID,
    "aprovadoEm" TIMESTAMPTZ(3),
    "convertidoEm" TIMESTAMPTZ(3),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "PropostaComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPropostaComercial" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "propostaId" UUID NOT NULL,
    "descricao" VARCHAR(300) NOT NULL,
    "tipoProfissional" VARCHAR(160),
    "horasPrevistas" DECIMAL(18,2) NOT NULL,
    "valorHoraCentavos" BIGINT NOT NULL,
    "valorTotalCentavos" BIGINT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ItemPropostaComercial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropostaComercial_empresaId_clienteId_status_idx" ON "PropostaComercial"("empresaId", "clienteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PropostaComercial_empresaId_id_key" ON "PropostaComercial"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PropostaComercial_empresaId_codigo_key" ON "PropostaComercial"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "PropostaComercial_empresaId_projetoId_key" ON "PropostaComercial"("empresaId", "projetoId");

-- CreateIndex
CREATE INDEX "ItemPropostaComercial_empresaId_propostaId_ordem_idx" ON "ItemPropostaComercial"("empresaId", "propostaId", "ordem");

-- AddForeignKey
ALTER TABLE "PropostaComercial" ADD CONSTRAINT "PropostaComercial_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PropostaComercial" ADD CONSTRAINT "PropostaComercial_empresaId_clienteId_fkey" FOREIGN KEY ("empresaId", "clienteId") REFERENCES "Cliente"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PropostaComercial" ADD CONSTRAINT "PropostaComercial_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ItemPropostaComercial" ADD CONSTRAINT "ItemPropostaComercial_empresaId_propostaId_fkey" FOREIGN KEY ("empresaId", "propostaId") REFERENCES "PropostaComercial"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
