import { describe, expect, it } from "vitest";
import { validarCadastroCliente } from "./validacao";

describe("validarCadastroCliente", () => {
  it("aceita cadastro valido", () => {
    const resultado = validarCadastroCliente({
      nome: "Cliente Exemplo",
      tipo: "PESSOA_JURIDICA",
      email: "contato@exemplo.com",
    });

    expect(resultado.nome).toBe("Cliente Exemplo");
    expect(resultado.tipo).toBe("PESSOA_JURIDICA");
    expect(resultado.email).toBe("contato@exemplo.com");
  });

  it("rejeita nome invalido", () => {
    expect(() =>
      validarCadastroCliente({
        nome: "A",
        tipo: "PESSOA_FISICA",
      }),
    ).toThrow("NomeInvalido");
  });

  it("rejeita tipo desconhecido", () => {
    expect(() =>
      validarCadastroCliente({
        nome: "Cliente Exemplo",
        tipo: "OUTRO",
      }),
    ).toThrow("TipoClienteInvalido");
  });

  it("rejeita email invalido", () => {
    expect(() =>
      validarCadastroCliente({
        nome: "Cliente Exemplo",
        tipo: "PESSOA_FISICA",
        email: "email-invalido",
      }),
    ).toThrow("EmailInvalido");
  });

  it("impede empresaId enviado externamente", () => {
    expect(() =>
      validarCadastroCliente({
        nome: "Cliente Exemplo",
        tipo: "PESSOA_JURIDICA",
        empresaId: "empresa-indevida",
      }),
    ).toThrow("CampoNaoPermitido");
  });
});