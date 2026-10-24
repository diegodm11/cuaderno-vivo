#!/usr/bin/env python3
"""Crea una copia completa de Cuaderno Vivo antes de modificarlo."""
from datetime import datetime
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
BACKUPS = ROOT / "backups"
STAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
DESTINATION = BACKUPS / f"{STAMP}_antes_de_modificar"


def ignore(directory: str, names: list[str]) -> set[str]:
    ignored = {".DS_Store", "__pycache__"}
    if Path(directory).resolve() == ROOT:
        ignored.add("backups")
    ignored.update(name for name in names if name.endswith((".pyc", ".pyo")))
    return ignored


BACKUPS.mkdir(exist_ok=True)
shutil.copytree(ROOT, DESTINATION, ignore=ignore)
files = sum(1 for path in DESTINATION.rglob("*") if path.is_file())
print(f"Backup creado: {DESTINATION}")
print(f"Archivos conservados: {files}")
