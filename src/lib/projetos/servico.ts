import { executarNoBanco } from "../db/prisma";
import {
  consultarPermissoesEfetivas,
  possuiPermissao,
} from "../auth/autorizacao";
import type { SessaoAutenticada } from "../auth/sessao";
import {
  logAviso,
  logErro,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";
import {
  validarCadastroProjeto,
  type CadastroProjeto,
} from "./validacao";

export async function cadastrarProjeto(
  sessao: SessaoAutenticada,
  contexto: ContextoLog,
  entrada: unknown,
): Promise<{ id: string; codigo: string }> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "CADASTRAR_PROJETO",
    modulo: "projetos",
    empresaId: sessao.empresaId,
    usuarioId: sessao.usuarioId,
    dependencia: "BANCO",
  };

  logInfo(ctx, "CADASTRO_PROJETO_INICIADO");

  try {
    const dados: CadastroProjeto = validarCadastroProjeto(entrada);

    const permissoes = await consultarPermissoesEfetivas(sessao, ctx);

    if (!possuiPermissao(permissoes, "projetos.criar", "EMPRESA")) {
      logAviso(ctx, "CADASTRO_PROJETO_NEGADO", "PERMISSAO_AUSENTE");
      throw new Error("AcessoNegado");
    }

    const projeto = await executarNoBanco(ctx, async (prisma) =>
      prisma.$transaction(async (tx) => {
        const cliente = await tx.cliente.findFirst({
          where: {
            id: dados.clienteId,
            empresaId: sessao.empresaId,
            arquivadoEm: null,
          },
          select: {
            id: true,
            codigo: true,
          },
        });

        if (!cliente) {
          throw new Error("ClienteProjetoNaoEncontrado");
        }

        const contador = await tx.contadorCodigoProjeto.upsert({
          where: {
            clienteId: cliente.id,
          },
          create: {
            clienteId: cliente.id,
            ultimoNumero: 1,
          },
          update: {
            ultimoNumero: {
              increment: 1,
            },
          },
          select: {
            ultimoNumero: true,
          },
        });

        const codigo =
          `${cliente.codigo}-P${String(contador.ultimoNumero).padStart(3, "0")}`;

        const criado = await tx.projeto.create({
          data: {
            empresaId: sessao.empresaId,
            clienteId: cliente.id,
            codigo,
            nome: dados.nome,
            descricao: dados.descricao ?? null,
          },
          select: {
            id: true,
            codigo: true,
          },
        });

        await tx.eventoAuditoria.create({
          data: {
            empresaId: sessao.empresaId,
            autorVinculoId: sessao.vinculoId,
            tipoAutor: "USUARIO",
            autorIdentificacao: sessao.usuarioId,
            moduloChave: "projetos",
            acao: "projetos.criar",
            entidadeTipo: "Projeto",
            entidadeId: criado.id,
            resultado: "SUCESSO",
            requisicaoId: ctx.requisicaoId,
          },
        });

        return criado;
      }),
    );

    logInfo(
      { ...ctx, entidadeId: projeto.id },
      "CADASTRO_PROJETO_CONCLUIDO",
    );

    return projeto;
  } catch (erro) {
    if (erro instanceof Error && erro.message === "AcessoNegado") {
      throw erro;
    }

    logErro(ctx, "CADASTRO_PROJETO_FALHOU", erro);
    throw erro;
  }
}