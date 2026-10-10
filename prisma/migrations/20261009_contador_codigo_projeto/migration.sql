-- CreateTable
CREATE TABLE "ContadorCodigoProjeto" (
    "clienteId" UUID NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContadorCodigoProjeto_pkey" PRIMARY KEY ("clienteId")
);

-- AddForeignKey
ALTER TABLE "ContadorCodigoProjeto" ADD CONSTRAINT "ContadorCodigoProjeto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
