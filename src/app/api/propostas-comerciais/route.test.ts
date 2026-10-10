import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lerSessaoAtual: vi.fn(),
  exigirOrigemPermitida: vi.fn(),
  cadastrarPropostaComercial: vi.fn(),
  logInfo: vi.fn(),
  logAviso: vi.fn(),
  logErro: vi.fn(),
}));

vi.mock("@/lib/auth/cookie", () => ({
  lerSessaoAtual: mocks.lerSessaoAtual,
}));

vi.mock("@/lib/auth/origem", () => ({
  ErroOrigemRequisicao: class ErroOrigemRequisicao extends Error {},
  exigirOrigemPermitida: mocks.exigirOrigemPermitida,
}));

vi.mock("@/lib/auditoria/logger", () => ({
  logInfo: mocks.logInfo,
  logAviso: mocks.logAviso,
  logErro: mocks.logErro,
}));

vi.mock("@/lib/propostas-comerciais/servico", () => ({
  cadastrarPropostaComercial: mocks.cadastrarPropostaComercial,
}));

import { ErroOrigemRequisicao } from "@/lib/auth/origem";
import { POST } from "./route";

const sessao = {
  empresaId: "empresa-teste",
  usuarioId: "usuario-teste",
  vinculoId: "vinculo-teste",
};

const proposta = {
  id: "proposta-teste",
  codigo: "PROP-000001",
};

function requisicao(
  corpo: string = "{}",
  tipo: string = "application/json",
): Request {
  return new Request("http://localhost/api/propostas-comerciais", {
    method: "POST",
    headers: { "content-type": tipo },
    body: corpo,
  });
}

describe("POST /api/propostas-comerciais", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.lerSessaoAtual.mockResolvedValue(sessao);
    mocks.cadastrarPropostaComercial.mockResolvedValue(proposta);
  });

  it("retorna 201 ao cadastrar proposta", async () => {
    const resposta = await POST(requisicao());
    const dados = await resposta.json();

    expect(resposta.status).toBe(201);
    expect(dados.ok).toBe(true);
    expect(dados.proposta).toEqual(proposta);
    expect(dados.requisicaoId).toBeTruthy();
    expect(resposta.headers.get("Cache-Control")).toBe("no-store");
    expect(resposta.headers.get("X-Request-Id")).toBe(dados.requisicaoId);
    expect(mocks.cadastrarPropostaComercial).toHaveBeenCalledOnce();
  });

  it("retorna 401 sem sessao", async () => {
    mocks.lerSessaoAtual.mockResolvedValue(null);

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(401);
    expect(mocks.cadastrarPropostaComercial).not.toHaveBeenCalled();
  });

  it("retorna 403 para origem proibida", async () => {
    mocks.exigirOrigemPermitida.mockImplementation(() => {
      throw new ErroOrigemRequisicao();
    });

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(403);
    expect(mocks.lerSessaoAtual).not.toHaveBeenCalled();
  });

  it("retorna 403 para acesso negado", async () => {
    mocks.cadastrarPropostaComercial.mockRejectedValue(
      new Error("AcessoNegado"),
    );

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(403);
  });

  it("retorna 400 para JSON invalido", async () => {
    const resposta = await POST(requisicao("{"));

    expect(resposta.status).toBe(400);
    expect(mocks.cadastrarPropostaComercial).not.toHaveBeenCalled();
  });

  it.each([
    "DadosPropostaInvalidos",
    "CampoPropostaNaoPermitido",
    "CampoPropostaInvalido:titulo",
    "ClientePropostaInvalido",
    "ItensPropostaInvalidos",
  ])("retorna 400 para %s", async (erro) => {
    mocks.cadastrarPropostaComercial.mockRejectedValue(
      new Error(erro),
    );

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(400);
  });

  it("retorna 404 para cliente inexistente", async () => {
    mocks.cadastrarPropostaComercial.mockRejectedValue(
      new Error("ClientePropostaNaoEncontrado"),
    );

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(404);
  });

  it("retorna 413 para corpo acima do limite", async () => {
    const resposta = await POST(requisicao("x".repeat(65537)));

    expect(resposta.status).toBe(413);
    expect(mocks.cadastrarPropostaComercial).not.toHaveBeenCalled();
  });

  it("retorna 415 para tipo incorreto", async () => {
    const resposta = await POST(
      requisicao("{}", "text/plain"),
    );

    expect(resposta.status).toBe(415);
  });

  it("retorna 503 para falha interna", async () => {
    mocks.cadastrarPropostaComercial.mockRejectedValue(
      new Error("FalhaInterna"),
    );

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(503);
    expect(mocks.logErro).toHaveBeenCalled();
  });

  it("nao classifica erro interno como validacao", async () => {
    mocks.cadastrarPropostaComercial.mockRejectedValue(
      new Error("BancoInvalido"),
    );

    const resposta = await POST(requisicao());

    expect(resposta.status).toBe(503);
  });
});