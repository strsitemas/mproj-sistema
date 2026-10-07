"""Uso: python analisar.py CAMINHO_DO_PROJETO [--comparar snapshot.json]"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from varredura import varrer, modulos
from prisma_info import analisar_prisma, modelos_usados
from package_info import analisar_package
from seguranca import ler_fontes, checar_auth, achar_segredos
from snapshot import tirar, comparar
from alertas import gerar
from relatorio import montar


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="Analisa a pasta do projeto MProj")
    ap.add_argument("caminho")
    ap.add_argument("--comparar", help="snapshot .json de uma análise anterior")
    ap.add_argument("--saida", default=str(Path(__file__).parent / "relatorios"))
    a = ap.parse_args()
    raiz = Path(a.caminho).resolve()
    if not raiz.is_dir():
        print(f"Pasta não encontrada: {raiz}")
        return 1
    v, mods = varrer(raiz), modulos(raiz)
    fontes = ler_fontes(raiz)
    pr = analisar_prisma(raiz)
    pr["usados"] = modelos_usados(pr["modelos"], fontes)
    pk, auth = analisar_package(raiz), checar_auth(fontes)
    alertas = gerar(v, mods, pr, pk, auth, achar_segredos(fontes))
    snap = tirar(raiz, v["lista"])
    delta = None
    if a.comparar:
        delta = comparar(json.loads(Path(a.comparar).read_text(encoding="utf-8")), snap)
    texto = montar(raiz, v, mods, pr, pk, auth, alertas, delta)
    saida = Path(a.saida)
    saida.mkdir(parents=True, exist_ok=True)
    carimbo = datetime.now().strftime("%Y%m%d-%H%M")
    (saida / f"relatorio-{carimbo}.md").write_text(texto, encoding="utf-8")
    (saida / f"snapshot-{carimbo}.json").write_text(json.dumps(snap, indent=1), encoding="utf-8")
    print(texto)
    print(f"Arquivos gravados em: {saida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())