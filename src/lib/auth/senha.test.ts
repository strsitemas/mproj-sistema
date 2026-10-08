import { describe, expect, it } from "vitest";
import { criarSenhaHash, verificarSenha } from "./senha";

const contexto = {
  requisicaoId: "teste-senha-001",
  modulo: "teste",
  operacao: "TESTE_SENHA",
  origem: "TESTE_AUTOMATIZADO",
};

describe("senha", () => {
  it("cria hash scrypt no formato esperado", async () => {
    const hash = await criarSenhaHash(
      "SenhaDeTeste#2026",
      contexto,
    );

    expect(hash).toMatch(
      /^scrypt\$32768\$8\$3\$[0-9a-f]{32}\$[0-9a-f]{128}$/,
    );
  });

  it("gera salts diferentes para a mesma senha", async () => {
    const senha = "SenhaDeTeste#2026";

    const hash1 = await criarSenhaHash(senha, contexto);
    const hash2 = await criarSenhaHash(senha, contexto);

    expect(hash1).not.toBe(hash2);
  });

  it("aceita a senha correta", async () => {
    const senha = "SenhaDeTeste#2026";
    const hash = await criarSenhaHash(senha, contexto);

    await expect(
      verificarSenha(senha, hash, contexto),
    ).resolves.toBe(true);
  });

  it("rejeita senha incorreta", async () => {
    const hash = await criarSenhaHash(
      "SenhaDeTeste#2026",
      contexto,
    );

    await expect(
      verificarSenha("SenhaErrada#2026", hash, contexto),
    ).resolves.toBe(false);
  });

  it("rejeita nova senha com menos de 15 caracteres", async () => {
    await expect(
      criarSenhaHash("Curta#2026", contexto),
    ).rejects.toThrow("SenhaForaDoTamanhoPermitido");
  });

  it("rejeita nova senha com mais de 128 caracteres", async () => {
    await expect(
      criarSenhaHash("A".repeat(129), contexto),
    ).rejects.toThrow("SenhaForaDoTamanhoPermitido");
  });

  it("preserva espaços e Unicode na senha", async () => {
    const senha = "  Senha çã 日本 2026!  ";

    const hash = await criarSenhaHash(senha, contexto);

    await expect(
      verificarSenha(senha, hash, contexto),
    ).resolves.toBe(true);

    await expect(
      verificarSenha(senha.trim(), hash, contexto),
    ).resolves.toBe(false);
  });

  it("trata hash malformado como erro de integridade", async () => {
    await expect(
      verificarSenha(
        "SenhaDeTeste#2026",
        "hash-invalido",
        contexto,
      ),
    ).rejects.toThrow("HashSenhaInvalido");
  });
});