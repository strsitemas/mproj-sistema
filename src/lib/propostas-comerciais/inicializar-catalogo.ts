import { executarNoBanco } from "../db/prisma";
import {
  logErro,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";

export async function inicializarCatalogoPropostasComerciais(
  contexto: ContextoLog,
): Promise<void> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "INICIALIZAR_CATALOGO_PROPOSTAS",
    modulo: "propostas-comerciais",
    dependencia: "BANCO",
  };

  logInfo(ctx, "CATALOGO_PROPOSTAS_INICIADO");

  try {
    await executarNoBanco(ctx, async (prisma) =>
      prisma.$transaction(async (tx) => {
        const modulo = await tx.modulo.upsert({
          where: { chave: "propostas-comerciais" },
          create: {
            chave: "propostas-comerciais",
            nome: "Propostas comerciais",
            descricao: "Cadastro de propostas comerciais por profissional e horas",
            obrigatorio: false,
            disponivel: true,
          },
          update: {},
          select: { id: true },
        });

        await tx.permissao.upsert({
          where: { chave: "propostas.criar" },
          create: {
            moduloId: modulo.id,
            chave: "propostas.criar",
            nome: "Cadastrar propostas comerciais",
          },
          update: {},
        });
      }),
    );

    logInfo(ctx, "CATALOGO_PROPOSTAS_CONCLUIDO");
  } catch (erro) {
    logErro(ctx, "CATALOGO_PROPOSTAS_FALHOU", erro);
    throw erro;
  }
}