# ESTADO REAL DE CUADERNO VIVO PRO

Fecha de verificación: 5 de noviembre de 2026

Este documento separa lo implementado y probado de lo pendiente. No sustituye las pruebas físicas con cámara, impresora o varios dispositivos.

## Proyecto activo y protección

- Fuente activa: `/Users/administrador/Desktop/Cuaderno_Vivo_Hack4Edu/index.html` y módulos editables de la misma carpeta.
- Despliegue público comprobado previamente: `https://glittery-frangollo-6e59fb.netlify.app/`, generado desde `dist/`.
- Rama de desarrollo: `feature/real-functional-core`.
- Copia anterior a esta intervención: `backups/20261105_155438_antes_de_modificar/`.
- La web pública de Netlify no se ha modificado ni publicado.
- La carpeta `dist/` nunca se edita a mano; se regenera con `python3 tools/build_dist.py`.

## Estado por fases

| Fase | Estado real | Evidencia |
|---|---|---|
| 0. Identificar y proteger | VERIFICADA | Proyecto activo localizado, backup realizado, rama de desarrollo creada y baseline ejecutado. |
| 1. Alumnos e historial | NÚCLEO IMPLEMENTADO; UX EN PROGRESO | SQLite crea A01–A24, aísla historiales y persiste tras reabrir la base. La interfaz local permite seleccionar cada alumno. El contenido demostrativo heredado aún contiene referencias visibles a A07 fuera del flujo real. |
| 2. PDF y QR | PRIMER RECORRIDO VERIFICADO | PDF real de 24 páginas, una por alumno, QR seudónimo y cuatro referencias de perspectiva. Falta generalizar a exámenes de hasta 20 páginas por alumno y preguntas numéricas/abiertas. |
| 3. Escáner y corrección | OMR CONTROLADO VERIFICADO CON IMAGEN SINTÉTICA | OpenCV corrige perspectiva, lee QR, interpreta ocho filas A–D, detecta doble marca y no guarda una nota ambigua. Falta corpus de fotografías físicas y gestión multipágina completa (repetidas/ausentes/mezcladas). |
| 4. Refuerzo | PENDIENTE DE CONECTAR AL NÚCLEO REAL | La interfaz heredada tiene refuerzos locales, pero todavía no consume los errores guardados por `real_exam_core.py`. |
| 5. Aula LAN | PARCIAL | Existe servidor LAN y API SQLite del flujo de examen. Las sesiones digitales heredadas siguen en memoria y aún no tienen sesiones/roles robustos ni recuperación completa. No se ha ejecutado todavía la prueba concurrente de 24 dispositivos del nuevo núcleo. |
| 6. Evolución | PARCIAL | Los intentos reales se guardan por alumno y examen. Falta el ciclo longitudinal unificado y backup/restauración/exportación del SQLite. |
| 7. Moodle/LTI 1.3 | DISEÑADA, NO IMPLEMENTADA | Se mantiene el informe técnico separado. No se ha conectado ningún Moodle institucional. |
| 8. Pruebas integrales | EN PROGRESO | Suite automatizada del repositorio ejecutada. Las pruebas físicas siguen pendientes y se enumeran abajo. |

## Recorrido funcional ya disponible en desarrollo

1. Iniciar el servidor local:

   ```bash
   python3 -m pip install --user -r requirements-local.txt
   python3 classroom_server.py
   ```

2. Abrir la URL `Profesor` indicada por la terminal, no el archivo mediante `file://`.
3. Ir a **Crear actividad → Modo funcional local**.
4. Crear una clase de 24 alumnos. Se guardan A01–A24 en SQLite.
5. Editar las ocho preguntas, sus cuatro opciones, habilidad y solución.
6. Guardar el examen y descargar el PDF real de 24 páginas.
7. En **Escanear fichas → Corrección real**, cargar fotografías PNG/JPG/WebP.
8. Si QR y OMR son legibles, el resultado se guarda en el historial del alumno identificado. Si existe doble marca o una marca no fiable, la nota no se guarda y se solicita revisión.
9. Volver a **Crear actividad** y consultar el historial de A01–A24 con el selector.

## Pruebas automatizadas verificadas del nuevo núcleo

- Creación de 24 códigos exactos A01–A24.
- Historial independiente de A07, A15 y A02.
- Persistencia después de cerrar y reabrir SQLite.
- PDF de 24 páginas.
- Lectura del QR de la página A01 después de normalizar la perspectiva.
- Hoja generada por el PDF → marcado controlado → lectura OMR → corrección 8/8 → persistencia.
- Imagen con dos marcas en Q1 → `needs_review=true` → Q1 queda sin inventar → no se guarda intento.
- API local para crear clases y exámenes, descargar PDF, subir imagen y consultar historial.
- Alumno A99 rechazado por la API.
- Service worker corregido para que toda ruta `/api/` sea exclusivamente de red y nunca devuelva datos académicos obsoletos desde caché.
- Interfaz verificada en navegador local: servidor detectado, clase real creada, examen real guardado y enlace PDF habilitado.

## Pruebas físicas pendientes (no afirmar superadas)

- Imprimir hojas en una impresora real y comprobar tamaño/márgenes.
- Fotografiar hojas con el teléfono del profesor bajo luz, sombras, giro y perspectiva variables.
- Construir y etiquetar un corpus con varias cámaras, lápices y calidades de papel.
- Medir sensibilidad, especificidad y tasa de revisión manual de OMR.
- Verificar QR y OMR en las 24 hojas físicas, no solo en imágenes controladas.
- Probar pérdida y recuperación de Wi-Fi con dos dispositivos físicos.
- Simular y después probar 24 conexiones simultáneas sobre la nueva persistencia SQLite.
- Probar permisos de firewall de macOS y aislamiento de clientes del punto de acceso.
- Validar el flujo LTI 1.3/AGS en un Moodle de pruebas.

## Límites y bloqueos actuales

- El OMR nuevo solo acepta la plantilla controlada de hasta ocho preguntas tipo test en una página.
- No existe todavía OCR fiable para respuestas numéricas manuscritas ni abiertas. Estas respuestas deben quedar para revisión docente.
- El flujo real no organiza todavía varias páginas del mismo examen ni detecta páginas ausentes/repetidas.
- La API real aún necesita autenticación docente, token CSRF, sesiones de alumno y autorización por recurso antes de un piloto con menores.
- SQLite no está cifrado en reposo. El equipo docente debe proteger la cuenta de macOS y el disco; se diseñará una exportación cifrada.
- La interfaz heredada conserva demostraciones etiquetadas y referencias a A07. No se consideran datos reales y deben sustituirse progresivamente por el estado SQLite.
- El servidor requiere Python y las dependencias locales instaladas. Después de instalarlas, el uso funcional no depende de Internet ni de APIs externas.

## Archivos añadidos o modificados en este avance

- `real_exam_core.py`: SQLite, clases, estudiantes, exámenes, PDF/QR y OMR OpenCV.
- `classroom_server.py`: API real, PDF, escaneo e historial.
- `real-workflow.js`: interfaz del recorrido real.
- `index.html`, `styles.css`: controles del flujo real y corrección real.
- `service-worker.js`: exclusión de todas las API de la caché.
- `requirements-local.txt`: dependencias locales reproducibles.
- `tools/sync_embedded.py`, `tools/build_dist.py`: empaquetado del nuevo módulo.
- `tests/test_real_exam_core.py`: persistencia, PDF/QR y OMR.
- `tests/test_real_classroom_api.py`: API local.
- `tests/test_real_workflow_ui.py`: contrato de interfaz sin resultados simulados.
- `tests/test_service_worker_contract.py`: API sin caché.

## Siguiente hito seguro

Generalizar el documento a varias páginas por alumno, registrar el estado de cada página y aceptar lotes de fotografías con detección de duplicadas/ausentes. Después, conectar los errores confirmados al refuerzo y migrar el aula digital heredada desde memoria a SQLite con sesiones y autorización.
