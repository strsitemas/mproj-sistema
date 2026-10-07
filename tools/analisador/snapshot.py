"""Snapshot por hash dos arquivos e comparação entre duas versões."""
import hashlib
from pathlib import Path


def tirar(raiz: Path, lista: list) -> dict:
    return {rel: hashlib.sha256((raiz / rel).read_bytes()).hexdigest() for rel in lista}


def comparar(antigo: dict, novo: dict) -> dict:
    return {"novos": sorted(set(novo) - set(antigo)),
            "removidos": sorted(set(antigo) - set(novo)),
            "alterados": sorted(k for k in novo if k in antigo and novo[k] != antigo[k])}