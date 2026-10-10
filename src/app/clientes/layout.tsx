import type { ReactNode } from "react";
import { exigirSessaoPagina } from "@/lib/auth/acesso-pagina";
import EstruturaAplicacao from "@/components/layout/estrutura-aplicacao";

export const runtime = "nodejs";

export default async function LayoutClientes({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { sessao } = await exigirSessaoPagina();

  return (
    <EstruturaAplicacao
      usuarioNome={sessao.usuarioNome}
      empresaNome={sessao.empresaNome}
    >
      {children}
    </EstruturaAplicacao>
  );
}