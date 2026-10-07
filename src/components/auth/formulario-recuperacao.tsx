"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/app/login/login.module.css";

type Props = { modo: "solicitar" | "redefinir" };

export default function FormularioRecuperacao({ modo }: Props) {
  const redefinir = modo === "redefinir";
  const tokenRef = useRef("");
  const enviandoRef = useRef(false);
  const [pronto, setPronto] = useState(!redefinir);
  const [linkValido, setLinkValido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!redefinir) return;

    // A referência preserva o token durante a repetição do efeito
    // feita pelo Strict Mode no desenvolvimento.
    const fragmento = window.location.hash;

    if (fragmento) {
      const parametros = new URLSearchParams(fragmento.slice(1));
      const tokens = parametros.getAll("token");

      tokenRef.current = tokens.length === 1 &&
        /^[0-9a-f]{64}$/.test(tokens[0])
        ? tokens[0]
        : "";

      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }

    const valido = /^[0-9a-f]{64}$/.test(tokenRef.current);
    setLinkValido(valido);
    setPronto(true);

    if (!valido) {
      setMensagem("Abra o link recebido por e-mail ou solicite uma nova recuperação.");
    }
  }, [redefinir]);

  function registrarFalha(evento: string, requisicaoId?: string): void {
    console.error(JSON.stringify({
      instante: new Date().toISOString(),
      nivel: "ERROR",
      evento,
      operacao: redefinir
        ? "ENVIAR_FORMULARIO_REDEFINICAO"
        : "ENVIAR_FORMULARIO_RECUPERACAO",
      requisicaoId,
    }));
  }

  async function enviar(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (enviandoRef.current || concluido || !pronto) return;

    const formulario = event.currentTarget;
    const campos = new FormData(formulario);
    let corpo: Record<string, string>;

    if (redefinir) {
      const novaSenha = campos.get("novaSenha");
      const confirmacaoSenha = campos.get("confirmacaoSenha");

      if (!linkValido || !tokenRef.current) {
        setMensagem("Solicite uma nova recuperação de acesso.");
        return;
      }

      if (
        typeof novaSenha !== "string" ||
        typeof confirmacaoSenha !== "string"
      ) {
        setMensagem("Preencha e confirme sua nova senha.");
        return;
      }

      const tamanho = Array.from(novaSenha).length;

      if (tamanho < 15 || tamanho > 128) {
        setMensagem("A nova senha deve ter entre 15 e 128 caracteres.");
        return;
      }

      if (novaSenha !== confirmacaoSenha) {
        setMensagem("A confirmação da senha não confere.");
        return;
      }

      corpo = { token: tokenRef.current, novaSenha, confirmacaoSenha };
    } else {
      const email = campos.get("email");
      const empresaSlug = campos.get("empresaSlug");

      if (
        typeof email !== "string" ||
        typeof empresaSlug !== "string"
      ) {
        setMensagem("Informe sua empresa e seu e-mail.");
        return;
      }

      corpo = { email, empresaSlug };
    }

    enviandoRef.current = true;
    setEnviando(true);
    setMensagem("");

    const controlador = new AbortController();
    const prazo = setTimeout(() => controlador.abort(), 60000);
    let requisicaoId: string | undefined;

    try {
      const resposta = await fetch(
        redefinir
          ? "/api/auth/redefinir-senha"
          : "/api/auth/recuperar-senha",
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
          signal: controlador.signal,
        },
      );

      const identificador = resposta.headers.get("X-Request-Id");

      if (
        identificador &&
        /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(identificador)
      ) {
        requisicaoId = identificador;
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
        setMensagem(
          redefinir
            ? "Confira os campos. Se estiverem corretos, o link pode ter expirado ou já ter sido utilizado. Solicite uma nova recuperação."
            : "Confira o identificador da empresa e o e-mail informado.",
        );
        return;
      }

      if (resposta.status === 403) {
        registrarFalha("RECUPERACAO_ORIGEM_RECUSADA", requisicaoId);
        setMensagem("Não foi possível enviar a solicitação deste endereço.");
        return;
      }

      if (!resposta.ok) {
        registrarFalha("RECUPERACAO_SERVIDOR_RECUSOU_OPERACAO", requisicaoId);
        setMensagem("O serviço está indisponível agora. Tente novamente mais tarde.");
        return;
      }

      const dados: unknown = await resposta.json();
      const statusEsperado = redefinir ? 200 : 202;

      if (
        resposta.status !== statusEsperado ||
        typeof dados !== "object" ||
        dados === null ||
        !("ok" in dados) ||
        dados.ok !== true
      ) {
        registrarFalha("RECUPERACAO_RESPOSTA_INESPERADA", requisicaoId);
        setMensagem("Não foi possível confirmar a operação.");
        return;
      }

      formulario.reset();
      tokenRef.current = "";
      setConcluido(true);
      setMensagem(
        redefinir
          ? "Senha alterada com sucesso. Entre novamente com sua nova senha."
          : "Se os dados corresponderem a um cadastro ativo, você receberá um e-mail com as instruções. Confira também a pasta de spam.",
      );
    } catch {
      registrarFalha(
        controlador.signal.aborted
          ? "RECUPERACAO_COMUNICACAO_TEMPO_EXCEDIDO"
          : "RECUPERACAO_COMUNICACAO_OU_RESPOSTA_FALHOU",
        requisicaoId,
      );

      setMensagem(
        redefinir
          ? "Não foi possível confirmar a alteração. Tente entrar com a nova senha; se não funcionar, tente novamente ou solicite outro link."
          : "Não foi possível confirmar a solicitação. Confira seu e-mail antes de tentar novamente.",
      );
    } finally {
      clearTimeout(prazo);
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <>
      {!pronto && <p role="status">Preparando a redefinição…</p>}

      {pronto && !concluido && (!redefinir || linkValido) && (
        <form
          onSubmit={enviar}
          className={styles.formulario}
          aria-busy={enviando}
        >
          {redefinir ? (
            <>
              <label htmlFor="novaSenha">Nova senha</label>
              <input
                id="novaSenha"
                name="novaSenha"
                type="password"
                required
                maxLength={256}
                autoComplete="new-password"
                aria-describedby="orientacao-senha"
                disabled={enviando}
              />

              <label htmlFor="confirmacaoSenha">Confirme a nova senha</label>
              <input
                id="confirmacaoSenha"
                name="confirmacaoSenha"
                type="password"
                required
                maxLength={256}
                autoComplete="new-password"
                disabled={enviando}
              />

              <p id="orientacao-senha" className={styles.descricao}>
                Use de 15 a 128 caracteres. Você pode usar uma frase.
                A alteração encerrará suas sessões atuais em todas as empresas.
              </p>
            </>
          ) : (
            <>
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

              <label htmlFor="email">E-mail cadastrado</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                disabled={enviando}
              />
            </>
          )}

          <button type="submit" disabled={enviando}>
            {enviando
              ? "Processando…"
              : redefinir ? "Salvar nova senha" : "Enviar instruções"}
          </button>
        </form>
      )}

      <p className={styles.mensagem} role="status" aria-live="polite">
        {mensagem}
      </p>

      <p>
        <a href="/login">Voltar para entrar</a>
      </p>

      {redefinir && !concluido && (
        <p>
          <a href="/recuperar-senha">Solicitar um novo link</a>
        </p>
      )}
    </>
  );
}
