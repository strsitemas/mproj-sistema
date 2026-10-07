"""Monta o relatório em Markdown."""
from datetime import datetime


def _tabela(cab: list, linhas: list) -> list:
    out = ["| " + " | ".join(cab) + " |", "|" + "---|" * len(cab)]
    return out + ["| " + " | ".join(str(c) for c in ln) + " |" for ln in linhas]


def montar(raiz, v, mods, pr, pk, auth, alertas, delta=None) -> str:
    L = [f"# Análise do MProj — {datetime.now():%d/%m/%Y %H:%M}", f"Pasta: {raiz}", ""]
    L += ["## Resumo",
          f"- Código: {v['arquivos']} arquivos, {v['linhas_ts']} linhas de TS/JS "
          f"(+ {v['linhas'] - v['linhas_ts']} de SQL/schema)",
          f"- Testes: {v['testes']} arquivo(s)",
          f"- Git: {'sim' if v['git'] else 'NÃO'}",
          f"- Banco: {len(pr['modelos'])} modelos ({len(pr['usados'])} usados no código), "
          f"{pr['enums']} enums, {pr['migracoes']} migrações, {pr['triggers']} triggers", ""]
    L += ["## Alertas"]
    L += [f"- **{n}**: {t}" for n, t in alertas] or ["- Nenhum alerta."]
    L += ["", "## Módulos (arquivos por pasta)"]
    L += _tabela(["Pasta", "Arquivos", "Situação"],
                 [(k, n, "vazio" if n == 0 else "em andamento") for k, n in mods.items()])
    L += ["", "## Linhas de código por pasta"]
    L += _tabela(["Pasta", "Linhas"], sorted(v["por_pasta"].items(), key=lambda x: -x[1]))
    L += ["", "## Segurança (indícios no código)"] + _tabela(["Verificação", "Resultado"], auth)
    nao = [m for m in pr["modelos"] if m not in pr["usados"]]
    L += ["", f"## Modelos sem uso no código ({len(nao)})", ", ".join(nao[:40]) or "-"]
    if delta:
        L += ["", "## Mudanças desde o snapshot anterior",
              f"- Novos: {len(delta['novos'])} | Removidos: {len(delta['removidos'])} "
              f"| Alterados: {len(delta['alterados'])}"]
        L += [f"  - {k}: {x}" for k in ("novos", "alterados", "removidos")
              for x in delta[k][:25]]
    return "\n".join(L) + "\n"