-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "StatusEmpresa" AS ENUM ('ATIVA', 'SUSPENSA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'BLOQUEADO', 'DESATIVADO');

-- CreateEnum
CREATE TYPE "StatusVinculo" AS ENUM ('ATIVO', 'SUSPENSO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "StatusModuloEmpresa" AS ENUM ('ATIVO', 'SUSPENSO', 'DESATIVADO');

-- CreateEnum
CREATE TYPE "AlcancePermissao" AS ENUM ('EMPRESA', 'PROPRIOS', 'PROJETOS_DESIGNADOS');

-- CreateEnum
CREATE TYPE "TipoAutorAuditoria" AS ENUM ('USUARIO', 'SISTEMA', 'INTEGRACAO', 'ANONIMO');

-- CreateEnum
CREATE TYPE "ResultadoAuditoria" AS ENUM ('SUCESSO', 'NEGADO', 'FALHA');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('PESSOA_FISICA', 'PESSOA_JURIDICA');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('RASCUNHO', 'VIGENTE', 'SUSPENSO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ModalidadeCobranca" AS ENUM ('PRECO_GLOBAL', 'POR_HORA', 'POR_ENTREGAVEL', 'MENSALIDADE', 'ALOCACAO', 'MISTA');

-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('PLANEJADO', 'EM_ANDAMENTO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PapelParticipacaoProjeto" AS ENUM ('GESTOR', 'COLABORADOR', 'OBSERVADOR');

-- CreateEnum
CREATE TYPE "StatusFase" AS ENUM ('PLANEJADA', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusEntregavel" AS ENUM ('PLANEJADO', 'EM_EXECUCAO', 'EM_REVISAO', 'AJUSTES_SOLICITADOS', 'APROVADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "DecisaoAvaliacaoEntregavel" AS ENUM ('APROVADO', 'AJUSTES_SOLICITADOS', 'REPROVADO');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('PLANEJADA', 'EM_ANDAMENTO', 'BLOQUEADA', 'EM_REVISAO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadeTarefa" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TipoDependenciaTarefa" AS ENUM ('TERMINO_INICIO', 'INICIO_INICIO', 'TERMINO_TERMINO', 'INICIO_TERMINO');

-- CreateEnum
CREATE TYPE "VisibilidadeDocumento" AS ENUM ('INTERNO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "StatusArquivoDocumento" AS ENUM ('PENDENTE', 'DISPONIVEL', 'REJEITADO', 'FALHA');

-- CreateEnum
CREATE TYPE "StatusReuniao" AS ENUM ('PLANEJADA', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusVersaoAta" AS ENUM ('RASCUNHO', 'EM_REVISAO', 'AJUSTES_SOLICITADOS', 'APROVADA');

-- CreateEnum
CREATE TYPE "DecisaoAvaliacaoAta" AS ENUM ('APROVADA', 'AJUSTES_SOLICITADOS', 'REPROVADA');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('PESSOA', 'EQUIPAMENTO', 'VEICULO', 'INSTALACAO', 'LICENCA_SOFTWARE', 'MATERIAL', 'SUBCONTRATADO');

-- CreateEnum
CREATE TYPE "UnidadeCustoRecurso" AS ENUM ('HORA', 'DIA', 'MES', 'USO', 'UNIDADE');

-- CreateEnum
CREATE TYPE "StatusAlocacaoRecurso" AS ENUM ('PREVISTA', 'CONFIRMADA', 'ENCERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusPeriodoHoras" AS ENUM ('ABERTO', 'EM_FECHAMENTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "StatusApontamentoHoras" AS ENUM ('RASCUNHO', 'EM_APROVACAO', 'AJUSTES_SOLICITADOS', 'APROVADO', 'REJEITADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OrigemApontamentoHoras" AS ENUM ('MANUAL', 'CRONOMETRO');

-- CreateEnum
CREATE TYPE "DecisaoAvaliacaoHoras" AS ENUM ('APROVADO', 'AJUSTES_SOLICITADOS', 'REJEITADO');

-- CreateEnum
CREATE TYPE "StatusAjusteHoras" AS ENUM ('RASCUNHO', 'EM_APROVACAO', 'AJUSTES_SOLICITADOS', 'APROVADO', 'REJEITADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "NaturezaFinanceira" AS ENUM ('RECEITA', 'CUSTO', 'DESPESA', 'TRIBUTO');

-- CreateEnum
CREATE TYPE "StatusOrcamentoProjeto" AS ENUM ('RASCUNHO', 'EM_APROVACAO', 'APROVADO', 'REJEITADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoFornecedor" AS ENUM ('PESSOA_FISICA', 'PESSOA_JURIDICA');

-- CreateEnum
CREATE TYPE "TipoTituloFinanceiro" AS ENUM ('PAGAR', 'RECEBER');

-- CreateEnum
CREATE TYPE "StatusTituloFinanceiro" AS ENUM ('RASCUNHO', 'EM_APROVACAO', 'APROVADO', 'REJEITADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusParcelaFinanceira" AS ENUM ('ATIVA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoContaFinanceira" AS ENUM ('BANCARIA', 'CAIXA', 'CARTEIRA_DIGITAL');

-- CreateEnum
CREATE TYPE "MeioLiquidacaoFinanceira" AS ENUM ('PIX', 'TRANSFERENCIA', 'BOLETO', 'CARTAO', 'DINHEIRO', 'CHEQUE', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoObjetoAprovacao" AS ENUM ('ENTREGAVEL', 'ATA', 'APONTAMENTO_HORAS', 'AJUSTE_HORAS', 'ORCAMENTO_PROJETO', 'TITULO_FINANCEIRO', 'LIQUIDACAO_FINANCEIRA', 'ESTORNO_FINANCEIRO', 'TRANSFERENCIA_FINANCEIRA', 'ABERTURA_SALDO');

-- CreateEnum
CREATE TYPE "StatusSolicitacaoAprovacao" AS ENUM ('PENDENTE', 'APROVADA', 'AJUSTES_SOLICITADOS', 'REJEITADA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "DecisaoParecerAprovacao" AS ENUM ('APROVAR', 'SOLICITAR_AJUSTES', 'REJEITAR');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "status" "StatusEmpresa" NOT NULL DEFAULT 'ATIVA',
    "fusoHorario" VARCHAR(80) NOT NULL DEFAULT 'America/Sao_Paulo',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "emailNormalizado" VARCHAR(254) NOT NULL,
    "senhaHash" VARCHAR(255) NOT NULL,
    "status" "StatusUsuario" NOT NULL DEFAULT 'ATIVO',
    "emailVerificadoEm" TIMESTAMPTZ(3),
    "versaoSessao" INTEGER NOT NULL DEFAULT 1,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinculoEmpresa" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "status" "StatusVinculo" NOT NULL DEFAULT 'ATIVO',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "encerradoEm" TIMESTAMPTZ(3),

    CONSTRAINT "VinculoEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "vinculoId" UUID NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "versaoSessaoNaEmissao" INTEGER NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMPTZ(3) NOT NULL,
    "revogadaEm" TIMESTAMPTZ(3),

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id" UUID NOT NULL,
    "chave" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" VARCHAR(500),
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DependenciaModulo" (
    "moduloId" UUID NOT NULL,
    "requeridoId" UUID NOT NULL,

    CONSTRAINT "DependenciaModulo_pkey" PRIMARY KEY ("moduloId","requeridoId")
);

-- CreateTable
CREATE TABLE "EmpresaModulo" (
    "empresaId" UUID NOT NULL,
    "moduloId" UUID NOT NULL,
    "status" "StatusModuloEmpresa" NOT NULL DEFAULT 'DESATIVADO',
    "configuracao" JSONB,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "ativadoEm" TIMESTAMPTZ(3),
    "desativadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "EmpresaModulo_pkey" PRIMARY KEY ("empresaId","moduloId")
);

-- CreateTable
CREATE TABLE "Permissao" (
    "id" UUID NOT NULL,
    "moduloId" UUID NOT NULL,
    "chave" VARCHAR(120) NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "descricao" VARCHAR(500),
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" VARCHAR(500),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilPermissao" (
    "empresaId" UUID NOT NULL,
    "perfilId" UUID NOT NULL,
    "permissaoId" UUID NOT NULL,
    "alcance" "AlcancePermissao" NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerfilPermissao_pkey" PRIMARY KEY ("empresaId","perfilId","permissaoId","alcance")
);

-- CreateTable
CREATE TABLE "AtribuicaoPerfil" (
    "empresaId" UUID NOT NULL,
    "vinculoId" UUID NOT NULL,
    "perfilId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "revogadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "AtribuicaoPerfil_pkey" PRIMARY KEY ("empresaId","vinculoId","perfilId")
);

-- CreateTable
CREATE TABLE "EventoAuditoria" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "autorVinculoId" UUID,
    "tipoAutor" "TipoAutorAuditoria" NOT NULL,
    "autorIdentificacao" VARCHAR(200) NOT NULL,
    "moduloChave" VARCHAR(80) NOT NULL,
    "acao" VARCHAR(120) NOT NULL,
    "entidadeTipo" VARCHAR(100) NOT NULL,
    "entidadeId" VARCHAR(200),
    "ocorridoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" "ResultadoAuditoria" NOT NULL,
    "requisicaoId" VARCHAR(100) NOT NULL,
    "justificativa" VARCHAR(2000),
    "codigoErro" VARCHAR(100),
    "valoresAnteriores" JSONB,
    "valoresPosteriores" JSONB,
    "camposAlterados" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "versaoAnterior" INTEGER,
    "versaoPosterior" INTEGER,

    CONSTRAINT "EventoAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "tipo" "TipoCliente" NOT NULL,
    "documentoNormalizado" VARCHAR(20),
    "email" VARCHAR(254),
    "telefone" VARCHAR(30),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "escopo" TEXT NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'RASCUNHO',
    "modalidade" "ModalidadeCobranca" NOT NULL,
    "moeda" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "valorContratadoCentavos" BIGINT,
    "inicioVigencia" DATE,
    "fimVigencia" DATE,
    "assinadoEm" TIMESTAMPTZ(3),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "clienteId" UUID,
    "contratoId" UUID,
    "codigo" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "status" "StatusProjeto" NOT NULL DEFAULT 'PLANEJADO',
    "inicioPrevisto" DATE,
    "fimPrevisto" DATE,
    "iniciadoEm" TIMESTAMPTZ(3),
    "concluidoEm" TIMESTAMPTZ(3),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipacaoProjeto" (
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "vinculoId" UUID NOT NULL,
    "papel" "PapelParticipacaoProjeto" NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "encerradoEm" TIMESTAMPTZ(3),

    CONSTRAINT "ParticipacaoProjeto_pkey" PRIMARY KEY ("empresaId","projetoId","vinculoId")
);

-- CreateTable
CREATE TABLE "Fase" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusFase" NOT NULL DEFAULT 'PLANEJADA',
    "inicioPrevisto" DATE,
    "fimPrevisto" DATE,
    "iniciadoEm" TIMESTAMPTZ(3),
    "concluidoEm" TIMESTAMPTZ(3),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Fase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entregavel" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "faseId" UUID,
    "responsavelVinculoId" UUID,
    "codigo" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusEntregavel" NOT NULL DEFAULT 'PLANEJADO',
    "prazoPrevisto" DATE,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Entregavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterioAceite" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "entregavelId" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "CriterioAceite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissaoEntregavel" (
    "projetoId" UUID NOT NULL,
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "entregavelId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "resumo" TEXT NOT NULL,
    "versaoEntregavel" INTEGER NOT NULL,
    "descricaoEntregavelSnapshot" TEXT NOT NULL,
    "criteriosSnapshot" JSONB NOT NULL,
    "submetidoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissaoEntregavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoEntregavel" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "submissaoId" UUID NOT NULL,
    "avaliadorVinculoId" UUID NOT NULL,
    "decisao" "DecisaoAvaliacaoEntregavel" NOT NULL,
    "observacoes" TEXT NOT NULL,
    "resultadosCriterios" JSONB NOT NULL,
    "avaliadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parecerId" UUID NOT NULL,

    CONSTRAINT "AvaliacaoEntregavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarefa" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "faseId" UUID,
    "entregavelId" UUID,
    "codigo" VARCHAR(80) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "status" "StatusTarefa" NOT NULL DEFAULT 'PLANEJADA',
    "prioridade" "PrioridadeTarefa" NOT NULL DEFAULT 'NORMAL',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "inicioPrevisto" TIMESTAMPTZ(3),
    "fimPrevisto" TIMESTAMPTZ(3),
    "iniciadoEm" TIMESTAMPTZ(3),
    "concluidoEm" TIMESTAMPTZ(3),
    "esforcoEstimadoMinutos" INTEGER,
    "progressoPercentual" INTEGER NOT NULL DEFAULT 0,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsavelTarefa" (
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "tarefaId" UUID NOT NULL,
    "vinculoId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "encerradoEm" TIMESTAMPTZ(3),

    CONSTRAINT "ResponsavelTarefa_pkey" PRIMARY KEY ("empresaId","projetoId","tarefaId","vinculoId")
);

-- CreateTable
CREATE TABLE "DependenciaTarefa" (
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "predecessoraId" UUID NOT NULL,
    "sucessoraId" UUID NOT NULL,
    "tipo" "TipoDependenciaTarefa" NOT NULL DEFAULT 'TERMINO_INICIO',
    "intervaloMinutos" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DependenciaTarefa_pkey" PRIMARY KEY ("empresaId","projetoId","predecessoraId","sucessoraId")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descricao" TEXT,
    "visibilidade" "VisibilidadeDocumento" NOT NULL DEFAULT 'INTERNO',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersaoDocumento" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "documentoId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "notaVersao" TEXT,
    "nomeArquivoOriginal" VARCHAR(255) NOT NULL,
    "tipoMime" VARCHAR(150),
    "tamanhoBytes" BIGINT,
    "sha256" VARCHAR(64),
    "armazenamento" VARCHAR(80) NOT NULL,
    "container" VARCHAR(200) NOT NULL,
    "chaveObjeto" VARCHAR(500) NOT NULL,
    "statusArquivo" "StatusArquivoDocumento" NOT NULL DEFAULT 'PENDENTE',
    "codigoFalha" VARCHAR(100),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "disponibilizadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "VersaoDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reuniao" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "registradorVinculoId" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "pauta" TEXT,
    "localOuReferencia" VARCHAR(500),
    "status" "StatusReuniao" NOT NULL DEFAULT 'PLANEJADA',
    "inicioPrevisto" TIMESTAMPTZ(3),
    "fimPrevisto" TIMESTAMPTZ(3),
    "inicioReal" TIMESTAMPTZ(3),
    "fimReal" TIMESTAMPTZ(3),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Reuniao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteReuniao" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "reuniaoId" UUID NOT NULL,
    "vinculoId" UUID,
    "nome" VARCHAR(200) NOT NULL,
    "organizacao" VARCHAR(200),
    "funcaoNaReuniao" VARCHAR(120),
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ParticipanteReuniao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VersaoAta" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "reuniaoId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "reuniaoSnapshot" JSONB,
    "status" "StatusVersaoAta" NOT NULL DEFAULT 'RASCUNHO',
    "notaRevisao" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "submetidaEm" TIMESTAMPTZ(3),
    "aprovadaEm" TIMESTAMPTZ(3),

    CONSTRAINT "VersaoAta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoAta" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "versaoAtaId" UUID NOT NULL,
    "avaliadorVinculoId" UUID NOT NULL,
    "versaoConteudoAvaliada" INTEGER NOT NULL,
    "decisao" "DecisaoAvaliacaoAta" NOT NULL,
    "observacoes" TEXT NOT NULL,
    "dadosAtaSnapshot" JSONB NOT NULL,
    "avaliadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parecerId" UUID NOT NULL,

    CONSTRAINT "AvaliacaoAta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnexoAta" (
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "versaoAtaId" UUID NOT NULL,
    "versaoDocumentoId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnexoAta_pkey" PRIMARY KEY ("empresaId","projetoId","versaoAtaId","versaoDocumentoId")
);

-- CreateTable
CREATE TABLE "DecisaoReuniao" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "versaoAtaId" UUID NOT NULL,
    "entregavelId" UUID,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT NOT NULL,
    "justificativa" TEXT,
    "decisoresSnapshot" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DecisaoReuniao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncaminhamentoReuniao" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "versaoAtaId" UUID NOT NULL,
    "decisaoId" UUID,
    "responsavelVinculoId" UUID,
    "responsavelNomeSnapshot" VARCHAR(200),
    "descricao" TEXT NOT NULL,
    "prazoCombinado" DATE,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EncaminhamentoReuniao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarefaEncaminhamento" (
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "encaminhamentoId" UUID NOT NULL,
    "tarefaId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradoEm" TIMESTAMPTZ(3),

    CONSTRAINT "TarefaEncaminhamento_pkey" PRIMARY KEY ("empresaId","projetoId","encaminhamentoId","tarefaId")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "vinculoPessoaId" UUID,
    "codigo" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "tipo" "TipoRecurso" NOT NULL,
    "descricao" TEXT,
    "capacidadeSimultanea" DECIMAL(18,4),
    "unidadeCapacidade" VARCHAR(80),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustoRecurso" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "recursoId" UUID NOT NULL,
    "unidade" "UnidadeCustoRecurso" NOT NULL,
    "moeda" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "custoUnitarioCentavos" BIGINT NOT NULL,
    "inicioVigencia" TIMESTAMPTZ(3) NOT NULL,
    "fimVigencia" TIMESTAMPTZ(3),
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustoRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndisponibilidadeRecurso" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "recursoId" UUID NOT NULL,
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fim" TIMESTAMPTZ(3) NOT NULL,
    "motivo" VARCHAR(300) NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "canceladoEm" TIMESTAMPTZ(3),

    CONSTRAINT "IndisponibilidadeRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlocacaoRecurso" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "tarefaId" UUID,
    "recursoId" UUID NOT NULL,
    "custoRecursoId" UUID,
    "status" "StatusAlocacaoRecurso" NOT NULL DEFAULT 'PREVISTA',
    "inicio" TIMESTAMPTZ(3) NOT NULL,
    "fim" TIMESTAMPTZ(3) NOT NULL,
    "quantidadeReservada" DECIMAL(18,4) NOT NULL,
    "unidadeCapacidadeSnapshot" VARCHAR(80) NOT NULL,
    "quantidadeCustoPrevista" DECIMAL(18,4),
    "unidadeCustoSnapshot" "UnidadeCustoRecurso",
    "moedaSnapshot" VARCHAR(3),
    "custoUnitarioCentavosSnapshot" BIGINT,
    "observacoes" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "confirmadoEm" TIMESTAMPTZ(3),
    "encerradoEm" TIMESTAMPTZ(3),
    "canceladoEm" TIMESTAMPTZ(3),

    CONSTRAINT "AlocacaoRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoHoras" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "inicio" DATE NOT NULL,
    "fim" DATE NOT NULL,
    "status" "StatusPeriodoHoras" NOT NULL DEFAULT 'ABERTO',
    "fechadoPorVinculoId" UUID,
    "fechadoEm" TIMESTAMPTZ(3),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PeriodoHoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApontamentoHoras" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "tarefaId" UUID,
    "recursoId" UUID NOT NULL,
    "periodoId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "custoRecursoId" UUID,
    "dataCompetencia" DATE NOT NULL,
    "minutos" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "origem" "OrigemApontamentoHoras" NOT NULL DEFAULT 'MANUAL',
    "inicioTrabalho" TIMESTAMPTZ(3),
    "fimTrabalho" TIMESTAMPTZ(3),
    "faturavel" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusApontamentoHoras" NOT NULL DEFAULT 'RASCUNHO',
    "moedaCustoSnapshot" VARCHAR(3),
    "custoHoraCentavosSnapshot" BIGINT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "submetidoEm" TIMESTAMPTZ(3),
    "aprovadoEm" TIMESTAMPTZ(3),
    "canceladoEm" TIMESTAMPTZ(3),

    CONSTRAINT "ApontamentoHoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoHoras" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "apontamentoId" UUID NOT NULL,
    "avaliadorVinculoId" UUID NOT NULL,
    "versaoApontamento" INTEGER NOT NULL,
    "decisao" "DecisaoAvaliacaoHoras" NOT NULL,
    "observacoes" TEXT NOT NULL,
    "dadosApontamentoSnapshot" JSONB NOT NULL,
    "avaliadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parecerId" UUID NOT NULL,

    CONSTRAINT "AvaliacaoHoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjusteHoras" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "apontamentoId" UUID NOT NULL,
    "periodoAplicacaoId" UUID NOT NULL,
    "solicitanteVinculoId" UUID NOT NULL,
    "ajusteAnteriorId" UUID,
    "justificativa" TEXT NOT NULL,
    "minutosDelta" INTEGER NOT NULL,
    "custoDeltaCentavos" BIGINT,
    "moedaCusto" VARCHAR(3),
    "dataAplicacao" DATE NOT NULL,
    "baseCalculoSnapshot" JSONB,
    "status" "StatusAjusteHoras" NOT NULL DEFAULT 'RASCUNHO',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "submetidoEm" TIMESTAMPTZ(3),
    "aprovadoEm" TIMESTAMPTZ(3),
    "aplicadoEm" TIMESTAMPTZ(3),
    "canceladoEm" TIMESTAMPTZ(3),

    CONSTRAINT "AjusteHoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoAjusteHoras" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "ajusteId" UUID NOT NULL,
    "avaliadorVinculoId" UUID NOT NULL,
    "versaoAjuste" INTEGER NOT NULL,
    "decisao" "DecisaoAvaliacaoHoras" NOT NULL,
    "observacoes" TEXT NOT NULL,
    "dadosAjusteSnapshot" JSONB NOT NULL,
    "avaliadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parecerId" UUID NOT NULL,

    CONSTRAINT "AvaliacaoAjusteHoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaFinanceira" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "natureza" "NaturezaFinanceira" NOT NULL,
    "descricao" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "CategoriaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CentroCusto" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "descricao" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "CentroCusto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrcamentoProjeto" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "aprovadoPorVinculoId" UUID,
    "numero" INTEGER NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "justificativaRevisao" TEXT,
    "moeda" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "status" "StatusOrcamentoProjeto" NOT NULL DEFAULT 'RASCUNHO',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "submetidoEm" TIMESTAMPTZ(3),
    "aprovadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "OrcamentoProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOrcamentoProjeto" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "orcamentoId" UUID NOT NULL,
    "categoriaId" UUID NOT NULL,
    "centroCustoId" UUID,
    "recursoId" UUID,
    "descricao" TEXT NOT NULL,
    "categoriaNomeSnapshot" VARCHAR(160) NOT NULL,
    "naturezaSnapshot" "NaturezaFinanceira" NOT NULL,
    "centroCustoNomeSnapshot" VARCHAR(160),
    "quantidadePrevista" DECIMAL(18,4),
    "unidadeQuantidade" VARCHAR(80),
    "valorPrevistoCentavos" BIGINT NOT NULL,
    "dataCompetenciaPrevista" DATE,
    "dataCaixaPrevista" DATE,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ItemOrcamentoProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "tipo" "TipoFornecedor" NOT NULL,
    "documentoNormalizado" VARCHAR(20),
    "email" VARCHAR(254),
    "telefone" VARCHAR(30),
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TituloFinanceiro" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID,
    "clienteId" UUID,
    "fornecedorId" UUID,
    "categoriaId" UUID NOT NULL,
    "centroCustoId" UUID,
    "autorVinculoId" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "tipo" "TipoTituloFinanceiro" NOT NULL,
    "status" "StatusTituloFinanceiro" NOT NULL DEFAULT 'RASCUNHO',
    "descricao" TEXT NOT NULL,
    "referenciaDocumento" VARCHAR(200),
    "contraparteNomeSnapshot" VARCHAR(200) NOT NULL,
    "categoriaNomeSnapshot" VARCHAR(160) NOT NULL,
    "naturezaSnapshot" "NaturezaFinanceira" NOT NULL,
    "centroCustoNomeSnapshot" VARCHAR(160),
    "moeda" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "valorPrincipalCentavos" BIGINT NOT NULL,
    "dataCompetencia" DATE NOT NULL,
    "emitidoEm" DATE,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "aprovadoEm" TIMESTAMPTZ(3),
    "canceladoEm" TIMESTAMPTZ(3),
    "motivoCancelamento" TEXT,

    CONSTRAINT "TituloFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelaFinanceira" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "tituloId" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "vencimento" DATE NOT NULL,
    "valorPrincipalCentavos" BIGINT NOT NULL,
    "status" "StatusParcelaFinanceira" NOT NULL DEFAULT 'ATIVA',
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "canceladoEm" TIMESTAMPTZ(3),

    CONSTRAINT "ParcelaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaFinanceira" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "codigo" VARCHAR(80) NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "tipo" "TipoContaFinanceira" NOT NULL,
    "moeda" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "instituicao" VARCHAR(160),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "arquivadoEm" TIMESTAMPTZ(3),

    CONSTRAINT "ContaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacaoFinanceira" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "parcelaId" UUID NOT NULL,
    "contaId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "chaveIdempotencia" VARCHAR(100) NOT NULL,
    "meio" "MeioLiquidacaoFinanceira" NOT NULL,
    "principalCentavos" BIGINT NOT NULL,
    "jurosCentavos" BIGINT NOT NULL DEFAULT 0,
    "multaCentavos" BIGINT NOT NULL DEFAULT 0,
    "descontoCentavos" BIGINT NOT NULL DEFAULT 0,
    "valorMovimentadoCentavos" BIGINT NOT NULL,
    "moedaSnapshot" VARCHAR(3) NOT NULL,
    "tipoTituloSnapshot" "TipoTituloFinanceiro" NOT NULL,
    "referenciaExterna" VARCHAR(200),
    "observacoes" TEXT,
    "movimentadoEm" TIMESTAMPTZ(3) NOT NULL,
    "dataCaixa" DATE NOT NULL,
    "registradoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidacaoFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstornoLiquidacaoFinanceira" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "liquidacaoId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "chaveIdempotencia" VARCHAR(100) NOT NULL,
    "justificativa" TEXT NOT NULL,
    "referenciaExterna" VARCHAR(200),
    "movimentadoEm" TIMESTAMPTZ(3) NOT NULL,
    "dataCaixa" DATE NOT NULL,
    "registradoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstornoLiquidacaoFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AberturaSaldoConta" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "contaId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "chaveIdempotencia" VARCHAR(100) NOT NULL,
    "saldoCentavos" BIGINT NOT NULL,
    "moedaSnapshot" VARCHAR(3) NOT NULL,
    "dataInicioControle" DATE NOT NULL,
    "justificativa" TEXT NOT NULL,
    "registradoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AberturaSaldoConta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstornoAberturaSaldo" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "aberturaId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "chaveIdempotencia" VARCHAR(100) NOT NULL,
    "justificativa" TEXT NOT NULL,
    "registradoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstornoAberturaSaldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaFinanceira" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "contaOrigemId" UUID NOT NULL,
    "contaDestinoId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "chaveIdempotencia" VARCHAR(100) NOT NULL,
    "valorCentavos" BIGINT NOT NULL,
    "moedaSnapshot" VARCHAR(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "referenciaExterna" VARCHAR(200),
    "movimentadoEm" TIMESTAMPTZ(3) NOT NULL,
    "dataCaixa" DATE NOT NULL,
    "registradoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferenciaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstornoTransferenciaFinanceira" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "transferenciaId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "chaveIdempotencia" VARCHAR(100) NOT NULL,
    "justificativa" TEXT NOT NULL,
    "referenciaExterna" VARCHAR(200),
    "movimentadoEm" TIMESTAMPTZ(3) NOT NULL,
    "dataCaixa" DATE NOT NULL,
    "registradoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstornoTransferenciaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnexoSubmissaoEntregavel" (
    "empresaId" UUID NOT NULL,
    "projetoId" UUID NOT NULL,
    "submissaoId" UUID NOT NULL,
    "versaoDocumentoId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnexoSubmissaoEntregavel_pkey" PRIMARY KEY ("empresaId","projetoId","submissaoId","versaoDocumentoId")
);

-- CreateTable
CREATE TABLE "PoliticaAprovacao" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "autorVinculoId" UUID NOT NULL,
    "publicadoPorVinculoId" UUID,
    "tipo" "TipoObjetoAprovacao" NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "descricao" TEXT,
    "moeda" VARCHAR(3),
    "minimoAprovadores" INTEGER NOT NULL DEFAULT 1,
    "permitirAutoaprovacao" BOOLEAN NOT NULL DEFAULT false,
    "exigirTodosPerfis" BOOLEAN NOT NULL DEFAULT false,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "publicadoEm" TIMESTAMPTZ(3),
    "encerradoEm" TIMESTAMPTZ(3),

    CONSTRAINT "PoliticaAprovacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilAprovadorPolitica" (
    "empresaId" UUID NOT NULL,
    "politicaId" UUID NOT NULL,
    "perfilId" UUID NOT NULL,
    "limiteValorCentavos" BIGINT,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerfilAprovadorPolitica_pkey" PRIMARY KEY ("empresaId","politicaId","perfilId")
);

-- CreateTable
CREATE TABLE "SolicitacaoAprovacao" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "projetoId" UUID,
    "politicaId" UUID NOT NULL,
    "solicitanteVinculoId" UUID NOT NULL,
    "tipo" "TipoObjetoAprovacao" NOT NULL,
    "entidadeId" UUID,
    "versaoObjeto" INTEGER,
    "chaveIdempotencia" VARCHAR(100) NOT NULL,
    "dadosObjetoSnapshot" JSONB NOT NULL,
    "politicaSnapshot" JSONB NOT NULL,
    "hashConteudo" VARCHAR(64) NOT NULL,
    "valorReferenciaCentavos" BIGINT,
    "moeda" VARCHAR(3),
    "status" "StatusSolicitacaoAprovacao" NOT NULL DEFAULT 'PENDENTE',
    "justificativa" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ(3) NOT NULL,
    "expiraEm" TIMESTAMPTZ(3),
    "decididoEm" TIMESTAMPTZ(3),
    "canceladoEm" TIMESTAMPTZ(3),
    "motivoCancelamento" TEXT,
    "aplicadoEm" TIMESTAMPTZ(3),
    "entidadeResultadoId" UUID,

    CONSTRAINT "SolicitacaoAprovacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParecerAprovacao" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "solicitacaoId" UUID NOT NULL,
    "avaliadorVinculoId" UUID NOT NULL,
    "perfilId" UUID NOT NULL,
    "decisao" "DecisaoParecerAprovacao" NOT NULL,
    "observacoes" TEXT NOT NULL,
    "autorizacaoSnapshot" JSONB NOT NULL,
    "avaliadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParecerAprovacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_slug_key" ON "Empresa"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_emailNormalizado_key" ON "Usuario"("emailNormalizado");

-- CreateIndex
CREATE INDEX "VinculoEmpresa_usuarioId_status_idx" ON "VinculoEmpresa"("usuarioId", "status");

-- CreateIndex
CREATE INDEX "VinculoEmpresa_empresaId_status_idx" ON "VinculoEmpresa"("empresaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VinculoEmpresa_empresaId_usuarioId_key" ON "VinculoEmpresa"("empresaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "VinculoEmpresa_empresaId_id_key" ON "VinculoEmpresa"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_tokenHash_key" ON "Sessao"("tokenHash");

-- CreateIndex
CREATE INDEX "Sessao_empresaId_vinculoId_idx" ON "Sessao"("empresaId", "vinculoId");

-- CreateIndex
CREATE INDEX "Sessao_expiraEm_idx" ON "Sessao"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_chave_key" ON "Modulo"("chave");

-- CreateIndex
CREATE INDEX "DependenciaModulo_requeridoId_idx" ON "DependenciaModulo"("requeridoId");

-- CreateIndex
CREATE INDEX "EmpresaModulo_moduloId_status_idx" ON "EmpresaModulo"("moduloId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Permissao_chave_key" ON "Permissao"("chave");

-- CreateIndex
CREATE INDEX "Permissao_moduloId_idx" ON "Permissao"("moduloId");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_empresaId_id_key" ON "Perfil"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_empresaId_nome_key" ON "Perfil"("empresaId", "nome");

-- CreateIndex
CREATE INDEX "PerfilPermissao_permissaoId_idx" ON "PerfilPermissao"("permissaoId");

-- CreateIndex
CREATE INDEX "AtribuicaoPerfil_empresaId_perfilId_idx" ON "AtribuicaoPerfil"("empresaId", "perfilId");

-- CreateIndex
CREATE INDEX "EventoAuditoria_empresaId_ocorridoEm_idx" ON "EventoAuditoria"("empresaId", "ocorridoEm");

-- CreateIndex
CREATE INDEX "EventoAuditoria_empresaId_entidadeTipo_entidadeId_ocorridoE_idx" ON "EventoAuditoria"("empresaId", "entidadeTipo", "entidadeId", "ocorridoEm");

-- CreateIndex
CREATE INDEX "EventoAuditoria_empresaId_autorVinculoId_ocorridoEm_idx" ON "EventoAuditoria"("empresaId", "autorVinculoId", "ocorridoEm");

-- CreateIndex
CREATE INDEX "EventoAuditoria_empresaId_moduloChave_ocorridoEm_idx" ON "EventoAuditoria"("empresaId", "moduloChave", "ocorridoEm");

-- CreateIndex
CREATE INDEX "EventoAuditoria_empresaId_requisicaoId_idx" ON "EventoAuditoria"("empresaId", "requisicaoId");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_nome_idx" ON "Cliente"("empresaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_empresaId_id_key" ON "Cliente"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_empresaId_documentoNormalizado_key" ON "Cliente"("empresaId", "documentoNormalizado");

-- CreateIndex
CREATE INDEX "Contrato_empresaId_clienteId_status_idx" ON "Contrato"("empresaId", "clienteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_empresaId_id_key" ON "Contrato"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_empresaId_codigo_key" ON "Contrato"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_empresaId_clienteId_id_key" ON "Contrato"("empresaId", "clienteId", "id");

-- CreateIndex
CREATE INDEX "Projeto_empresaId_status_fimPrevisto_idx" ON "Projeto"("empresaId", "status", "fimPrevisto");

-- CreateIndex
CREATE INDEX "Projeto_empresaId_clienteId_idx" ON "Projeto"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "Projeto_empresaId_clienteId_contratoId_idx" ON "Projeto"("empresaId", "clienteId", "contratoId");

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_empresaId_id_key" ON "Projeto"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_empresaId_codigo_key" ON "Projeto"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "ParticipacaoProjeto_empresaId_vinculoId_encerradoEm_idx" ON "ParticipacaoProjeto"("empresaId", "vinculoId", "encerradoEm");

-- CreateIndex
CREATE INDEX "Fase_empresaId_projetoId_ordem_idx" ON "Fase"("empresaId", "projetoId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "Fase_empresaId_projetoId_id_key" ON "Fase"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Fase_empresaId_projetoId_codigo_key" ON "Fase"("empresaId", "projetoId", "codigo");

-- CreateIndex
CREATE INDEX "Entregavel_empresaId_projetoId_status_idx" ON "Entregavel"("empresaId", "projetoId", "status");

-- CreateIndex
CREATE INDEX "Entregavel_empresaId_projetoId_faseId_idx" ON "Entregavel"("empresaId", "projetoId", "faseId");

-- CreateIndex
CREATE INDEX "Entregavel_empresaId_responsavelVinculoId_idx" ON "Entregavel"("empresaId", "responsavelVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "Entregavel_empresaId_id_key" ON "Entregavel"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Entregavel_empresaId_projetoId_id_key" ON "Entregavel"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Entregavel_empresaId_projetoId_codigo_key" ON "Entregavel"("empresaId", "projetoId", "codigo");

-- CreateIndex
CREATE INDEX "CriterioAceite_empresaId_entregavelId_ordem_idx" ON "CriterioAceite"("empresaId", "entregavelId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "CriterioAceite_empresaId_id_key" ON "CriterioAceite"("empresaId", "id");

-- CreateIndex
CREATE INDEX "SubmissaoEntregavel_empresaId_autorVinculoId_idx" ON "SubmissaoEntregavel"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissaoEntregavel_empresaId_id_key" ON "SubmissaoEntregavel"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissaoEntregavel_empresaId_entregavelId_numero_key" ON "SubmissaoEntregavel"("empresaId", "entregavelId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissaoEntregavel_empresaId_projetoId_id_key" ON "SubmissaoEntregavel"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE INDEX "AvaliacaoEntregavel_empresaId_submissaoId_avaliadoEm_idx" ON "AvaliacaoEntregavel"("empresaId", "submissaoId", "avaliadoEm");

-- CreateIndex
CREATE INDEX "AvaliacaoEntregavel_empresaId_avaliadorVinculoId_idx" ON "AvaliacaoEntregavel"("empresaId", "avaliadorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoEntregavel_empresaId_id_key" ON "AvaliacaoEntregavel"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoEntregavel_empresaId_parecerId_key" ON "AvaliacaoEntregavel"("empresaId", "parecerId");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_projetoId_status_fimPrevisto_idx" ON "Tarefa"("empresaId", "projetoId", "status", "fimPrevisto");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_projetoId_faseId_idx" ON "Tarefa"("empresaId", "projetoId", "faseId");

-- CreateIndex
CREATE INDEX "Tarefa_empresaId_projetoId_entregavelId_idx" ON "Tarefa"("empresaId", "projetoId", "entregavelId");

-- CreateIndex
CREATE UNIQUE INDEX "Tarefa_empresaId_projetoId_id_key" ON "Tarefa"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Tarefa_empresaId_projetoId_codigo_key" ON "Tarefa"("empresaId", "projetoId", "codigo");

-- CreateIndex
CREATE INDEX "ResponsavelTarefa_empresaId_projetoId_vinculoId_encerradoEm_idx" ON "ResponsavelTarefa"("empresaId", "projetoId", "vinculoId", "encerradoEm");

-- CreateIndex
CREATE INDEX "DependenciaTarefa_empresaId_projetoId_sucessoraId_idx" ON "DependenciaTarefa"("empresaId", "projetoId", "sucessoraId");

-- CreateIndex
CREATE INDEX "Documento_empresaId_projetoId_arquivadoEm_idx" ON "Documento"("empresaId", "projetoId", "arquivadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Documento_empresaId_projetoId_id_key" ON "Documento"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Documento_empresaId_projetoId_codigo_key" ON "Documento"("empresaId", "projetoId", "codigo");

-- CreateIndex
CREATE INDEX "VersaoDocumento_empresaId_projetoId_statusArquivo_idx" ON "VersaoDocumento"("empresaId", "projetoId", "statusArquivo");

-- CreateIndex
CREATE INDEX "VersaoDocumento_empresaId_autorVinculoId_idx" ON "VersaoDocumento"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoDocumento_empresaId_projetoId_id_key" ON "VersaoDocumento"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoDocumento_empresaId_projetoId_documentoId_numero_key" ON "VersaoDocumento"("empresaId", "projetoId", "documentoId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoDocumento_armazenamento_container_chaveObjeto_key" ON "VersaoDocumento"("armazenamento", "container", "chaveObjeto");

-- CreateIndex
CREATE INDEX "Reuniao_empresaId_projetoId_inicioReal_idx" ON "Reuniao"("empresaId", "projetoId", "inicioReal");

-- CreateIndex
CREATE INDEX "Reuniao_empresaId_projetoId_inicioPrevisto_idx" ON "Reuniao"("empresaId", "projetoId", "inicioPrevisto");

-- CreateIndex
CREATE INDEX "Reuniao_empresaId_registradorVinculoId_idx" ON "Reuniao"("empresaId", "registradorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "Reuniao_empresaId_projetoId_id_key" ON "Reuniao"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE INDEX "ParticipanteReuniao_empresaId_projetoId_reuniaoId_idx" ON "ParticipanteReuniao"("empresaId", "projetoId", "reuniaoId");

-- CreateIndex
CREATE INDEX "ParticipanteReuniao_empresaId_vinculoId_idx" ON "ParticipanteReuniao"("empresaId", "vinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipanteReuniao_empresaId_projetoId_reuniaoId_vinculoId_key" ON "ParticipanteReuniao"("empresaId", "projetoId", "reuniaoId", "vinculoId");

-- CreateIndex
CREATE INDEX "VersaoAta_empresaId_projetoId_status_idx" ON "VersaoAta"("empresaId", "projetoId", "status");

-- CreateIndex
CREATE INDEX "VersaoAta_empresaId_autorVinculoId_idx" ON "VersaoAta"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoAta_empresaId_projetoId_id_key" ON "VersaoAta"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "VersaoAta_empresaId_projetoId_reuniaoId_numero_key" ON "VersaoAta"("empresaId", "projetoId", "reuniaoId", "numero");

-- CreateIndex
CREATE INDEX "AvaliacaoAta_empresaId_projetoId_versaoAtaId_avaliadoEm_idx" ON "AvaliacaoAta"("empresaId", "projetoId", "versaoAtaId", "avaliadoEm");

-- CreateIndex
CREATE INDEX "AvaliacaoAta_empresaId_avaliadorVinculoId_idx" ON "AvaliacaoAta"("empresaId", "avaliadorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoAta_revisao_avaliador_key" ON "AvaliacaoAta"("empresaId", "projetoId", "versaoAtaId", "versaoConteudoAvaliada", "avaliadorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoAta_empresaId_parecerId_key" ON "AvaliacaoAta"("empresaId", "parecerId");

-- CreateIndex
CREATE INDEX "AnexoAta_empresaId_projetoId_versaoDocumentoId_idx" ON "AnexoAta"("empresaId", "projetoId", "versaoDocumentoId");

-- CreateIndex
CREATE INDEX "DecisaoReuniao_empresaId_projetoId_versaoAtaId_ordem_idx" ON "DecisaoReuniao"("empresaId", "projetoId", "versaoAtaId", "ordem");

-- CreateIndex
CREATE INDEX "DecisaoReuniao_empresaId_projetoId_entregavelId_idx" ON "DecisaoReuniao"("empresaId", "projetoId", "entregavelId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisaoReuniao_empresaId_projetoId_versaoAtaId_id_key" ON "DecisaoReuniao"("empresaId", "projetoId", "versaoAtaId", "id");

-- CreateIndex
CREATE INDEX "EncaminhamentoReuniao_empresaId_projetoId_versaoAtaId_ordem_idx" ON "EncaminhamentoReuniao"("empresaId", "projetoId", "versaoAtaId", "ordem");

-- CreateIndex
CREATE INDEX "EncaminhamentoReuniao_empresaId_projetoId_versaoAtaId_decis_idx" ON "EncaminhamentoReuniao"("empresaId", "projetoId", "versaoAtaId", "decisaoId");

-- CreateIndex
CREATE INDEX "EncaminhamentoReuniao_empresaId_projetoId_responsavelVincul_idx" ON "EncaminhamentoReuniao"("empresaId", "projetoId", "responsavelVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "EncaminhamentoReuniao_empresaId_projetoId_id_key" ON "EncaminhamentoReuniao"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE INDEX "TarefaEncaminhamento_empresaId_projetoId_tarefaId_idx" ON "TarefaEncaminhamento"("empresaId", "projetoId", "tarefaId");

-- CreateIndex
CREATE INDEX "Recurso_empresaId_tipo_arquivadoEm_idx" ON "Recurso"("empresaId", "tipo", "arquivadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Recurso_empresaId_id_key" ON "Recurso"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Recurso_empresaId_codigo_key" ON "Recurso"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Recurso_empresaId_vinculoPessoaId_key" ON "Recurso"("empresaId", "vinculoPessoaId");

-- CreateIndex
CREATE INDEX "CustoRecurso_empresaId_recursoId_unidade_moeda_inicioVigenc_idx" ON "CustoRecurso"("empresaId", "recursoId", "unidade", "moeda", "inicioVigencia");

-- CreateIndex
CREATE UNIQUE INDEX "CustoRecurso_empresaId_recursoId_id_key" ON "CustoRecurso"("empresaId", "recursoId", "id");

-- CreateIndex
CREATE INDEX "IndisponibilidadeRecurso_empresaId_recursoId_inicio_fim_idx" ON "IndisponibilidadeRecurso"("empresaId", "recursoId", "inicio", "fim");

-- CreateIndex
CREATE INDEX "AlocacaoRecurso_empresaId_projetoId_status_idx" ON "AlocacaoRecurso"("empresaId", "projetoId", "status");

-- CreateIndex
CREATE INDEX "AlocacaoRecurso_empresaId_projetoId_tarefaId_idx" ON "AlocacaoRecurso"("empresaId", "projetoId", "tarefaId");

-- CreateIndex
CREATE INDEX "AlocacaoRecurso_empresaId_recursoId_inicio_fim_idx" ON "AlocacaoRecurso"("empresaId", "recursoId", "inicio", "fim");

-- CreateIndex
CREATE INDEX "AlocacaoRecurso_empresaId_recursoId_custoRecursoId_idx" ON "AlocacaoRecurso"("empresaId", "recursoId", "custoRecursoId");

-- CreateIndex
CREATE UNIQUE INDEX "AlocacaoRecurso_empresaId_id_key" ON "AlocacaoRecurso"("empresaId", "id");

-- CreateIndex
CREATE INDEX "PeriodoHoras_empresaId_inicio_fim_idx" ON "PeriodoHoras"("empresaId", "inicio", "fim");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoHoras_empresaId_id_key" ON "PeriodoHoras"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodoHoras_empresaId_codigo_key" ON "PeriodoHoras"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "ApontamentoHoras_empresaId_projetoId_dataCompetencia_idx" ON "ApontamentoHoras"("empresaId", "projetoId", "dataCompetencia");

-- CreateIndex
CREATE INDEX "ApontamentoHoras_empresaId_projetoId_tarefaId_idx" ON "ApontamentoHoras"("empresaId", "projetoId", "tarefaId");

-- CreateIndex
CREATE INDEX "ApontamentoHoras_empresaId_recursoId_dataCompetencia_idx" ON "ApontamentoHoras"("empresaId", "recursoId", "dataCompetencia");

-- CreateIndex
CREATE INDEX "ApontamentoHoras_empresaId_periodoId_status_idx" ON "ApontamentoHoras"("empresaId", "periodoId", "status");

-- CreateIndex
CREATE INDEX "ApontamentoHoras_empresaId_autorVinculoId_idx" ON "ApontamentoHoras"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE INDEX "ApontamentoHoras_empresaId_recursoId_custoRecursoId_idx" ON "ApontamentoHoras"("empresaId", "recursoId", "custoRecursoId");

-- CreateIndex
CREATE UNIQUE INDEX "ApontamentoHoras_empresaId_id_key" ON "ApontamentoHoras"("empresaId", "id");

-- CreateIndex
CREATE INDEX "AvaliacaoHoras_empresaId_avaliadorVinculoId_idx" ON "AvaliacaoHoras"("empresaId", "avaliadorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoHoras_empresaId_apontamentoId_versaoApontamento_av_key" ON "AvaliacaoHoras"("empresaId", "apontamentoId", "versaoApontamento", "avaliadorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoHoras_empresaId_parecerId_key" ON "AvaliacaoHoras"("empresaId", "parecerId");

-- CreateIndex
CREATE INDEX "AjusteHoras_empresaId_apontamentoId_aplicadoEm_idx" ON "AjusteHoras"("empresaId", "apontamentoId", "aplicadoEm");

-- CreateIndex
CREATE INDEX "AjusteHoras_empresaId_periodoAplicacaoId_status_idx" ON "AjusteHoras"("empresaId", "periodoAplicacaoId", "status");

-- CreateIndex
CREATE INDEX "AjusteHoras_empresaId_solicitanteVinculoId_idx" ON "AjusteHoras"("empresaId", "solicitanteVinculoId");

-- CreateIndex
CREATE INDEX "AjusteHoras_empresaId_ajusteAnteriorId_idx" ON "AjusteHoras"("empresaId", "ajusteAnteriorId");

-- CreateIndex
CREATE UNIQUE INDEX "AjusteHoras_empresaId_id_key" ON "AjusteHoras"("empresaId", "id");

-- CreateIndex
CREATE INDEX "AvaliacaoAjusteHoras_empresaId_avaliadorVinculoId_idx" ON "AvaliacaoAjusteHoras"("empresaId", "avaliadorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoAjusteHoras_empresaId_ajusteId_versaoAjuste_avalia_key" ON "AvaliacaoAjusteHoras"("empresaId", "ajusteId", "versaoAjuste", "avaliadorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AvaliacaoAjusteHoras_empresaId_parecerId_key" ON "AvaliacaoAjusteHoras"("empresaId", "parecerId");

-- CreateIndex
CREATE INDEX "CategoriaFinanceira_empresaId_natureza_arquivadoEm_idx" ON "CategoriaFinanceira"("empresaId", "natureza", "arquivadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaFinanceira_empresaId_id_key" ON "CategoriaFinanceira"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaFinanceira_empresaId_codigo_key" ON "CategoriaFinanceira"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCusto_empresaId_id_key" ON "CentroCusto"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CentroCusto_empresaId_codigo_key" ON "CentroCusto"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "OrcamentoProjeto_empresaId_projetoId_status_idx" ON "OrcamentoProjeto"("empresaId", "projetoId", "status");

-- CreateIndex
CREATE INDEX "OrcamentoProjeto_empresaId_autorVinculoId_idx" ON "OrcamentoProjeto"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE INDEX "OrcamentoProjeto_empresaId_aprovadoPorVinculoId_idx" ON "OrcamentoProjeto"("empresaId", "aprovadoPorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "OrcamentoProjeto_empresaId_projetoId_id_key" ON "OrcamentoProjeto"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "OrcamentoProjeto_empresaId_projetoId_numero_key" ON "OrcamentoProjeto"("empresaId", "projetoId", "numero");

-- CreateIndex
CREATE INDEX "ItemOrcamentoProjeto_empresaId_projetoId_orcamentoId_ordem_idx" ON "ItemOrcamentoProjeto"("empresaId", "projetoId", "orcamentoId", "ordem");

-- CreateIndex
CREATE INDEX "ItemOrcamentoProjeto_empresaId_categoriaId_idx" ON "ItemOrcamentoProjeto"("empresaId", "categoriaId");

-- CreateIndex
CREATE INDEX "ItemOrcamentoProjeto_empresaId_centroCustoId_idx" ON "ItemOrcamentoProjeto"("empresaId", "centroCustoId");

-- CreateIndex
CREATE INDEX "ItemOrcamentoProjeto_empresaId_recursoId_idx" ON "ItemOrcamentoProjeto"("empresaId", "recursoId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemOrcamentoProjeto_empresaId_projetoId_id_key" ON "ItemOrcamentoProjeto"("empresaId", "projetoId", "id");

-- CreateIndex
CREATE INDEX "Fornecedor_empresaId_nome_idx" ON "Fornecedor"("empresaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_empresaId_id_key" ON "Fornecedor"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_empresaId_documentoNormalizado_key" ON "Fornecedor"("empresaId", "documentoNormalizado");

-- CreateIndex
CREATE INDEX "TituloFinanceiro_empresaId_tipo_status_dataCompetencia_idx" ON "TituloFinanceiro"("empresaId", "tipo", "status", "dataCompetencia");

-- CreateIndex
CREATE INDEX "TituloFinanceiro_empresaId_projetoId_idx" ON "TituloFinanceiro"("empresaId", "projetoId");

-- CreateIndex
CREATE INDEX "TituloFinanceiro_empresaId_clienteId_idx" ON "TituloFinanceiro"("empresaId", "clienteId");

-- CreateIndex
CREATE INDEX "TituloFinanceiro_empresaId_fornecedorId_idx" ON "TituloFinanceiro"("empresaId", "fornecedorId");

-- CreateIndex
CREATE INDEX "TituloFinanceiro_empresaId_categoriaId_idx" ON "TituloFinanceiro"("empresaId", "categoriaId");

-- CreateIndex
CREATE INDEX "TituloFinanceiro_empresaId_centroCustoId_idx" ON "TituloFinanceiro"("empresaId", "centroCustoId");

-- CreateIndex
CREATE INDEX "TituloFinanceiro_empresaId_autorVinculoId_idx" ON "TituloFinanceiro"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "TituloFinanceiro_empresaId_id_key" ON "TituloFinanceiro"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "TituloFinanceiro_empresaId_codigo_key" ON "TituloFinanceiro"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "ParcelaFinanceira_empresaId_status_vencimento_idx" ON "ParcelaFinanceira"("empresaId", "status", "vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelaFinanceira_empresaId_id_key" ON "ParcelaFinanceira"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelaFinanceira_empresaId_tituloId_numero_key" ON "ParcelaFinanceira"("empresaId", "tituloId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ContaFinanceira_empresaId_id_key" ON "ContaFinanceira"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ContaFinanceira_empresaId_codigo_key" ON "ContaFinanceira"("empresaId", "codigo");

-- CreateIndex
CREATE INDEX "LiquidacaoFinanceira_empresaId_parcelaId_movimentadoEm_idx" ON "LiquidacaoFinanceira"("empresaId", "parcelaId", "movimentadoEm");

-- CreateIndex
CREATE INDEX "LiquidacaoFinanceira_empresaId_contaId_dataCaixa_idx" ON "LiquidacaoFinanceira"("empresaId", "contaId", "dataCaixa");

-- CreateIndex
CREATE INDEX "LiquidacaoFinanceira_empresaId_autorVinculoId_idx" ON "LiquidacaoFinanceira"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidacaoFinanceira_empresaId_id_key" ON "LiquidacaoFinanceira"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidacaoFinanceira_empresaId_chaveIdempotencia_key" ON "LiquidacaoFinanceira"("empresaId", "chaveIdempotencia");

-- CreateIndex
CREATE INDEX "EstornoLiquidacaoFinanceira_empresaId_dataCaixa_idx" ON "EstornoLiquidacaoFinanceira"("empresaId", "dataCaixa");

-- CreateIndex
CREATE INDEX "EstornoLiquidacaoFinanceira_empresaId_autorVinculoId_idx" ON "EstornoLiquidacaoFinanceira"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoLiquidacaoFinanceira_empresaId_id_key" ON "EstornoLiquidacaoFinanceira"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoLiquidacaoFinanceira_empresaId_liquidacaoId_key" ON "EstornoLiquidacaoFinanceira"("empresaId", "liquidacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoLiquidacaoFinanceira_empresaId_chaveIdempotencia_key" ON "EstornoLiquidacaoFinanceira"("empresaId", "chaveIdempotencia");

-- CreateIndex
CREATE INDEX "AberturaSaldoConta_empresaId_contaId_dataInicioControle_idx" ON "AberturaSaldoConta"("empresaId", "contaId", "dataInicioControle");

-- CreateIndex
CREATE INDEX "AberturaSaldoConta_empresaId_autorVinculoId_idx" ON "AberturaSaldoConta"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "AberturaSaldoConta_empresaId_id_key" ON "AberturaSaldoConta"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AberturaSaldoConta_empresaId_chaveIdempotencia_key" ON "AberturaSaldoConta"("empresaId", "chaveIdempotencia");

-- CreateIndex
CREATE INDEX "EstornoAberturaSaldo_empresaId_autorVinculoId_idx" ON "EstornoAberturaSaldo"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoAberturaSaldo_empresaId_id_key" ON "EstornoAberturaSaldo"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoAberturaSaldo_empresaId_aberturaId_key" ON "EstornoAberturaSaldo"("empresaId", "aberturaId");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoAberturaSaldo_empresaId_chaveIdempotencia_key" ON "EstornoAberturaSaldo"("empresaId", "chaveIdempotencia");

-- CreateIndex
CREATE INDEX "TransferenciaFinanceira_empresaId_contaOrigemId_dataCaixa_idx" ON "TransferenciaFinanceira"("empresaId", "contaOrigemId", "dataCaixa");

-- CreateIndex
CREATE INDEX "TransferenciaFinanceira_empresaId_contaDestinoId_dataCaixa_idx" ON "TransferenciaFinanceira"("empresaId", "contaDestinoId", "dataCaixa");

-- CreateIndex
CREATE INDEX "TransferenciaFinanceira_empresaId_autorVinculoId_idx" ON "TransferenciaFinanceira"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferenciaFinanceira_empresaId_id_key" ON "TransferenciaFinanceira"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "TransferenciaFinanceira_empresaId_chaveIdempotencia_key" ON "TransferenciaFinanceira"("empresaId", "chaveIdempotencia");

-- CreateIndex
CREATE INDEX "EstornoTransferenciaFinanceira_empresaId_dataCaixa_idx" ON "EstornoTransferenciaFinanceira"("empresaId", "dataCaixa");

-- CreateIndex
CREATE INDEX "EstornoTransferenciaFinanceira_empresaId_autorVinculoId_idx" ON "EstornoTransferenciaFinanceira"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoTransferenciaFinanceira_empresaId_id_key" ON "EstornoTransferenciaFinanceira"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoTransferenciaFinanceira_empresaId_transferenciaId_key" ON "EstornoTransferenciaFinanceira"("empresaId", "transferenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "EstornoTransferenciaFinanceira_empresaId_chaveIdempotencia_key" ON "EstornoTransferenciaFinanceira"("empresaId", "chaveIdempotencia");

-- CreateIndex
CREATE INDEX "AnexoSubmissaoEntregavel_empresaId_projetoId_versaoDocument_idx" ON "AnexoSubmissaoEntregavel"("empresaId", "projetoId", "versaoDocumentoId");

-- CreateIndex
CREATE INDEX "PoliticaAprovacao_empresaId_tipo_moeda_publicadoEm_encerrad_idx" ON "PoliticaAprovacao"("empresaId", "tipo", "moeda", "publicadoEm", "encerradoEm");

-- CreateIndex
CREATE INDEX "PoliticaAprovacao_empresaId_autorVinculoId_idx" ON "PoliticaAprovacao"("empresaId", "autorVinculoId");

-- CreateIndex
CREATE INDEX "PoliticaAprovacao_empresaId_publicadoPorVinculoId_idx" ON "PoliticaAprovacao"("empresaId", "publicadoPorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "PoliticaAprovacao_empresaId_id_key" ON "PoliticaAprovacao"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PoliticaAprovacao_empresaId_tipo_numero_key" ON "PoliticaAprovacao"("empresaId", "tipo", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "PoliticaAprovacao_empresaId_tipo_id_key" ON "PoliticaAprovacao"("empresaId", "tipo", "id");

-- CreateIndex
CREATE INDEX "PerfilAprovadorPolitica_empresaId_perfilId_idx" ON "PerfilAprovadorPolitica"("empresaId", "perfilId");

-- CreateIndex
CREATE INDEX "SolicitacaoAprovacao_empresaId_status_criadoEm_idx" ON "SolicitacaoAprovacao"("empresaId", "status", "criadoEm");

-- CreateIndex
CREATE INDEX "SolicitacaoAprovacao_empresaId_tipo_entidadeId_idx" ON "SolicitacaoAprovacao"("empresaId", "tipo", "entidadeId");

-- CreateIndex
CREATE INDEX "SolicitacaoAprovacao_empresaId_projetoId_status_idx" ON "SolicitacaoAprovacao"("empresaId", "projetoId", "status");

-- CreateIndex
CREATE INDEX "SolicitacaoAprovacao_empresaId_tipo_politicaId_idx" ON "SolicitacaoAprovacao"("empresaId", "tipo", "politicaId");

-- CreateIndex
CREATE INDEX "SolicitacaoAprovacao_empresaId_solicitanteVinculoId_idx" ON "SolicitacaoAprovacao"("empresaId", "solicitanteVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitacaoAprovacao_empresaId_id_key" ON "SolicitacaoAprovacao"("empresaId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitacaoAprovacao_empresaId_chaveIdempotencia_key" ON "SolicitacaoAprovacao"("empresaId", "chaveIdempotencia");

-- CreateIndex
CREATE INDEX "ParecerAprovacao_empresaId_avaliadorVinculoId_avaliadoEm_idx" ON "ParecerAprovacao"("empresaId", "avaliadorVinculoId", "avaliadoEm");

-- CreateIndex
CREATE INDEX "ParecerAprovacao_empresaId_perfilId_idx" ON "ParecerAprovacao"("empresaId", "perfilId");

-- CreateIndex
CREATE UNIQUE INDEX "ParecerAprovacao_empresaId_solicitacaoId_avaliadorVinculoId_key" ON "ParecerAprovacao"("empresaId", "solicitacaoId", "avaliadorVinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "ParecerAprovacao_empresaId_id_key" ON "ParecerAprovacao"("empresaId", "id");

-- AddForeignKey
ALTER TABLE "VinculoEmpresa" ADD CONSTRAINT "VinculoEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "VinculoEmpresa" ADD CONSTRAINT "VinculoEmpresa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_empresaId_vinculoId_fkey" FOREIGN KEY ("empresaId", "vinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DependenciaModulo" ADD CONSTRAINT "DependenciaModulo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DependenciaModulo" ADD CONSTRAINT "DependenciaModulo_requeridoId_fkey" FOREIGN KEY ("requeridoId") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EmpresaModulo" ADD CONSTRAINT "EmpresaModulo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EmpresaModulo" ADD CONSTRAINT "EmpresaModulo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Permissao" ADD CONSTRAINT "Permissao_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PerfilPermissao" ADD CONSTRAINT "PerfilPermissao_empresaId_perfilId_fkey" FOREIGN KEY ("empresaId", "perfilId") REFERENCES "Perfil"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PerfilPermissao" ADD CONSTRAINT "PerfilPermissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "Permissao"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AtribuicaoPerfil" ADD CONSTRAINT "AtribuicaoPerfil_empresaId_vinculoId_fkey" FOREIGN KEY ("empresaId", "vinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AtribuicaoPerfil" ADD CONSTRAINT "AtribuicaoPerfil_empresaId_perfilId_fkey" FOREIGN KEY ("empresaId", "perfilId") REFERENCES "Perfil"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EventoAuditoria" ADD CONSTRAINT "EventoAuditoria_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EventoAuditoria" ADD CONSTRAINT "EventoAuditoria_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_empresaId_clienteId_fkey" FOREIGN KEY ("empresaId", "clienteId") REFERENCES "Cliente"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_empresaId_clienteId_fkey" FOREIGN KEY ("empresaId", "clienteId") REFERENCES "Cliente"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_empresaId_clienteId_contratoId_fkey" FOREIGN KEY ("empresaId", "clienteId", "contratoId") REFERENCES "Contrato"("empresaId", "clienteId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ParticipacaoProjeto" ADD CONSTRAINT "ParticipacaoProjeto_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ParticipacaoProjeto" ADD CONSTRAINT "ParticipacaoProjeto_empresaId_vinculoId_fkey" FOREIGN KEY ("empresaId", "vinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Fase" ADD CONSTRAINT "Fase_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Entregavel" ADD CONSTRAINT "Entregavel_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Entregavel" ADD CONSTRAINT "Entregavel_empresaId_projetoId_faseId_fkey" FOREIGN KEY ("empresaId", "projetoId", "faseId") REFERENCES "Fase"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Entregavel" ADD CONSTRAINT "Entregavel_empresaId_responsavelVinculoId_fkey" FOREIGN KEY ("empresaId", "responsavelVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CriterioAceite" ADD CONSTRAINT "CriterioAceite_empresaId_entregavelId_fkey" FOREIGN KEY ("empresaId", "entregavelId") REFERENCES "Entregavel"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubmissaoEntregavel" ADD CONSTRAINT "SubmissaoEntregavel_empresaId_projetoId_entregavelId_fkey" FOREIGN KEY ("empresaId", "projetoId", "entregavelId") REFERENCES "Entregavel"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SubmissaoEntregavel" ADD CONSTRAINT "SubmissaoEntregavel_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoEntregavel" ADD CONSTRAINT "AvaliacaoEntregavel_empresaId_submissaoId_fkey" FOREIGN KEY ("empresaId", "submissaoId") REFERENCES "SubmissaoEntregavel"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoEntregavel" ADD CONSTRAINT "AvaliacaoEntregavel_empresaId_avaliadorVinculoId_fkey" FOREIGN KEY ("empresaId", "avaliadorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoEntregavel" ADD CONSTRAINT "AvaliacaoEntregavel_empresaId_parecerId_fkey" FOREIGN KEY ("empresaId", "parecerId") REFERENCES "ParecerAprovacao"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_empresaId_projetoId_faseId_fkey" FOREIGN KEY ("empresaId", "projetoId", "faseId") REFERENCES "Fase"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_empresaId_projetoId_entregavelId_fkey" FOREIGN KEY ("empresaId", "projetoId", "entregavelId") REFERENCES "Entregavel"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ResponsavelTarefa" ADD CONSTRAINT "ResponsavelTarefa_empresaId_projetoId_tarefaId_fkey" FOREIGN KEY ("empresaId", "projetoId", "tarefaId") REFERENCES "Tarefa"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ResponsavelTarefa" ADD CONSTRAINT "ResponsavelTarefa_empresaId_projetoId_vinculoId_fkey" FOREIGN KEY ("empresaId", "projetoId", "vinculoId") REFERENCES "ParticipacaoProjeto"("empresaId", "projetoId", "vinculoId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DependenciaTarefa" ADD CONSTRAINT "DependenciaTarefa_empresaId_projetoId_predecessoraId_fkey" FOREIGN KEY ("empresaId", "projetoId", "predecessoraId") REFERENCES "Tarefa"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DependenciaTarefa" ADD CONSTRAINT "DependenciaTarefa_empresaId_projetoId_sucessoraId_fkey" FOREIGN KEY ("empresaId", "projetoId", "sucessoraId") REFERENCES "Tarefa"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "VersaoDocumento" ADD CONSTRAINT "VersaoDocumento_empresaId_projetoId_documentoId_fkey" FOREIGN KEY ("empresaId", "projetoId", "documentoId") REFERENCES "Documento"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "VersaoDocumento" ADD CONSTRAINT "VersaoDocumento_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Reuniao" ADD CONSTRAINT "Reuniao_empresaId_registradorVinculoId_fkey" FOREIGN KEY ("empresaId", "registradorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ParticipanteReuniao" ADD CONSTRAINT "ParticipanteReuniao_empresaId_projetoId_reuniaoId_fkey" FOREIGN KEY ("empresaId", "projetoId", "reuniaoId") REFERENCES "Reuniao"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ParticipanteReuniao" ADD CONSTRAINT "ParticipanteReuniao_empresaId_vinculoId_fkey" FOREIGN KEY ("empresaId", "vinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "VersaoAta" ADD CONSTRAINT "VersaoAta_empresaId_projetoId_reuniaoId_fkey" FOREIGN KEY ("empresaId", "projetoId", "reuniaoId") REFERENCES "Reuniao"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "VersaoAta" ADD CONSTRAINT "VersaoAta_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoAta" ADD CONSTRAINT "AvaliacaoAta_empresaId_projetoId_versaoAtaId_fkey" FOREIGN KEY ("empresaId", "projetoId", "versaoAtaId") REFERENCES "VersaoAta"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoAta" ADD CONSTRAINT "AvaliacaoAta_empresaId_avaliadorVinculoId_fkey" FOREIGN KEY ("empresaId", "avaliadorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoAta" ADD CONSTRAINT "AvaliacaoAta_empresaId_parecerId_fkey" FOREIGN KEY ("empresaId", "parecerId") REFERENCES "ParecerAprovacao"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AnexoAta" ADD CONSTRAINT "AnexoAta_empresaId_projetoId_versaoAtaId_fkey" FOREIGN KEY ("empresaId", "projetoId", "versaoAtaId") REFERENCES "VersaoAta"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AnexoAta" ADD CONSTRAINT "AnexoAta_empresaId_projetoId_versaoDocumentoId_fkey" FOREIGN KEY ("empresaId", "projetoId", "versaoDocumentoId") REFERENCES "VersaoDocumento"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DecisaoReuniao" ADD CONSTRAINT "DecisaoReuniao_empresaId_projetoId_versaoAtaId_fkey" FOREIGN KEY ("empresaId", "projetoId", "versaoAtaId") REFERENCES "VersaoAta"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "DecisaoReuniao" ADD CONSTRAINT "DecisaoReuniao_empresaId_projetoId_entregavelId_fkey" FOREIGN KEY ("empresaId", "projetoId", "entregavelId") REFERENCES "Entregavel"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EncaminhamentoReuniao" ADD CONSTRAINT "EncaminhamentoReuniao_empresaId_projetoId_versaoAtaId_fkey" FOREIGN KEY ("empresaId", "projetoId", "versaoAtaId") REFERENCES "VersaoAta"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EncaminhamentoReuniao" ADD CONSTRAINT "EncaminhamentoReuniao_empresaId_projetoId_versaoAtaId_deci_fkey" FOREIGN KEY ("empresaId", "projetoId", "versaoAtaId", "decisaoId") REFERENCES "DecisaoReuniao"("empresaId", "projetoId", "versaoAtaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EncaminhamentoReuniao" ADD CONSTRAINT "EncaminhamentoReuniao_empresaId_projetoId_responsavelVincu_fkey" FOREIGN KEY ("empresaId", "projetoId", "responsavelVinculoId") REFERENCES "ParticipacaoProjeto"("empresaId", "projetoId", "vinculoId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TarefaEncaminhamento" ADD CONSTRAINT "TarefaEncaminhamento_empresaId_projetoId_encaminhamentoId_fkey" FOREIGN KEY ("empresaId", "projetoId", "encaminhamentoId") REFERENCES "EncaminhamentoReuniao"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TarefaEncaminhamento" ADD CONSTRAINT "TarefaEncaminhamento_empresaId_projetoId_tarefaId_fkey" FOREIGN KEY ("empresaId", "projetoId", "tarefaId") REFERENCES "Tarefa"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_empresaId_vinculoPessoaId_fkey" FOREIGN KEY ("empresaId", "vinculoPessoaId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CustoRecurso" ADD CONSTRAINT "CustoRecurso_empresaId_recursoId_fkey" FOREIGN KEY ("empresaId", "recursoId") REFERENCES "Recurso"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "IndisponibilidadeRecurso" ADD CONSTRAINT "IndisponibilidadeRecurso_empresaId_recursoId_fkey" FOREIGN KEY ("empresaId", "recursoId") REFERENCES "Recurso"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AlocacaoRecurso" ADD CONSTRAINT "AlocacaoRecurso_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AlocacaoRecurso" ADD CONSTRAINT "AlocacaoRecurso_empresaId_projetoId_tarefaId_fkey" FOREIGN KEY ("empresaId", "projetoId", "tarefaId") REFERENCES "Tarefa"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AlocacaoRecurso" ADD CONSTRAINT "AlocacaoRecurso_empresaId_recursoId_fkey" FOREIGN KEY ("empresaId", "recursoId") REFERENCES "Recurso"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AlocacaoRecurso" ADD CONSTRAINT "AlocacaoRecurso_empresaId_recursoId_custoRecursoId_fkey" FOREIGN KEY ("empresaId", "recursoId", "custoRecursoId") REFERENCES "CustoRecurso"("empresaId", "recursoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PeriodoHoras" ADD CONSTRAINT "PeriodoHoras_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PeriodoHoras" ADD CONSTRAINT "PeriodoHoras_empresaId_fechadoPorVinculoId_fkey" FOREIGN KEY ("empresaId", "fechadoPorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_empresaId_projetoId_tarefaId_fkey" FOREIGN KEY ("empresaId", "projetoId", "tarefaId") REFERENCES "Tarefa"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_empresaId_recursoId_fkey" FOREIGN KEY ("empresaId", "recursoId") REFERENCES "Recurso"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_empresaId_periodoId_fkey" FOREIGN KEY ("empresaId", "periodoId") REFERENCES "PeriodoHoras"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ApontamentoHoras" ADD CONSTRAINT "ApontamentoHoras_empresaId_recursoId_custoRecursoId_fkey" FOREIGN KEY ("empresaId", "recursoId", "custoRecursoId") REFERENCES "CustoRecurso"("empresaId", "recursoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoHoras" ADD CONSTRAINT "AvaliacaoHoras_empresaId_apontamentoId_fkey" FOREIGN KEY ("empresaId", "apontamentoId") REFERENCES "ApontamentoHoras"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoHoras" ADD CONSTRAINT "AvaliacaoHoras_empresaId_avaliadorVinculoId_fkey" FOREIGN KEY ("empresaId", "avaliadorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoHoras" ADD CONSTRAINT "AvaliacaoHoras_empresaId_parecerId_fkey" FOREIGN KEY ("empresaId", "parecerId") REFERENCES "ParecerAprovacao"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AjusteHoras" ADD CONSTRAINT "AjusteHoras_empresaId_apontamentoId_fkey" FOREIGN KEY ("empresaId", "apontamentoId") REFERENCES "ApontamentoHoras"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AjusteHoras" ADD CONSTRAINT "AjusteHoras_empresaId_periodoAplicacaoId_fkey" FOREIGN KEY ("empresaId", "periodoAplicacaoId") REFERENCES "PeriodoHoras"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AjusteHoras" ADD CONSTRAINT "AjusteHoras_empresaId_solicitanteVinculoId_fkey" FOREIGN KEY ("empresaId", "solicitanteVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AjusteHoras" ADD CONSTRAINT "AjusteHoras_empresaId_ajusteAnteriorId_fkey" FOREIGN KEY ("empresaId", "ajusteAnteriorId") REFERENCES "AjusteHoras"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoAjusteHoras" ADD CONSTRAINT "AvaliacaoAjusteHoras_empresaId_ajusteId_fkey" FOREIGN KEY ("empresaId", "ajusteId") REFERENCES "AjusteHoras"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoAjusteHoras" ADD CONSTRAINT "AvaliacaoAjusteHoras_empresaId_avaliadorVinculoId_fkey" FOREIGN KEY ("empresaId", "avaliadorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AvaliacaoAjusteHoras" ADD CONSTRAINT "AvaliacaoAjusteHoras_empresaId_parecerId_fkey" FOREIGN KEY ("empresaId", "parecerId") REFERENCES "ParecerAprovacao"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CategoriaFinanceira" ADD CONSTRAINT "CategoriaFinanceira_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CentroCusto" ADD CONSTRAINT "CentroCusto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "OrcamentoProjeto" ADD CONSTRAINT "OrcamentoProjeto_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "OrcamentoProjeto" ADD CONSTRAINT "OrcamentoProjeto_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "OrcamentoProjeto" ADD CONSTRAINT "OrcamentoProjeto_empresaId_aprovadoPorVinculoId_fkey" FOREIGN KEY ("empresaId", "aprovadoPorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ItemOrcamentoProjeto" ADD CONSTRAINT "ItemOrcamentoProjeto_empresaId_projetoId_orcamentoId_fkey" FOREIGN KEY ("empresaId", "projetoId", "orcamentoId") REFERENCES "OrcamentoProjeto"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ItemOrcamentoProjeto" ADD CONSTRAINT "ItemOrcamentoProjeto_empresaId_categoriaId_fkey" FOREIGN KEY ("empresaId", "categoriaId") REFERENCES "CategoriaFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ItemOrcamentoProjeto" ADD CONSTRAINT "ItemOrcamentoProjeto_empresaId_centroCustoId_fkey" FOREIGN KEY ("empresaId", "centroCustoId") REFERENCES "CentroCusto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ItemOrcamentoProjeto" ADD CONSTRAINT "ItemOrcamentoProjeto_empresaId_recursoId_fkey" FOREIGN KEY ("empresaId", "recursoId") REFERENCES "Recurso"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TituloFinanceiro" ADD CONSTRAINT "TituloFinanceiro_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TituloFinanceiro" ADD CONSTRAINT "TituloFinanceiro_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TituloFinanceiro" ADD CONSTRAINT "TituloFinanceiro_empresaId_clienteId_fkey" FOREIGN KEY ("empresaId", "clienteId") REFERENCES "Cliente"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TituloFinanceiro" ADD CONSTRAINT "TituloFinanceiro_empresaId_fornecedorId_fkey" FOREIGN KEY ("empresaId", "fornecedorId") REFERENCES "Fornecedor"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TituloFinanceiro" ADD CONSTRAINT "TituloFinanceiro_empresaId_categoriaId_fkey" FOREIGN KEY ("empresaId", "categoriaId") REFERENCES "CategoriaFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TituloFinanceiro" ADD CONSTRAINT "TituloFinanceiro_empresaId_centroCustoId_fkey" FOREIGN KEY ("empresaId", "centroCustoId") REFERENCES "CentroCusto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TituloFinanceiro" ADD CONSTRAINT "TituloFinanceiro_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ParcelaFinanceira" ADD CONSTRAINT "ParcelaFinanceira_empresaId_tituloId_fkey" FOREIGN KEY ("empresaId", "tituloId") REFERENCES "TituloFinanceiro"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ContaFinanceira" ADD CONSTRAINT "ContaFinanceira_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LiquidacaoFinanceira" ADD CONSTRAINT "LiquidacaoFinanceira_empresaId_parcelaId_fkey" FOREIGN KEY ("empresaId", "parcelaId") REFERENCES "ParcelaFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LiquidacaoFinanceira" ADD CONSTRAINT "LiquidacaoFinanceira_empresaId_contaId_fkey" FOREIGN KEY ("empresaId", "contaId") REFERENCES "ContaFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LiquidacaoFinanceira" ADD CONSTRAINT "LiquidacaoFinanceira_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EstornoLiquidacaoFinanceira" ADD CONSTRAINT "EstornoLiquidacaoFinanceira_empresaId_liquidacaoId_fkey" FOREIGN KEY ("empresaId", "liquidacaoId") REFERENCES "LiquidacaoFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EstornoLiquidacaoFinanceira" ADD CONSTRAINT "EstornoLiquidacaoFinanceira_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AberturaSaldoConta" ADD CONSTRAINT "AberturaSaldoConta_empresaId_contaId_fkey" FOREIGN KEY ("empresaId", "contaId") REFERENCES "ContaFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AberturaSaldoConta" ADD CONSTRAINT "AberturaSaldoConta_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EstornoAberturaSaldo" ADD CONSTRAINT "EstornoAberturaSaldo_empresaId_aberturaId_fkey" FOREIGN KEY ("empresaId", "aberturaId") REFERENCES "AberturaSaldoConta"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EstornoAberturaSaldo" ADD CONSTRAINT "EstornoAberturaSaldo_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TransferenciaFinanceira" ADD CONSTRAINT "TransferenciaFinanceira_empresaId_contaOrigemId_fkey" FOREIGN KEY ("empresaId", "contaOrigemId") REFERENCES "ContaFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TransferenciaFinanceira" ADD CONSTRAINT "TransferenciaFinanceira_empresaId_contaDestinoId_fkey" FOREIGN KEY ("empresaId", "contaDestinoId") REFERENCES "ContaFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "TransferenciaFinanceira" ADD CONSTRAINT "TransferenciaFinanceira_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EstornoTransferenciaFinanceira" ADD CONSTRAINT "EstornoTransferenciaFinanceira_empresaId_transferenciaId_fkey" FOREIGN KEY ("empresaId", "transferenciaId") REFERENCES "TransferenciaFinanceira"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EstornoTransferenciaFinanceira" ADD CONSTRAINT "EstornoTransferenciaFinanceira_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AnexoSubmissaoEntregavel" ADD CONSTRAINT "AnexoSubmissaoEntregavel_empresaId_projetoId_submissaoId_fkey" FOREIGN KEY ("empresaId", "projetoId", "submissaoId") REFERENCES "SubmissaoEntregavel"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "AnexoSubmissaoEntregavel" ADD CONSTRAINT "AnexoSubmissaoEntregavel_empresaId_projetoId_versaoDocumen_fkey" FOREIGN KEY ("empresaId", "projetoId", "versaoDocumentoId") REFERENCES "VersaoDocumento"("empresaId", "projetoId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PoliticaAprovacao" ADD CONSTRAINT "PoliticaAprovacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PoliticaAprovacao" ADD CONSTRAINT "PoliticaAprovacao_empresaId_autorVinculoId_fkey" FOREIGN KEY ("empresaId", "autorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PoliticaAprovacao" ADD CONSTRAINT "PoliticaAprovacao_empresaId_publicadoPorVinculoId_fkey" FOREIGN KEY ("empresaId", "publicadoPorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PerfilAprovadorPolitica" ADD CONSTRAINT "PerfilAprovadorPolitica_empresaId_politicaId_fkey" FOREIGN KEY ("empresaId", "politicaId") REFERENCES "PoliticaAprovacao"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PerfilAprovadorPolitica" ADD CONSTRAINT "PerfilAprovadorPolitica_empresaId_perfilId_fkey" FOREIGN KEY ("empresaId", "perfilId") REFERENCES "Perfil"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolicitacaoAprovacao" ADD CONSTRAINT "SolicitacaoAprovacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolicitacaoAprovacao" ADD CONSTRAINT "SolicitacaoAprovacao_empresaId_projetoId_fkey" FOREIGN KEY ("empresaId", "projetoId") REFERENCES "Projeto"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolicitacaoAprovacao" ADD CONSTRAINT "SolicitacaoAprovacao_empresaId_tipo_politicaId_fkey" FOREIGN KEY ("empresaId", "tipo", "politicaId") REFERENCES "PoliticaAprovacao"("empresaId", "tipo", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "SolicitacaoAprovacao" ADD CONSTRAINT "SolicitacaoAprovacao_empresaId_solicitanteVinculoId_fkey" FOREIGN KEY ("empresaId", "solicitanteVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ParecerAprovacao" ADD CONSTRAINT "ParecerAprovacao_empresaId_solicitacaoId_fkey" FOREIGN KEY ("empresaId", "solicitacaoId") REFERENCES "SolicitacaoAprovacao"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ParecerAprovacao" ADD CONSTRAINT "ParecerAprovacao_empresaId_avaliadorVinculoId_fkey" FOREIGN KEY ("empresaId", "avaliadorVinculoId") REFERENCES "VinculoEmpresa"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ParecerAprovacao" ADD CONSTRAINT "ParecerAprovacao_empresaId_perfilId_fkey" FOREIGN KEY ("empresaId", "perfilId") REFERENCES "Perfil"("empresaId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- COMPLEMENTO STR 01: VALORES, DATAS E CONSISTENCIA

-- Versões de concorrência e números editoriais devem ser positivos.
DO $$
DECLARE
    coluna RECORD;
BEGIN
    FOR coluna IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type = 'integer'
          AND column_name IN (
              'versao', 'numero', 'versaoSessao',
              'versaoSessaoNaEmissao', 'versaoEntregavel',
              'versaoConteudoAvaliada', 'versaoApontamento',
              'versaoAjuste', 'versaoObjeto',
              'versaoAnterior', 'versaoPosterior'
          )
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%I > 0)',
            coluna.table_name,
            coluna.table_name || '_' || coluna.column_name || '_positivo',
            coluna.column_name
        );
    END LOOP;
END
$$;

ALTER TABLE "Sessao"
  ADD CONSTRAINT "Sessao_expiracao_valida"
  CHECK ("expiraEm" > "criadoEm");

ALTER TABLE "DependenciaModulo"
  ADD CONSTRAINT "DependenciaModulo_sem_autodependencia"
  CHECK ("moduloId" <> "requeridoId");

ALTER TABLE "Projeto"
  ADD CONSTRAINT "Projeto_contrato_exige_cliente"
  CHECK ("contratoId" IS NULL OR "clienteId" IS NOT NULL),
  ADD CONSTRAINT "Projeto_datas_previstas_validas"
  CHECK ("fimPrevisto" >= "inicioPrevisto");

ALTER TABLE "Contrato"
  ADD CONSTRAINT "Contrato_valor_nao_negativo"
  CHECK ("valorContratadoCentavos" >= 0),
  ADD CONSTRAINT "Contrato_vigencia_valida"
  CHECK ("fimVigencia" >= "inicioVigencia");

ALTER TABLE "Fase"
  ADD CONSTRAINT "Fase_datas_previstas_validas"
  CHECK ("fimPrevisto" >= "inicioPrevisto");

ALTER TABLE "Tarefa"
  ADD CONSTRAINT "Tarefa_progresso_valido"
  CHECK ("progressoPercentual" BETWEEN 0 AND 100),
  ADD CONSTRAINT "Tarefa_esforco_nao_negativo"
  CHECK ("esforcoEstimadoMinutos" >= 0),
  ADD CONSTRAINT "Tarefa_datas_previstas_validas"
  CHECK ("fimPrevisto" >= "inicioPrevisto");

ALTER TABLE "DependenciaTarefa"
  ADD CONSTRAINT "DependenciaTarefa_sem_autodependencia"
  CHECK ("predecessoraId" <> "sucessoraId");

ALTER TABLE "Reuniao"
  ADD CONSTRAINT "Reuniao_datas_previstas_validas"
  CHECK ("fimPrevisto" >= "inicioPrevisto"),
  ADD CONSTRAINT "Reuniao_datas_reais_validas"
  CHECK ("fimReal" >= "inicioReal");

ALTER TABLE "Recurso"
  ADD CONSTRAINT "Recurso_vinculo_exclusivo_pessoa"
  CHECK ("vinculoPessoaId" IS NULL OR "tipo" = 'PESSOA'),
  ADD CONSTRAINT "Recurso_capacidade_positiva"
  CHECK ("capacidadeSimultanea" > 0),
  ADD CONSTRAINT "Recurso_capacidade_unidade_pareadas"
  CHECK (
    ("capacidadeSimultanea" IS NULL) =
    ("unidadeCapacidade" IS NULL)
  );

ALTER TABLE "CustoRecurso"
  ADD CONSTRAINT "CustoRecurso_valor_nao_negativo"
  CHECK ("custoUnitarioCentavos" >= 0),
  ADD CONSTRAINT "CustoRecurso_vigencia_valida"
  CHECK ("fimVigencia" > "inicioVigencia");

ALTER TABLE "IndisponibilidadeRecurso"
  ADD CONSTRAINT "IndisponibilidadeRecurso_intervalo_valido"
  CHECK ("fim" > "inicio");

ALTER TABLE "AlocacaoRecurso"
  ADD CONSTRAINT "AlocacaoRecurso_intervalo_valido"
  CHECK ("fim" > "inicio"),
  ADD CONSTRAINT "AlocacaoRecurso_quantidade_positiva"
  CHECK ("quantidadeReservada" > 0),
  ADD CONSTRAINT "AlocacaoRecurso_custo_previsto_nao_negativo"
  CHECK (
    "quantidadeCustoPrevista" >= 0 AND
    "custoUnitarioCentavosSnapshot" >= 0
  );

ALTER TABLE "PeriodoHoras"
  ADD CONSTRAINT "PeriodoHoras_intervalo_valido"
  CHECK ("fim" >= "inicio"),
  ADD CONSTRAINT "PeriodoHoras_fechamento_identificado"
  CHECK (
    "status" <> 'FECHADO' OR
    ("fechadoEm" IS NOT NULL AND "fechadoPorVinculoId" IS NOT NULL)
  );

ALTER TABLE "ApontamentoHoras"
  ADD CONSTRAINT "ApontamentoHoras_minutos_positivos"
  CHECK ("minutos" > 0),
  ADD CONSTRAINT "ApontamentoHoras_intervalo_pareado"
  CHECK (("inicioTrabalho" IS NULL) = ("fimTrabalho" IS NULL)),
  ADD CONSTRAINT "ApontamentoHoras_intervalo_valido"
  CHECK ("fimTrabalho" > "inicioTrabalho"),
  ADD CONSTRAINT "ApontamentoHoras_cronometro_exige_intervalo"
  CHECK ("origem" <> 'CRONOMETRO' OR "inicioTrabalho" IS NOT NULL),
  ADD CONSTRAINT "ApontamentoHoras_custo_nao_negativo"
  CHECK ("custoHoraCentavosSnapshot" >= 0),
  ADD CONSTRAINT "ApontamentoHoras_custo_moeda_pareados"
  CHECK (
    ("custoHoraCentavosSnapshot" IS NULL) =
    ("moedaCustoSnapshot" IS NULL)
  );

ALTER TABLE "AjusteHoras"
  ADD CONSTRAINT "AjusteHoras_sem_autocompensacao"
  CHECK ("ajusteAnteriorId" IS NULL OR "ajusteAnteriorId" <> "id"),
  ADD CONSTRAINT "AjusteHoras_delta_significativo"
  CHECK (
    "minutosDelta" <> 0 OR
    COALESCE("custoDeltaCentavos", 0) <> 0
  ),
  ADD CONSTRAINT "AjusteHoras_custo_moeda_pareados"
  CHECK (("custoDeltaCentavos" IS NULL) = ("moedaCusto" IS NULL)),
  ADD CONSTRAINT "AjusteHoras_aplicacao_exige_aprovacao"
  CHECK (
    "aplicadoEm" IS NULL OR
    ("status" = 'APROVADO' AND "aprovadoEm" IS NOT NULL)
  );

ALTER TABLE "ItemOrcamentoProjeto"
  ADD CONSTRAINT "ItemOrcamentoProjeto_valor_nao_negativo"
  CHECK ("valorPrevistoCentavos" >= 0),
  ADD CONSTRAINT "ItemOrcamentoProjeto_quantidade_positiva"
  CHECK ("quantidadePrevista" > 0),
  ADD CONSTRAINT "ItemOrcamentoProjeto_quantidade_unidade_pareadas"
  CHECK (("quantidadePrevista" IS NULL) = ("unidadeQuantidade" IS NULL));

ALTER TABLE "TituloFinanceiro"
  ADD CONSTRAINT "TituloFinanceiro_principal_positivo"
  CHECK ("valorPrincipalCentavos" > 0),
  ADD CONSTRAINT "TituloFinanceiro_contraparte_exclusiva"
  CHECK ("clienteId" IS NULL OR "fornecedorId" IS NULL);

ALTER TABLE "ParcelaFinanceira"
  ADD CONSTRAINT "ParcelaFinanceira_principal_positivo"
  CHECK ("valorPrincipalCentavos" > 0);

ALTER TABLE "LiquidacaoFinanceira"
  ADD CONSTRAINT "LiquidacaoFinanceira_valores_validos"
  CHECK (
    "principalCentavos" > 0 AND
    "jurosCentavos" >= 0 AND
    "multaCentavos" >= 0 AND
    "descontoCentavos" >= 0 AND
    "valorMovimentadoCentavos" >= 0
  ),
  ADD CONSTRAINT "LiquidacaoFinanceira_formula_valida"
  CHECK (
    "valorMovimentadoCentavos"::numeric =
    "principalCentavos"::numeric +
    "jurosCentavos"::numeric +
    "multaCentavos"::numeric -
    "descontoCentavos"::numeric
  );

ALTER TABLE "TransferenciaFinanceira"
  ADD CONSTRAINT "TransferenciaFinanceira_contas_distintas"
  CHECK ("contaOrigemId" <> "contaDestinoId"),
  ADD CONSTRAINT "TransferenciaFinanceira_valor_positivo"
  CHECK ("valorCentavos" > 0);

ALTER TABLE "VersaoDocumento"
  ADD CONSTRAINT "VersaoDocumento_tamanho_nao_negativo"
  CHECK ("tamanhoBytes" >= 0),
  ADD CONSTRAINT "VersaoDocumento_sha256_valido"
  CHECK ("sha256" ~ '^[0-9a-fA-F]{64}$'),
  ADD CONSTRAINT "VersaoDocumento_disponivel_exige_metadados"
  CHECK (
    "statusArquivo" <> 'DISPONIVEL' OR
    (
      "tamanhoBytes" IS NOT NULL AND
      "sha256" IS NOT NULL AND
      "tipoMime" IS NOT NULL AND
      "disponibilizadoEm" IS NOT NULL
    )
  );

ALTER TABLE "PoliticaAprovacao"
  ADD CONSTRAINT "PoliticaAprovacao_quorum_positivo"
  CHECK ("minimoAprovadores" > 0),
  ADD CONSTRAINT "PoliticaAprovacao_publicacao_identificada"
  CHECK (("publicadoEm" IS NULL) = ("publicadoPorVinculoId" IS NULL)),
  ADD CONSTRAINT "PoliticaAprovacao_encerramento_valido"
  CHECK (
    "encerradoEm" IS NULL OR
    ("publicadoEm" IS NOT NULL AND "encerradoEm" >= "publicadoEm")
  );

-- NULLS NOT DISTINCT impede duas políticas ativas sem moeda.
CREATE UNIQUE INDEX "PoliticaAprovacao_ativa_por_tipo_moeda"
  ON "PoliticaAprovacao" ("empresaId", "tipo", "moeda")
  NULLS NOT DISTINCT
  WHERE "publicadoEm" IS NOT NULL AND "encerradoEm" IS NULL;

ALTER TABLE "PerfilAprovadorPolitica"
  ADD CONSTRAINT "PerfilAprovadorPolitica_limite_nao_negativo"
  CHECK ("limiteValorCentavos" >= 0);

ALTER TABLE "SolicitacaoAprovacao"
  ADD CONSTRAINT "SolicitacaoAprovacao_hash_valido"
  CHECK ("hashConteudo" ~ '^[0-9a-fA-F]{64}$'),
  ADD CONSTRAINT "SolicitacaoAprovacao_valor_nao_negativo"
  CHECK ("valorReferenciaCentavos" >= 0),
  ADD CONSTRAINT "SolicitacaoAprovacao_valor_moeda_pareados"
  CHECK (("valorReferenciaCentavos" IS NULL) = ("moeda" IS NULL)),
  ADD CONSTRAINT "SolicitacaoAprovacao_expiracao_valida"
  CHECK ("expiraEm" > "criadoEm"),
  ADD CONSTRAINT "SolicitacaoAprovacao_aplicacao_identificada"
  CHECK (
    "aplicadoEm" IS NULL OR
    ("status" = 'APROVADA' AND "entidadeResultadoId" IS NOT NULL)
  );


-- COMPLEMENTO STR 02: PROTECAO DOS REGISTROS HISTORICOS
-- Permite inserção, mas impede UPDATE, DELETE e TRUNCATE.
-- Correções financeiras são novos registros, incluindo estornos.
-- A aplicação deverá registrar a tentativa negada com seu requisicaoId.
-- A função não inclui conteúdo dos registros na mensagem de erro.

CREATE FUNCTION public.mproj_bloquear_mutacao_historica()
RETURNS trigger
LANGUAGE plpgsql
AS $mproj$
BEGIN
    RAISE EXCEPTION USING
        ERRCODE = 'MP001',
        MESSAGE = 'MPROJ_REGISTRO_HISTORICO_IMUTAVEL',
        DETAIL = format(
            'Operacao=%s; tabela=%s',
            TG_OP,
            TG_TABLE_NAME
        );

    RETURN NULL;
END;
$mproj$;

DO $mproj$
DECLARE
    tabela_mproj text;
BEGIN
    FOREACH tabela_mproj IN ARRAY ARRAY[
        'EventoAuditoria',
        'SubmissaoEntregavel',
        'AnexoSubmissaoEntregavel',
        'AvaliacaoEntregavel',
        'AvaliacaoAta',
        'AvaliacaoHoras',
        'AvaliacaoAjusteHoras',
        'ParecerAprovacao',
        'LiquidacaoFinanceira',
        'EstornoLiquidacaoFinanceira',
        'AberturaSaldoConta',
        'EstornoAberturaSaldo',
        'TransferenciaFinanceira',
        'EstornoTransferenciaFinanceira'
    ]
    LOOP
        IF to_regclass(format('public.%I', tabela_mproj)) IS NULL THEN
            RAISE EXCEPTION
                'MPROJ_TABELA_HISTORICA_AUSENTE: %',
                tabela_mproj;
        END IF;

        EXECUTE format(
            'CREATE TRIGGER %I
             BEFORE UPDATE OR DELETE ON public.%I
             FOR EACH ROW
             EXECUTE FUNCTION public.mproj_bloquear_mutacao_historica()',
            'mproj_historico_sem_mutacao',
            tabela_mproj
        );

        EXECUTE format(
            'CREATE TRIGGER %I
             BEFORE TRUNCATE ON public.%I
             FOR EACH STATEMENT
             EXECUTE FUNCTION public.mproj_bloquear_mutacao_historica()',
            'mproj_historico_sem_truncate',
            tabela_mproj
        );
    END LOOP;
END;
$mproj$;

-- Proteção operacional: o usuário da aplicação em produção
-- deverá ser distinto do proprietário responsável pelas migrações.
-- O proprietário pode alterar/remover triggers; esta proteção
-- não substitui a separação de privilégios em produção.


-- COMPLEMENTO STR 03: DOCUMENTOS E POLITICAS PUBLICADAS

-- Uma versão disponibilizada não poderá ser sobrescrita ou apagada.
-- Correções exigem outra versão de documento.
CREATE FUNCTION public.mproj_proteger_documento_disponibilizado()
RETURNS trigger
LANGUAGE plpgsql
AS $mproj$
BEGIN
    IF OLD."statusArquivo" = 'DISPONIVEL'
       OR OLD."disponibilizadoEm" IS NOT NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'MP002',
            MESSAGE = 'MPROJ_VERSAO_DOCUMENTO_IMUTAVEL';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$mproj$;

CREATE TRIGGER mproj_documento_disponibilizado
BEFORE UPDATE OR DELETE ON public."VersaoDocumento"
FOR EACH ROW
EXECUTE FUNCTION public.mproj_proteger_documento_disponibilizado();

CREATE TRIGGER mproj_documento_sem_truncate
BEFORE TRUNCATE ON public."VersaoDocumento"
FOR EACH STATEMENT
EXECUTE FUNCTION public.mproj_bloquear_mutacao_historica();

-- Política publicada permite somente seu primeiro encerramento.
-- Encerramento exige incrementar versao, mantendo todas as regras.
-- Revisões encerradas não poderão ser reabertas ou apagadas.
CREATE FUNCTION public.mproj_proteger_politica_publicada()
RETURNS trigger
LANGUAGE plpgsql
AS $mproj$
BEGIN
    IF OLD."publicadoEm" IS NOT NULL THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION USING
                ERRCODE = 'MP003',
                MESSAGE = 'MPROJ_POLITICA_PUBLICADA_IMUTAVEL';
        END IF;

        IF OLD."encerradoEm" IS NOT NULL
           OR NEW."encerradoEm" IS NULL
           OR NEW."versao" <> OLD."versao" + 1
           OR (
               to_jsonb(NEW) -
               ARRAY['encerradoEm', 'versao', 'atualizadoEm']::text[]
           ) IS DISTINCT FROM (
               to_jsonb(OLD) -
               ARRAY['encerradoEm', 'versao', 'atualizadoEm']::text[]
           ) THEN
            RAISE EXCEPTION USING
                ERRCODE = 'MP003',
                MESSAGE = 'MPROJ_POLITICA_PUBLICADA_IMUTAVEL';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$mproj$;

CREATE TRIGGER mproj_politica_publicada
BEFORE UPDATE OR DELETE ON public."PoliticaAprovacao"
FOR EACH ROW
EXECUTE FUNCTION public.mproj_proteger_politica_publicada();

CREATE TRIGGER mproj_politica_sem_truncate
BEFORE TRUNCATE ON public."PoliticaAprovacao"
FOR EACH STATEMENT
EXECUTE FUNCTION public.mproj_bloquear_mutacao_historica();

-- A alteração dos aprovadores bloqueia a linha da política.
-- Isso coordena a edição dos aprovadores com a publicação concorrente.
-- Depois de publicada, nenhuma inclusão, alteração ou exclusão é permitida.
CREATE FUNCTION public.mproj_proteger_perfis_politica()
RETURNS trigger
LANGUAGE plpgsql
AS $mproj$
DECLARE
    empresa_mproj uuid;
    politica_mproj uuid;
    publicada_mproj timestamptz;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW."empresaId" IS DISTINCT FROM OLD."empresaId"
           OR NEW."politicaId" IS DISTINCT FROM OLD."politicaId"
           OR NEW."perfilId" IS DISTINCT FROM OLD."perfilId" THEN
            RAISE EXCEPTION USING
                ERRCODE = 'MP004',
                MESSAGE = 'MPROJ_IDENTIDADE_APROVADOR_IMUTAVEL';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        empresa_mproj := OLD."empresaId";
        politica_mproj := OLD."politicaId";
    ELSE
        empresa_mproj := NEW."empresaId";
        politica_mproj := NEW."politicaId";
    END IF;

    SELECT p."publicadoEm"
      INTO publicada_mproj
      FROM public."PoliticaAprovacao" p
     WHERE p."empresaId" = empresa_mproj
       AND p."id" = politica_mproj
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = 'MP005',
            MESSAGE = 'MPROJ_POLITICA_APROVACAO_AUSENTE';
    END IF;

    IF publicada_mproj IS NOT NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'MP006',
            MESSAGE = 'MPROJ_APROVADORES_PUBLICADOS_IMUTAVEIS';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$mproj$;

CREATE TRIGGER mproj_perfis_politica_publicada
BEFORE INSERT OR UPDATE OR DELETE ON public."PerfilAprovadorPolitica"
FOR EACH ROW
EXECUTE FUNCTION public.mproj_proteger_perfis_politica();

CREATE TRIGGER mproj_perfis_politica_sem_truncate
BEFORE TRUNCATE ON public."PerfilAprovadorPolitica"
FOR EACH STATEMENT
EXECUTE FUNCTION public.mproj_bloquear_mutacao_historica();
