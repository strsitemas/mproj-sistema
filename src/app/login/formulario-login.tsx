"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

function registrarFalha(evento: string, requisicaoId?: string): void {
  // Nunca registrar formulário, senha, resposta completa ou objeto do erro.
  console.error(JSON.stringify({
    instante: new Date().toISOString(),
    nivel: "ERROR",
    evento,
    operacao: "ENVIAR_FORMULARIO_LOGIN",
    requisicaoId,
  }));
}

export default function FormularioLogin() {
  const router = useRouter();
  const enviandoRef = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function enviar(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (enviandoRef.current) return;

    const formulario = event.currentTarget;
    const campos = new FormData(formulario);
    const email = campos.get("email");
    const senha = campos.get("senha");
    const empresaSlug = campos.get("empresaSlug");

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      typeof empresaSlug !== "string"
    ) {
      setMensagem("Preencha os campos para entrar.");
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    setMensagem("");

    const controlador = new AbortController();
    const prazo = setTimeout(() => controlador.abort(), 60000);
    let requisicaoId: string | undefined;

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, empresaSlug }),
        signal: controlador.signal,
      });

      const identificador = resposta.headers.get("X-Request-Id");
      if (
        identificador &&
        /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(identificador)
      ) {
        requisicaoId = identificador;
      }

      if (resposta.status === 401) {
        setMensagem("Não foi possível entrar com os dados informados.");
        return;
      }

      if (resposta.status === 429) {
        const valor = resposta.headers.get("Retry-After");
        const segundos = valor && /^\d{1,5}$/.test(valor)
          ? Number(valor)
          : 0;

        setMensagem(
          segundos > 0
            ? `Muitas tentativas. Aguarde ${Math.ceil(segundos / 60)} minuto(s).`
            : "Muitas tentativas. Aguarde antes de tentar novamente.",
        );
        return;
      }

      if ([400, 413, 415].includes(resposta.status)) {
        setMensagem("Confira os campos informados.");
        return;
      }

      if (resposta.status === 403) {
        registrarFalha("LOGIN_ORIGEM_RECUSADA", requisicaoId);
        setMensagem("Não foi possível enviar o acesso deste endereço.");
        return;
      }

      if (!resposta.ok) {
        registrarFalha("LOGIN_SERVIDOR_RECUSOU_OPERACAO", requisicaoId);
        setMensagem("O acesso está indisponível agora. Tente novamente mais tarde.");
        return;
      }

      const dados: unknown = await resposta.json();

      if (
        resposta.status !== 200 ||
        typeof dados !== "object" ||
        dados === null ||
        !("ok" in dados) ||
        dados.ok !== true
      ) {
        registrarFalha("LOGIN_RESPOSTA_INESPERADA", requisicaoId);
        setMensagem("Não foi possível confirmar o acesso.");
        return;
      }

      formulario.reset();
      setMensagem("Acesso autorizado. Abrindo seu ambiente…");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      registrarFalha(
        controlador.signal.aborted
          ? "LOGIN_COMUNICACAO_TEMPO_EXCEDIDO"
          : "LOGIN_COMUNICACAO_OU_RESPOSTA_FALHOU",
        requisicaoId,
      );

      setMensagem(
        "Não foi possível confirmar o acesso. Confira sua conexão e tente novamente.",
      );
    } finally {
      clearTimeout(prazo);
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className={styles.formulario} aria-busy={enviando}>
      <label htmlFor="empresaSlug">Identificador da empresa</label>
      <input
        id="empresaSlug"
        name="empresaSlug"
        type="text"
        required
        maxLength={100}
        autoCapitalize="none"
        spellCheck={false}
        disabled={enviando}
      />

      <label htmlFor="email">E-mail</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        maxLength={254}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        disabled={enviando}
      />

      <label htmlFor="senha">Senha</label>
      <input
        id="senha"
        name="senha"
        type="password"
        required
        maxLength={256}
        autoComplete="current-password"
        disabled={enviando}
      />

      <button type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>

      <p className={styles.mensagem} role="status" aria-live="polite">
        {mensagem}
      </p>
    </form>
  );
}
