"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

const navegacao = [
  ["Início", "M3 11l9-8 9 8M5 10v10h14V10"],
  ["Projetos", "M3 6h6l2 2h10v11H3z"],
  ["Tarefas", "M4 4h16v16H4zM8 12l3 3 5-6"],
  ["Cronograma", "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4"],
  ["Horas", "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2"],
  ["Financeiro", "M12 3v18M16 7c-1-2-7-2-7 1s7 2 7 5-6 3-8 1"],
  ["Relatórios", "M5 20V10M12 20V4M19 20v-7"],
  ["Equipe", "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5"],
  ["Documentos", "M6 3h8l4 4v14H6zM14 3v4h4"],
  ["Configurações", "M12 9a3 3 0 100 6 3 3 0 000-6zM4 12h2M18 12h2M12 4v2M12 18v2"],
] as const;

function AreaPreparacao({ titulo }: { titulo: string }) {
  return (
    <section className={styles.cartao} aria-label={titulo}>
      <div className={styles.cabecalhoCartao}>
        <h2>{titulo}</h2>
        <span className={styles.etiqueta}>Em preparação</span>
      </div>
      <div className={styles.vazio}>
        Esta área estará disponível em breve.
      </div>
    </section>
  );
}

export default function Painel({
  usuarioNome,
  empresaNome,
}: Readonly<{ usuarioNome: string; empresaNome: string }>) {
  const router = useRouter();
  const [claro, setClaro] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const saindoRef = useRef(false);

  const primeiroNome = usuarioNome.trim().split(/\s+/)[0] || usuarioNome;
  const iniciais = usuarioNome.trim().split(/\s+/)
    .slice(0, 2).map(parte => Array.from(parte)[0] || "").join("");

  async function sair(): Promise<void> {
    if (saindoRef.current) return;
    saindoRef.current = true;
    setSaindo(true);
    setMensagem("");

    const controlador = new AbortController();
    const prazo = setTimeout(() => controlador.abort(), 30000);
    let requisicaoId: string | undefined;

    try {
      const resposta = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        signal: controlador.signal,
      });

      const identificador = resposta.headers.get("X-Request-Id");
      if (
        identificador &&
        /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(identificador)
      ) {
        requisicaoId = identificador;
      }

      if (!resposta.ok) throw new Error("LogoutRecusado");

      const dados: unknown = await resposta.json();
      if (
        resposta.status !== 200 ||
        typeof dados !== "object" ||
        dados === null ||
        !("ok" in dados) ||
        dados.ok !== true
      ) {
        throw new Error("RespostaLogoutInesperada");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      console.error(JSON.stringify({
        instante: new Date().toISOString(),
        nivel: "ERROR",
        evento: controlador.signal.aborted
          ? "LOGOUT_INTERFACE_TEMPO_EXCEDIDO"
          : "LOGOUT_INTERFACE_FALHOU",
        operacao: "SAIR_DO_DASHBOARD",
        requisicaoId,
      }));

      setMensagem("Não foi possível confirmar a saída. Tente novamente.");
    } finally {
      clearTimeout(prazo);
      saindoRef.current = false;
      setSaindo(false);
    }
  }

  return (
    <div className={styles.aplicacao} data-theme={claro ? "light" : "dark"}>
      <a href="#conteudo-dashboard" className={styles.pular}>
        Ir para o conteúdo
      </a>

      <aside
        id="menu-dashboard"
        className={`${styles.lateral} ${menuAberto ? styles.menuAberto : ""}`}
      >
        <a href="/dashboard" className={styles.marca}>
          <span className={styles.logo} aria-hidden="true">M</span>
          <span>MProj</span>
        </a>

        <nav aria-label="Navegação principal" className={styles.navegacao}>
          {navegacao.map(([nome, desenho], indice) => (
            indice === 0 ? (
              <a
                key={nome}
                href="/dashboard"
                className={styles.ativo}
                aria-current="page"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={desenho} />
                </svg>
                <span>{nome}</span>
              </a>
            ) : (
              <button
                key={nome}
                type="button"
                disabled
                title={`${nome} — disponível em breve`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={desenho} />
                </svg>
                <span>{nome}</span>
              </button>
            )
          ))}
        </nav>

        <div className={styles.rodapeMenu}>STR Software</div>
      </aside>

      <div className={styles.principal}>
        <header className={styles.topo}>
          <button
            type="button"
            className={styles.botaoMenu}
            aria-controls="menu-dashboard"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto(!menuAberto)}
          >
            {menuAberto ? "Fechar menu" : "Menu"}
          </button>

          <span className={styles.empresa}>{empresaNome}</span>

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.botao}
              onClick={() => setClaro(!claro)}
              aria-label={claro ? "Usar tema escuro" : "Usar tema claro"}
            >
              {claro ? "Escuro" : "Claro"}
            </button>

            <span className={styles.avatar} aria-hidden="true">{iniciais}</span>
            <span className={styles.usuario}>{usuarioNome}</span>

            <button
              type="button"
              className={styles.botao}
              disabled={saindo}
              onClick={sair}
            >
              {saindo ? "Saindo…" : "Sair"}
            </button>
          </div>
        </header>

        <main id="conteudo-dashboard" className={styles.conteudo}>
          <h1>Olá, {primeiroNome}</h1>
          <p className={styles.subtitulo}>
            Seu ambiente de projetos, equipes e entregas.
          </p>

          {mensagem && (
            <p className={styles.aviso} role="alert">{mensagem}</p>
          )}

          <div className={styles.indicadores}>
            {["Projetos ativos", "Tarefas pendentes", "Horas registradas", "Financeiro"]
              .map(titulo => (
                <section key={titulo} className={`${styles.cartao} ${styles.indicador}`}>
                  <h2>{titulo}</h2>
                  <span className={styles.valor} aria-label="Ainda indisponível">—</span>
                  <span className={styles.muted}>Em preparação</span>
                </section>
              ))}
          </div>

          <div className={styles.grade}>
            <div className={styles.coluna}>
              <AreaPreparacao titulo="Projetos em destaque" />
              <AreaPreparacao titulo="Cronograma" />
              <AreaPreparacao titulo="Próximas tarefas" />
            </div>
            <div className={styles.coluna}>
              <AreaPreparacao titulo="Horas por projeto" />
              <AreaPreparacao titulo="Resumo financeiro" />
              <AreaPreparacao titulo="Atividades recentes" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
