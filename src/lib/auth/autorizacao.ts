import { executarNoBanco } from "../db/prisma";
import type { ContextoLog } from "../auditoria/logger";
import type { SessaoAutenticada } from "./sessao";

export type AlcanceAutorizado =
  | "EMPRESA"
  | "PROPRIOS"
  | "PROJETOS_DESIGNADOS";

export type PermissaoEfetiva = Readonly<{
  chave: string;
  moduloChave: string;
  alcances: readonly AlcanceAutorizado[];
}>;

export async function consultarPermissoesEfetivas(
  sessao: SessaoAutenticada,
  contexto: ContextoLog,
): Promise<readonly PermissaoEfetiva[]> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    operacao: "CONSULTAR_PERMISSOES",
    modulo: "autorizacao",
    dependencia: "BANCO",
  };

  return executarNoBanco(ctx, async (prisma) => {
    const atribuicoes = await prisma.atribuicaoPerfil.findMany({
      where: {
        empresaId: sessao.empresaId,
        vinculoId: sessao.vinculoId,
        revogadoEm: null,
        perfil: {
          ativo: true,
        },
      },
      select: {
        perfil: {
          select: {
            permissoes: {
              select: {
                alcance: true,
                permissao: {
                  select: {
                    chave: true,
                    modulo: {
                      select: {
                        chave: true,
                        disponivel: true,
                        dependencias: {
                          select: {
                            requerido: {
                              select: {
                                disponivel: true,
                                empresas: {
                                  where: {
                                    empresaId: sessao.empresaId,
                                    status: "ATIVO",
                                  },
                                  select: { moduloId: true },
                                },
                              },
                            },
                          },
                        },
                        empresas: {
                          where: {
                            empresaId: sessao.empresaId,
                            status: "ATIVO",
                          },
                          select: { moduloId: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const resultado = new Map<
      string,
      {
        moduloChave: string;
        alcances: Set<AlcanceAutorizado>;
      }
    >();

    for (const atribuicao of atribuicoes) {
      for (const item of atribuicao.perfil.permissoes) {
        const permissao = item.permissao;
        const modulo = permissao.modulo;

        if (!modulo.disponivel || modulo.empresas.length === 0) {
          continue;
        }

        const dependenciasAtivas = dependenciasDiretasAtivas(
          modulo.dependencias,
        );

        if (!dependenciasAtivas) {
          continue;
        }

        let registro = resultado.get(permissao.chave);

        if (!registro) {
          registro = {
            moduloChave: modulo.chave,
            alcances: new Set<AlcanceAutorizado>(),
          };
          resultado.set(permissao.chave, registro);
        }

        registro.alcances.add(item.alcance);
      }
    }

    return Array.from(resultado, ([chave, registro]) => ({
      chave,
      moduloChave: registro.moduloChave,
      alcances: Array.from(registro.alcances),
    }));
  });
}

/**
 * Verifica se uma permissao e seu alcance foram concedidos.
 * A autorizacao por recurso deve ser validada separadamente.
 * Nao interpreta PROPRIOS ou PROJETOS_DESIGNADOS como acesso geral.
 */
export function possuiPermissao(
  permissoes: readonly PermissaoEfetiva[],
  chave: string,
  alcance: AlcanceAutorizado,
): boolean {
  return permissoes.some(
    (permissao) =>
      permissao.chave === chave &&
      permissao.alcances.includes(alcance),
  );
}

/**
 * Verifica as dependencias diretas de um modulo.
 * Dependencias indisponiveis ou nao ativadas negam acesso.
 */
export function dependenciasDiretasAtivas(
  dependencias: readonly {
    requerido: {
      disponivel: boolean;
      empresas: readonly unknown[];
    };
  }[],
): boolean {
  return dependencias.every(
    ({ requerido }) =>
      requerido.disponivel && requerido.empresas.length > 0,
  );
}
