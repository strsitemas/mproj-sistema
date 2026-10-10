import { executarNoBanco } from "../db/prisma";
import {
  logErro,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";

export async function inicializarCatalogoProjetos(
  contexto: ContextoLog,
): Promise<void> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "INICIALIZAR_CATALOGO_PROJETOS",
    modulo: "projetos",
    dependencia: "BANCO",
  };

  logInfo(ctx, "CATALOGO_PROJETOS_INICIADO");

  try {
    await executarNoBanco(ctx, async (prisma) =>
      prisma.$transaction(async (tx) => {
        const modulo = await tx.modulo.upsert({
          where: { chave: "projetos" },
          create: {
            chave: "projetos",
            nome: "Projetos",
            descricao: "Cadastro e gerenciamento de projetos",
            obrigatorio: false,
            disponivel: true,
          },
          update: {},
          select: { id: true },
        });

        await tx.permissao.upsert({
          where: { chave: "projetos.criar" },
          create: {
            moduloId: modulo.id,
            chave: "projetos.criar",
            nome: "Cadastrar projetos",
          },
          update: {},
        });
      }),
    );

    logInfo(ctx, "CATALOGO_PROJETOS_CONCLUIDO");
  } catch (erro) {
    logErro(ctx, "CATALOGO_PROJETOS_FALHOU", erro);
    throw erro;
  }
}