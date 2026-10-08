import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  queryRawMock,
  txQueryRawMock,
  updateManyMock,
  auditoriaCreateMock,
  transactionMock,
  criarSenhaHashMock,
} = vi.hoisted(() => {
  const txQueryRawMock = vi.fn();
  const updateManyMock = vi.fn();
  const auditoriaCreateMock = vi.fn();

  const transactionMock = vi.fn(
    async (executar: (tx: unknown) => Promise<unknown>) => {
      return executar({
        $queryRaw: txQueryRawMock,
        usuario: {
          updateMany: updateManyMock,
        },
        eventoAuditoria: {
          create: auditoriaCreateMock,
        },
      });
    },
  );

  return {
    queryRawMock: vi.fn(),
    txQueryRawMock,
    updateManyMock,
    auditoriaCreateMock,
    transactionMock,
    criarSenhaHashMock: vi.fn(),
  };
});

vi.mock("../db/prisma", () => ({
  executarNoBanco: vi.fn(
    async (
      _contexto: unknown,
      executar: (prisma: unknown) => Promise<unknown>,
    ) => {
      return executar({
        $queryRaw: queryRawMock,
        $transaction: transactionMock,
      });
    },
  ),
}));

vi.mock("./senha", () => ({
  criarSenhaHash: criarSenhaHashMock,
}));

import { redefinirSenha } from "./redefinir-senha";

const contexto = {
  requisicaoId: "teste-redefinir-transacao-001",
  modulo: "teste",
  operacao: "TESTE_REDEFINIR_TRANSACAO",
};

const candidato = {
  id: "recuperacao-001",
  empresaId: "empresa-001",
  vinculoId: "vinculo-001",
  usuarioId: "usuario-001",
  versaoSessao: 7,
};

describe("redefinição de senha - transação", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    queryRawMock.mockResolvedValue([candidato]);

    criarSenhaHashMock.mockResolvedValue(
      "hash-scrypt-da-nova-senha",
    );
  });

  it("redefine senha, incrementa versões, registra auditoria e retorna true", async () => {
    txQueryRawMock
      .mockResolvedValueOnce([
        { id: "usuario-001" },
      ])
      .mockResolvedValueOnce([
        candidato,
      ])
      .mockResolvedValueOnce([
        { id: "recuperacao-001" },
      ]);

    updateManyMock.mockResolvedValueOnce({
      count: 1,
    });

    auditoriaCreateMock.mockResolvedValue({
      id: "auditoria-001",
    });

    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "Senha nova segura 2026!",
        },
        contexto,
      ),
    ).resolves.toBe(true);

    expect(criarSenhaHashMock).toHaveBeenCalledTimes(1);

    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        id: "usuario-001",
        versaoSessao: 7,
        status: "ATIVO",
      },
      data: {
        senhaHash: "hash-scrypt-da-nova-senha",
        versaoSessao: {
          increment: 1,
        },
        versao: {
          increment: 1,
        },
      },
    });

    expect(auditoriaCreateMock).toHaveBeenCalledTimes(2);
  });

  it("recusa se usuário desaparecer antes da transação concluir", async () => {
    txQueryRawMock.mockResolvedValueOnce([]);

    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "Senha nova segura 2026!",
        },
        contexto,
      ),
    ).resolves.toBe(false);

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditoriaCreateMock).not.toHaveBeenCalled();
  });

  it("recusa se recuperação deixar de ser elegível dentro da transação", async () => {
    txQueryRawMock
      .mockResolvedValueOnce([
        { id: "usuario-001" },
      ])
      .mockResolvedValueOnce([]);

    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "Senha nova segura 2026!",
        },
        contexto,
      ),
    ).resolves.toBe(false);

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditoriaCreateMock).not.toHaveBeenCalled();
  });

  it("recusa se token não puder mais ser consumido", async () => {
    txQueryRawMock
      .mockResolvedValueOnce([
        { id: "usuario-001" },
      ])
      .mockResolvedValueOnce([
        candidato,
      ])
      .mockResolvedValueOnce([]);

    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "Senha nova segura 2026!",
        },
        contexto,
      ),
    ).resolves.toBe(false);

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditoriaCreateMock).not.toHaveBeenCalled();
  });

  it("falha se atualização da senha não alterar exatamente um usuário", async () => {
    txQueryRawMock
      .mockResolvedValueOnce([
        { id: "usuario-001" },
      ])
      .mockResolvedValueOnce([
        candidato,
      ])
      .mockResolvedValueOnce([
        { id: "recuperacao-001" },
      ]);

    updateManyMock.mockResolvedValueOnce({
      count: 0,
    });

    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "Senha nova segura 2026!",
        },
        contexto,
      ),
    ).rejects.toThrow(
      "AlteracaoSenhaNaoConfirmada",
    );

    expect(auditoriaCreateMock).not.toHaveBeenCalled();
  });
});