import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();

vi.mock("../db/prisma", () => ({
  executarNoBanco: vi.fn(
    async (
      _contexto: unknown,
      executar: (prisma: unknown) => Promise<unknown>,
    ) => {
      return executar({
        sessao: {
          findUnique: findUniqueMock,
        },
      });
    },
  ),
}));

import {
  DURACAO_SESSAO_MS,
  gerarCredencialSessao,
  validarSessao,
} from "./sessao";

const contexto = {
  requisicaoId: "teste-sessao-001",
  modulo: "teste",
  operacao: "TESTE_SESSAO",
};

function sessaoValida() {
  return {
    id: "sessao-001",
    empresaId: "empresa-001",
    vinculoId: "vinculo-001",
    versaoSessaoNaEmissao: 3,
    expiraEm: new Date(Date.now() + 60 * 60 * 1000),
    revogadaEm: null as Date | null,
    vinculo: {
      status: "ATIVO",
      encerradoEm: null as Date | null,
      empresa: {
        nome: "MPROJ",
        status: "ATIVA",
        arquivadoEm: null as Date | null,
      },
      usuario: {
        id: "usuario-001",
        nome: "Usuário Teste",
        status: "ATIVO",
        versaoSessao: 3,
      },
    },
  };
}

describe("sessão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("define duração de sessão em 24 horas", () => {
    expect(DURACAO_SESSAO_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("gera token e hash com 64 caracteres hexadecimais", () => {
    const credencial = gerarCredencialSessao();

    expect(credencial.token).toMatch(/^[0-9a-f]{64}$/);
    expect(credencial.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(credencial.tokenHash).not.toBe(credencial.token);
  });

  it("gera credenciais diferentes", () => {
    const primeira = gerarCredencialSessao();
    const segunda = gerarCredencialSessao();

    expect(primeira.token).not.toBe(segunda.token);
    expect(primeira.tokenHash).not.toBe(segunda.tokenHash);
  });

  it("retorna null quando token está ausente", async () => {
    await expect(
      validarSessao(undefined, contexto),
    ).resolves.toBeNull();

    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("retorna null para token malformado sem consultar o banco", async () => {
    await expect(
      validarSessao("token-invalido", contexto),
    ).resolves.toBeNull();

    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("retorna null quando a sessão não existe", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("retorna a identidade de uma sessão válida", async () => {
    const sessao = sessaoValida();
    findUniqueMock.mockResolvedValueOnce(sessao);

    const resultado = await validarSessao(
      "a".repeat(64),
      contexto,
    );

    expect(resultado).toEqual({
      sessaoId: "sessao-001",
      empresaId: "empresa-001",
      empresaNome: "MPROJ",
      vinculoId: "vinculo-001",
      usuarioId: "usuario-001",
      usuarioNome: "Usuário Teste",
      versaoSessao: 3,
      expiraEm: sessao.expiraEm,
    });
  });

  it("recusa sessão revogada", async () => {
    const sessao = sessaoValida();
    sessao.revogadaEm = new Date();

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();
  });

  it("recusa sessão expirada", async () => {
    const sessao = sessaoValida();
    sessao.expiraEm = new Date(Date.now() - 1000);

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();
  });

  it("recusa sessão com versão antiga", async () => {
    const sessao = sessaoValida();
    sessao.versaoSessaoNaEmissao = 2;

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();
  });

  it("recusa usuário inativo", async () => {
    const sessao = sessaoValida();
    sessao.vinculo.usuario.status = "INATIVO";

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();
  });

  it("recusa vínculo inativo", async () => {
    const sessao = sessaoValida();
    sessao.vinculo.status = "INATIVO";

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();
  });

  it("recusa vínculo encerrado", async () => {
    const sessao = sessaoValida();
    sessao.vinculo.encerradoEm = new Date();

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();
  });

  it("recusa empresa inativa", async () => {
    const sessao = sessaoValida();
    sessao.vinculo.empresa.status = "INATIVA";

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();
  });

  it("recusa empresa arquivada", async () => {
    const sessao = sessaoValida();
    sessao.vinculo.empresa.arquivadoEm = new Date();

    findUniqueMock.mockResolvedValueOnce(sessao);

    await expect(
      validarSessao("a".repeat(64), contexto),
    ).resolves.toBeNull();
  });
});