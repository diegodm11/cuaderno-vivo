# Pruebas reproducibles

## Requisitos locales

- Python 3.11 o posterior.
- Playwright para Python.
- Google Chrome en macOS o Chromium instalado por Playwright.
- Node.js para validar la sintaxis JavaScript.

## Ejecución

En una terminal:

```bash
cd /Users/administrador/Desktop/Cuaderno_Vivo_Hack4Edu
python3 -m http.server 4180
```

En otra terminal:

```bash
/Users/administrador/.hermes/bin/uv run --with playwright python -m unittest tests/test_service_worker_contract.py -v
/Users/administrador/.hermes/bin/uv run --with playwright python -m unittest tests/test_product_integrity.py -v
```

Las pruebas comprueban comportamiento, no solo presencia de botones:

- edición de preguntas → impresión → recarga;
- imagen obligatoria y rechazo de archivos dañados;
- lectura de ocho marcas desde píxeles de una plantilla controlada;
- edición de refuerzo → vista previa → recarga;
- exit ticket sin resultado predeterminado;
- borrado integral de claves locales;
- protección de la caché de navegación frente a respuestas 404.

GitHub Actions repite sintaxis, construcción y E2E en cada push o pull request.
