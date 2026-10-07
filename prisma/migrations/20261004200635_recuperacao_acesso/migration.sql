BEGIN;

CREATE TABLE public."RecuperacaoAcesso" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "vinculoId" UUID NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "versaoSessaoNaEmissao" INTEGER NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMPTZ(3) NOT NULL,
    "enviadoEm" TIMESTAMPTZ(3),
    "utilizadoEm" TIMESTAMPTZ(3),
    "revogadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "RecuperacaoAcesso_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "RecuperacaoAcesso_token_formato_check"
        CHECK ("tokenHash" ~ '^[0-9a-f]{64}$'),

    CONSTRAINT "RecuperacaoAcesso_versao_check"
        CHECK ("versaoSessaoNaEmissao" >= 1),

    CONSTRAINT "RecuperacaoAcesso_validade_check"
        CHECK ("expiraEm" > "criadoEm"),

    CONSTRAINT "RecuperacaoAcesso_envio_check"
        CHECK (
            "enviadoEm" IS NULL OR (
                "enviadoEm" >= "criadoEm"
                AND "enviadoEm" < "expiraEm"
            )
        ),

    CONSTRAINT "RecuperacaoAcesso_uso_check"
        CHECK (
            "utilizadoEm" IS NULL OR (
                "enviadoEm" IS NOT NULL
                AND "utilizadoEm" >= "enviadoEm"
                AND "utilizadoEm" < "expiraEm"
            )
        ),

    CONSTRAINT "RecuperacaoAcesso_revogacao_check"
        CHECK (
            "revogadoEm" IS NULL
            OR "revogadoEm" >= "criadoEm"
        )
);

CREATE UNIQUE INDEX "RecuperacaoAcesso_tokenHash_key"
    ON public."RecuperacaoAcesso" ("tokenHash");

CREATE INDEX "RecuperacaoAcesso_empresaId_vinculoId_criadoEm_idx"
    ON public."RecuperacaoAcesso" ("empresaId", "vinculoId", "criadoEm");

CREATE INDEX "RecuperacaoAcesso_expiraEm_idx"
    ON public."RecuperacaoAcesso" ("expiraEm");

ALTER TABLE public."RecuperacaoAcesso"
    ADD CONSTRAINT "RecuperacaoAcesso_empresaId_vinculoId_fkey"
    FOREIGN KEY ("empresaId", "vinculoId")
    REFERENCES public."VinculoEmpresa" ("empresaId", "id")
    ON DELETE RESTRICT
    ON UPDATE RESTRICT;

COMMIT;
