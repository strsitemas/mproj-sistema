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

import { cadastrarProjeto } from "./servico";
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
  requisicaoId: "req-projeto-teste",
  operacao: "TESTE",
  modulo: "projetos",
};

const entrada = {
  clienteId: "123e4567-e89b-42d3-a456-426614174000",
  nome: "Projeto Demonstrativo",
};

function permitirCadastro() {
  mocks.consultarPermissoesEfetivas.mockResolvedValue([
    { chave: "projetos.criar", alcances: ["EMPRESA"] },
  ]);
}

describe("cadastrarProjeto", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("nega cadastro sem permissao e nao acessa a transacao", async () => {
    mocks.consultarPermissoesEfetivas.mockResolvedValue([]);

    await expect(
      cadastrarProjeto(sessao, contexto, entrada),
    ).rejects.toThrow("AcessoNegado");

    expect(mocks.executarNoBanco).not.toHaveBeenCalled();
    expect(mocks.logAviso).toHaveBeenCalledWith(
      expect.anything(),
      "CADASTRO_PROJETO_NEGADO",
      "PERMISSAO_AUSENTE",
    );
  });

  it("gera codigo sequencial e registra auditoria na transacao", async () => {
    permitirCadastro();

    const findCliente = vi.fn().mockResolvedValue({
      id: entrada.clienteId,
      codigo: "CLI-000001",
    });

    const upsertContador = vi.fn().mockResolvedValue({
      ultimoNumero: 1,
    });

    const createProjeto = vi.fn().mockResolvedValue({
      id: "projeto-1",
      codigo: "CLI-000001-P001",
    });

    const createAuditoria = vi.fn().mockResolvedValue({
      id: "auditoria-1",
    });

    const transaction = vi.fn(async (callback) =>
      callback({
        cliente: { findFirst: findCliente },
        contadorCodigoProjeto: { upsert: upsertContador },
        projeto: { create: createProjeto },
        eventoAuditoria: { create: createAuditoria },
      }),
    );

    mocks.executarNoBanco.mockImplementation(
      async (_ctx, callback) => callback({ $transaction: transaction }),
    );

    const resultado = await cadastrarProjeto(sessao, contexto, entrada);

    expect(resultado).toEqual({
      id: "projeto-1",
      codigo: "CLI-000001-P001",
    });

    expect(transaction).toHaveBeenCalledOnce();

    expect(findCliente).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          empresaId: "empresa-1",
          arquivadoEm: null,
        }),
      }),
    );

    expect(upsertContador).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clienteId: entrada.clienteId },
        update: { ultimoNumero: { increment: 1 } },
      }),
    );

    expect(createProjeto).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          empresaId: "empresa-1",
          clienteId: entrada.clienteId,
          codigo: "CLI-000001-P001",
        }),
      }),
    );

    expect(createAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          acao: "projetos.criar",
          entidadeId: "projeto-1",
          requisicaoId: "req-projeto-teste",
          resultado: "SUCESSO",
        }),
      }),
    );
  });

  it("recusa cliente inexistente sem gerar codigo ou projeto", async () => {
    permitirCadastro();

    const upsertContador = vi.fn();
    const createProjeto = vi.fn();

    const transaction = vi.fn(async (callback) =>
      callback({
        cliente: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
        contadorCodigoProjeto: { upsert: upsertContador },
        projeto: { create: createProjeto },
      }),
    );

    mocks.executarNoBanco.mockImplementation(
      async (_ctx, callback) => callback({ $transaction: transaction }),
    );

    await expect(
      cadastrarProjeto(sessao, contexto, entrada),
    ).rejects.toThrow("ClienteProjetoNaoEncontrado");

    expect(upsertContador).not.toHaveBeenCalled();
    expect(createProjeto).not.toHaveBeenCalled();
  });

  it("registra e propaga falha de persistencia", async () => {
    permitirCadastro();

    mocks.executarNoBanco.mockRejectedValue(new Error("FalhaBanco"));

    await expect(
      cadastrarProjeto(sessao, contexto, entrada),
    ).rejects.toThrow("FalhaBanco");

    expect(mocks.logErro).toHaveBeenCalledWith(
      expect.anything(),
      "CADASTRO_PROJETO_FALHOU",
      expect.any(Error),
    );
  });
});