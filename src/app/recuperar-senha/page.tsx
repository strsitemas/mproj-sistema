import type { Metadata } from "next";
import FormularioRecuperacao from "@/components/auth/formulario-recuperacao";
import styles from "@/app/login/login.module.css";

export const metadata: Metadata = {
  title: "Recuperar acesso",
  referrer: "no-referrer",
};

export default function PaginaRecuperarSenha() {
  return (
    <main className={styles.pagina}>
      <section className={styles.cartao} aria-labelledby="titulo-recuperacao">
        <a href="/" className={styles.marca} aria-label="MProj - início">
          <span aria-hidden="true">M</span>
          MProj
        </a>

        <p className={styles.identificacao}>STR Software</p>
        <h1 id="titulo-recuperacao">Recupere seu acesso</h1>
        <p className={styles.descricao}>
          Informe sua empresa e o e-mail cadastrado para receber
          as instruções de recuperação.
        </p>

        <FormularioRecuperacao modo="solicitar" />
      </section>
    </main>
  );
}
