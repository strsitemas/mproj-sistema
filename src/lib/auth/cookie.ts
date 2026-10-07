import { cookies } from "next/headers";
import {
  executarComLog,
  type ContextoLog,
} from "../auditoria/logger";
import { obterOrigemAplicacao } from "./origem";
import {
  DURACAO_SESSAO_MS,
  validarSessao,
  type SessaoAutenticada,
} from "./sessao";

function configuracaoCookie(contexto: ContextoLog) {
  const origem = obterOrigemAplicacao(contexto);
  const seguro = origem.startsWith("https://");

  return {
    nome: seguro ? "__Host-mproj-session" : "mproj-session",
    opcoes: {
      httpOnly: true,
      secure: seguro,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function lerTokenSessao(
  contexto: ContextoLog,
): Promise<string | undefined> {
  return executarComLog(
    { ...contexto, modulo: "autenticacao", operacao: "LER_COOKIE_SESSAO" },
    async () => {
      const configuracao = configuracaoCookie(contexto);
      const armazenamento = await cookies();
      return armazenamento.get(configuracao.nome)?.value;
    },
  );
}

export async function lerSessaoAtual(
  contexto: ContextoLog,
): Promise<SessaoAutenticada | null> {
  const token = await lerTokenSessao(contexto);
  return validarSessao(token, contexto);
}

/**
 * Somente em Route Handler ou Server Action.
 * Chamar depois da confirmação da sessão no banco.
 * O token não deve ser incluído no JSON da resposta.
 */
export async function gravarCookieSessao(
  token: string,
  expiraEm: Date,
  contexto: ContextoLog,
): Promise<void> {
  return executarComLog(
    { ...contexto, modulo: "autenticacao", operacao: "GRAVAR_COOKIE_SESSAO" },
    async () => {
      const instante = Date.now();
      const expiracao = expiraEm.getTime();

      if (
        !/^[0-9a-f]{64}$/.test(token) ||
        !Number.isFinite(expiracao) ||
        expiracao <= instante ||
        expiracao > instante + DURACAO_SESSAO_MS
      ) {
        throw new Error("CredencialCookieInvalida");
      }

      const configuracao = configuracaoCookie(contexto);
      const armazenamento = await cookies();

      armazenamento.set(configuracao.nome, token, {
        ...configuracao.opcoes,
        expires: expiraEm,
      });
    },
  );
}

/**
 * Somente em Route Handler ou Server Action.
 * No logout, revogar primeiro no banco; depois remover o cookie.
 */
export async function removerCookieSessao(
  contexto: ContextoLog,
): Promise<void> {
  return executarComLog(
    { ...contexto, modulo: "autenticacao", operacao: "REMOVER_COOKIE_SESSAO" },
    async () => {
      const configuracao = configuracaoCookie(contexto);
      const armazenamento = await cookies();

      armazenamento.set(configuracao.nome, "", {
        ...configuracao.opcoes,
        expires: new Date(0),
        maxAge: 0,
      });
    },
  );
}
