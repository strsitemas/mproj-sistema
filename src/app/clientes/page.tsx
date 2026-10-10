"use client";

import { useState, type FormEvent } from "react";
import styles from "./clientes.module.css";

type TipoCliente = "PESSOA_FISICA" | "PESSOA_JURIDICA";

export default function PaginaClientes() {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoCliente>("PESSOA_JURIDICA");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setMensagem("");
    setSucesso(false);

    try {
      const resposta = await fetch("/api/clientes", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          tipo,
          documentoNormalizado: documento || null,
          email: email || null,
          telefone: telefone || null,
        }),
      });

      const dados: { ok?: boolean; mensagem?: string; cliente?: { id: string; codigo: string } } =
        await resposta.json();

      if (!resposta.ok || !dados.ok) {
        setMensagem(dados.mensagem || "Não foi possível cadastrar.");
        return;
      }

      setSucesso(true);
      setMensagem(`Cliente cadastrado com sucesso. Código: ${dados.cliente?.codigo ?? "não informado"}`);
      setNome("");
      setDocumento("");
      setEmail("");
      setTelefone("");
    } catch {
      setMensagem("Falha de comunicação com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className={styles.pagina}><div className={styles.conteudo}><section className={styles.cartao}>
      <h1 className={styles.titulo}>Cadastro de clientes</h1>
      <p className={styles.descricao}>
        MProj — Gestão de projetos
      </p>

      <form onSubmit={cadastrar} className={styles.formulario}>
        <label className={styles.campo}>
          <span className={styles.rotulo}>Nome ou razão social</span>
          <input
            required
            minLength={2}
            maxLength={200}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={styles.entrada}
          />
        </label>

        <label className={styles.campo}>
          <span className={styles.rotulo}>Tipo de cliente</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCliente)}
            className={styles.entrada}
          >
            <option value="PESSOA_JURIDICA">Pessoa jurídica</option>
            <option value="PESSOA_FISICA">Pessoa física</option>
          </select>
        </label>

        <label className={styles.campo}>
          <span className={styles.rotulo}>CPF ou CNPJ</span>
          <input
            maxLength={20}
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            className={styles.entrada}
          />
        </label>

        <label className={styles.campo}>
          <span className={styles.rotulo}>E-mail</span>
          <input
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.entrada}
          />
        </label>

        <label className={styles.campo}>
          <span className={styles.rotulo}>Telefone</span>
          <input
            maxLength={30}
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className={styles.entrada}
          />
        </label>

        <button
          type="submit"
          disabled={enviando}
          className={styles.botao}
        >
          {enviando ? "Salvando..." : "Cadastrar cliente"}
        </button>

        {mensagem && (
          <p
            role="status"
            className={sucesso ? styles.sucesso : styles.erro}
          >
            {mensagem}
          </p>
        )}
      </form>
    </section></div></main>
  );
}