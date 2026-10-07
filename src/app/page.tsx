export default function PaginaInicial() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="MProj — início">
          <span className="brand-symbol" aria-hidden="true">M</span>
          <span>MProj</span>
        </a>
        <span className="development-badge">Em desenvolvimento</span>
      </header>

      <main id="conteudo" className="main-content">
        <section className="welcome" aria-labelledby="titulo-inicial">
          <p className="eyebrow">STR Software</p>
          <h1 id="titulo-inicial">Seu próximo projeto começa aqui.</h1>
          <p className="intro">
            Um espaço para organizar projetos, equipes e entregas.
          </p>

          <div className="preparation">
            <span className="preparation-icon" aria-hidden="true">M</span>
            <div>
              <h2>Estamos preparando seu ambiente.</h2>
              <p>
                As áreas de trabalho serão disponibilizadas conforme
                o desenvolvimento dos módulos.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        MProj · STR Software
      </footer>
    </div>
  );
}
