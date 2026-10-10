-- CreateTable
CREATE TABLE "ContadorCodigoProposta" (
    "empresaId" UUID NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContadorCodigoProposta_pkey" PRIMARY KEY ("empresaId")
);

-- AddForeignKey
ALTER TABLE "ContadorCodigoProposta" ADD CONSTRAINT "ContadorCodigoProposta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
