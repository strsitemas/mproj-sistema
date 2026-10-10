export type ItemCadastroProposta = {
  descricao: string;
  tipoProfissional: string;
  horasPrevistas: string;
  valorHoraCentavos: bigint;
  valorTotalCentavos: bigint;
  ordem: number;
};

export type CadastroProposta = {
  clienteId: string;
  titulo: string;
  descricao: string | null;
  itens: ItemCadastroProposta[];
  valorTotalCentavos: bigint;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function objeto(valor: unknown): Record<string, unknown> {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor)) {
    throw new Error("DadosPropostaInvalidos");
  }

  return valor as Record<string, unknown>;
}

function camposPermitidos(
  dados: Record<string, unknown>,
  permitidos: string[],
): void {
  const conjunto = new Set(permitidos);

  if (Object.keys(dados).some((chave) => !conjunto.has(chave))) {
    throw new Error("CampoPropostaNaoPermitido");
  }
}

function texto(
  valor: unknown,
  campo: string,
  minimo: number,
  maximo: number,
): string {
  if (typeof valor !== "string") {
    throw new Error(`CampoPropostaInvalido:${campo}`);
  }

  const resultado = valor.trim();

  if (resultado.length < minimo || resultado.length > maximo) {
    throw new Error(`CampoPropostaInvalido:${campo}`);
  }

  return resultado;
}

function numeroDecimal(
  valor: unknown,
  campo: string,
  casasMaximas: number,
): bigint {
  if (typeof valor !== "string") {
    throw new Error(`CampoPropostaInvalido:${campo}`);
  }

  const padrao = new RegExp(
    `^(?:0|[1-9][0-9]{0,8})(?:\\.[0-9]{1,${casasMaximas}})?$`,
  );

  if (!padrao.test(valor)) {
    throw new Error(`CampoPropostaInvalido:${campo}`);
  }

  const [inteiro, decimal = ""] = valor.split(".");
  const fator = 10n ** BigInt(casasMaximas);

  const resultado =
    BigInt(inteiro) * fator +
    BigInt(decimal.padEnd(casasMaximas, "0"));

  if (resultado <= 0n) {
    throw new Error(`CampoPropostaInvalido:${campo}`);
  }

  return resultado;
}

export function validarCadastroProposta(
  entrada: unknown,
): CadastroProposta {
  const dados = objeto(entrada);

  camposPermitidos(dados, [
    "clienteId",
    "titulo",
    "descricao",
    "itens",
  ]);

  if (typeof dados.clienteId !== "string" || !UUID.test(dados.clienteId)) {
    throw new Error("ClientePropostaInvalido");
  }

  const titulo = texto(dados.titulo, "titulo", 2, 200);

  let descricao: string | null = null;

  if (dados.descricao !== undefined && dados.descricao !== null) {
    descricao = texto(dados.descricao, "descricao", 0, 10000) || null;
  }

  if (
    !Array.isArray(dados.itens) ||
    dados.itens.length === 0 ||
    dados.itens.length > 100
  ) {
    throw new Error("ItensPropostaInvalidos");
  }

  const itens: ItemCadastroProposta[] = [];
  let valorTotalCentavos = 0n;

  for (const [indice, entradaItem] of dados.itens.entries()) {
    const item = objeto(entradaItem);

    camposPermitidos(item, [
      "descricao",
      "tipoProfissional",
      "horasPrevistas",
      "valorHora",
    ]);

    const descricaoItem = texto(item.descricao, "descricaoItem", 2, 300);
    const tipoProfissional = texto(
      item.tipoProfissional,
      "tipoProfissional",
      2,
      160,
    );

    // Horas em formato decimal: "10", "10.5" ou "10.50".
    const horasCentésimos = numeroDecimal(
      item.horasPrevistas,
      "horasPrevistas",
      2,
    );

    // Valor da hora em reais: "250", "250.00" ou "250.50".
    const valorHoraCentavos = numeroDecimal(
      item.valorHora,
      "valorHora",
      2,
    );

    // Arredondamento para o centavo mais próximo.
    const valorItemCentavos =
      (horasCentésimos * valorHoraCentavos + 50n) / 100n;

    valorTotalCentavos += valorItemCentavos;

    itens.push({
      descricao: descricaoItem,
      tipoProfissional,
      horasPrevistas:
        `${horasCentésimos / 100n}.${String(horasCentésimos % 100n).padStart(2, "0")}`,
      valorHoraCentavos,
      valorTotalCentavos: valorItemCentavos,
      ordem: indice,
    });
  }

  return {
    clienteId: dados.clienteId,
    titulo,
    descricao,
    itens,
    valorTotalCentavos,
  };
}