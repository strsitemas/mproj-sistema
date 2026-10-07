import { Resend } from "resend";
import {
  executarComLog,
  logInfo,
  type ContextoLog,
} from "../auditoria/logger";
import { obterOrigemAplicacao } from "./origem";

type EntradaEmailRecuperacao = Readonly<{
  destinatario: string;
  token: string;
  recuperacaoId: string;
}>;

export class ErroEmailRecuperacao extends Error {
  constructor(readonly code: string) {
    super("Não foi possível confirmar o envio da recuperação.");
    this.name = "ErroEmailRecuperacao";
  }
}

function emailValido(valor: string): boolean {
  return valor.length <= 254 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/
      .test(valor);
}

function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (caractere) => {
    const substituicoes: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return substituicoes[caractere];
  });
}

function codigoRecusa(nome: string): string {
  const codigos: Record<string, string> = {
    validation_error: "EMAIL_VALIDACAO_RECUSADA",
    missing_api_key: "EMAIL_CHAVE_AUSENTE",
    invalid_api_key: "EMAIL_CHAVE_INVALIDA",
    restricted_api_key: "EMAIL_CHAVE_RESTRITA",
    application_error: "EMAIL_PROVEDOR_INDISPONIVEL",
    internal_server_error: "EMAIL_PROVEDOR_INDISPONIVEL",
    rate_limit_exceeded: "EMAIL_LIMITE_PROVEDOR",
    daily_quota_exceeded: "EMAIL_COTA_DIARIA",
    monthly_quota_exceeded: "EMAIL_COTA_MENSAL",
    invalid_idempotent_request: "EMAIL_IDEMPOTENCIA_DIVERGENTE",
    concurrent_idempotent_requests: "EMAIL_ENVIO_CONCORRENTE",
  };

  return Object.hasOwn(codigos, nome)
    ? codigos[nome]
    : "EMAIL_ENVIO_RECUSADO";
}

/**
 * Uso interno no servidor, após criar a recuperação no banco.
 * O destinatário deverá vir do cadastro, nunca diretamente da rota.
 * Não registra destinatário, token, link, chave ou resposta bruta.
 * Aceitação pelo Resend não confirma entrega na caixa de entrada.
 * Este serviço não altera o banco nem consome o token.
 */
export async function enviarEmailRecuperacao(
  entrada: EntradaEmailRecuperacao,
  contexto: ContextoLog,
): Promise<string> {
  const ctx: ContextoLog = {
    requisicaoId: contexto.requisicaoId,
    empresaId: contexto.empresaId,
    usuarioId: contexto.usuarioId,
    operacao: "ENVIAR_EMAIL_RECUPERACAO",
    modulo: "autenticacao",
    dependencia: "API_EXTERNA",
  };

  return executarComLog(ctx, async () => {
    if (typeof window !== "undefined") {
      throw new ErroEmailRecuperacao("EMAIL_USO_FORA_SERVIDOR");
    }

    if (
      typeof entrada?.destinatario !== "string" ||
      !emailValido(entrada.destinatario) ||
      typeof entrada?.token !== "string" ||
      !/^[0-9a-f]{64}$/.test(entrada.token) ||
      typeof entrada?.recuperacaoId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        .test(entrada.recuperacaoId)
    ) {
      throw new ErroEmailRecuperacao("EMAIL_ENTRADA_INVALIDA");
    }

    const chave = process.env.RESEND_API_KEY;
    const remetente = process.env.RESEND_FROM?.trim();

    if (!chave || !/^re_[A-Za-z0-9_-]{8,}$/.test(chave)) {
      throw new ErroEmailRecuperacao("EMAIL_CONFIGURACAO_CHAVE");
    }

    if (!remetente || remetente.length > 320) {
      throw new ErroEmailRecuperacao("EMAIL_CONFIGURACAO_REMETENTE");
    }

    // Aceita endereço simples ou o formato MProj <endereço>.
    const enderecoRemetente = remetente.startsWith("MProj <") &&
      remetente.endsWith(">")
      ? remetente.slice(7, -1)
      : remetente;

    if (!emailValido(enderecoRemetente)) {
      throw new ErroEmailRecuperacao("EMAIL_CONFIGURACAO_REMETENTE");
    }

    const link = new URL(
      "/redefinir-senha",
      obterOrigemAplicacao(ctx),
    );

    // O fragmento não é enviado no GET da página.
    // A futura tela lerá o token e enviará ao servidor no corpo do POST.
    link.hash = new URLSearchParams({ token: entrada.token }).toString();

    const endereco = link.toString();
    const enderecoHtml = escaparHtml(endereco);

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <body style="margin:0;padding:24px;background:#f5f7fb;
          color:#182235;font-family:Arial,Helvetica,sans-serif;">
          <main style="max-width:560px;margin:auto;padding:28px;
            background:#ffffff;border:1px solid #dfe5ee;border-radius:12px;">
            <h1 style="font-size:24px;margin:0 0 20px;">MProj</h1>
            <h2 style="font-size:20px;">Recuperação de acesso</h2>
            <p>Recebemos uma solicitação para definir uma nova senha
              da sua conta.</p>
            <p>O link tem validade de 30 minutos a partir da solicitação
              e poderá ser utilizado uma única vez.</p>
            <p style="margin:28px 0;">
              <a href="${enderecoHtml}" style="display:inline-block;
                padding:12px 20px;background:#087f79;color:#ffffff;
                text-decoration:none;border-radius:8px;">
                Definir nova senha
              </a>
            </p>
            <p>Se o botão não abrir, copie este endereço no navegador:</p>
            <p style="overflow-wrap:anywhere;">
              <a href="${enderecoHtml}">${enderecoHtml}</a>
            </p>
            <p>A alteração encerrará suas sessões atuais,
              inclusive em outras empresas vinculadas à conta.</p>
            <p>Se você não solicitou a recuperação, ignore esta mensagem.
              Sua senha não será alterada apenas por receber este e-mail.</p>
            <p style="margin-top:28px;color:#59677c;font-size:12px;">
              MProj · Desenvolvido pela STR Software
            </p>
          </main>
        </body>
      </html>
    `;

    const texto = [
      "MProj - Recuperação de acesso",
      "",
      "Recebemos uma solicitação para definir uma nova senha da sua conta.",
      "O link vale por 30 minutos a partir da solicitação e tem uso único.",
      "",
      endereco,
      "",
      "A alteração encerrará suas sessões atuais em todas as empresas.",
      "Se você não solicitou a recuperação, ignore esta mensagem.",
      "",
      "MProj - Desenvolvido pela STR Software",
    ].join("\n");

    const resend = new Resend(chave);

    let resposta: Awaited<ReturnType<typeof resend.emails.send>>;

    try {
      resposta = await resend.emails.send(
        {
          from: remetente,
          to: [entrada.destinatario],
          subject: "MProj - Recuperação de acesso",
          html,
          text: texto,
        },
        {
          idempotencyKey: `mproj-recuperacao/${entrada.recuperacaoId}`,
        },
      );
    } catch {
      // Não propaga objeto externo que possa conter dados do envio.
      throw new ErroEmailRecuperacao("EMAIL_COMUNICACAO_FALHOU");
    }

    if (resposta.error) {
      throw new ErroEmailRecuperacao(
        codigoRecusa(resposta.error.name),
      );
    }

    const emailId = resposta.data?.id;

    if (
      typeof emailId !== "string" ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(emailId)
    ) {
      throw new ErroEmailRecuperacao("EMAIL_RESPOSTA_INCONSISTENTE");
    }

    logInfo(
      { ...ctx, entidadeId: entrada.recuperacaoId },
      "EMAIL_RECUPERACAO_ACEITO_PELO_PROVEDOR",
    );

    return emailId;
  });
}
