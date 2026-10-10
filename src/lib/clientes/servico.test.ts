import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consultarPermissoesEfetivas: vi.fn(),
  executarNoBanco: vi.fn(),
  logInfo: vi.fn(),
  logAviso: vi.fn(),
  logErro: vi.fn(),
}));

vi.mock("../auth/autorizacao", () => ({
  consultarPermissoesEfetivas: mocks.consultarPermissoesEfetivas,
  possuiPermissao: (
    permissoes: Array<{ chave: string; alcances: string[] }>,
    chave: string,
    alcance: string,
  ) => permissoes.some(
    (p) => p.chave === chave && p.alcances.includes(alcance),
  ),
}));

vi.mock("../db/prisma", () => ({
  executarNoBanco: mocks.executarNoBanco,
}));

vi.mock("../auditoria/logger", () => ({
  logInfo: mocks.logInfo,
  logAviso: mocks.logAviso,
  logErro: mocks.logErro,
}));

import { cadastrarCliente } from "./servico";
import type { SessaoAutenticada } from "../auth/sessao";

const sessao = {
  sessaoId: "sessao-1",
  empresaId: "empresa-1",
  empresaNome: "Empresa Teste",
  vinculoId: "vinculo-1",
  usuarioId: "usuario-1",
  usuarioNome: "Usuario Teste",
  versaoSessao: 1,
  expiraEm: new Date(Date.now() + 60000),
} satisfies SessaoAutenticada;

const contexto = {
  requisicaoId: "req-teste-1",
  operacao: "TESTE",
  modulo: "clientes",
};

const entrada = {
  nome: "Cliente Teste",
  tipo: "PESSOA_JURIDICA",
};

describe("cadastrarCliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nega cadastro sem permissao", async () => {
    mocks.consultarPermissoesEfetivas.mockResolvedValue([]);

    await expect(
      cadastrarCliente(sessao, contexto, entrada),
    ).rejects.toThrow("AcessoNegado");

    expect(mocks.executarNoBanco).not.toHaveBeenCalled();
    expect(mocks.logAviso).toHaveBeenCalledWith(
      expect.anything(),
      "CADASTRO_CLIENTE_NEGADO",
      "PERMISSAO_AUSENTE",
    );
  });

  it("grava cliente e auditoria na mesma transacao", async () => {
    mocks.consultarPermissoesEfetivas.mockResolvedValue([
      { chave: "clientes.criar", alcances: ["EMPRESA"] },
    ]);

    const createCliente = vi.fn().mockResolvedValue({ id: "cliente-1" });
    const createAuditoria = vi.fn().mockResolvedValue({ id: "auditoria-1" });
    const transaction = vi.fn(async (callback) => callback({
      contadorCodigoCliente: {
        upsert: vi.fn().mockResolvedValue({ ultimoNumero: 1 }),
      },
      cliente: { create: createCliente },
      eventoAuditoria: { create: createAuditoria },
    }));

    mocks.executarNoBanco.mockImplementation(
      async (_ctx, callback) => callback({ $transaction: transaction }),
    );

    const resultado = await cadastrarCliente(sessao, contexto, entrada);

    expect(resultado).toEqual({ id: "cliente-1" });
    expect(transaction).toHaveBeenCalledOnce();
    expect(createCliente).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ empresaId: "empresa-1" }),
    }));
    expect(createAuditoria).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        empresaId: "empresa-1",
        entidadeId: "cliente-1",
        resultado: "SUCESSO",
      }),
    }));
  });

  it("registra erro de persistencia sem ocultar falha", async () => {
    mocks.consultarPermissoesEfetivas.mockResolvedValue([
      { chave: "clientes.criar", alcances: ["EMPRESA"] },
    ]);
    mocks.executarNoBanco.mockRejectedValue(new Error("FalhaBanco"));

    await expect(
      cadastrarCliente(sessao, contexto, entrada),
    ).rejects.toThrow("FalhaBanco");

    expect(mocks.logErro).toHaveBeenCalledWith(
      expect.anything(),
      "CADASTRO_CLIENTE_FALHOU",
      expect.any(Error),
    );
  });
});