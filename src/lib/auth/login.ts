import { scrypt } from "node:crypto";
import { executarNoBanco } from "../db/prisma";
import {
  logAviso,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";
import { verificarSenha } from "./senha";
import { DURACAO_SESSAO_MS, gerarCredencialSessao } from "./sessao";

export type EntradaLogin = {
  email: string;
  senha: string;
  empresaSlug: string;
};

export type ResultadoLogin = {
  token: string;
  expiraEm: Date;
  sessaoId: string;
  empresaId: string;
  vinculoId: string;
  usuarioId: string;
};

/**
 * Executa o mesmo custo criptográfico quando o usuário não existe.
 * Reduz a diferença de tempo entre usuário ausente e senha incorreta.
 * Não cria usuário, hash armazenado ou registro de teste.
 */
async function consumirCustoSemUsuario(senha: string): Promise<void> {
  const chave = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      senha,
      Buffer.alloc(16),
      64,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (erro, resultado) => {
        if (erro) {
          reject(erro);
          return;
        }
        resolve(resultado);
      },
    );
  });

  chave.fill(0);
}

/**
 * Serviço interno do servidor.
 * A rota deverá validar origem e limite de tentativas antes de chamar.
 * null significa credenciais/acesso recusados.
 * Falhas técnicas são registradas e propagadas.
 * O token retornado deve ir somente para o cookie, nunca para logs ou JSON.
 */
export async function autenticarUsuario(
  entrada: EntradaLogin,
  contexto: ContextoLog,
): Promise<ResultadoLogin | null> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "AUTENTICAR_USUARIO",
    modulo: "autenticacao",
    dependencia: "BANCO",
  };

  return executarNoBanco(ctx, async (prisma) => {
    if (
      typeof entrada?.email !== "string" ||
      typeof entrada?.senha !== "string" ||
      typeof entrada?.empresaSlug !== "string" ||
      entrada.email.length > 254 ||
      entrada.empresaSlug.length > 100 ||
      entrada.senha.length > 256
    ) {
      logAviso(ctx, "LOGIN_ENTRADA_INVALIDA", "AUTH_ENTRADA_INVALIDA");
      return null;
    }

    const email = entrada.email.trim().toLowerCase();
    const slug = entrada.empresaSlug.trim().toLowerCase();
    const tamanhoSenha = Array.from(entrada.senha).length;

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(slug) ||
      tamanhoSenha < 1 ||
      tamanhoSenha > 128
    ) {
      logAviso(ctx, "LOGIN_ENTRADA_INVALIDA", "AUTH_ENTRADA_INVALIDA");
      return null;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { emailNormalizado: email },
      select: {
        id: true,
        senhaHash: true,
      },
    });

    if (!usuario) {
      await consumirCustoSemUsuario(entrada.senha);
      logAviso(ctx, "LOGIN_RECUSADO", "AUTH_CREDENCIAL_INVALIDA");
      return null;
    }

    const confere = await verificarSenha(
      entrada.senha,
      usuario.senhaHash,
      { ...ctx, usuarioId: usuario.id },
    );

    if (!confere) {
      logAviso(ctx, "LOGIN_RECUSADO", "AUTH_CREDENCIAL_INVALIDA");
      return null;
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // Impede alterações concorrentes do usuário, vínculo e empresa
      // enquanto a sessão é emitida. Os parâmetros são enviados pelo Prisma.
      const vinculos = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT v."id"
          FROM "VinculoEmpresa" v
          JOIN "Empresa" e ON e."id" = v."empresaId"
          JOIN "Usuario" u ON u."id" = v."usuarioId"
         WHERE v."usuarioId" = ${usuario.id}::uuid
           AND e."slug" = ${slug}
         FOR SHARE OF u, e, v
      `;

      if (vinculos.length === 0) return null;

      if (vinculos.length !== 1) {
        logAviso(
          ctx,
          "LOGIN_VINCULOS_INCONSISTENTES",
          "AUTH_INTEGRIDADE_VINCULO",
        );
        throw new Error("VinculosLoginInconsistentes");
      }

      const vinculo = await tx.vinculoEmpresa.findUnique({
        where: { id: vinculos[0].id },
        select: {
          id: true,
          empresaId: true,
          status: true,
          encerradoEm: true,
          empresa: {
            select: {
              status: true,
              arquivadoEm: true,
            },
          },
          usuario: {
            select: {
              id: true,
              emailNormalizado: true,
              senhaHash: true,
              status: true,
              versaoSessao: true,
            },
          },
        },
      });

      if (
        !vinculo ||
        vinculo.status !== "ATIVO" ||
        vinculo.encerradoEm !== null ||
        vinculo.empresa.status !== "ATIVA" ||
        vinculo.empresa.arquivadoEm !== null ||
        vinculo.usuario.status !== "ATIVO" ||
        vinculo.usuario.emailNormalizado !== email ||
        vinculo.usuario.senhaHash !== usuario.senhaHash
      ) {
        return null;
      }

      const credencial = gerarCredencialSessao();
      const expiraEm = new Date(Date.now() + DURACAO_SESSAO_MS);

      const sessao = await tx.sessao.create({
        data: {
          empresaId: vinculo.empresaId,
          vinculoId: vinculo.id,
          tokenHash: credencial.tokenHash,
          versaoSessaoNaEmissao: vinculo.usuario.versaoSessao,
          expiraEm,
        },
        select: { id: true },
      });

      await tx.eventoAuditoria.create({
        data: {
          empresaId: vinculo.empresaId,
          autorVinculoId: vinculo.id,
          tipoAutor: "USUARIO",
          autorIdentificacao: vinculo.usuario.id,
          moduloChave: "autenticacao",
          acao: "sessao.criar",
          entidadeTipo: "Sessao",
          entidadeId: sessao.id,
          resultado: "SUCESSO",
          requisicaoId: ctx.requisicaoId,
        },
      });

      return {
        token: credencial.token,
        expiraEm,
        sessaoId: sessao.id,
        empresaId: vinculo.empresaId,
        vinculoId: vinculo.id,
        usuarioId: vinculo.usuario.id,
      };
    });

    if (!resultado) {
      logAviso(ctx, "LOGIN_RECUSADO", "AUTH_CREDENCIAL_INVALIDA");
      return null;
    }

    logInfo(
      {
        ...ctx,
        empresaId: resultado.empresaId,
        usuarioId: resultado.usuarioId,
        entidadeId: resultado.sessaoId,
      },
      "LOGIN_AUTENTICADO_SESSAO_CRIADA",
    );

    return resultado;
  });
}
