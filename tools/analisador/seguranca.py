"""Verificações estáticas de segurança (indícios, não prova)."""
import re
from pathlib import Path
from config import CHECKS_AUTH, PADROES_SEGREDO, IGNORAR_DIRS, EXT_CODIGO


def ler_fontes(raiz: Path) -> dict:
    """Retorna {caminho_relativo: texto} de src, prisma e scripts (sem gerados)."""
    out = {}
    for base in ("src", "prisma", "scripts"):
        pasta = raiz / base
        if not pasta.exists():
            continue
        for p in pasta.rglob("*"):
            if p.is_file() and p.suffix in EXT_CODIGO and not (set(p.relative_to(raiz).parts) & IGNORAR_DIRS):
                out[p.relative_to(raiz).as_posix()] = p.read_text(
                    encoding="utf-8", errors="replace")
    return out


def checar_auth(fontes: dict) -> list:
    src = "\n".join(t for k, t in fontes.items() if k.startswith("src"))
    res = []
    for nome, padrao, deve in CHECKS_AUTH:
        achou = re.search(padrao, src, re.I) is not None
        res.append((nome, "OK" if achou == deve else ("FALHA" if deve else "ALERTA")))
    return res


def achar_segredos(fontes: dict) -> list:
    """Retorna (arquivo, linha, tipo). Nunca devolve o valor encontrado."""
    achados = []
    for caminho, texto in fontes.items():
        for i, linha in enumerate(texto.splitlines(), 1):
            for nome, padrao in PADROES_SEGREDO.items():
                if re.search(padrao, linha):
                    achados.append((caminho, i, nome))
    return achados