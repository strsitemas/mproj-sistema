"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./aplicacao.module.css";
import {
  lerTemaAplicacao,
  salvarTemaAplicacao,
  type TemaAplicacao,
} from "./tema";

type Props = {
  usuarioNome: string;
  empresaNome: string;
  children: ReactNode;
};

export default function EstruturaAplicacao({
  usuarioNome,
  empresaNome,
  children,
}: Readonly<Props>) {
  const pathname = usePathname();
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const saindoRef = useRef(false);

  const [tema, setTema] = useState<TemaAplicacao>("dark");
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setTema(lerTemaAplicacao());
  }, []);
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

  function alternarTema() {
    const proximo = tema === "dark" ? "light" : "dark";
    setTema(proximo);
    salvarTemaAplicacao(proximo);
  }

  const paginas = [
    { nome: "Início", href: "/dashboard" },
    { nome: "Clientes", href: "/clientes" },
  ];

  return (
    <div className={styles.aplicacao} data-theme={tema}>
      <a href="#conteudo-principal" className={styles.pular}>
        Ir para o conteúdo
      </a>

      <aside
        className={`${styles.lateral} ${menuAberto ? styles.menuAberto : ""}`}
      >
        <a href="/dashboard" className={styles.marca}>
          <span className={styles.logo} aria-hidden="true">M</span>
          <span>MProj</span>
        </a>

        <nav aria-label="Navegação principal" className={styles.navegacao}>
          {paginas.map((pagina) => (
            <a
              key={pagina.href}
              href={pagina.href}
              className={pathname === pagina.href ? styles.ativo : ""}
              aria-current={pathname === pagina.href ? "page" : undefined}
            >
              {pagina.nome}
            </a>
          ))}
        </nav>

        <div className={styles.rodapeMenu}>STR Software</div>
      </aside>

      <div className={styles.principal}>
        <header className={styles.topo}>
          <button
            type="button"
            className={styles.botaoMenu}
            onClick={() => setMenuAberto(!menuAberto)}
            aria-expanded={menuAberto}
          >
            {menuAberto ? "Fechar menu" : "Menu"}
          </button>

          <span className={styles.empresa}>{empresaNome}</span>

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.botao}
              onClick={alternarTema}
              aria-label={tema === "dark" ? "Usar tema claro" : "Usar tema escuro"}
            >
              {tema === "dark" ? "Claro" : "Escuro"}
            </button>

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

        <main id="conteudo-principal" className={styles.conteudo}>
          {mensagem && <p className={styles.aviso} role="alert">{mensagem}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}