/**
 * Logger de execução do MProj.
 * Uso exclusivo no servidor.
 * Não substitui a auditoria transacional de negócio.
 */

export type ContextoLog = {
  requisicaoId: string;
  operacao: string;
  modulo: string;
  empresaId?: string;
  usuarioId?: string;
  entidadeId?: string;
  dependencia?: "BANCO" | "API_EXTERNA" | "ARQUIVO" | "AUTENTICACAO";
};

type NivelLog = "INFO" | "WARN" | "ERROR";

type DadosLog = {
  evento: string;
  duracaoMs?: number;
  codigo?: string;
  erroTipo?: string;
};

function validarContexto(contexto: ContextoLog): void {
  if (typeof window !== "undefined") {
    throw new Error("O logger do MProj deve ser usado somente no servidor.");
  }

  if (!contexto.requisicaoId || !contexto.operacao || !contexto.modulo) {
    throw new Error("Contexto de log obrigatório não informado.");
  }
}

/**
 * Projeta apenas campos permitidos.
 * Propriedades adicionais recebidas em execução não são serializadas.
 */
function emitir(
  nivel: NivelLog,
  contexto: ContextoLog,
  dados: DadosLog,
): void {
  validarContexto(contexto);

  const registro = JSON.stringify({
    instante: new Date().toISOString(),
    nivel,
    evento: dados.evento,
    requisicaoId: contexto.requisicaoId,
    operacao: contexto.operacao,
    modulo: contexto.modulo,
    empresaId: contexto.empresaId,
    usuarioId: contexto.usuarioId,
    entidadeId: contexto.entidadeId,
    dependencia: contexto.dependencia,
    duracaoMs: dados.duracaoMs,
    codigo: dados.codigo,
    erroTipo: dados.erroTipo,
  });

  if (nivel === "ERROR") {
    console.error(registro);
  } else if (nivel === "WARN") {
    console.warn(registro);
  } else {
    console.info(registro);
  }
}

/**
 * Extrai somente identificadores técnicos.
 * Mensagem, stack e objeto do erro não são enviados ao log:
 * podem conter SQL, parâmetros ou credenciais.
 */
function identificarErro(erro: unknown): {
  erroTipo: string;
  codigo?: string;
} {
  let erroTipo = "ErroNaoIdentificado";
  let codigo: string | undefined;

  // Um erro também pode ser um objeto com getters que lançam exceções.
  try {
    if (erro instanceof Error &&
        /^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(erro.name)) {
      erroTipo = erro.name;
    }

    if (typeof erro === "object" && erro !== null && "code" in erro) {
      const valor = (erro as { code?: unknown }).code;

      if (typeof valor === "string" &&
          /^[A-Z0-9_]{1,40}$/.test(valor)) {
        codigo = valor;
      }
    }
  } catch {
    // A falha da inspeção será identificada no evento ERROR.
    erroTipo = "ErroNaoInspecionavel";
  }

  return { erroTipo, codigo };
}

export function logInfo(
  contexto: ContextoLog,
  evento: string,
): void {
  emitir("INFO", contexto, { evento });
}

export function logAviso(
  contexto: ContextoLog,
  evento: string,
  codigo?: string,
): void {
  emitir("WARN", contexto, { evento, codigo });
}

export function logErro(
  contexto: ContextoLog,
  evento: string,
  erro: unknown,
): void {
  emitir("ERROR", contexto, { evento, ...identificarErro(erro) });
}

/**
 * Não registra argumentos nem resultado da operação.
 * Uma operação só é bem-sucedida se sua função resolver sem erro.
 */
export async function executarComLog<T>(
  contexto: ContextoLog,
  executar: () => Promise<T>,
): Promise<T> {
  const inicio = Date.now();

  emitir("INFO", contexto, { evento: "OPERACAO_INICIADA" });

  try {
    const resultado = await executar();

    emitir("INFO", contexto, {
      evento: "OPERACAO_CONCLUIDA",
      duracaoMs: Math.max(0, Date.now() - inicio),
    });

    return resultado;
  } catch (erro: unknown) {
    emitir("ERROR", contexto, {
      evento: "OPERACAO_FALHOU",
      duracaoMs: Math.max(0, Date.now() - inicio),
      ...identificarErro(erro),
    });

    throw erro;
  }
}