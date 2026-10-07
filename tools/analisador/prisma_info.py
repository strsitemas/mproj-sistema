"""Análise do schema Prisma e das migrações."""
import re
from pathlib import Path


def analisar_prisma(raiz: Path) -> dict:
    info = {"existe": False, "modelos": [], "enums": 0, "linhas": 0,
            "migracoes": 0, "triggers": 0}
    schema = raiz / "prisma" / "schema.prisma"
    if schema.exists():
        txt = schema.read_text(encoding="utf-8-sig", errors="replace")
        info["existe"] = True
        info["modelos"] = re.findall(r"^model\s+(\w+)", txt, re.M)
        info["enums"] = len(re.findall(r"^enum\s+\w+", txt, re.M))
        info["linhas"] = txt.count("\n") + 1
    sqls = list((raiz / "prisma" / "migrations").glob("*/migration.sql"))
    info["migracoes"] = len(sqls)
    for s in sqls:
        t = s.read_text(encoding="utf-8-sig", errors="replace")
        info["triggers"] += len(re.findall(r"create\s+(?:or\s+replace\s+)?trigger", t, re.I))
    return info


def modelos_usados(modelos: list, fontes: dict) -> list:
    """Modelos referenciados no código de src/ (ex.: prisma.usuario.findFirst)."""
    src = "\n".join(t for k, t in fontes.items() if k.startswith("src"))
    usados = []
    for m in modelos:
        delegado = m[0].lower() + m[1:]
        if re.search(r"\.%s\.(find|create|update|delete|upsert|count|aggregate|group)"
                     % delegado, src):
            usados.append(m)
    return usados