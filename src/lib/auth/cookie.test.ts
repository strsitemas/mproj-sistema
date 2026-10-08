import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const setMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: getMock,
    set: setMock,
  })),
}));

vi.mock("./origem", () => ({
  obterOrigemAplicacao: vi.fn(() => "https://mproj.example.com"),
}));

vi.mock("./sessao", async (importOriginal) => {
  const original = await importOriginal<typeof import("./sessao")>();

  return {
    ...original,
    validarSessao: vi.fn(),
  };
});

import {
  gravarCookieSessao,
  lerTokenSessao,
  removerCookieSessao,
} from "./cookie";

const contexto = {
  requisicaoId: "teste-cookie-001",
  modulo: "teste",
  operacao: "TESTE_COOKIE",
};

describe("cookie de sessão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lê o cookie seguro de sessão", async () => {
    getMock.mockReturnValueOnce({
      value: "a".repeat(64),
    });

    await expect(
      lerTokenSessao(contexto),
    ).resolves.toBe("a".repeat(64));

    expect(getMock).toHaveBeenCalledWith("__Host-mproj-session");
  });

  it("retorna undefined quando cookie não existe", async () => {
    getMock.mockReturnValueOnce(undefined);

    await expect(
      lerTokenSessao(contexto),
    ).resolves.toBeUndefined();
  });

  it("grava cookie HttpOnly seguro com SameSite lax e path raiz", async () => {
    const token = "b".repeat(64);
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

    await gravarCookieSessao(
      token,
      expiraEm,
      contexto,
    );

    expect(setMock).toHaveBeenCalledWith(
      "__Host-mproj-session",
      token,
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires: expiraEm,
      },
    );
  });

  it("rejeita token malformado ao gravar cookie", async () => {
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

    await expect(
      gravarCookieSessao(
        "token-invalido",
        expiraEm,
        contexto,
      ),
    ).rejects.toThrow("CredencialCookieInvalida");

    expect(setMock).not.toHaveBeenCalled();
  });

  it("rejeita cookie já expirado", async () => {
    await expect(
      gravarCookieSessao(
        "a".repeat(64),
        new Date(Date.now() - 1000),
        contexto,
      ),
    ).rejects.toThrow("CredencialCookieInvalida");

    expect(setMock).not.toHaveBeenCalled();
  });

  it("rejeita expiração superior à duração máxima da sessão", async () => {
    const expiraEm = new Date(
      Date.now() + 24 * 60 * 60 * 1000 + 60_000,
    );

    await expect(
      gravarCookieSessao(
        "a".repeat(64),
        expiraEm,
        contexto,
      ),
    ).rejects.toThrow("CredencialCookieInvalida");

    expect(setMock).not.toHaveBeenCalled();
  });

  it("remove cookie usando expiração no passado e maxAge zero", async () => {
    await removerCookieSessao(contexto);

    expect(setMock).toHaveBeenCalledWith(
      "__Host-mproj-session",
      "",
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      },
    );
  });
});