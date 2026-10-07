import {
  logAviso,
  logErro,
  type ContextoLog,
} from "../auditoria/logger";

export class ErroOrigemRequisicao extends Error {
  readonly code = "AUTH_ORIGEM_INVALIDA";

  constructor() {
    super("Origem da requisição não permitida.");
    this.name = "ErroOrigemRequisicao";
  }
}

export function obterOrigemAplicacao(contexto: ContextoLog): string {
  try {
    const configurada = process.env.APP_ORIGIN;
    if (!configurada) throw new Error("AppOriginAusente");

    const url = new URL(configurada);
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);

    if (
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && local)) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error("AppOriginInvalida");
    }

    return url.origin;
  } catch (erro: unknown) {
    logErro(
      {
        ...contexto,
        modulo: "autenticacao",
        operacao: "CARREGAR_ORIGEM_APLICACAO",
      },
      "CONFIGURACAO_ORIGEM_FALHOU",
      erro,
    );
    throw erro;
  }
}

/**
 * Deve ser chamada antes de alterações feitas pelas rotas autenticadas.
 * Origem ausente também é recusada.
 * Webhooks e integrações terão autenticação própria.
 */
export function exigirOrigemPermitida(
  requisicao: Request,
  contexto: ContextoLog,
): void {
  const permitida = obterOrigemAplicacao(contexto);

  if (requisicao.headers.get("origin") !== permitida) {
    logAviso(
      {
        ...contexto,
        modulo: "autenticacao",
        operacao: "VALIDAR_ORIGEM_REQUISICAO",
      },
      "ORIGEM_REQUISICAO_RECUSADA",
      "AUTH_ORIGEM_INVALIDA",
    );
    throw new ErroOrigemRequisicao();
  }
}
