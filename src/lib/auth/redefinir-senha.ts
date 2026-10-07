import { createHash } from "node:crypto";
import { executarNoBanco } from "../db/prisma";
import {
  logAviso,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";
import { criarSenhaHash } from "./senha";

export type EntradaRedefinicaoSenha = Readonly<{
  token: string;
  novaSenha: string;
}>;

type RecuperacaoElegivel = {
  id: string;
  empresaId: string;
  vinculoId: string;
  usuarioId: string;
  versaoSessao: number;
};

/**
 * Serviço interno do servidor.
 * A rota deverá validar origem, tamanho do corpo e limite de tentativas.
 * false significa que o link não pode mais ser utilizado.
 * Falhas técnicas são propagadas.
 * Nunca registra token, senha ou hash.
 */
export async function redefinirSenha(
  entrada: EntradaRedefinicaoSenha,
  contexto: ContextoLog,
): Promise<boolean> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "REDEFINIR_SENHA",
    modulo: "autenticacao",
    dependencia: "BANCO",
  };

  if (
    typeof entrada?.token !== "string" ||
    !/^[0-9a-f]{64}$/.test(entrada.token)
  ) {
    logAviso(ctx, "REDEFINICAO_LINK_RECUSADO", "AUTH_RECUPERACAO_INVALIDA");
    return false;
  }

  if (
    typeof entrada?.novaSenha !== "string" ||
    entrada.novaSenha.length > 256
  ) {
    throw new RangeError("SenhaForaDoTamanhoPermitido");
  }

  const tamanhoSenha = Array.from(entrada.novaSenha).length;

  if (tamanhoSenha < 15 || tamanhoSenha > 128) {
    throw new RangeError("SenhaForaDoTamanhoPermitido");
  }

  const tokenHash = createHash("sha256")
    .update(entrada.token, "utf8")
    .digest("hex");

  return executarNoBanco(ctx, async (prisma) => {
    // Consulta inicial evita derivar senha para links já inválidos.
    // Todas as condições serão verificadas novamente na transação.
    const candidatos = await prisma.$queryRaw<RecuperacaoElegivel[]>`
      SELECT
        r."id",
        r."empresaId",
        r."vinculoId",
        u."id" AS "usuarioId",
        u."versaoSessao"
      FROM public."RecuperacaoAcesso" r
      JOIN public."VinculoEmpresa" v
        ON v."empresaId" = r."empresaId"
       AND v."id" = r."vinculoId"
      JOIN public."Usuario" u ON u."id" = v."usuarioId"
      JOIN public."Empresa" e ON e."id" = v."empresaId"
      WHERE r."tokenHash" = ${tokenHash}
        AND r."enviadoEm" IS NOT NULL
        AND r."utilizadoEm" IS NULL
        AND r."revogadoEm" IS NULL
        AND r."criadoEm" <= clock_timestamp()
        AND r."enviadoEm" <= clock_timestamp()
        AND r."expiraEm" > clock_timestamp()
        AND r."versaoSessaoNaEmissao" = u."versaoSessao"
        AND u."status" = 'ATIVO'
        AND v."status" = 'ATIVO'
        AND v."encerradoEm" IS NULL
        AND e."status" = 'ATIVA'
        AND e."arquivadoEm" IS NULL
    `;

    if (candidatos.length === 0) {
      logAviso(ctx, "REDEFINICAO_LINK_RECUSADO", "AUTH_RECUPERACAO_INVALIDA");
      return false;
    }

    if (candidatos.length !== 1) {
      throw new Error("RecuperacaoSenhaInconsistente");
    }

    const candidato = candidatos[0];

    // A derivação criptográfica ocorre fora da transação.
    const senhaHash = await criarSenhaHash(entrada.novaSenha, ctx);

    const alterada = await prisma.$transaction(async (tx) => {
      // Serializa trocas de senha da mesma conta global,
      // mesmo quando solicitadas por empresas diferentes.
      const usuarios = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM public."Usuario"
        WHERE "id" = ${candidato.usuarioId}::uuid
        FOR UPDATE
      `;

      if (usuarios.length === 0) return false;

      if (usuarios.length !== 1) {
        throw new Error("UsuarioRecuperacaoInconsistente");
      }

      // Mantém empresa e vínculo estáveis até concluir a alteração.
      // A linha do usuário já está bloqueada acima.
      const elegiveis = await tx.$queryRaw<RecuperacaoElegivel[]>`
        SELECT
          r."id",
          r."empresaId",
          r."vinculoId",
          u."id" AS "usuarioId",
          u."versaoSessao"
        FROM public."RecuperacaoAcesso" r
        JOIN public."VinculoEmpresa" v
          ON v."empresaId" = r."empresaId"
         AND v."id" = r."vinculoId"
        JOIN public."Usuario" u ON u."id" = v."usuarioId"
        JOIN public."Empresa" e ON e."id" = v."empresaId"
        WHERE r."id" = ${candidato.id}::uuid
          AND r."tokenHash" = ${tokenHash}
          AND u."id" = ${candidato.usuarioId}::uuid
          AND u."versaoSessao" = ${candidato.versaoSessao}::integer
          AND r."versaoSessaoNaEmissao" = u."versaoSessao"
          AND r."enviadoEm" IS NOT NULL
          AND r."utilizadoEm" IS NULL
          AND r."revogadoEm" IS NULL
          AND r."criadoEm" <= clock_timestamp()
          AND r."enviadoEm" <= clock_timestamp()
          AND r."expiraEm" > clock_timestamp()
          AND u."status" = 'ATIVO'
          AND v."status" = 'ATIVO'
          AND v."encerradoEm" IS NULL
          AND e."status" = 'ATIVA'
          AND e."arquivadoEm" IS NULL
        FOR SHARE OF e, v
      `;

      if (elegiveis.length === 0) return false;

      if (elegiveis.length !== 1) {
        throw new Error("RecuperacaoSenhaInconsistente");
      }

      const recuperacao = elegiveis[0];

      // Consumo condicional: uma revogação concorrente também
      // impede o uso. O horário vem do PostgreSQL.
      const consumidas = await tx.$queryRaw<Array<{ id: string }>>`
        UPDATE public."RecuperacaoAcesso"
        SET "utilizadoEm" = clock_timestamp()
        WHERE "id" = ${recuperacao.id}::uuid
          AND "empresaId" = ${recuperacao.empresaId}::uuid
          AND "tokenHash" = ${tokenHash}
          AND "versaoSessaoNaEmissao" =
            ${recuperacao.versaoSessao}::integer
          AND "enviadoEm" IS NOT NULL
          AND "enviadoEm" <= clock_timestamp()
          AND "utilizadoEm" IS NULL
          AND "revogadoEm" IS NULL
          AND "expiraEm" > clock_timestamp()
        RETURNING "id"
      `;

      if (consumidas.length === 0) return false;

      if (consumidas.length !== 1) {
        throw new Error("ConsumoRecuperacaoInconsistente");
      }

      const atualizacao = await tx.usuario.updateMany({
        where: {
          id: recuperacao.usuarioId,
          versaoSessao: recuperacao.versaoSessao,
          status: "ATIVO",
        },
        data: {
          senhaHash,
          versaoSessao: { increment: 1 },
          versao: { increment: 1 },
        },
      });

      if (atualizacao.count !== 1) {
        // A exceção desfaz também o consumo do token.
        throw new Error("AlteracaoSenhaNaoConfirmada");
      }

      // O incremento da versão invalida sessões e outros tokens
      // emitidos anteriormente para a conta em qualquer empresa.
      // Os registros permanecem preservados no banco.
      await tx.eventoAuditoria.create({
        data: {
          empresaId: recuperacao.empresaId,
          tipoAutor: "SISTEMA",
          autorIdentificacao: "RECUPERACAO_ACESSO",
          moduloChave: "autenticacao",
          acao: "usuario.redefinir_senha",
          entidadeTipo: "Usuario",
          entidadeId: recuperacao.usuarioId,
          resultado: "SUCESSO",
          requisicaoId: ctx.requisicaoId,
          camposAlterados: ["senhaHash", "versaoSessao", "versao"],
        },
      });

      await tx.eventoAuditoria.create({
        data: {
          empresaId: recuperacao.empresaId,
          tipoAutor: "SISTEMA",
          autorIdentificacao: "RECUPERACAO_ACESSO",
          moduloChave: "autenticacao",
          acao: "recuperacao.utilizar",
          entidadeTipo: "RecuperacaoAcesso",
          entidadeId: recuperacao.id,
          resultado: "SUCESSO",
          requisicaoId: ctx.requisicaoId,
          camposAlterados: ["utilizadoEm"],
        },
      });

      return true;
    });

    if (!alterada) {
      logAviso(ctx, "REDEFINICAO_LINK_RECUSADO", "AUTH_RECUPERACAO_INVALIDA");
      return false;
    }

    logInfo(
      {
        ...ctx,
        empresaId: candidato.empresaId,
        usuarioId: candidato.usuarioId,
        entidadeId: candidato.id,
      },
      "SENHA_REDEFINIDA_SESSOES_ANTERIORES_INVALIDADAS",
    );

    return true;
  });
}
