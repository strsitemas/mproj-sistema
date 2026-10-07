BEGIN;

CREATE TABLE public."LimiteTentativaLogin" (
    "chaveHash" VARCHAR(64) NOT NULL,
    "inicioJanela" TIMESTAMPTZ(3) NOT NULL,
    "fimJanela" TIMESTAMPTZ(3) NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 1,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LimiteTentativaLogin_pkey"
        PRIMARY KEY ("chaveHash"),

    CONSTRAINT "LimiteTentativaLogin_chave_formato_check"
        CHECK ("chaveHash" ~ '^[0-9a-f]{64}$'),

    CONSTRAINT "LimiteTentativaLogin_contador_check"
        CHECK ("tentativas" >= 1),

    CONSTRAINT "LimiteTentativaLogin_janela_check"
        CHECK ("fimJanela" > "inicioJanela")
);

CREATE INDEX "LimiteTentativaLogin_fimJanela_idx"
    ON public."LimiteTentativaLogin" ("fimJanela");

COMMIT;
