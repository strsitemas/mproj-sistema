import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  queryRawMock,
  criarSenhaHashMock,
} = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
  criarSenhaHashMock: vi.fn(),
}));

vi.mock("../db/prisma", () => ({
  executarNoBanco: vi.fn(
    async (
      _contexto: unknown,
      executar: (prisma: unknown) => Promise<unknown>,
    ) => {
      return executar({
        $queryRaw: queryRawMock,
      });
    },
  ),
}));

vi.mock("./senha", () => ({
  criarSenhaHash: criarSenhaHashMock,
}));

import { redefinirSenha } from "./redefinir-senha";

const contexto = {
  requisicaoId: "teste-redefinir-senha-001",
  modulo: "teste",
  operacao: "TESTE_REDEFINIR_SENHA",
};

describe("redefinição de senha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recusa token malformado sem consultar banco nem derivar senha", async () => {
    await expect(
      redefinirSenha(
        {
          token: "token-invalido",
          novaSenha: "Senha nova segura 2026!",
        },
        contexto,
      ),
    ).resolves.toBe(false);

    expect(queryRawMock).not.toHaveBeenCalled();
    expect(criarSenhaHashMock).not.toHaveBeenCalled();
  });

  it("rejeita senha com menos de 15 caracteres", async () => {
    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "Curta123!",
        },
        contexto,
      ),
    ).rejects.toThrow("SenhaForaDoTamanhoPermitido");

    expect(queryRawMock).not.toHaveBeenCalled();
    expect(criarSenhaHashMock).not.toHaveBeenCalled();
  });

  it("rejeita senha com mais de 128 caracteres Unicode", async () => {
    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "ç".repeat(129),
        },
        contexto,
      ),
    ).rejects.toThrow("SenhaForaDoTamanhoPermitido");

    expect(queryRawMock).not.toHaveBeenCalled();
    expect(criarSenhaHashMock).not.toHaveBeenCalled();
  });

  it("recusa recuperação inexistente ou inelegível sem derivar senha", async () => {
    queryRawMock.mockResolvedValueOnce([]);

    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "Senha nova segura 2026!",
        },
        contexto,
      ),
    ).resolves.toBe(false);

    expect(queryRawMock).toHaveBeenCalledTimes(1);
    expect(criarSenhaHashMock).not.toHaveBeenCalled();
  });

  it("rejeita múltiplas recuperações para o mesmo token", async () => {
    queryRawMock.mockResolvedValueOnce([
      {
        id: "rec-001",
        empresaId: "empresa-001",
        vinculoId: "vinculo-001",
        usuarioId: "usuario-001",
        versaoSessao: 1,
      },
      {
        id: "rec-002",
        empresaId: "empresa-001",
        vinculoId: "vinculo-001",
        usuarioId: "usuario-001",
        versaoSessao: 1,
      },
    ]);

    await expect(
      redefinirSenha(
        {
          token: "a".repeat(64),
          novaSenha: "Senha nova segura 2026!",
        },
        contexto,
      ),
    ).rejects.toThrow("RecuperacaoSenhaInconsistente");

    expect(criarSenhaHashMock).not.toHaveBeenCalled();
  });
});