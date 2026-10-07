import type { Metadata } from "next";
import FormularioLogin from "./formulario-login";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function PaginaLogin() {
  return (
    <main className={styles.pagina}>
      <section className={styles.cartao} aria-labelledby="titulo-login">
        <a href="/" className={styles.marca} aria-label="MProj - início">
          <span aria-hidden="true">M</span>
          MProj
        </a>

        <p className={styles.identificacao}>STR Software</p>
        <h1 id="titulo-login">Entre no seu ambiente</h1>
        <p className={styles.descricao}>
          Informe sua empresa e suas credenciais de acesso.
        </p>

        <FormularioLogin />
        <p><a href="/recuperar-senha">Esqueci minha senha</a></p>
      </section>
    </main>
  );
}
