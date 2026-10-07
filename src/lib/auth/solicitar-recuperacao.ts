import { createHash, randomBytes } from "node:crypto";
import { executarNoBanco } from "../db/prisma";
import {
  logErro,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";
import { enviarEmailRecuperacao } from "./email-recuperacao";

export type EntradaRecuperacao = Readonly<{
  email: string;
  empresaSlug: string;
}>;

const VALIDADE_MS = 30 * 60 * 1000;

/**
 * Uso interno no servidor.
 * A futura rota deverá validar origem, corpo e limite de tentativas.
 * Não retorna existência de usuário, token ou resultado do envio.
 * A resposta pública deverá ser igual para cadastros existentes e ausentes.
 * Falhas do envio são registradas sem expor dados do destinatário.
 */
export async function solicitarRecuperacao(
  entrada: EntradaRecuperacao,
  contexto: ContextoLog,
): Promise<void> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "SOLICITAR_RECUPERACAO_ACESSO",
    modulo: "autenticacao",
    dependencia: "BANCO",
  };

  if (
    typeof entrada?.email !== "string" ||
    typeof entrada?.empresaSlug !== "string" ||
    entrada.email.length > 254 ||
    entrada.empresaSlug.length > 100
  ) {
    throw new Error("EntradaRecuperacaoInvalida");
  }

  const email = entrada.email.trim().toLowerCase();
  const slug = entrada.empresaSlug.trim().toLowerCase();

  if (
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/
      .test(email) ||
    !/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(slug)
  ) {
    throw new Error("EntradaRecuperacaoInvalida");
  }

  const registro = await executarNoBanco(ctx, async (prisma) => {
    return prisma.$transaction(async (tx) => {
      // Coordena a emissão com alterações do usuário, empresa e vínculo.
      const linhas = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT v."id"
          FROM public."VinculoEmpresa" v
          JOIN public."Usuario" u ON u."id" = v."usuarioId"
          JOIN public."Empresa" e ON e."id" = v."empresaId"
         WHERE u."emailNormalizado" = ${email}
           AND e."slug" = ${slug}
           AND u."status" = 'ATIVO'
           AND v."status" = 'ATIVO'
           AND v."encerradoEm" IS NULL
           AND e."status" = 'ATIVA'
           AND e."arquivadoEm" IS NULL
         FOR SHARE OF u, e, v
      `;

      if (linhas.length === 0) return null;

      if (linhas.length !== 1) {
        throw new Error("VinculosRecuperacaoInconsistentes");
      }

      const vinculo = await tx.vinculoEmpresa.findUnique({
        where: { id: linhas[0].id },
        select: {
          id: true,
          empresaId: true,
          usuario: {
            select: {
              id: true,
              emailNormalizado: true,
              versaoSessao: true,
            },
          },
        },
      });

      if (!vinculo) {
        throw new Error("VinculoRecuperacaoAusente");
      }

      const relogio = await tx.$queryRaw<Array<{ agora: Date }>>`
        SELECT clock_timestamp() AS "agora"
      `;

      const agora = relogio[0]?.agora;

      if (!(agora instanceof Date) || !Number.isFinite(agora.getTime())) {
        throw new Error("RelogioBancoInvalido");
      }

      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256")
        .update(token, "utf8")
        .digest("hex");

      const recuperacao = await tx.recuperacaoAcesso.create({
        data: {
          empresaId: vinculo.empresaId,
          vinculoId: vinculo.id,
          tokenHash,
          versaoSessaoNaEmissao: vinculo.usuario.versaoSessao,
          criadoEm: agora,
          expiraEm: new Date(agora.getTime() + VALIDADE_MS),
        },
        select: { id: true },
      });

      // Solicitação não autenticada: não atribuir a ação ao usuário.
      await tx.eventoAuditoria.create({
        data: {
          empresaId: vinculo.empresaId,
          tipoAutor: "SISTEMA",
          autorIdentificacao: "RECUPERACAO_ACESSO",
          moduloChave: "autenticacao",
          acao: "recuperacao.solicitar",
          entidadeTipo: "RecuperacaoAcesso",
          entidadeId: recuperacao.id,
          resultado: "SUCESSO",
          requisicaoId: ctx.requisicaoId,
        },
      });

      return {
        id: recuperacao.id,
        empresaId: vinculo.empresaId,
        destinatario: vinculo.usuario.emailNormalizado,
        token,
      };
    });
  });

  if (!registro) {
    logInfo(ctx, "SOLICITACAO_RECUPERACAO_PROCESSADA");
    return;
  }

  const ctxRegistro: ContextoLog = {
    ...ctx,
    empresaId: registro.empresaId,
    entidadeId: registro.id,
  };

  try {
    await enviarEmailRecuperacao(
      {
        destinatario: registro.destinatario,
        token: registro.token,
        recuperacaoId: registro.id,
      },
      ctxRegistro,
    );

    await executarNoBanco(
      { ...ctxRegistro, operacao: "CONFIRMAR_ENVIO_RECUPERACAO" },
      async (prisma) => {
        await prisma.$transaction(async (tx) => {
          // Usa o relógio do banco e recusa confirmações após expiração.
          const quantidade = await tx.$executeRaw`
            UPDATE public."RecuperacaoAcesso"
               SET "enviadoEm" = GREATEST(
                 clock_timestamp(),
                 "criadoEm"
               )
             WHERE "id" = ${registro.id}::uuid
               AND "empresaId" = ${registro.empresaId}::uuid
               AND "enviadoEm" IS NULL
               AND "utilizadoEm" IS NULL
               AND "revogadoEm" IS NULL
               AND "expiraEm" >
                 GREATEST(clock_timestamp(), "criadoEm")
          `;

          if (quantidade !== 1) {
            throw new Error("ConfirmacaoEnvioRecuperacaoRecusada");
          }

          await tx.eventoAuditoria.create({
            data: {
              empresaId: registro.empresaId,
              tipoAutor: "SISTEMA",
              autorIdentificacao: "RECUPERACAO_ACESSO",
              moduloChave: "autenticacao",
              acao: "recuperacao.confirmar_envio",
              entidadeTipo: "RecuperacaoAcesso",
              entidadeId: registro.id,
              resultado: "SUCESSO",
              requisicaoId: ctx.requisicaoId,
              camposAlterados: ["enviadoEm"],
            },
          });
        });
      },
    );
  } catch (erro) {
    logErro(ctxRegistro, "RECUPERACAO_ENVIO_NAO_CONFIRMADO", erro);

    try {
      await executarNoBanco(
        { ...ctxRegistro, operacao: "REVOGAR_RECUPERACAO_SEM_ENVIO" },
        async (prisma) => {
          await prisma.$transaction(async (tx) => {
            const quantidade = await tx.$executeRaw`
              UPDATE public."RecuperacaoAcesso"
                 SET "revogadoEm" = GREATEST(
                   clock_timestamp(),
                   "criadoEm"
                 )
               WHERE "id" = ${registro.id}::uuid
                 AND "empresaId" = ${registro.empresaId}::uuid
                 AND "utilizadoEm" IS NULL
                 AND "revogadoEm" IS NULL
            `;

            if (quantidade === 0) return;

            if (quantidade !== 1) {
              throw new Error("RevogacaoRecuperacaoInconsistente");
            }

            await tx.eventoAuditoria.create({
              data: {
                empresaId: registro.empresaId,
                tipoAutor: "SISTEMA",
                autorIdentificacao: "RECUPERACAO_ACESSO",
                moduloChave: "autenticacao",
                acao: "recuperacao.revogar_apos_falha",
                entidadeTipo: "RecuperacaoAcesso",
                entidadeId: registro.id,
                resultado: "SUCESSO",
                requisicaoId: ctx.requisicaoId,
                camposAlterados: ["revogadoEm"],
              },
            });
          });
        },
      );
    } catch (erroRevogacao) {
      logErro(
        ctxRegistro,
        "RECUPERACAO_REVOGACAO_APOS_FALHA_FALHOU",
        erroRevogacao,
      );
    }

    // A resposta pública não revela se o cadastro existe.
    // Sem enviadoEm confirmado, o token deverá ser recusado na redefinição.
  } finally {
    registro.token = "";
  }

  logInfo(ctx, "SOLICITACAO_RECUPERACAO_PROCESSADA");
}
