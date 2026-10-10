export type CadastroCliente = {
  nome: string;
  tipo: "PESSOA_FISICA" | "PESSOA_JURIDICA";
  documentoNormalizado?: string | null;
  email?: string | null;
  telefone?: string | null;
};

function campoOpcional(
  valor: unknown,
  limite: number,
  campo: string,
): string | null {
  if (valor === undefined || valor === null) return null;

  if (typeof valor !== "string") {
    throw new Error(`CampoInvalido:${campo}`);
  }

  const texto = valor.trim();

  if (texto.length > limite) {
    throw new Error(`CampoInvalido:${campo}`);
  }

  return texto || null;
}

export function validarCadastroCliente(
  entrada: unknown,
): CadastroCliente {
  if (
    typeof entrada !== "object" ||
    entrada === null ||
    Array.isArray(entrada)
  ) {
    throw new Error("CadastroClienteInvalido");
  }

  const dados = entrada as Record<string, unknown>;

  const permitidos = new Set([
    "nome",
    "tipo",
    "documentoNormalizado",
    "email",
    "telefone",
  ]);

  if (Object.keys(dados).some((chave) => !permitidos.has(chave))) {
    throw new Error("CampoNaoPermitido");
  }

  if (typeof dados.nome !== "string") {
    throw new Error("NomeInvalido");
  }

  const nome = dados.nome.trim();

  if (nome.length < 2 || nome.length > 200) {
    throw new Error("NomeInvalido");
  }

  if (
    dados.tipo !== "PESSOA_FISICA" &&
    dados.tipo !== "PESSOA_JURIDICA"
  ) {
    throw new Error("TipoClienteInvalido");
  }

  const email = campoOpcional(dados.email, 254, "email");

  if (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("EmailInvalido");
  }

  return {
    nome,
    tipo: dados.tipo,
    documentoNormalizado: campoOpcional(
      dados.documentoNormalizado,
      20,
      "documentoNormalizado",
    ),
    email,
    telefone: campoOpcional(dados.telefone, 30, "telefone"),
  };
}