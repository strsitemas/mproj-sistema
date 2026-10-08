import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawMock = vi.fn();

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

import { consumirTentativaLogin } from "./limite-login";

const contexto = {
  requisicaoId: "teste-limite-login-001",
  modulo: "teste",
  operacao: "TESTE_LIMITE_LOGIN",
};

function contador(tentativas: number, esperaSegundos: number) {
  return [{ tentativas, esperaSegundos }];
}

describe("limite de login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LOGIN_RATE_LIMIT_SECRET = "a".repeat(64);
  });

  it("permite tentativa dentro dos limites", async () => {
    queryRawMock
      .mockResolvedValueOnce(contador(1, 60))
      .mockResolvedValueOnce(contador(1, 900));

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).resolves.toEqual({
      permitido: true,
      tentarNovamenteEmSegundos: 0,
    });

    expect(queryRawMock).toHaveBeenCalledTimes(2);
  });

  it("permite a quinta tentativa individual", async () => {
    queryRawMock
      .mockResolvedValueOnce(contador(5, 60))
      .mockResolvedValueOnce(contador(5, 700));

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).resolves.toEqual({
      permitido: true,
      tentarNovamenteEmSegundos: 0,
    });
  });

  it("bloqueia a sexta tentativa individual", async () => {
    queryRawMock
      .mockResolvedValueOnce(contador(6, 60))
      .mockResolvedValueOnce(contador(6, 700));

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).resolves.toEqual({
      permitido: false,
      tentarNovamenteEmSegundos: 700,
    });
  });

  it("permite a centésima tentativa no limite geral", async () => {
    queryRawMock
      .mockResolvedValueOnce(contador(100, 30))
      .mockResolvedValueOnce(contador(1, 900));

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).resolves.toEqual({
      permitido: true,
      tentarNovamenteEmSegundos: 0,
    });
  });

  it("bloqueia a tentativa 101 no limite geral", async () => {
    queryRawMock
      .mockResolvedValueOnce(contador(101, 27));

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).resolves.toEqual({
      permitido: false,
      tentarNovamenteEmSegundos: 27,
    });

    expect(queryRawMock).toHaveBeenCalledTimes(1);
  });

  it("rejeita email inválido", async () => {
    await expect(
      consumirTentativaLogin("email-invalido", contexto),
    ).rejects.toThrow("EntradaLimiteLoginInvalida");

    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("rejeita email maior que 254 caracteres", async () => {
    const email = `${"a".repeat(250)}@x.com`;

    await expect(
      consumirTentativaLogin(email, contexto),
    ).rejects.toThrow("EntradaLimiteLoginInvalida");

    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("rejeita segredo ausente", async () => {
    delete process.env.LOGIN_RATE_LIMIT_SECRET;

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).rejects.toThrow("ConfiguracaoLimiteLoginInvalida");

    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("rejeita segredo fora do formato esperado", async () => {
    process.env.LOGIN_RATE_LIMIT_SECRET = "segredo-invalido";

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).rejects.toThrow("ConfiguracaoLimiteLoginInvalida");

    expect(queryRawMock).not.toHaveBeenCalled();
  });

  it("rejeita contador geral inconsistente", async () => {
    queryRawMock.mockResolvedValueOnce(
      contador(102, 60),
    );

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).rejects.toThrow("ContadorLoginInconsistente");
  });

  it("rejeita contador individual inconsistente", async () => {
    queryRawMock
      .mockResolvedValueOnce(contador(1, 60))
      .mockResolvedValueOnce(contador(7, 900));

    await expect(
      consumirTentativaLogin("usuario@example.com", contexto),
    ).rejects.toThrow("ContadorLoginInconsistente");
  });
});