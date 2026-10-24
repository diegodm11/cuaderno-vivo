from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
FILES = [
    "index.html",
    "styles.css",
    "product-core.css",
    "app.js",
    "reinforcement.js",
    "profile-i18n.js",
    "product-core.js",
    "pwa.js",
    "service-worker.js",
    "manifest.webmanifest",
    "LICENSE",
    "CONTENT_LICENSE.md",
    "THIRD_PARTY_NOTICES.md",
    "vendor/qrcode.min.js",
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

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

missing = [item for item in FILES if not (ROOT / item).is_file()]
if missing:
    raise SystemExit(f"Faltan archivos de producción: {', '.join(missing)}")

for relative in FILES:
    source = ROOT / relative
    target = DIST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)

for source_name, target_name in DEPLOYMENT_FILES.items():
    shutil.copy2(ROOT / source_name, DIST / target_name)

digest = hashlib.sha256()
for relative in FILES:
    if relative != "service-worker.js":
        digest.update((DIST / relative).read_bytes())
build_id = digest.hexdigest()[:12]
worker = DIST / "service-worker.js"
worker.write_text(worker.read_text(encoding="utf-8").replace("__BUILD_ID__", build_id), encoding="utf-8")

text_extensions = {".html", ".css", ".js", ".json", ".webmanifest", ".vtt", ""}
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
(DIST / "build-manifest.json").write_text(json.dumps({"app":"Cuaderno Vivo Pro","files":records},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Producción creada: {DIST}")
print(f"Versión de caché PWA: {build_id}")
print(f"Archivos públicos: {len(records)+1}")
print(f"Tamaño: {sum(item['bytes'] for item in records)/1024/1024:.2f} MiB")
