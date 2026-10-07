"""Varredura de arquivos: contagens, pastas vazias, .env, .bak, git, testes."""
import os
from pathlib import Path
from config import IGNORAR_DIRS, EXT_CODIGO, GITIGNORE_ESPERADO


def _linhas(p: Path) -> int:
    return len(p.read_text(encoding="utf-8", errors="replace").splitlines())


def _gitignore(raiz: Path) -> dict:
    p = raiz / ".gitignore"
    if not p.exists():
        return {"existe": False, "faltando": list(GITIGNORE_ESPERADO)}
    txt = p.read_text(encoding="utf-8", errors="replace")
    return {"existe": True, "faltando": [x for x in GITIGNORE_ESPERADO if x not in txt]}


def varrer(raiz: Path) -> dict:
    r = {"arquivos": 0, "linhas": 0, "por_pasta": {}, "env": [], "bak": 0,
         "vazias": [], "linhas_ts": 0, "git": (raiz / ".git").exists(), "testes": 0, "lista": []}
    for pasta, dirs, nomes in os.walk(raiz):
        dirs[:] = [d for d in dirs if d not in IGNORAR_DIRS]
        rel = Path(pasta).relative_to(raiz)
        if rel.parts[:2] == ("tools", "analisador"):
            continue
        if not dirs and not nomes and len(rel.parts) > 1:
            r["vazias"].append(rel.as_posix())
        for nome in nomes:
            p = Path(pasta) / nome
            if nome.startswith(".env"):
                r["env"].append((rel / nome).as_posix())
            elif ".bak" in nome:
                r["bak"] += 1
            elif p.suffix in EXT_CODIGO or (p.suffix in (".md", ".json")
                                            and nome != "package-lock.json"):
                r["lista"].append((rel / nome).as_posix())
                if p.suffix in EXT_CODIGO:
                    n = _linhas(p)
                    r["arquivos"] += 1
                    r["linhas"] += n
                    if p.suffix not in (".sql", ".prisma"):
                        r["linhas_ts"] += n
                    chave = "/".join(rel.parts[:2]) or "."
                    r["por_pasta"][chave] = r["por_pasta"].get(chave, 0) + n
                    if ".test." in nome or ".spec." in nome or "tests" in rel.parts:
                        r["testes"] += 1
    r["gitignore"] = _gitignore(raiz)
    return r


def modulos(raiz: Path) -> dict:
    res = {}
    for base in ("src/modules", "src/lib"):
        b = raiz / base
        if b.exists():
            for d in sorted(x for x in b.iterdir() if x.is_dir()):
                res[f"{base}/{d.name}"] = sum(1 for f in d.rglob("*") if f.is_file())
    return res