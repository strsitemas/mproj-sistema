-- MProj: identificacao permanente dos clientes.
-- Os codigos sao sequenciais por empresa.

CREATE TABLE "ContadorCodigoCliente" (
    "empresaId" UUID NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ContadorCodigoCliente_pkey" PRIMARY KEY ("empresaId"),
    CONSTRAINT "ContadorCodigoCliente_empresaId_fkey"
        FOREIGN KEY ("empresaId")
        REFERENCES "Empresa"("id")
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,
    CONSTRAINT "ContadorCodigoCliente_ultimoNumero_check"
        CHECK ("ultimoNumero" >= 0)
);

ALTER TABLE "Cliente"
    ADD COLUMN "codigo" VARCHAR(80);

-- Numeracao deterministica para clientes preexistentes.
WITH numerados AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "empresaId"
            ORDER BY "criadoEm", "id"
        ) AS numero
    FROM "Cliente"
)
UPDATE "Cliente" AS c
SET "codigo" = 'CLI-' || LPAD(n.numero::TEXT, 6, '0')
FROM numerados AS n
WHERE c."id" = n."id";

INSERT INTO "ContadorCodigoCliente" ("empresaId", "ultimoNumero")
SELECT
    e."id",
    COALESCE(MAX(
        CAST(SUBSTRING(c."codigo" FROM 5) AS INTEGER)
    ), 0)
FROM "Empresa" AS e
LEFT JOIN "Cliente" AS c
    ON c."empresaId" = e."id"
GROUP BY e."id";

ALTER TABLE "Cliente"
    ALTER COLUMN "codigo" SET NOT NULL;

CREATE UNIQUE INDEX "Cliente_empresaId_codigo_key"
    ON "Cliente"("empresaId", "codigo");