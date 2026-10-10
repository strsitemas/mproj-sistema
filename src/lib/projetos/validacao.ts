export type CadastroProjeto = {
  clienteId: string;
  nome: string;
  descricao?: string;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validarCadastroProjeto(entrada: unknown): CadastroProjeto {
  if (
    typeof entrada !== "object" ||
    entrada === null ||
    Array.isArray(entrada)
  ) {
    throw new Error("DadosProjetoInvalidos");
  }

  const dados = entrada as Record<string, unknown>;

  const camposPermitidos = new Set([
    "clienteId",
    "nome",
    "descricao",
  ]);

  if (Object.keys(dados).some((campo) => !camposPermitidos.has(campo))) {
    throw new Error("CamposProjetoNaoPermitidos");
  }

  if (typeof dados.clienteId !== "string" || !UUID.test(dados.clienteId)) {
    throw new Error("ClienteProjetoInvalido");
  }

  if (typeof dados.nome !== "string") {
    throw new Error("NomeProjetoInvalido");
  }

  const nome = dados.nome.trim();

  if (nome.length < 2 || nome.length > 200) {
    throw new Error("NomeProjetoInvalido");
  }

  let descricao: string | undefined;

  if (dados.descricao !== undefined) {
    if (typeof dados.descricao !== "string") {
      throw new Error("DescricaoProjetoInvalida");
    }

    descricao = dados.descricao.trim();

    if (descricao.length > 10000) {
      throw new Error("DescricaoProjetoInvalida");
    }
  }

  return {
    clienteId: dados.clienteId,
    nome,
    ...(descricao !== undefined ? { descricao } : {}),
  };
}