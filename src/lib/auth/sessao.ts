import { createHash, randomBytes } from "node:crypto";
import { executarNoBanco } from "../db/prisma";
import {
  logAviso,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";

export const DURACAO_SESSAO_MS = 24 * 60 * 60 * 1000;

export type SessaoAutenticada = Readonly<{
  sessaoId: string;
  empresaId: string;
  empresaNome: string;
  vinculoId: string;
  usuarioId: string;
  usuarioNome: string;
  versaoSessao: number;
  expiraEm: Date;
}>;

function contextoSessao(
  contexto: ContextoLog,
  operacao: string,
): ContextoLog {
  // Identidade será obtida do banco, não do contexto recebido.
  return {
    requisicaoId: contexto.requisicaoId,
    operacao,
    modulo: "autenticacao",
    dependencia: "BANCO",
  };
}

function calcularTokenHash(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function tokenValido(token: unknown): token is string {
  return typeof token === "string" && /^[0-9a-f]{64}$/.test(token);
}

/**
 * Uso interno pelo futuro serviço de login após verificar credenciais.
 * Apenas gera a credencial: não cria uma sessão no banco.
 * O token completo deve ser enviado exclusivamente ao cookie.
 */
export function gerarCredencialSessao(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: calcularTokenHash(token) };
}

/**
 * Não usa cache compartilhado: cada chamada consulta o estado atual.
 * Ausência de sessão retorna null.
 * Falhas de banco são registradas e propagadas, nunca viram "sem sessão".
 */
export async function validarSessao(
  token: string | undefined,
  contexto: ContextoLog,
): Promise<SessaoAutenticada | null> {
  const ctx = contextoSessao(contexto, "VALIDAR_SESSAO");

  if (token === undefined) return null;

  if (!tokenValido(token)) {
    logAviso(ctx, "TOKEN_SESSAO_INVALIDO", "AUTH_TOKEN_INVALIDO");
    return null;
  }

  return executarNoBanco(ctx, async (prisma) => {
    const sessao = await prisma.sessao.findUnique({
      where: { tokenHash: calcularTokenHash(token) },
      select: {
        id: true,
        empresaId: true,
        vinculoId: true,
        versaoSessaoNaEmissao: true,
        expiraEm: true,
        revogadaEm: true,
        vinculo: {
          select: {
            status: true,
            encerradoEm: true,
            empresa: {
              select: {
                nome: true,
                status: true,
                arquivadoEm: true,
              },
            },
            usuario: {
              select: {
                id: true,
                nome: true,
                status: true,
                versaoSessao: true,
              },
            },
          },
        },
      },
    });

    if (!sessao) {
      logAviso(ctx, "SESSAO_NAO_ENCONTRADA", "AUTH_SESSAO_INVALIDA");
      return null;
    }

    const identidade = {
      ...ctx,
      empresaId: sessao.empresaId,
      usuarioId: sessao.vinculo.usuario.id,
      entidadeId: sessao.id,
    };

    if (
      sessao.revogadaEm !== null ||
      sessao.expiraEm.getTime() <= Date.now() ||
      sessao.versaoSessaoNaEmissao !==
        sessao.vinculo.usuario.versaoSessao ||
      sessao.vinculo.usuario.status !== "ATIVO" ||
      sessao.vinculo.status !== "ATIVO" ||
      sessao.vinculo.encerradoEm !== null ||
      sessao.vinculo.empresa.status !== "ATIVA" ||
      sessao.vinculo.empresa.arquivadoEm !== null
    ) {
      logAviso(
        identidade,
        "SESSAO_RECUSADA",
        "AUTH_SESSAO_SEM_VALIDADE",
      );
      return null;
    }

    return {
      sessaoId: sessao.id,
      empresaId: sessao.empresaId,
      empresaNome: sessao.vinculo.empresa.nome,
      vinculoId: sessao.vinculoId,
      usuarioId: sessao.vinculo.usuario.id,
      usuarioNome: sessao.vinculo.usuario.nome,
      versaoSessao: sessao.versaoSessaoNaEmissao,
      expiraEm: sessao.expiraEm,
    };
  });
}

/**
 * Revoga exclusivamente a sessão identificada pelo token.
 * Também permite encerrar uma sessão expirada ou de vínculo suspenso.
 * Repetir a revogação retorna false sem duplicar a auditoria.
 * A futura rota de logout deverá validar a origem da requisição.
 */
export async function revogarSessao(
  token: string | undefined,
  contexto: ContextoLog,
): Promise<boolean> {
  const ctx = contextoSessao(contexto, "REVOGAR_SESSAO");

  if (token === undefined) return false;

  if (!tokenValido(token)) {
    logAviso(ctx, "TOKEN_SESSAO_INVALIDO", "AUTH_TOKEN_INVALIDO");
    return false;
  }

  return executarNoBanco(ctx, async (prisma) => {
    const resultado = await prisma.$transaction(async (tx) => {
      const sessao = await tx.sessao.findUnique({
        where: { tokenHash: calcularTokenHash(token) },
        select: {
          id: true,
          empresaId: true,
          vinculoId: true,
          revogadaEm: true,
          vinculo: {
            select: { usuarioId: true },
          },
        },
      });

      if (!sessao || sessao.revogadaEm !== null) return null;

      const alteracao = await tx.sessao.updateMany({
        where: {
          id: sessao.id,
          empresaId: sessao.empresaId,
          revogadaEm: null,
        },
        data: { revogadaEm: new Date() },
      });

      if (alteracao.count === 0) return null;

      if (alteracao.count !== 1) {
        logAviso(
          ctx,
          "REVOGACAO_QUANTIDADE_INESPERADA",
          "AUTH_INTEGRIDADE_SESSAO",
        );
        throw new Error("QuantidadeDeSessoesInesperada");
      }

      await tx.eventoAuditoria.create({
        data: {
          empresaId: sessao.empresaId,
          autorVinculoId: sessao.vinculoId,
          tipoAutor: "USUARIO",
          autorIdentificacao: sessao.vinculo.usuarioId,
          moduloChave: "autenticacao",
          acao: "sessao.revogar",
          entidadeTipo: "Sessao",
          entidadeId: sessao.id,
          resultado: "SUCESSO",
          requisicaoId: ctx.requisicaoId,
          camposAlterados: ["revogadaEm"],
        },
      });

      return sessao;
    });

    if (!resultado) {
      logInfo(ctx, "REVOGACAO_SEM_ALTERACAO");
      return false;
    }

    logInfo(
      {
        ...ctx,
        empresaId: resultado.empresaId,
        usuarioId: resultado.vinculo.usuarioId,
        entidadeId: resultado.id,
      },
      "SESSAO_REVOGADA",
    );

    return true;
  });
}
