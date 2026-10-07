import type { Metadata } from "next";
import { exigirSessaoPagina } from "@/lib/auth/acesso-pagina";
import Painel from "./painel";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const runtime = "nodejs";

export default async function PaginaDashboard() {
  const { sessao } = await exigirSessaoPagina();

  return (
    <Painel
      usuarioNome={sessao.usuarioNome}
      empresaNome={sessao.empresaNome}
    />
  );
}
