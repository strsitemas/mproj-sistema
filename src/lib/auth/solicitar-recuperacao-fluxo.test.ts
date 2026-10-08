import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  queryRawMock,
  executeRawMock,
  vinculoFindUniqueMock,
  recuperacaoCreateMock,
  auditoriaCreateMock,
  transactionMock,
  enviarEmailMock,
} = vi.hoisted(() => {
  const queryRawMock = vi.fn();
  const executeRawMock = vi.fn();
  const vinculoFindUniqueMock = vi.fn();
  const recuperacaoCreateMock = vi.fn();
  const auditoriaCreateMock = vi.fn();

  const transactionMock = vi.fn(
    async (executar: (tx: unknown) => Promise<unknown>) => {
      return executar({
        $queryRaw: queryRawMock,
        $executeRaw: executeRawMock,
        vinculoEmpresa: {
          findUnique: vinculoFindUniqueMock,
        },
        recuperacaoAcesso: {
          create: recuperacaoCreateMock,
        },
        eventoAuditoria: {
          create: auditoriaCreateMock,
        },
      });
    },
  );

  return {
    queryRawMock,
    executeRawMock,
    vinculoFindUniqueMock,
    recuperacaoCreateMock,
    auditoriaCreateMock,
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
  requisicaoId: "teste-recuperacao-fluxo-001",
  modulo: "teste",
  operacao: "TESTE_RECUPERACAO_FLUXO",
};

const agora = new Date("2026-10-07T02:00:00.000Z");

function prepararEmissao() {
  queryRawMock
    .mockResolvedValueOnce([
      { id: "vinculo-001" },
    ])
    .mockResolvedValueOnce([
      { agora },
    ]);

  vinculoFindUniqueMock.mockResolvedValueOnce({
    id: "vinculo-001",
    empresaId: "empresa-001",
    usuario: {
      id: "usuario-001",
      emailNormalizado: "usuario@example.com",
      versaoSessao: 4,
    },
  });

  recuperacaoCreateMock.mockResolvedValueOnce({
    id: "recuperacao-001",
  });

  auditoriaCreateMock.mockResolvedValue({
    id: "auditoria-001",
  });
}

describe("solicitação de recuperação - fluxo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emite token, envia e-mail e confirma o envio", async () => {
    prepararEmissao();

    enviarEmailMock.mockResolvedValueOnce(undefined);

    executeRawMock.mockResolvedValueOnce(1);

    await expect(
      solicitarRecuperacao(
        {
          email: "usuario@example.com",
          empresaSlug: "mproj",
        },
        contexto,
      ),
    ).resolves.toBeUndefined();

    expect(recuperacaoCreateMock).toHaveBeenCalledTimes(1);
    expect(enviarEmailMock).toHaveBeenCalledTimes(1);
    expect(executeRawMock).toHaveBeenCalledTimes(1);

    expect(auditoriaCreateMock).toHaveBeenCalledTimes(2);

    const chamadaEmail = enviarEmailMock.mock.calls[0][0];

    expect(chamadaEmail.destinatario).toBe(
      "usuario@example.com",
    );

    expect(chamadaEmail.recuperacaoId).toBe(
      "recuperacao-001",
    );

    expect(chamadaEmail.token).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });

  it("revoga a recuperação quando o envio do e-mail falha", async () => {
    prepararEmissao();

    enviarEmailMock.mockRejectedValueOnce(
      new Error("FalhaEmailSimulada"),
    );

    executeRawMock.mockResolvedValueOnce(1);

    await expect(
      solicitarRecuperacao(
        {
          email: "usuario@example.com",
          empresaSlug: "mproj",
        },
        contexto,
      ),
    ).resolves.toBeUndefined();

    expect(enviarEmailMock).toHaveBeenCalledTimes(1);

    expect(executeRawMock).toHaveBeenCalledTimes(1);

    expect(auditoriaCreateMock).toHaveBeenCalledTimes(2);
  });

  it("não confirma envio quando atualização do banco é recusada", async () => {
    prepararEmissao();

    enviarEmailMock.mockResolvedValueOnce(undefined);

    executeRawMock
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    await expect(
      solicitarRecuperacao(
        {
          email: "usuario@example.com",
          empresaSlug: "mproj",
        },
        contexto,
      ),
    ).resolves.toBeUndefined();

    expect(enviarEmailMock).toHaveBeenCalledTimes(1);

    expect(executeRawMock).toHaveBeenCalledTimes(2);
  });
});