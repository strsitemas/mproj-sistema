import { describe, expect, it } from "vitest";
import {
  dependenciasDiretasAtivas,
  possuiPermissao,
  type PermissaoEfetiva,
} from "./autorizacao";

describe("CORE-01: decisao de permissao", () => {
  const permissoes: readonly PermissaoEfetiva[] = [
    {
      chave: "projetos.visualizar",
      moduloChave: "projetos",
      alcances: ["PROPRIOS", "PROJETOS_DESIGNADOS"],
    },
  ];

  it("permite alcance concedido", () => {
    expect(
      possuiPermissao(permissoes, "projetos.visualizar", "PROPRIOS"),
    ).toBe(true);
  });

  it("nega alcance nao concedido", () => {
    expect(
      possuiPermissao(permissoes, "projetos.visualizar", "EMPRESA"),
    ).toBe(false);
  });

  it("nega permissao inexistente", () => {
    expect(
      possuiPermissao(permissoes, "projetos.excluir", "PROPRIOS"),
    ).toBe(false);
  });

  it("nega usuario sem permissoes", () => {
    expect(
      possuiPermissao([], "projetos.visualizar", "PROPRIOS"),
    ).toBe(false);
  });
});

describe("CORE-01: dependencias de modulos", () => {
  it("permite modulo sem dependencias", () => {
    expect(dependenciasDiretasAtivas([])).toBe(true);
  });

  it("permite dependencias ativas", () => {
    expect(
      dependenciasDiretasAtivas([
        { requerido: { disponivel: true, empresas: [{}] } },
      ]),
    ).toBe(true);
  });

  it("nega dependencia indisponivel", () => {
    expect(
      dependenciasDiretasAtivas([
        { requerido: { disponivel: false, empresas: [{}] } },
      ]),
    ).toBe(false);
  });

  it("nega dependencia sem ativacao empresarial", () => {
    expect(
      dependenciasDiretasAtivas([
        { requerido: { disponivel: true, empresas: [] } },
      ]),
    ).toBe(false);
  });

  it("nega quando uma entre varias dependencias falha", () => {
    expect(
      dependenciasDiretasAtivas([
        { requerido: { disponivel: true, empresas: [{}] } },
        { requerido: { disponivel: true, empresas: [] } },
      ]),
    ).toBe(false);
  });
});
