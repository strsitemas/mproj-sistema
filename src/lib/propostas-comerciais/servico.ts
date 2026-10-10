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
  validarCadastroProposta,
} from "./validacao";

export async function cadastrarPropostaComercial(
  sessao: SessaoAutenticada,
  contexto: ContextoLog,
  entrada: unknown,
): Promise<{ id: string; codigo: string }> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "CADASTRAR_PROPOSTA_COMERCIAL",
    modulo: "propostas-comerciais",
    empresaId: sessao.empresaId,
    usuarioId: sessao.usuarioId,
    dependencia: "BANCO",
  };

  logInfo(ctx, "CADASTRO_PROPOSTA_INICIADO");

  try {
    const dados = validarCadastroProposta(entrada);

    const permissoes = await consultarPermissoesEfetivas(sessao, ctx);

    if (!possuiPermissao(permissoes, "propostas.criar", "EMPRESA")) {
      logAviso(ctx, "CADASTRO_PROPOSTA_NEGADO", "PERMISSAO_AUSENTE");
      throw new Error("AcessoNegado");
    }

    const proposta = await executarNoBanco(ctx, async (prisma) =>
      prisma.$transaction(async (tx) => {
        const cliente = await tx.cliente.findFirst({
          where: {
            id: dados.clienteId,
            empresaId: sessao.empresaId,
            arquivadoEm: null,
          },
          select: { id: true },
        });

        if (!cliente) {
          throw new Error("ClientePropostaNaoEncontrado");
        }

        const contador = await tx.contadorCodigoProposta.upsert({
          where: { empresaId: sessao.empresaId },
          create: {
            empresaId: sessao.empresaId,
            ultimoNumero: 1,
          },
          update: {
            ultimoNumero: { increment: 1 },
          },
          select: { ultimoNumero: true },
        });

        const codigo =
          `PROP-${String(contador.ultimoNumero).padStart(6, "0")}`;

        const criada = await tx.propostaComercial.create({
          data: {
            empresaId: sessao.empresaId,
            clienteId: cliente.id,
            codigo,
            titulo: dados.titulo,
            descricao: dados.descricao,
            valorTotalCentavos: dados.valorTotalCentavos,
            itens: {
              create: dados.itens.map((item) => ({
                empresaId: sessao.empresaId,
                descricao: item.descricao,
                tipoProfissional: item.tipoProfissional,
                horasPrevistas: item.horasPrevistas,
                valorHoraCentavos: item.valorHoraCentavos,
                valorTotalCentavos: item.valorTotalCentavos,
                ordem: item.ordem,
              })),
            },
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
            moduloChave: "propostas-comerciais",
            acao: "propostas.criar",
            entidadeTipo: "PropostaComercial",
            entidadeId: criada.id,
            resultado: "SUCESSO",
            requisicaoId: ctx.requisicaoId,
          },
        });

        return criada;
      }),
    );

    logInfo(
      { ...ctx, entidadeId: proposta.id },
      "CADASTRO_PROPOSTA_CONCLUIDO",
    );

    return proposta;
  } catch (erro) {
    if (erro instanceof Error && erro.message === "AcessoNegado") {
      throw erro;
    }

    logErro(ctx, "CADASTRO_PROPOSTA_FALHOU", erro);
    throw erro;
  }
}