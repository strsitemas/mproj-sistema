import { afterEach, describe, expect, it } from "vitest";
import {
  ErroOrigemRequisicao,
  exigirOrigemPermitida,
  obterOrigemAplicacao,
} from "./origem";

const contexto = {
  requisicaoId: "teste-origem-001",
  modulo: "teste",
  operacao: "TESTE_ORIGEM",
  origem: "TESTE_AUTOMATIZADO",
};

const appOriginOriginal = process.env.APP_ORIGIN;

afterEach(() => {
  if (appOriginOriginal === undefined) {
    delete process.env.APP_ORIGIN;
  } else {
    process.env.APP_ORIGIN = appOriginOriginal;
  }
});

describe("origem da aplicação", () => {
  it("aceita HTTPS válido", () => {
    process.env.APP_ORIGIN = "https://mproj.exemplo.com";

    expect(obterOrigemAplicacao(contexto))
      .toBe("https://mproj.exemplo.com");
  });

  it("aceita HTTP em localhost", () => {
    process.env.APP_ORIGIN = "http://localhost:3000";

    expect(obterOrigemAplicacao(contexto))
      .toBe("http://localhost:3000");
  });

  it("rejeita HTTP fora do ambiente local", () => {
    process.env.APP_ORIGIN = "http://mproj.exemplo.com";

    expect(() => obterOrigemAplicacao(contexto))
      .toThrow("AppOriginInvalida");
  });

  it("rejeita APP_ORIGIN ausente", () => {
    delete process.env.APP_ORIGIN;

    expect(() => obterOrigemAplicacao(contexto))
      .toThrow("AppOriginAusente");
  });

  it("rejeita APP_ORIGIN com caminho", () => {
    process.env.APP_ORIGIN = "https://mproj.exemplo.com/login";

    expect(() => obterOrigemAplicacao(contexto))
      .toThrow("AppOriginInvalida");
  });

  it("aceita requisição com Origin exatamente permitido", () => {
    process.env.APP_ORIGIN = "https://mproj.exemplo.com";

    const requisicao = new Request(
      "https://mproj.exemplo.com/api/teste",
      {
        method: "POST",
        headers: {
          origin: "https://mproj.exemplo.com",
        },
      },
    );

    expect(() =>
      exigirOrigemPermitida(requisicao, contexto),
    ).not.toThrow();
  });

  it("rejeita requisição de outra origem", () => {
    process.env.APP_ORIGIN = "https://mproj.exemplo.com";

    const requisicao = new Request(
      "https://mproj.exemplo.com/api/teste",
      {
        method: "POST",
        headers: {
          origin: "https://atacante.exemplo.com",
        },
      },
    );

    expect(() =>
      exigirOrigemPermitida(requisicao, contexto),
    ).toThrow(ErroOrigemRequisicao);
  });

  it("rejeita requisição sem header Origin", () => {
    process.env.APP_ORIGIN = "https://mproj.exemplo.com";

    const requisicao = new Request(
      "https://mproj.exemplo.com/api/teste",
      {
        method: "POST",
      },
    );

    expect(() =>
      exigirOrigemPermitida(requisicao, contexto),
    ).toThrow(ErroOrigemRequisicao);
  });
});