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

import { inicializarCatalogoClientes } from "./inicializar-catalogo";

const contexto = {
  requisicaoId: "req-catalogo-teste",
  operacao: "TESTE",
  modulo: "clientes",
};

describe("inicializarCatalogoClientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa upsert para modulo e permissoes na mesma transacao", async () => {
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

    await inicializarCatalogoClientes(contexto);

    expect(transaction).toHaveBeenCalledOnce();
    expect(upsertModulo).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chave: "clientes" },
        update: {},
      }),
    );

    expect(upsertPermissao).toHaveBeenCalledTimes(2);

    expect(upsertPermissao.mock.calls.map(([args]) => args.where.chave))
      .toEqual(["clientes.criar", "clientes.listar"]);

    expect(mocks.logInfo).toHaveBeenCalledWith(
      expect.anything(),
      "CATALOGO_CLIENTES_CONCLUIDO",
    );
  });

  it("registra e propaga falha de inicializacao", async () => {
    mocks.executarNoBanco.mockRejectedValue(new Error("FalhaBanco"));

    await expect(
      inicializarCatalogoClientes(contexto),
    ).rejects.toThrow("FalhaBanco");

    expect(mocks.logErro).toHaveBeenCalledWith(
      expect.anything(),
      "CATALOGO_CLIENTES_FALHOU",
      expect.any(Error),
    );
  });
});