import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  transactionMock,
  queryRawMock,
  enviarEmailMock,
} = vi.hoisted(() => {
  const queryRawMock = vi.fn();

  const transactionMock = vi.fn(
    async (executar: (tx: unknown) => Promise<unknown>) => {
      return executar({
        $queryRaw: queryRawMock,
      });
    },
  );

  return {
    queryRawMock,
    transactionMock,
    enviarEmailMock: vi.fn(),
  };
});

vi.mock("../db/prisma", () => ({
  executarNoBanco: vi.fn(
    async (
      _contexto: unknown,
      executar: (prisma: unknown) => Promise<unknown>,
    ) => {
      return executar({
        $transaction: transactionMock,
      });
    },
  ),
}));

vi.mock("./email-recuperacao", () => ({
  enviarEmailRecuperacao: enviarEmailMock,
}));

import { solicitarRecuperacao } from "./solicitar-recuperacao";

const contexto = {
  requisicaoId: "teste-solicitar-recuperacao-001",
  modulo: "teste",
  operacao: "TESTE_SOLICITAR_RECUPERACAO",
};

describe("solicitação de recuperação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita e-mail inválido antes de acessar o banco", async () => {
    await expect(
      solicitarRecuperacao(
        {
          email: "email-invalido",
          empresaSlug: "mproj",
        },
        contexto,
      ),
    ).rejects.toThrow("EntradaRecuperacaoInvalida");

    expect(transactionMock).not.toHaveBeenCalled();
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("rejeita slug inválido antes de acessar o banco", async () => {
    await expect(
      solicitarRecuperacao(
        {
          email: "usuario@example.com",
          empresaSlug: "MPROJ INVÁLIDA!",
        },
        contexto,
      ),
    ).rejects.toThrow("EntradaRecuperacaoInvalida");

    expect(transactionMock).not.toHaveBeenCalled();
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("processa conta inexistente sem enviar e-mail e sem revelar existência", async () => {
    queryRawMock.mockResolvedValueOnce([]);

    await expect(
      solicitarRecuperacao(
        {
          email: "naoexiste@example.com",
          empresaSlug: "mproj",
        },
        contexto,
      ),
    ).resolves.toBeUndefined();

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("normaliza e-mail e slug antes da consulta", async () => {
    queryRawMock.mockResolvedValueOnce([]);

    await expect(
      solicitarRecuperacao(
        {
          email: "  USUARIO@EXAMPLE.COM  ",
          empresaSlug: "  MPROJ  ",
        },
        contexto,
      ),
    ).resolves.toBeUndefined();

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(enviarEmailMock).not.toHaveBeenCalled();
  });

  it("rejeita múltiplos vínculos encontrados para a recuperação", async () => {
    queryRawMock.mockResolvedValueOnce([
      { id: "vinculo-001" },
      { id: "vinculo-002" },
    ]);

    await expect(
      solicitarRecuperacao(
        {
          email: "usuario@example.com",
          empresaSlug: "mproj",
        },
        contexto,
      ),
    ).rejects.toThrow(
      "VinculosRecuperacaoInconsistentes",
    );

    expect(enviarEmailMock).not.toHaveBeenCalled();
  });
});