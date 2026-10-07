import type { Metadata } from "next";
import FormularioRecuperacao from "@/components/auth/formulario-recuperacao";
import styles from "@/app/login/login.module.css";

export const metadata: Metadata = {
  title: "Definir nova senha",
  referrer: "no-referrer",
};

export default function PaginaRedefinirSenha() {
  return (
    <main className={styles.pagina}>
      <section className={styles.cartao} aria-labelledby="titulo-redefinicao">
        <a href="/" className={styles.marca} aria-label="MProj - início">
          <span aria-hidden="true">M</span>
          MProj
        </a>

        <p className={styles.identificacao}>STR Software</p>
        <h1 id="titulo-redefinicao">Defina sua nova senha</h1>
        <p className={styles.descricao}>
          Escolha uma nova senha para voltar ao seu ambiente.
        </p>

        <FormularioRecuperacao modo="redefinir" />
      </section>
    </main>
  );
}
