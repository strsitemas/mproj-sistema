"""Análise do package.json (scripts, testes, validação)."""
import json
from pathlib import Path


def analisar_package(raiz: Path) -> dict:
    p = raiz / "package.json"
    if not p.exists():
        return {"existe": False}
    d = json.loads(p.read_text(encoding="utf-8-sig"))
    sc = d.get("scripts", {})
    teste = sc.get("test", "")
    deps = d.get("dependencies", {})
    return {"existe": True, "nome": d.get("name", "?"), "scripts": sorted(sc),
            "teste_placeholder": (not teste) or "no test specified" in teste,
            "tem_lint": "lint" in sc, "tem_build": "build" in sc,
            "deps": len(deps), "devdeps": len(d.get("devDependencies", {})),
            "validacao": [x for x in ("zod", "valibot", "yup") if x in deps]}