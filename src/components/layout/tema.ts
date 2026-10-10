export type TemaAplicacao = "light" | "dark";

const CHAVE_TEMA = "mproj-tema";

export function lerTemaAplicacao(): TemaAplicacao {
  try {
    const tema = window.localStorage.getItem(CHAVE_TEMA);
    return tema === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function salvarTemaAplicacao(tema: TemaAplicacao): void {
  try {
    window.localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // A interface continua funcional se o armazenamento estiver indisponivel.
  }
}