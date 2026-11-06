#!/usr/bin/env python3
"""Construye el paquete público modular de Cuaderno Vivo Pro.

La raíz conserva un index.html autocontenido para apertura directa. Este script
extrae sus bloques marcados con data-embedded-source y genera una versión CSP
segura para Netlify en dist/. Nunca se debe editar dist/ directamente.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
INDEX = ROOT / "index.html"

RUNTIME_FILES = [
    "manifest.webmanifest",
    "service-worker.js",
    "LICENSE",
    "CONTENT_LICENSE.md",
    "THIRD_PARTY_NOTICES.md",
    "assets/logo-cuaderno-vivo-oficial.png",
    "assets/logo-cuaderno-vivo-icono.png",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/maskable-512.png",
    "icons/apple-touch-icon.png",
    "media/tutorial/poster.png",
    "media/tutorial/subtitulos-es.vtt",
    "media/tutorial/tutorial-cuaderno-vivo.mp4",
]
DEPLOYMENT_FILES = {
    "deployment/_headers": "_headers",
    "deployment/_redirects": "_redirects",
}

STYLE_RE = re.compile(
    r'<style data-embedded-source="([^"]+)">\n?(.*?)\n?</style>', re.DOTALL
)
SCRIPT_RE = re.compile(
    r'<script data-embedded-source="([^"]+)">\n?(.*?)\n?</script>', re.DOTALL
)

if not INDEX.is_file():
    raise SystemExit("Falta index.html en la raíz del proyecto.")

html = INDEX.read_text(encoding="utf-8")
embedded: dict[str, str] = {}


def extract_style(match: re.Match[str]) -> str:
    name, content = match.groups()
    embedded[name] = content + "\n"
    return f'<link rel="stylesheet" href="{name}">'


def extract_script(match: re.Match[str]) -> str:
    name, content = match.groups()
    embedded[name] = content + "\n"
    return f'<script src="{name}"></script>'


public_html = STYLE_RE.sub(extract_style, html)
public_html = SCRIPT_RE.sub(extract_script, public_html)

if not embedded:
    raise SystemExit("index.html no contiene bloques data-embedded-source.")

public_html = re.sub(
    r'<link rel="manifest" href="data:application/manifest\+json;base64,[^"]+">',
    '<link rel="manifest" href="manifest.webmanifest">',
    public_html,
    count=1,
)
public_html = re.sub(
    r'<link rel="apple-touch-icon" href="data:image/png;base64,[^"]+">',
    '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">',
    public_html,
    count=1,
)
public_html = re.sub(
    r'(data-embedded-image="([^"]+)" src=")data:image/[^;]+;base64,[^"]+("[^>]*>)',
    lambda match: match.group(1) + match.group(2) + match.group(3),
    public_html,
)
public_html = re.sub(
    r'data-poster="data:image/[^;]+;base64,[^"]+"',
    'data-poster="media/tutorial/poster.png"',
    public_html,
    count=1,
)
public_html = re.sub(
    r'data-src="data:text/vtt;base64,[^"]+"',
    'data-src="media/tutorial/subtitulos-es.vtt"',
    public_html,
    count=1,
)

required_embedded = {
    "styles.css", "product-core.css", "vendor/qrcode.min.js", "app.js",
    "curriculum-engine.js", "reinforcement.js", "profile-i18n.js",
    "learning-history.js", "class-review.js", "learning-capsules.js",
    "product-core.js", "accessibility-demo.js", "real-workflow.js",
    "classroom.js", "pwa.js",
}
missing_embedded = sorted(required_embedded - embedded.keys())
if missing_embedded:
    raise SystemExit("Faltan bloques embebidos: " + ", ".join(missing_embedded))

missing_runtime = [item for item in RUNTIME_FILES if not (ROOT / item).is_file()]
missing_deployment = [item for item in DEPLOYMENT_FILES if not (ROOT / item).is_file()]
if missing_runtime or missing_deployment:
    raise SystemExit("Faltan archivos de producción: " + ", ".join(missing_runtime + missing_deployment))

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

(DIST / "index.html").write_text(public_html, encoding="utf-8")
for relative, content in embedded.items():
    target = DIST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
for relative in RUNTIME_FILES:
    target = DIST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / relative, target)
for source_name, target_name in DEPLOYMENT_FILES.items():
    shutil.copy2(ROOT / source_name, DIST / target_name)

digest = hashlib.sha256()
for path in sorted(item for item in DIST.rglob("*") if item.is_file() and item.name != "service-worker.js"):
    digest.update(path.relative_to(DIST).as_posix().encode("utf-8"))
    digest.update(path.read_bytes())
build_id = digest.hexdigest()[:12]
worker = DIST / "service-worker.js"
worker.write_text(
    worker.read_text(encoding="utf-8").replace("__BUILD_ID__", build_id),
    encoding="utf-8",
)
if "__BUILD_ID__" in worker.read_text(encoding="utf-8"):
    raise SystemExit("No se pudo inyectar la versión de caché en service-worker.js")

text_extensions = {".html", ".css", ".js", ".json", ".webmanifest", ".vtt", ".md", ""}
for path in DIST.rglob("*"):
    if path.is_file() and path.suffix in text_extensions:
        text = path.read_text(encoding="utf-8")
        if "/Users/" in text or "file://" in text:
            raise SystemExit(f"Ruta local detectada en {path.relative_to(DIST)}")

records = []
for path in sorted(item for item in DIST.rglob("*") if item.is_file()):
    relative = path.relative_to(DIST).as_posix()
    records.append({
        "path": relative,
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    })
(DIST / "build-manifest.json").write_text(
    json.dumps({"app": "Cuaderno Vivo Pro", "build_id": build_id, "files": records}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

print(f"Producción creada: {DIST}")
print(f"Versión de caché PWA: {build_id}")
print(f"Archivos públicos: {len(records) + 1}")
print(f"Tamaño: {sum(item['bytes'] for item in records) / 1024 / 1024:.2f} MiB")
