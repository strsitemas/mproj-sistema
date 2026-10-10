import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executarNoBanco: vi.fn(),
  logInfo: vi.fn(),
  logErro: vi.fn(),
}));

vi.mock("../db/prisma", () => ({
  executarNoBanco: mocks.executarNoBanco,
}));

vi.mock("../auditoria/logger", () => ({
  logInfo: mocks.logInfo,
  logErro: mocks.logErro,
}));

import { inicializarCatalogoProjetos } from "./inicializar-catalogo";

const contexto = {
  requisicaoId: "req-catalogo-projetos-teste",
  operacao: "TESTE",
  modulo: "projetos",
};

describe("inicializarCatalogoProjetos", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("registra modulo e permissao na mesma transacao", async () => {
    const upsertModulo = vi.fn().mockResolvedValue({ id: "modulo-1" });
    const upsertPermissao = vi.fn().mockResolvedValue({ id: "permissao-1" });

    const transaction = vi.fn(async (callback) =>
      callback({
        modulo: { upsert: upsertModulo },
        permissao: { upsert: upsertPermissao },
      }),
    );

    mocks.executarNoBanco.mockImplementation(
      async (_ctx, callback) => callback({ $transaction: transaction }),
    );

    await inicializarCatalogoProjetos(contexto);

    expect(transaction).toHaveBeenCalledOnce();
    expect(upsertModulo).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chave: "projetos" },
        update: {},
      }),
    );
    expect(upsertPermissao).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chave: "projetos.criar" },
        update: {},
      }),
    );
    expect(mocks.logInfo).toHaveBeenCalledWith(
      expect.anything(),
      "CATALOGO_PROJETOS_CONCLUIDO",
    );
  });

  it("registra e propaga falha de inicializacao", async () => {
    mocks.executarNoBanco.mockRejectedValue(new Error("FalhaBanco"));

    await expect(
      inicializarCatalogoProjetos(contexto),
    ).rejects.toThrow("FalhaBanco");

    expect(mocks.logErro).toHaveBeenCalledWith(
      expect.anything(),
      "CATALOGO_PROJETOS_FALHOU",
      expect.any(Error),
    );
  });
});