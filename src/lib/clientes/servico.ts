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
  validarCadastroCliente,
  type CadastroCliente,
} from "./validacao";

export async function cadastrarCliente(
  sessao: SessaoAutenticada,
  contexto: ContextoLog,
  entrada: unknown,
): Promise<{ id: string; codigo: string }> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "CADASTRAR_CLIENTE",
    modulo: "clientes",
    empresaId: sessao.empresaId,
    usuarioId: sessao.usuarioId,
    dependencia: "BANCO",
  };

  logInfo(ctx, "CADASTRO_CLIENTE_INICIADO");

  try {
    const dados: CadastroCliente = validarCadastroCliente(entrada);

    const permissoes = await consultarPermissoesEfetivas(sessao, ctx);

    if (!possuiPermissao(permissoes, "clientes.criar", "EMPRESA")) {
      logAviso(ctx, "CADASTRO_CLIENTE_NEGADO", "PERMISSAO_AUSENTE");
      throw new Error("AcessoNegado");
    }

    const cliente = await executarNoBanco(ctx, async (prisma) =>
      prisma.$transaction(async (tx) => {
        const contador = await tx.contadorCodigoCliente.upsert({
          where: {
            empresaId: sessao.empresaId,
          },
          create: {
            empresaId: sessao.empresaId,
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

        const codigo = `CLI-${String(contador.ultimoNumero).padStart(6, "0")}`;

        const criado = await tx.cliente.create({
          data: {
            empresaId: sessao.empresaId,
            codigo,
            nome: dados.nome,
            tipo: dados.tipo,
            documentoNormalizado: dados.documentoNormalizado ?? null,
            email: dados.email ?? null,
            telefone: dados.telefone ?? null,
          },
          select: { id: true, codigo: true },
        });

        await tx.eventoAuditoria.create({
          data: {
            empresaId: sessao.empresaId,
            autorVinculoId: sessao.vinculoId,
            tipoAutor: "USUARIO",
            autorIdentificacao: sessao.usuarioId,
            moduloChave: "clientes",
            acao: "clientes.criar",
            entidadeTipo: "Cliente",
            entidadeId: criado.id,
            resultado: "SUCESSO",
            requisicaoId: ctx.requisicaoId,
          },
        });

        return criado;
      }),
    );

    logInfo(
      { ...ctx, entidadeId: cliente.id },
      "CADASTRO_CLIENTE_CONCLUIDO",
    );

    return cliente;
  } catch (erro) {
    if (erro instanceof Error && erro.message === "AcessoNegado") {
      throw erro;
    }

    logErro(ctx, "CADASTRO_CLIENTE_FALHOU", erro);
    throw erro;
  }
}