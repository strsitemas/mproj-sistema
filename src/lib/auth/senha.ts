import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import {
  executarComLog,
  logAviso,
  type ContextoLog,
} from "../auditoria/logger";

const PARAMETROS = {
  N: 32768,
  r: 8,
  p: 3,
  maxmem: 64 * 1024 * 1024,
};

const TAMANHO_CHAVE = 64;
const PREFIXO = "scrypt$32768$8$3";

// O formato cabe no campo Usuario.senhaHash.
// Os parâmetros são fixos: um hash armazenado não pode aumentar
// arbitrariamente o custo de processamento.
const FORMATO_HASH =
  /^scrypt\$32768\$8\$3\$([0-9a-f]{32})\$([0-9a-f]{128})$/;

function quantidadeCaracteres(valor: string): number {
  return Array.from(valor).length;
}

function entradaValida(senha: string, minimo: number): boolean {
  if (typeof senha !== "string") return false;

  const quantidade = quantidadeCaracteres(senha);
  return quantidade >= minimo && quantidade <= 128;
}

function derivarChave(senha: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      senha,
      salt,
      TAMANHO_CHAVE,
      PARAMETROS,
      (erro, chave) => {
        if (erro) {
          reject(erro);
          return;
        }

        resolve(chave);
      },
    );
  });
}

/**
 * Novas senhas: 15 a 128 caracteres.
 * Preserva espaços e caracteres Unicode, sem trim ou truncamento.
 * Nunca registra a senha, salt ou hash.
 */
export async function criarSenhaHash(
  senha: string,
  contexto: ContextoLog,
): Promise<string> {
  return executarComLog(
    {
      ...contexto,
      modulo: "autenticacao",
      operacao: "CRIAR_HASH_SENHA",
      dependencia: "AUTENTICACAO",
    },
    async () => {
      if (!entradaValida(senha, 15)) {
        throw new RangeError("SenhaForaDoTamanhoPermitido");
      }

      const salt = randomBytes(16);
      const chave = await derivarChave(senha, salt);

      try {
        return `${PREFIXO}$${salt.toString("hex")}$${chave.toString("hex")}`;
      } finally {
        chave.fill(0);
      }
    },
  );
}

/**
 * Retorna false para senha incorreta.
 * Hash inválido é falha de integridade e não deve ser tratado
 * silenciosamente como erro de digitação do usuário.
 */
export async function verificarSenha(
  senha: string,
  senhaHash: string,
  contexto: ContextoLog,
): Promise<boolean> {
  const contextoVerificacao: ContextoLog = {
    ...contexto,
    modulo: "autenticacao",
    operacao: "VERIFICAR_SENHA",
    dependencia: "AUTENTICACAO",
  };

  return executarComLog(contextoVerificacao, async () => {
    if (typeof senhaHash !== "string") {
      logAviso(
        contextoVerificacao,
        "HASH_SENHA_INVALIDO",
        "AUTH_HASH_INVALIDO",
      );
      throw new Error("HashSenhaInvalido");
    }

    const partes = FORMATO_HASH.exec(senhaHash);

    if (!partes) {
      logAviso(
        contextoVerificacao,
        "HASH_SENHA_INVALIDO",
        "AUTH_HASH_INVALIDO",
      );
      throw new Error("HashSenhaInvalido");
    }

    if (!entradaValida(senha, 1)) {
      logAviso(
        contextoVerificacao,
        "ENTRADA_SENHA_INVALIDA",
        "AUTH_ENTRADA_INVALIDA",
      );
      return false;
    }

    const salt = Buffer.from(partes[1], "hex");
    const esperada = Buffer.from(partes[2], "hex");
    const recebida = await derivarChave(senha, salt);

    try {
      const confere = timingSafeEqual(recebida, esperada);

      if (!confere) {
        logAviso(
          contextoVerificacao,
          "SENHA_NAO_CONFERE",
          "AUTH_CREDENCIAL_INVALIDA",
        );
      }

      return confere;
    } finally {
      recebida.fill(0);
      esperada.fill(0);
    }
  });
}
