import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const updateManyMock = vi.fn();
const auditoriaCreateMock = vi.fn();

const transactionMock = vi.fn(
  async (executar: (tx: unknown) => Promise<unknown>) => {
    return executar({
      sessao: {
        findUnique: findUniqueMock,
        updateMany: updateManyMock,
      },
      eventoAuditoria: {
        create: auditoriaCreateMock,
      },
    });
  },
);

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

import { revogarSessao } from "./sessao";

const contexto = {
  requisicaoId: "teste-revogacao-001",
  modulo: "teste",
  operacao: "TESTE_REVOGACAO",
};

function sessaoRevogavel() {
  return {
    id: "sessao-001",
    empresaId: "empresa-001",
    vinculoId: "vinculo-001",
    revogadaEm: null as Date | null,
    vinculo: {
      usuarioId: "usuario-001",
    },
  };
}

describe("revogação de sessão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna false quando token está ausente", async () => {
    await expect(
      revogarSessao(undefined, contexto),
    ).resolves.toBe(false);

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna false para token malformado sem acessar o banco", async () => {
    await expect(
      revogarSessao("token-invalido", contexto),
    ).resolves.toBe(false);

    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("retorna false quando sessão não existe", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await expect(
      revogarSessao("a".repeat(64), contexto),
    ).resolves.toBe(false);

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditoriaCreateMock).not.toHaveBeenCalled();
  });

  it("retorna false quando sessão já está revogada", async () => {
    const sessao = sessaoRevogavel();
    sessao.revogadaEm = new Date();

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      revogarSessao("a".repeat(64), contexto),
    ).resolves.toBe(false);

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(auditoriaCreateMock).not.toHaveBeenCalled();
  });

  it("revoga exatamente uma sessão e registra auditoria", async () => {
    findUniqueMock.mockResolvedValueOnce(sessaoRevogavel());
    updateManyMock.mockResolvedValueOnce({ count: 1 });
    auditoriaCreateMock.mockResolvedValueOnce({ id: "auditoria-001" });

    await expect(
      revogarSessao("a".repeat(64), contexto),
    ).resolves.toBe(true);

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(auditoriaCreateMock).toHaveBeenCalledTimes(1);

    expect(auditoriaCreateMock).toHaveBeenCalledWith({
      data: {
        empresaId: "empresa-001",
        autorVinculoId: "vinculo-001",
        tipoAutor: "USUARIO",
        autorIdentificacao: "usuario-001",
        moduloChave: "autenticacao",
        acao: "sessao.revogar",
        entidadeTipo: "Sessao",
        entidadeId: "sessao-001",
        resultado: "SUCESSO",
        requisicaoId: "teste-revogacao-001",
        camposAlterados: ["revogadaEm"],
      },
    });
  });

  it("retorna false se outra operação já revogou a sessão", async () => {
    findUniqueMock.mockResolvedValueOnce(sessaoRevogavel());
    updateManyMock.mockResolvedValueOnce({ count: 0 });

    await expect(
      revogarSessao("a".repeat(64), contexto),
    ).resolves.toBe(false);

    expect(auditoriaCreateMock).not.toHaveBeenCalled();
  });

  it("rejeita quantidade inesperada de sessões alteradas", async () => {
    findUniqueMock.mockResolvedValueOnce(sessaoRevogavel());
    updateManyMock.mockResolvedValueOnce({ count: 2 });

    await expect(
      revogarSessao("a".repeat(64), contexto),
    ).rejects.toThrow("QuantidadeDeSessoesInesperada");

    expect(auditoriaCreateMock).not.toHaveBeenCalled();
  });
});