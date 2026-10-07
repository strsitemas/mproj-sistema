"""Regras que transformam os resultados em alertas priorizados."""


def gerar(v: dict, mods: dict, pr: dict, pk: dict, auth: list, segredos: list) -> list:
    a = []
    env_reais = [e for e in v["env"] if ".example" not in e]
    if env_reais:
        a.append(("ALTO", f"{len(env_reais)} arquivo(s) .env com possíveis segredos "
                          "dentro da pasta (não envie em zip/chat)"))
    if segredos:
        a.append(("ALTO", f"{len(segredos)} possível(is) segredo(s) escritos no código-fonte"))
    if not v["git"]:
        a.append(("ALTO", "Sem repositório git (nenhum histórico de versões)"))
    if v["testes"] == 0 or pk.get("teste_placeholder"):
        a.append(("ALTO", "Sem testes automatizados reais"))
    if v["gitignore"]["faltando"]:
        a.append(("MÉDIO", "Faltam no .gitignore: " + ", ".join(v["gitignore"]["faltando"])))
    if v["bak"]:
        a.append(("MÉDIO", f"{v['bak']} cópias .bak (use git no lugar)"))
    vazios = [k for k, n in mods.items() if n == 0]
    if vazios:
        a.append(("MÉDIO", f"{len(vazios)} módulo(s) vazio(s): " + ", ".join(vazios[:6])))
    falhas = [n for n, s in auth if s != "OK"]
    if falhas:
        a.append(("MÉDIO", "Checagens de segurança sem indício: " + "; ".join(falhas)))
    if pk.get("existe") and not pk.get("validacao"):
        a.append(("BAIXO", "Sem biblioteca de validação de entrada (zod/valibot/yup)"))
    if pk.get("existe") and not pk.get("tem_lint"):
        a.append(("BAIXO", "Sem script de lint no package.json"))
    return a