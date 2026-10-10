import { executarNoBanco } from "../db/prisma";
import {
  logErro,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";

export async function inicializarCatalogoClientes(
  contexto: ContextoLog,
): Promise<void> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "INICIALIZAR_CATALOGO_CLIENTES",
    modulo: "clientes",
    dependencia: "BANCO",
  };

  logInfo(ctx, "CATALOGO_CLIENTES_INICIADO");

  try {
    await executarNoBanco(ctx, async (prisma) =>
      prisma.$transaction(async (tx) => {
        const modulo = await tx.modulo.upsert({
          where: { chave: "clientes" },
          create: {
            chave: "clientes",
            nome: "Clientes",
            descricao: "Cadastro e consulta de clientes",
            obrigatorio: false,
            disponivel: true,
          },
          update: {},
          select: { id: true },
        });

        for (const permissao of [
          { chave: "clientes.criar", nome: "Cadastrar clientes" },
          { chave: "clientes.listar", nome: "Consultar clientes" },
        ]) {
          await tx.permissao.upsert({
            where: { chave: permissao.chave },
            create: {
              moduloId: modulo.id,
              chave: permissao.chave,
              nome: permissao.nome,
            },
            update: {},
          });
        }
      }),
    );

    logInfo(ctx, "CATALOGO_CLIENTES_CONCLUIDO");
  } catch (erro) {
    logErro(ctx, "CATALOGO_CLIENTES_FALHOU", erro);
    throw erro;
  }
}