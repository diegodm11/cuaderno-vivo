# AUDITORÍA PROFESIONAL DE CUADERNO VIVO PRO

**Fecha de auditoría:** 5 de noviembre de 2026  
**Aplicación auditada:** https://glittery-frangollo-6e59fb.netlify.app/  
**Proyecto local:** `/Users/administrador/Desktop/Cuaderno_Vivo_Hack4Edu`  
**Modalidad:** inspección estática, contraste local–producción, pruebas automatizadas y exploratorias no destructivas, revisión pedagógica y análisis competitivo.  
**Estado de producción:** no modificado durante la auditoría.

---

## 0. Cómo leer este informe

Para evitar confundir una interfaz convincente con una capacidad validada, se emplean cuatro etiquetas:

- **HECHO COMPROBADO:** observado en código, respuesta HTTP, prueba automatizada o ejecución controlada.
- **HIPÓTESIS:** explicación plausible que requiere datos o pruebas adicionales.
- **PROPUESTA:** cambio recomendado; no describe el estado actual.
- **NO EVALUADO:** no existe evidencia suficiente para concluir.

La gravedad se expresa como:

- **P0 — bloqueo:** puede invalidar una demostración, asociar evidencia a la persona o habilidad equivocada, mostrar resultados no sustentados o impedir el flujo principal.
- **P1 — alta:** imprescindible para un MVP fiable.
- **P2 — media:** mejora importante de calidad, accesibilidad, eficiencia o mantenibilidad.
- **P3 — baja/diferible:** valor posterior al MVP o deuda no crítica.

Ninguna cifra de precisión, ahorro docente o mejora del aprendizaje incluida como **objetivo** debe comunicarse como resultado obtenido hasta completar el plan de validación.

---

# 1. Resumen ejecutivo

## 1.1 Dictamen

Cuaderno Vivo Pro es un **prototipo front-end avanzado, visualmente completo y parcialmente funcional**, no todavía un producto de evaluación educativa validado. Tiene activos valiosos: instalación PWA real, funcionamiento offline tras la primera carga, persistencia local, exportación y borrado de datos, generación e impresión de actividades, edición docente, un OMR básico que procesa una plantilla controlada, revisión de lecturas inciertas y un servidor de aula local opcional.

Sin embargo, el núcleo que sustenta la promesa pedagógica todavía mezcla:

1. evidencia real capturada;
2. datos de ejemplo precargados;
3. reglas heurísticas no calibradas;
4. inferencias pedagógicas demasiado amplias;
5. resultados posteriores fijos que sólo son válidos para una actividad de fracciones;
6. una interfaz de lote y seguimiento longitudinal que supera lo que el modelo de datos implementa.

**Conclusión para un jurado:** el proyecto puede defenderse honestamente como una demostración de un flujo “papel → revisión docente → refuerzo → nueva evidencia”, pero no como un sistema que ya identifica automáticamente a cada alumno, corrige fotografías reales con precisión medida, diagnostica causas de error mediante IA o demuestra mejora del aprendizaje.

## 1.2 Riesgos que deben resolverse antes de una demostración competitiva

1. El ticket de salida siempre pregunta fracciones y usa claves fijas `C/B`, aunque el profesor seleccione Lengua, Ciencias, Inglés u otro curso (`index.html:343-378`; `product-core.js:463-483`).
2. El panel compara el ticket con un “antes: 0/2” precargado, no con las ocho respuestas realmente escaneadas; el `+100%` es una diferencia frente a ese cero fijo (`index.html:239-244`; `product-core.js:490-505`).
3. El escáner no decodifica el QR ni la identidad: guarda siempre `student: "A07"` y toma la actividad activa del estado local (`product-core.js:389-401`).
4. La cola “0/24” y los grupos de seis estudiantes son demostrativos: sólo existe un objeto `currentScan` y varios alumnos/patrones precargados (`product-core.js:7-25`; `app.js:58-77`).
5. El diagnóstico atribuye la misma etiqueta de error a cualquier opción incorrecta de una pregunta; no existen distractores diagnósticos específicos (`curriculum-engine.js`; `product-core.js:112-145`).
6. La vista de “aula activa” desplegada en Netlify intenta usar `/api/classroom/*`, pero Netlify sólo sirve archivos estáticos. La suite remota obtuvo `404` en `test_reinforcement_and_local_classroom`.
7. La confianza del OMR es una heurística sin calibración y una fila en blanco obtuvo `confidence: 100`; no representa probabilidad de acierto (`product-core.js:286-346`).
8. El artefacto desplegado coincide con `dist/`, pero el árbol de trabajo no es reproducible desde el único commit: había 23 rutas modificadas/no versionadas y numerosos archivos activos no rastreados.
9. El editor avanzado está funcionalmente roto: editar una opción puede sobrescribir el enunciado porque `product-core.js:86-98` interpreta cualquier `input` como texto de pregunta; se reprodujo en producción con “OPCION EDITADA”.
10. El material de refuerzo reutiliza literalmente P5–P7 de la evaluación inicial (`reinforcement.js:30`), de modo que una mejora posterior puede reflejar memoria o exposición al solucionario.

## 1.3 Decisión recomendada

**Apto para continuar como prototipo de hackathon con condiciones.** Antes de enseñar una cifra de progreso o un diagnóstico, se debe asegurar trazabilidad completa:

`evidencia original → lectura propuesta → confirmación docente → criterio/habilidad → intervención aprobada → nueva pregunta equivalente → resultado posterior → historial`.

La innovación defendible no es “escanear papel con IA”. ZipGrade y Plickers ya cubren escaneo e identificación de respuestas cerradas.[1][2]

Gradescope cubre calificación, rúbricas, analítica y agrupación asistida.[3] Akindi y Gradient cubren creación, controles avanzados y flujos combinados de papel y digital.[6][7]

La oportunidad es un **bucle privado, local y controlado por el docente que convierte evidencia cotidiana del cuaderno en una siguiente acción verificable**, con revisión por excepciones y progreso por habilidad.

---

# 2. Identificación de la versión real

## 2.1 Proyecto fuente y artefacto desplegable

### HECHOS COMPROBADOS

- La entrada fuente editable es `index.html` en la raíz.
- `index.html` contiene bloques embebidos de CSS y JavaScript para funcionar de forma autónoma; `tools/sync_embedded.py` sincroniza esos bloques desde los módulos externos.
- `tools/build_dist.py` extrae los bloques, genera `dist/index.html`, copia módulos, PWA, iconos, vídeo, QR y reglas de Netlify, y crea `dist/build-manifest.json`.
- `netlify.toml:1-3` publica `dist/` y no ejecuta un backend.
- `classroom_server.py` es una variante local opcional y **no forma parte del artefacto Netlify**.
- `backups/`, documentos PDF/Markdown de gestión, capturas y otros entregables no son runtime de producción.

### Archivos de aplicación actuales

**Núcleo desplegado:**

- `index.html`
- `styles.css`, `product-core.css`
- `app.js`, `curriculum-engine.js`, `reinforcement.js`
- `classroom.js`, `profile-i18n.js`, `learning-history.js`
- `class-review.js`, `learning-capsules.js`, `product-core.js`
- `accessibility-demo.js`, `pwa.js`, `service-worker.js`
- `manifest.webmanifest`
- `vendor/qrcode.min.js`
- `icons/*`
- `media/tutorial.mp4`, `media/tutorial-poster.svg`, `media/tutorial-captions.vtt`
- `_headers`, `_redirects` generados desde `deployment/`

**Soporte no desplegado:** `classroom_server.py`, `tools/*`, `tests/*`, `.github/workflows/quality.yml`.

## 2.2 Paridad local–producción

### HECHOS COMPROBADOS

Se descargaron y calcularon hashes SHA-256 de todos los recursos enumerados por `dist/build-manifest.json`:

- **27/27 archivos de contenido público coinciden byte a byte** entre `dist/` y Netlify.
- `_headers` y `_redirects` no son descargables como archivos porque Netlify los consume como configuración; su efecto sí se comprobó en las cabeceras y reescritura.
- Resultado global: `ALL_CONTENT_MATCH` para el contenido servible.
- El propio `build-manifest.json` remoto coincide con el local.
- El service worker activo usa `CACHE_ID = "8c1c7c939eab"`.
- SHA-256 local:
  - `dist/build-manifest.json`: `89556d896f0d375cc9c91f492eb2a5ecda67816bc383189ba8f5f59df688801b`
  - `dist/index.html`: `2565a3bfb14fa010ea4ef1a35b8d42551b23c2fcf8c14ed5337147267544b6cf`
  - `dist/service-worker.js`: `b324b1ddce87304ac1e65d6bb6bec0940402a20c4a5d1d2be13bc85940dfbcbb`
- Producción devolvió para `/` `ETag: "a1f95794c7a084996410cd6ceaf875c5-ssl-df"`, `Last-Modified: Thu, 05 Nov 2026 11:13:45 GMT` y `X-Nf-Request-Id: 01K9B51Y54HGF5KQJ8MAZA6Z0R` durante la auditoría.

### Limitación de trazabilidad

Git sólo contiene un commit (`4c6052d`, 3 de noviembre de 2026), mientras que el trabajo actual tenía **23 rutas modificadas o no rastreadas**. Por tanto:

- sí se puede identificar con precisión el artefacto desplegado mediante hashes;
- no se puede reconstruir limpiamente esa versión desde una etiqueta o commit;
- no debe llamarse “release reproducible” hasta consolidar y etiquetar la fuente.

---

# 3. Diagnóstico técnico

## 3.1 Arquitectura y dependencias

### Arquitectura actual

Aplicación web estática monolítica/modular híbrida:

1. UI HTML con vistas SPA controladas por `setView`.
2. estado local global en `window.APP_STATE`, `window.CV_PRO_DOMAIN` y estados de cada módulo;
3. persistencia primaria en `localStorage` y copia del dominio en IndexedDB;
4. generación de preguntas mediante plantillas locales deterministas;
5. OMR en Canvas 2D sobre una plantilla de 400×800 px;
6. impresión mediante DOM temporal y `window.print()`;
7. PWA con service worker “cache first” para activos y “network first con fallback” para navegación;
8. servidor Python opcional para una sesión LAN.

### Dependencias reales

- No hay framework ni gestor de paquetes JavaScript.
- QR local mediante `vendor/qrcode.min.js`.
- Web APIs: Canvas, FileReader, localStorage, IndexedDB, Cache Storage, Service Worker, Web Speech, `window.print`.
- Backend LAN: biblioteca estándar de Python (`ThreadingHTTPServer`).
- No se observaron llamadas a IA remota, OCR remoto, analítica externa ni servicios que envíen datos del alumnado.

### Valoración

**Fortalezas:** baja dependencia externa, privacidad por defecto, facilidad de distribución y buena capacidad offline.  
**Debilidad:** varios módulos escriben y leen estado global, el dominio convive con datos de demo y el `index.html` fuente duplica CSS/JS embebido. Esto aumenta el riesgo de que una corrección se aplique sólo a una de las representaciones.

## 3.2 Código duplicado, obsoleto o innecesario

### HECHOS COMPROBADOS

- `index.html` fuente pesa aproximadamente 473 KB y replica módulos externos; la sincronización está automatizada, pero sigue habiendo dos representaciones del mismo código.
- `app.js` conserva controladores históricos de escaneo y simulación (`app.js:113-119`, `168-171`). `product-core.js:515-558` instala controladores en fase de captura y usa `stopImmediatePropagation()` para sustituirlos.
- El mismo patrón existe en generación/impresión: la capa nueva intercepta la antigua en vez de eliminar o encapsular su comportamiento.
- Hay dos listeners de aprobación del plan: uno visual en `reinforcement.js` y otro de estado/navegación en `app.js`.

### Consecuencia

No es código muerto inocuo: el orden de carga y la fase del listener determinan qué lógica gana. Un cambio de DOM o de orden de scripts puede reactivar simulaciones antiguas o duplicar efectos.

Además, existe un defecto funcional independiente en el editor avanzado. `curriculum-engine.js:277-280` genera controles para enunciado, opciones, habilidad, clave, dificultad y explicación, pero `product-core.js:86-98` clasifica los controles por tipo y posición, no por campo. En una comprobación runtime, editar la opción A a `OPCION EDITADA` sustituyó el enunciado de P1 y dejó intacto el primer elemento de `options`. Por tanto, la afirmación “el profesor puede editar todos los campos” sólo es parcialmente cierta hasta corregir el mapeo.

### PROPUESTA

Mantener las funciones existentes, pero introducir una capa de controladores única por flujo. No eliminar el código histórico en la primera iteración: marcarlo como legado, cubrirlo con tests y retirarlo sólo con autorización tras demostrar equivalencia.

## 3.3 Procesamiento de fotografías y reconocimiento

### Lo que sí existe

- Lectura de imagen con `FileReader` y Canvas.
- Reescalado a 400×800.
- comprobación de cuatro zonas oscuras esperadas en las esquinas;
- muestreo por cuadrícula en cuatro opciones × ocho preguntas;
- selección por mayor densidad y revisión si el margen entre primera y segunda opción es pequeño;
- estados `ok`, `review` y `error`;
- corrección manual de la lectura incierta antes de guardar.

### Lo que no existe

- detección/decodificación del QR;
- extracción automática de alumno, actividad o versión;
- homografía o corrección de perspectiva;
- detección robusta de contorno/hoja;
- compensación de iluminación local, sombras o balance de blancos;
- lote real de 24 fotografías;
- OCR de texto manuscrito;
- clasificador entrenado o calibrado;
- métrica de precisión derivada de un corpus real.

### Prueba adversarial ejecutada

Sobre el ejemplo sintético incluido:

| Rotación | Resultado | Respuestas correctas |
|---:|---|---:|
| 0° | `ok` | 8/8 |
| 1° | `ok` | 8/8 |
| 2° | `ok` | 8/8 |
| 3° | `error` | 0/8 |
| 5° | `error` | 0/8 |

Esto **no mide precisión fotográfica**; sólo muestra un límite geométrico del algoritmo sobre su propia imagen ideal. La interfaz debe instruir al usuario sobre el encuadre y evitar cualquier afirmación de “corrección de perspectiva” hasta implementarla y medirla.

### Confianza

`confidence = round(55 + margin × 100)` es una escala visual, no una probabilidad calibrada. En la prueba de fila en blanco se obtuvo `answer: null`, `flag: "blank"` y `confidence: 100`. Debe renombrarse a “separación de marcas” o calibrarse contra verdad terreno; nunca presentarse como 100% de certeza.

## 3.4 Persistencia, privacidad y seguridad

### Fortalezas comprobadas

- Todo el tratamiento principal se mantiene en el navegador.
- Exportación JSON de claves `cv-*` y dominio educativo.
- Borrado de claves, IndexedDB y cachés mediante `CV_PRODUCT.deleteAll()`.
- Cabeceras en producción: HSTS, `X-Content-Type-Options`, `X-Frame-Options`, políticas de cámara/micrófono/geolocalización y CSP restrictiva para scripts.
- La fotografía se procesa en memoria y no se observó subida externa.

### Riesgos

1. `localStorage` no aísla profesores que comparten el mismo perfil de navegador.
2. No hay migraciones explícitas de esquema, usuario, curso, consentimiento, retención configurable ni cifrado a nivel de aplicación.
3. El servidor LAN se enlaza a `0.0.0.0` sin autenticación docente; un código de sesión protege el acceso funcional, pero no constituye control de acceso institucional.
4. Un alumno puede reenviar respuestas y usar otro código de alumno; el servidor devuelve soluciones tras enviar y no implementa cierre inmutable o rate limiting.
5. La vista previa de refuerzo inserta contenido editable con `innerHTML` (`reinforcement.js:37`). En ejecución se introdujo `<b id="audit-injected">…</b>` como enunciado y apareció como un nodo real. La CSP bloquea JavaScript inline, pero sigue existiendo **inyección HTML/estilos y posibilidad de suplantar mensajes de interfaz**.
6. “Borrar datos de demo” no muestra una confirmación específica en el flujo auditado.
7. `product-core.js:23-43` escribe una copia en localStorage y otra en IndexedDB sin esperar; `product-core.js:654-661` puede cargar después una copia IndexedDB anterior y sustituir el dominio local. No se reprodujo pérdida de datos, pero la carrera es plausible y debe probarse con cierres/recargas durante escritura.
8. Nombre, correo, centro y fotografía base64 del perfil se almacenan en claro en localStorage y se incluyen en la exportación general (`profile-i18n.js:4-6,31-32`; `product-core.js:612-626`).

### Dictamen de privacidad

La arquitectura local-first es una ventaja real, pero **local no equivale automáticamente a seguro**. Para un piloto con datos personales debe existir separación de perfil, política de conservación, exportación legible, confirmación de borrado y un modelo de amenazas documentado.

## 3.5 Funcionamiento sin conexión

### HECHOS COMPROBADOS

- El service worker se registra, activa y controla la aplicación.
- Caché observada: `cuaderno-vivo-8c1c7c939eab`, con 24 activos.
- Tras completar la instalación y recargar, la navegación offline a `/` devolvió `200`, título correcto y `offline: true`.
- La pantalla sin conexión funciona desde caché después de una primera visita conectada.
- La suite de contrato del service worker pasó **7/7 tests**.

### Riesgos de resiliencia

- La instalación usa `cache.addAll(APP_SHELL)`: un único recurso no disponible puede abortar la precarga completa.
- Se precarga el vídeo tutorial de ~2,17 MB; aumenta tiempo/almacenamiento inicial.
- La activación elimina toda caché cuyo nombre no sea exactamente el actual (`service-worker.js:32-34`), no sólo versiones `cuaderno-vivo-*`; en un origen compartido podría borrar cachés ajenas.
- No hay UI clara de “datos sólo locales”, “pendiente de sincronizar” o versión cacheada.
- El borrado de cachés hace que la app deje de estar disponible offline hasta una nueva visita conectada; es coherente, pero debe explicarse.

## 3.6 Generación de materiales imprimibles

### HECHOS COMPROBADOS

- El generador crea ocho preguntas, clave, QR y una tira OMR.
- El profesor puede editar enunciados, opciones, respuestas y etiquetas antes de imprimir.
- El QR se genera realmente de forma local.
- La impresión usa el diálogo nativo del navegador; no existe un archivo PDF generado y versionado por la aplicación.
- En Chrome headless, una actividad para **un alumno produjo dos páginas A4**; la segunda comenzó con la pregunta 8 y la zona OMR. No existe test visual que garantice paginación, márgenes o que QR/OMR sigan siendo decodificables después de imprimir/escanear.

### Riesgo

El salto de página puede incrementar coste, separar el identificador del bloque OMR o sorprender al profesor. Debe definirse explícitamente si cada ficha ocupa una o dos hojas y probarse en impresoras reales.

## 3.7 Pruebas y calidad

### Resultados ejecutados

- `tests/test_service_worker_contract.py`: **7/7 correctos**.
- `tests/test_product_integrity.py` contra Netlify: **30 ejecutados; 29 correctos y 1 error**.
- Error: el test de aula local recibió `HTTP 404` en `/api/classroom/*`.
- La navegación offline real se comprobó adicionalmente con Playwright.
- Las pruebas del OMR usan imágenes ideales generadas por la propia app; no son un conjunto independiente de fotografías reales.

### Problema de CI

`.github/workflows/quality.yml` inicia `python3 -m http.server 4173`, pero la prueba de aula requiere `classroom_server.py`. Es una inconsistencia reproducible. No se consultó el estado actual de GitHub Actions, por lo que no se afirma que una ejecución concreta esté roja; sí que la configuración auditada no puede satisfacer ese contrato.

### Cobertura ausente

- corpus de fotos reales, dispositivos, sombras, arrugas, inclinación y marcas ambiguas;
- calibración y curvas de error/revisión;
- QR → alumno → actividad;
- lote, reintentos y recuperación;
- equivalencia pedagógica de pre/post;
- regresión visual de impresión;
- accesibilidad automática/manual completa;
- localización integral;
- seguridad de contenido editable;
- migraciones del dominio y restauración de exportaciones;
- Safari/iOS, Firefox y Android reales.

---

# 4. Inventario de funcionalidad: real, demostrativa e incompleta

| Área | Estado | Evidencia y alcance honesto |
|---|---|---|
| Generación de 8 preguntas | **Real, con límites** | Plantillas locales; no IA generativa. Amplia cobertura superficial, no validación curricular completa. |
| Edición docente | **Real** | Cambios de pregunta/opciones/clave se reflejan en la impresión. |
| Editor avanzado | **Implementación defectuosa** | Los controles existen, pero el listener puede guardar una opción, dificultad o explicación como si fuera el enunciado. |
| QR impreso | **Real** | Se genera localmente. |
| Lectura de QR | **No implementada** | El escáner no decodifica el QR. |
| Escáner OMR | **Real en plantilla controlada** | Canvas y densidad por zonas; tolerancia sintética 0–2°, error desde 3° en la prueba realizada. |
| Corrección de perspectiva | **No implementada** | No hay homografía ni detección de hoja. |
| OCR manuscrito | **No implementado** | No aparece motor OCR ni inferencia de escritura. |
| “Confianza” del escáner | **Heurística no calibrada** | Margen de densidades; fila en blanco puede mostrar 100. |
| Identificación automática del alumno | **Demostración** | Se guarda `A07` de forma fija. |
| Lote 24 alumnos | **Interfaz demostrativa** | No existe una cola persistente de 24 capturas. |
| Diagnóstico de error | **Regla simple/incompleta** | Error por pregunta/habilidad, no por distractor ni explicación del alumno. |
| Agrupamiento | **Demostración** | Grupos y conteos precargados; no derivados de un lote real. |
| Plan de refuerzo | **Real como plantilla editable** | Se genera/edita/imprime; no es una recomendación de IA validada. |
| Aprobación docente | **Parcial** | Cambia estado y navegación; no guarda versión, autor, momento o diferencias. |
| Ticket de salida | **Real sólo para el caso de fracciones** | Dos preguntas fijas, claves `C/B`; inválido en otros temas. |
| “Mejora +100%” | **Dato de demo** | Compara con `0/2` fijo, no con evidencia inicial equivalente. |
| Historial de aprendizaje | **Parcial** | Guarda eventos OMR y ticket; modelo global/single-student insuficiente para clase real. |
| Aula multidispositivo | **Real sólo con servidor Python local** | No funciona en Netlify estático. |
| PWA/offline | **Real** | Caché instalada y navegación offline verificada. |
| Exportar/borrar | **Real** | JSON local y borrado de almacenamiento/cachés. |
| Reseñas y cápsulas | **Real como módulos locales** | Reacciones y contenido local; periféricos al bucle crítico. |
| Idiomas | **Parcial** | Al elegir inglés siguen visibles textos centrales en español. |

---

# 5. Análisis UX/UI y accesibilidad

## 5.1 Fortalezas

- Estética coherente, jerarquía visual clara y lenguaje centrado en el docente.
- Navegación principal reconocible y modo guiado.
- Mensajes explícitos sobre límites de IA y datos ficticios en varias pantallas.
- Edición antes de impresión y confirmación de lecturas dudosas: buen patrón de control humano.
- Los controles visibles auditados tenían nombre accesible y no se detectaron IDs duplicados.
- El flujo principal funciona en viewport móvil de 390×844 sin desbordamiento horizontal global.

## 5.2 Problemas observados

1. **Demasiadas promesas simultáneas.** Generación, escaneo, refuerzo, aula, reseñas, cápsulas, perfil, idiomas y tutorial compiten con el flujo principal.
2. **Estado mezclado.** Datos ficticios conviven con eventos reales; el usuario no siempre sabe qué cifra cambió por su acción.
3. **Navegación sin semántica de pestañas.** Los botones principales no usan `role="tab"`, `aria-selected` ni un contenedor `tablist`.
4. **Objetivos táctiles pequeños.** En móvil se midieron controles visibles de 12–20 px de alto (“Ver límites”, “Proponer otra secuencia”, varios “Editar”). WCAG 2.2 pide 24×24 CSS px o espaciado/excepción suficiente.[5]
5. **Traducción incompleta.** Con perfil inglés se observaron simultáneamente textos en inglés y frases clave en español, incluidos “Usar datos de ejemplo”, “Activar grupo temporal” y “Aprendizaje detectado”.
6. **Impresión opaca.** No hay preflight que avise número de páginas, coste aproximado, escala o legibilidad del OMR.
7. **Error de contexto en aula.** En producción estática el usuario descubre el fallo al pulsar, en vez de ver de antemano que requiere servidor local.
8. **Decisión docente decorativa.** El selector “mantener / ajustar / cerrar” no genera una acción trazable.

## 5.3 Principio de rediseño

La pantalla de inicio debería responder sólo a tres preguntas:

1. ¿Qué actividad voy a evaluar?
2. ¿Qué evidencia requiere revisión?
3. ¿Qué decisión docente queda pendiente?

El resto debe aparecer por revelado progresivo. No se propone eliminar funcionalidades; sí cambiar jerarquía y etiquetar módulos experimentales.

---

# 6. Evaluación pedagógica

## 6.1 Evaluar

### Estado actual

- La evidencia inicial son ocho respuestas de opción múltiple.
- La plantilla contiene habilidad, respuesta correcta y etiqueta de error.
- Se permite revisión manual de ambigüedad.

### Dictamen

Es una base válida para evaluación formativa cerrada, pero no permite inferir comprensión profunda, procedimiento o causa del error. Una opción incorrecta es evidencia de desempeño en un ítem, no prueba suficiente de una concepción errónea estable.

## 6.2 Detectar error

### Problema crítico

La lógica asigna `question.error` a cualquier respuesta incorrecta. Si una pregunta tiene cuatro opciones, tres distractores conceptualmente distintos terminan en el mismo diagnóstico. Tampoco considera:

- número mínimo de ítems por habilidad;
- consistencia entre ítems;
- dificultad;
- lectura no confirmada;
- explicación del alumno;
- evidencia previa;
- posible error de marcado o escaneo.

### Regla defendible propuesta

Un patrón sólo puede cambiar a “confirmado” cuando:

1. todas las lecturas que lo sustentan han sido revisadas o superan un umbral calibrado;
2. existen al menos dos ítems independientes de la misma habilidad;
3. los distractores están asociados a códigos de error distintos y revisados por un docente;
4. no hay evidencia contradictoria reciente;
5. el profesor confirma la interpretación.

En otro caso debe llamarse “indicio pendiente”, no “dificultad detectada”.

## 6.3 Reforzar

### Estado actual

El plan propone cinco pasos estáticos y un ejemplo por error. El profesor puede editarlo y debe aprobarlo. Sin embargo, `reinforcement.js:30` construye el test con `all.slice(4,7)`: P5–P7 de la evaluación inicial reaparecen literalmente en vista previa, impresión y solucionario. Esto contradice la promesa visible “No confundimos repetición con aprendizaje”.

### Valoración

El control docente es correcto como intención, pero la aprobación no conserva:

- versión aprobada;
- evidencia que la motivó;
- cambios respecto de la sugerencia;
- autor/fecha;
- alumnos incluidos;
- criterio de cierre.

La intervención debe ser una entidad versionada, no un booleano `approved`. Además, evaluación inicial, práctica y reevaluación deben usar conjuntos sin solapamiento exacto de `itemId`, enunciado y opciones, aunque compartan una familia de habilidad.

## 6.4 Volver a evaluar

### Problema crítico

El ticket actual repite el dominio de fracciones con dos preguntas fijas, independientemente de la actividad. Para que mida “la misma habilidad” sin repetir el ejercicio debe usar un **blueprint**:

- mismo identificador de habilidad;
- representación o contexto diferente;
- dificultad comparable;
- distractores equivalentes;
- ninguna copia literal del ítem inicial;
- clave y explicación revisadas;
- versión separada e identificable.

Dos preguntas no permiten estimaciones finas; sólo un indicador provisional (`2/2`, `1/2`, `0/2`). Un umbral de 80% no tiene resolución real con n=2: sólo 100% lo supera.

La lógica actual añade otro riesgo: `learning-history.js:71-88` puede declarar “Dominio provisional” con dos aciertos posteriores aunque el ratio global sea 50%, y una única evidencia correcta con `phase="retention"` puede producir “Consolidado”. No existe todavía un flujo normal que cree esa retención, pero la regla es pedagógicamente insuficiente y debe corregirse antes de activarlo.

## 6.5 Comprobar evolución

### Problema crítico

El “antes” fijo `0/2` no proviene del escaneo inicial. Comparar ocho preguntas iniciales con dos posteriores tampoco es automáticamente válido. Para hablar de evolución se necesita:

- habilidad común;
- formas paralelas o anclaje;
- identificación inequívoca del alumno;
- timestamps y versiones;
- registro de intervención;
- estado de revisión;
- posible retención demorada.

### Semáforo pedagógico propuesto

- **Sin evidencia:** no hay suficientes ítems confirmados.
- **Indicio:** una respuesta o lectura no confirmada.
- **Necesita apoyo:** ≥2 evidencias consistentes + confirmación docente.
- **Mejora inmediata:** forma paralela posterior mejora, aún sin retención.
- **Consolidado:** rendimiento mantenido en una comprobación demorada.

Nunca convertir automáticamente este semáforo en una decisión de agrupamiento, nota o comunicación a familias.

## 6.6 Control docente obligatorio

El profesor debe confirmar:

- asociación alumno–actividad;
- lecturas ambiguas;
- interpretación diagnóstica;
- composición del grupo;
- intervención y materiales;
- publicación/compartición;
- criterio de dominio y cierre.

El sistema puede sugerir y ordenar excepciones; no debe tomar esas decisiones en silencio.

---

# 7. Análisis competitivo

## 7.1 Qué ya existe en el mercado

| Producto | Capacidades ya comercializadas | Lección para Cuaderno Vivo |
|---|---|---|
| **ZipGrade** | Escaneo de quizzes en papel con móvil, hojas flexibles, sincronización entre dispositivos, analítica y seguimiento de estándares; declara más de un millón de docentes usuarios.[1] | Escanear burbujas y obtener análisis inmediato no es innovación por sí solo. Debe igualarse la fiabilidad y velocidad básica. |
| **Plickers** | Cada alumno usa una tarjeta identificada; orientación A/B/C/D; el móvil del profesor escanea y atribuye respuestas. Ofrece hasta 63 patrones.[2] | La identidad robusta y la experiencia de aula con un único dispositivo ya están resueltas para respuesta cerrada. |
| **Gradescope** | Tareas de longitud variable y plantilla fija, rúbricas rápidas, cambios retroactivos, estadísticas por pregunta/rúbrica, devolución opcional y agrupación asistida por IA revisada por el docente.[3] | Revisión por criterio, historial de cambios y human-in-the-loop son expectativas maduras. |
| **Gradient / GradeCam** | Papel y digital en un mismo sistema, tipos de ítem diversos, calificación rápida, informes y transferencia de notas.[6] | “Papel + digital + datos accionables” tampoco es una categoría nueva. |
| **Akindi** | Creación/importación de evaluaciones, aleatorización y controles avanzados, junto con entrega/calificación en papel.[7] | La operación profesional exige versiones, excepciones, lotes y trazabilidad, no sólo una cámara. |
| **Formative** | Plataforma de evaluación formativa digital para docentes con constructor, respuesta en vivo y feedback; es un comparable de flujo, no de papel local-first.[4] | La respuesta rápida y la siguiente acción ya están bien posicionadas; diferenciarse por cuaderno físico, privacidad y evidencia longitudinal. |
| **Remark Office OMR** | Aplicación Windows para diseñar formularios y procesar papel/PDF/imagen con OMR, códigos y reporting; el ICR manuscrito requiere Microsoft Computer Vision.[10] | OMR local y formularios flexibles ya existen; “procesar papel localmente” no basta como novedad. |
| **CoGrader** | Fotografía o importa manuscritos, transcribe y propone puntuación/feedback bajo rúbrica para revisión docente; su documentación de transparencia describe proveedores de IA cloud.[11][12][13] | Es el comparable más cercano a “foto + manuscrito + IA + docente”; Cuaderno Vivo sólo se diferencia si demuestra procesamiento local y ciclo de reevaluación por pasos. |

## 7.2 Qué hace mejor la competencia

- **Fiabilidad operativa:** identificación, lotes, reescaneo, excepciones y recalificación.
- **Modelo de datos:** curso, actividad, versión, alumno, ítem, estándar, rúbrica y publicación.
- **Analítica:** desglose por ítem/criterio y cambios auditables.
- **Madurez UX:** flujo explícito preparar → capturar → revisar → devolver.
- **Escala:** sincronización, LMS/SIS, permisos y administración.
- **Validación:** años de uso y expectativas claras sobre lo que el escáner puede procesar.

El funcionamiento local/offline tampoco es novedoso aisladamente: ZipGrade documenta almacenamiento local y sincronización desactivable, Plickers declara procesamiento local del vídeo de cámara y Remark es una aplicación de escritorio.[8][9][10]

## 7.3 Problemas todavía insuficientemente resueltos

Esto es una **oportunidad**, no una afirmación de ausencia total en competidores:

1. convertir evidencia cotidiana del cuaderno —no sólo exámenes— en una historia por habilidad;
2. mantener captura, diagnóstico provisional y refuerzo en el dispositivo del docente;
3. mostrar siempre original, propuesta, motivo, incertidumbre y corrección humana;
4. combinar papel con una intervención breve sin exigir cuenta o dispositivo por alumno;
5. demostrar que una pregunta posterior es paralela a la inicial y no una repetición;
6. conservar decisiones docentes, no sólo puntuaciones.

La formulación “foto + manuscrito + IA + control docente” tampoco puede presentarse como inédita por la existencia de CoGrader.[11][12] El espacio diferencial exige **procedimientos por pasos, trazabilidad entre error y nueva evidencia, y ejecución local verificable**.

## 7.4 Ventaja defendible recomendada

**“Cuaderno Vivo convierte evidencia cotidiana en una siguiente decisión docente trazable, manteniendo el papel, la privacidad y el control humano.”**

El foso no será un algoritmo OMR sencillo. Debe ser:

- un modelo longitudinal de evidencia e intervención;
- una bandeja de revisión por excepciones;
- blueprints de habilidades y distractores revisados;
- funcionamiento local/offline comprobable;
- exportación portable;
- adaptación curricular profunda a España/UE;
- mediciones transparentes de calidad.

## 7.5 Innovación útil frente a innovación innecesaria

### Aporta valor real

- QR/identidad verificable sin cuentas de alumnos;
- lote offline reanudable;
- revisión por excepción con imagen original;
- intervención versionada y aprobada;
- formas paralelas por habilidad;
- retención demorada;
- panel de decisiones pendientes, no “dashboard museo”;
- informe de procedencia de cada conclusión.

### Debe aplazarse

- OCR libre de escritura manuscrita;
- IA generativa abierta para diagnosticar alumnos;
- agrupamiento autónomo;
- predicción de rendimiento;
- nube multi-centro y LMS antes de validar el flujo local;
- gamificación extensa;
- traducción automática de contenidos curriculares sin revisión experta.

---

# 8. Matriz profesional de los 20 problemas prioritarios

| ID / prioridad | Archivo o componente | Evidencia concreta | Consecuencia | Solución propuesta | Esfuerzo | Riesgo regresión | Prueba de corrección |
|---|---|---|---|---|---|---|---|
| **CV-01 / P0** | `index.html`, `product-core.js` | Ticket fijo de fracciones y claves `C/B` para cualquier asignatura. | Reevalúa una habilidad distinta y genera conclusiones inválidas. | Generar ticket desde blueprint de la habilidad activa; bloquear si no hay forma paralela aprobada. | Alto | Alto | Matriz asignatura×curso×tema; cada ítem post comparte `skillId`, no texto, y pasa revisión experta. |
| **CV-02 / P0** | Resultados | “Antes 0/2” y `+100%` fijos, no derivados de escaneo. | Presenta mejora ficticia. | Calcular sólo con evidencia inicial equivalente; si no existe, mostrar “sin comparación válida”. | Medio | Alto | Test con 0, 1 y ≥2 evidencias; nunca aparece delta sin pares comparables. |
| **CV-03 / P0** | OMR/QR | Guarda siempre alumno `A07`; no decodifica QR. | Evidencia asociada a persona/actividad equivocada. | Decodificar QR local o exigir confirmación manual inequívoca antes de guardar. | Alto | Alto | 100 plantillas multi-alumno: cero asociaciones silenciosamente erróneas; errores van a revisión. |
| **CV-04 / P0** | `product-core.js` OMR | Sin homografía; imagen sintética falla desde 3° en prueba. | Fotos normales pueden rechazarse o leerse mal. | Detectar cuatro marcadores, estimar homografía, normalizar iluminación y conservar original. | Alto | Alto | Corpus real estratificado por dispositivo/ángulo/luz; métricas por estrato. |
| **CV-05 / P0** | Confianza OMR | Heurística no calibrada; fila en blanco mostró 100. | Falsa seguridad y automatización incorrecta. | Separar `markSeparation` de probabilidad; calibrar umbrales y abstención con verdad terreno. | Medio-Alto | Alto | Curva precisión–revisión, Brier/ECE si se muestra probabilidad; blancos nunca “100% seguros”. |
| **CV-06 / P0** | Cola de escaneo | UI `0/24`; sólo un `currentScan`. | La demo sugiere lote inexistente. | Implementar cola persistente o etiquetar claramente “flujo individual de prototipo”. | Alto | Medio | 24 imágenes, pausa/reanudación, duplicados, fallos y recarga sin pérdida. |
| **CV-07 / P0** | Diagnóstico | Cualquier distractor usa la misma `question.error`. | Atribuye causas no demostradas. | Distractor con `misconceptionCode`; mínimo de evidencias y confirmación docente. | Alto | Alto | Tests por distractor; respuestas distintas producen indicios distintos o “no concluyente”. |
| **CV-08 / P0** | Patrones/grupos | El plan puede usar evidencia no revisada; grupos y conteos precargados. | Intervención aplicada a alumnos equivocados. | Estado provisional/confirmado; excluir no revisado de decisiones; grupo sólo tras aprobación. | Medio-Alto | Alto | Ningún no revisado crea grupo/plan; auditoría de inclusión y override. |
| **CV-09 / P0** | Aula Netlify | `/api/classroom/*` da 404; backend no se despliega. | Flujo visible falla en producción. | Detección de capacidad: modo local con instrucciones o demo explícita; no prometer backend en Netlify. | Bajo-Medio | Bajo | E2E en Netlify muestra límite antes de iniciar; E2E local con servidor completa sesión. |
| **CV-10 / P0** | CI | Workflow usa `http.server`, test requiere `classroom_server.py`. | El contrato no puede pasar de forma reproducible. | Separar suites estática/LAN o iniciar el servidor correcto; publicar resultados. | Bajo | Bajo | Pipeline limpio y obligatorio, todas las suites verdes con logs. |
| **CV-11 / P1** | Modelo de dominio | `exitEvidence` global y alumno/actividad insuficientemente versionados. | No soporta clase, múltiples sesiones ni historial fiable. | Esquema v2 con IDs de estudiante, actividad, versión, ítem, evidencia, intervención y timestamps. | Alto | Alto | Migración v1→v2, dos cursos/actividades/alumnos sin colisiones; export/import round-trip. |
| **CV-12 / P1** | Aprobación | `approved` booleano; sin versión, autor, cambios ni evidencia. | No existe trazabilidad del control docente. | Evento de aprobación inmutable con snapshot/diff, responsable, fecha y alcance. | Medio | Medio | Editar tras aprobar crea nueva versión pendiente; historial reproduce cada decisión. |
| **CV-13 / P1** | Generador curricular | Catálogo valida estructura, no contenido; A2, B1, C1 y C2 reutilizan silenciosamente el banco B2; materias no matemáticas usan plantillas genéricas. | Material aparentemente curricular pero semánticamente débil y nivel falseado. | Banco versionado por habilidad/nivel, metadatos, revisión sustantiva y bloqueo de combinaciones no cubiertas. | Alto | Medio | Revisión experta ciega; A1–C2 independientes; detector de bancos idénticos; 0 fallback silencioso. |
| **CV-14 / P1** | `reinforcement.js` | Contenido editable entra en `innerHTML`; inyección HTML confirmada. | Puede falsear mensajes, ocultar límites o romper impresión. | Renderizar con DOM/textContent; sanitizador local si se permite formato. | Medio | Medio | Suite de payloads HTML/CSS/SVG; aparecen como texto y no crean nodos/estilos. |
| **CV-15 / P0** | `reinforcement.js` | El refuerzo usa `all.slice(4,7)`: reutiliza literalmente P5–P7 de la evaluación inicial. | El resultado puede medir memoria/exposición al solucionario, no transferencia. | Tres pools sin solapamiento: inicial, práctica y salida/retención, unidos por familia de habilidad. | Medio-Alto | Alto | Intersección normalizada de `itemId`, enunciado y opciones igual a cero entre fases. |
| **CV-16 / P1** | Código legado | Listeners históricos son anulados por captura/`stopImmediatePropagation`. | Orden de carga puede reactivar simulaciones o duplicar acciones. | Controlador único por flujo, adaptador temporal y tests de una sola emisión. | Medio-Alto | Alto | Un clic genera exactamente un evento/impresión/escaneo en todos los modos. |
| **CV-17 / P1** | Impresión | Una ficha generó 2 A4; sin test visual/QR/OMR tras impresión. | Coste y separación física inesperados; lectura no garantizada. | Preflight, plantilla paginada deliberadamente y test de impresión–foto–lectura. | Medio | Medio | PDF visual en A4/Letter, conteo esperado, QR/OMR decodificables en impresoras objetivo. |
| **CV-18 / P0** | Editor avanzado | Editar opción/dificultad/explicación puede sobrescribir `question.text`; reproducido con “OPCION EDITADA”. | El profesor imprime o persiste contenido distinto de lo editado. | Enlazar cada control por `data-field`/ruta explícita y actualizar sólo ese campo con validación de esquema. | Medio | Alto | E2E edita y recarga cada campo; modelo, preview, impresión y exportación coinciden exactamente. |
| **CV-19 / P2** | Accesibilidad/UX | Tabs sin semántica; controles de 12–20 px; alta densidad. | Dificultad teclado/táctil y carga cognitiva. | Patrón ARIA tabs, 24×24 mínimo/espaciado, foco, disclosure progresivo. | Medio | Bajo-Medio | axe + teclado + lector; WCAG 2.2 AA y prueba móvil con docentes. |
| **CV-20 / P1** | Validación | Tests ideales; sin corpus real, calibración, seguridad, impresión o estudio pedagógico. | No se pueden sostener precisión, ahorro o aprendizaje. | Protocolo de validación preregistrado, dataset anonimizado y gates cuantitativos. | Alto | Bajo | Informe reproducible con intervalos, errores por estrato y decisiones de go/no-go. |

---

# 9. Plan de innovación y roadmap

## 9.1 Antes de cualquier demostración (P0; 1–2 semanas)

1. **Modo de evidencia honesto:** cada tarjeta indica `DEMO`, `REAL`, `PENDIENTE` o `NO DISPONIBLE EN NETLIFY`.
2. Sustituir `0/2` y `+100%` por “sin comparación válida” salvo evidencia equivalente real.
3. Limitar el ticket a la actividad de fracciones o generar uno válido por habilidad; nunca usar el fijo en otras asignaturas.
4. Exigir confirmación visible de alumno y actividad antes de guardar un escaneo.
5. Renombrar confianza a “calidad/separación de marca” y mostrar “requiere revisión” en blancos/dobles.
6. Etiquetar la cola y grupos como datos de ejemplo o no activarlos con una captura individual.
7. Explicar antes del clic que Aula activa requiere `classroom_server.py` local.
8. Corregir el workflow de pruebas y crear una release reproducible con hash/commit.
9. Neutralizar la inyección HTML del contenido editable.
10. Ensayar una demo de recuperación: qué hacer si no lee la hoja, si no hay red o si el QR no se reconoce.
11. Corregir el mapeo del editor avanzado y probar cada campo antes de permitir su uso en la demo.
12. Separar inmediatamente las preguntas de evaluación y refuerzo; no volver a imprimir P5–P7 como práctica.

## 9.2 MVP funcional (4–8 semanas)

1. Esquema de dominio v2 y migración.
2. QR local + confirmación de identidad + prevención de duplicados.
3. Cola offline reanudable de capturas.
4. OMR con homografía, normalización y abstención.
5. Bandeja de revisión por excepciones con miniatura original.
6. Banco de ítems por habilidad con distractores codificados y versiones paralelas.
7. Pools independientes para evaluación inicial, práctica, salida y retención, sin solapamiento literal.
8. Diagnóstico provisional basado sólo en evidencia confirmada.
9. Intervenciones versionadas y aprobadas; grupos temporales editables.
10. Ticket equivalente y retención programable.
11. Exportación/importación completa, retención y separación de perfiles.
12. Impresión predecible y validada.
13. Accesibilidad WCAG 2.2 AA e i18n coherente.

## 9.3 Diferenciales para Hack4Edu (después del MVP)

1. **Pasaporte de evidencia:** cronología por habilidad con original, lectura, corrección, decisión y resultado posterior.
2. **Prueba de procedencia:** al pulsar cualquier conclusión, mostrar exactamente qué evidencias la sustentan y cuáles fueron excluidas.
3. **Diseñador de forma paralela:** ayuda al profesor a variar contexto/representación conservando habilidad y dificultad.
4. **Revisión por excepción offline:** el sistema automatiza el orden, no el juicio.
5. **Panel de impacto docente:** tiempo real empleado, excepciones resueltas, intervenciones y retención; sin rankings de alumnos.
6. **Paquetes curriculares locales versionados:** comunidad autónoma, curso, competencia y revisión experta.

## 9.4 Funciones que deben aplazarse

- OCR de escritura libre y corrección automática de razonamientos.
- IA generativa autónoma para diagnósticos o calificaciones.
- predicción de riesgo y agrupamiento automático;
- nube multi-centro, marketplace y LMS/SIS completo;
- gamificación social de cápsulas;
- nuevos idiomas curriculares sin revisión humana;
- analítica psicométrica avanzada antes de disponer de volumen y calidad de ítems.

No se propone eliminar las funciones existentes: deben conservarse, pero los módulos periféricos pueden etiquetarse como experimentales y quedar fuera del flujo principal hasta consolidar el núcleo.

---

# 10. Métricas de éxito y protocolo de validación

## 10.1 Fiabilidad

**Objetivos propuestos, no resultados actuales:**

- 0 asociaciones silenciosas alumno–actividad incorrectas en el conjunto de validación.
- ≥99% de exactitud por burbuja en condiciones de uso definidas y ≥98% por hoja completa; publicar IC 95% y rendimiento por dispositivo/luz/ángulo.
- ≤5% de hojas enviadas a revisión en condiciones objetivo, sin reducir la precisión.
- 100% de blancos/dobles tratados como abstención o revisión.
- 100% de operaciones críticas disponibles offline tras instalación.
- 0 pérdidas en prueba de 24 capturas con pausa, cierre y reanudación.

## 10.2 Ahorro de tiempo docente

Diseño cruzado con ≥12 docentes:

- misma tarea con método habitual y con Cuaderno Vivo;
- medir tiempo desde recogida hasta decisión lista para aplicar;
- objetivo inicial: reducción mediana ≥30%, sin aumento de errores;
- registrar tiempo de revisión y preparación por separado;
- reportar distribución e intervalos, no sólo promedio.

## 10.3 Facilidad de uso

- ≥90% completa `crear → imprimir → escanear → revisar → aprobar → reevaluar` sin ayuda crítica.
- SUS ≥80 como objetivo de madurez.
- tasa de error crítico <2% por sesión.
- tiempo mediano hasta primera ficha imprimible <5 min para usuario nuevo.
- WCAG 2.2 AA en auditoría automática y manual; teclado y lector de pantalla sin bloqueos.

## 10.4 Aprendizaje observado

No usar el `+100%` de la demo. Diseñar:

- pretest y postest con formas paralelas y blueprint común;
- comprobación demorada a 7–14 días;
- comparación con práctica habitual o diseño escalonado;
- muestra y análisis acordados antes de observar resultados;
- efecto con intervalo de confianza y datos de abandono;
- separar mejora inmediata, retención y transferencia.

Métrica primaria sugerida: proporción de habilidades con mejora confirmada en forma paralela **y** mantenida en retención. Métrica de seguridad pedagógica: porcentaje de sugerencias diagnósticas modificadas/rechazadas por docentes y motivo.

## 10.5 Gates de go/no-go

- **No demo competitiva:** si quedan resultados ficticios sin etiquetar o CI no reproducible.
- **No piloto con alumnado:** si QR/identidad puede asociar silenciosamente mal una hoja.
- **No automatización:** si la precisión no alcanza el umbral por estrato.
- **No afirmación de aprendizaje:** sin forma paralela, retención e intervalo de incertidumbre.

---

# 11. Especificación de implementación por mejora prioritaria

## 11.1 Trazabilidad y resultados honestos

**Archivos:** `product-core.js`, `learning-history.js`, `index.html`, `styles.css`, tests.  
**Cambios:**

1. Añadir `EvidenceStatus = demo|captured|reviewed|approved|invalid`.
2. Reemplazar cifras fijas por selectores que consulten pares de evidencia equivalentes.
3. Si no hay par, renderizar “Aún no hay evidencia comparable”.
4. Mostrar procedencia al abrir un resultado.
5. Mantener datos demo en un namespace separado y borrable.

**Tests:** cero, una y varias evidencias; datos demo no contaminan real; recarga; exportación.  
**Aceptación:** ninguna cifra de progreso puede renderizarse sin IDs de evidencia inicial/posterior, habilidad común y revisión.

## 11.2 Identidad, lote y OMR robusto

**Archivos:** `product-core.js`, nuevo módulo local de decodificación/geométrica, `index.html`, CSS, service worker, tests.  
**Cambios:** QR local; homografía; normalización; cola IndexedDB; estados por captura; original + recorte; abstención; confirmación manual.  
**Tests:** corpus real etiquetado, duplicados, QR incorrecto, rotaciones, perspectiva, sombras, blur, blancos, dobles y reanudación.  
**Aceptación:** cero misasociaciones silenciosas y métricas publicadas por estrato.

## 11.3 Motor pedagógico por habilidad

**Archivos:** `curriculum-engine.js`, `product-core.js`, `reinforcement.js`, nuevo banco versionado, tests.  
**Cambios:** `skillId`, `itemVersion`, `misconceptionCode`, blueprint, forma inicial/post/retención; reglas de evidencia mínima; estado provisional; teacher override.  
**Tests:** equivalencia estructural, no repetición literal, distractores, evidencia contradictoria y diferentes asignaturas.  
**Aceptación:** ninguna etiqueta diagnóstica con un solo ítem o lectura no revisada; ticket siempre pertenece a la habilidad activa.

## 11.4 Decisiones docentes auditables

**Archivos:** `reinforcement.js`, `product-core.js`, `learning-history.js`, `class-review.js`, tests.  
**Cambios:** intervención versionada, snapshot, diff, responsable local, fecha, alumnos, criterios, aprobación/publicación/cierre separados.  
**Tests:** editar tras aprobar, deshacer, grupo ajustado, export/import e historial.  
**Aceptación:** cualquier cambio significativo puede explicarse y revertirse sin perder la versión aprobada.

## 11.5 Release, UX y validación

**Archivos:** `.github/workflows/quality.yml`, build tools, `pwa.js`, HTML/CSS/i18n, tests.  
**Cambios:** suites separadas, artefacto con commit/hash, snapshots de impresión, sanitización DOM, tabs ARIA, targets táctiles, cobertura de traducción y matriz de navegadores.  
**Aceptación:** checkout limpio reproduce artefacto; CI verde; 0 inyección DOM; accesibilidad AA; impresión y offline validados.

---

# 12. Plan de pruebas y validación

## 12.1 Pirámide de pruebas

### Unitarias

- reglas de dominio y migraciones;
- selección/abstención OMR;
- cálculo de evidencia y comparabilidad;
- distractores/diagnóstico;
- sanitización;
- traducciones y fallback.

### Integración

- QR → identidad → actividad → respuestas;
- captura → revisión → historial;
- actividad → impresión → relectura;
- intervención → aprobación → ticket → retención;
- exportación → borrado → importación;
- caché y actualización del service worker.

### E2E

1. usuario nuevo sin datos;
2. datos demo claramente separados;
3. actividad real de Matemáticas;
4. actividad de Lengua que demuestra que no aparece ticket de fracciones;
5. lote 24 con errores parciales;
6. funcionamiento offline;
7. aula local con servidor y comportamiento claro en Netlify;
8. teclado, lector y móvil;
9. impresión A4/Letter;
10. borrado total.

## 12.2 Dataset OMR

Mínimo recomendado para prepiloto: 500 hojas/variantes, con partición independiente de desarrollo y prueba; múltiples móviles, impresoras, bolígrafos, marcas, ángulos, distancias, sombras, fondos, arrugas y fotos parciales. Registrar verdad terreno por dos revisores. No entrenar/ajustar umbrales con el conjunto final.

Reportar:

- exactitud por burbuja y hoja;
- falso positivo/negativo de marca;
- tasa de abstención;
- error de identidad;
- tiempo de proceso;
- rendimiento por condición;
- IC 95%.

## 12.3 Validación curricular

Cada ítem necesita revisión de:

- corrección y unicidad de clave;
- relación con `skillId`;
- dificultad prevista;
- distractores plausibles y código de error;
- lenguaje/edad;
- sesgo y accesibilidad;
- equivalencia entre formas.

Dos expertos revisan una muestra ciega; discrepancias se resuelven y versionan.

## 12.4 Validación con docentes

Tres rondas:

1. **usabilidad formativa** (5 docentes): pensar en voz alta;
2. **piloto operativo** (12–20): tiempo, errores, overrides y entrevistas;
3. **estudio de aprendizaje:** diseño preespecificado, forma paralela y retención.

No publicar porcentajes de ahorro o aprendizaje antes de completar la ronda correspondiente.

---

# 13. Cinco prompts individuales de implementación, en orden de prioridad

> Estos prompts están preparados para ejecutarse **uno por uno**, después de aprobar este informe. Todos deben comenzar ejecutando `tools/backup_project.py`, trabajar sobre archivos existentes, no editar `dist/` directamente, no desplegar producción y finalizar con `tools/build_dist.py` sólo para validación local del artefacto.

## Prompt 1 — Eliminar resultados pedagógicos ficticios del flujo real

```text
Trabaja en /Users/administrador/Desktop/Cuaderno_Vivo_Hack4Edu. Antes de modificar, ejecuta tools/backup_project.py. No elimines funciones, no edites dist/ y no despliegues.

Objetivo: garantizar que Cuaderno Vivo nunca muestre progreso o diagnóstico como real sin evidencia trazable.

1. Inspecciona product-core.js, learning-history.js, index.html y tests.
2. Separa explícitamente datos demo y datos capturados mediante source/status.
3. Sustituye “Antes 0/2”, “+100%” y cualquier delta fijo por cálculo sobre pares comparables con studentId, activityId, skillId, itemForm, reviewed=true y timestamps.
4. Si falta cualquier dato, muestra “Sin evidencia comparable todavía”.
5. Impide que lecturas no revisadas generen patrones confirmados, grupos o planes aprobables.
6. Mantén la demo existente bajo una etiqueta visible “DATOS DE EJEMPLO”.
7. Añade tests unitarios y E2E para 0/1/varias evidencias, mezcla demo-real, recarga y exportación.

Criterios de aceptación:
- ninguna cifra de mejora aparece sin evidencia inicial y posterior equivalente;
- cada conclusión permite abrir las evidencias que la sustentan;
- datos demo no alteran métricas reales;
- suites existentes y nuevas pasan;
- build_dist.py genera un artefacto válido, sin publicarlo.
```

## Prompt 2 — Corregir la reevaluación por habilidad y el diagnóstico

```text
Trabaja sobre el proyecto existente y crea backup previo. No reemplaces la aplicación ni despliegues.

Objetivo: convertir el ticket fijo de fracciones en una reevaluación pedagógicamente válida y controlada por el profesor.

1. Diseña un esquema de ítem con skillId, itemId, version, form(initial|post|retention), misconceptionCode por distractor, difficultyBand y provenance.
2. Migra curriculum-engine.js sin romper presets existentes.
3. Genera formas posteriores que compartan skillId pero no repitan texto, números o contexto literal.
4. Separa cuatro pools: inicial, práctica/refuerzo, post y retención; exige intersección exacta cero de itemId, enunciado y opciones entre fases.
5. Elimina las claves globales C/B y toma la clave del ítem versionado.
6. Exige al menos dos evidencias consistentes y revisadas para proponer un patrón; en otro caso usa “indicio no confirmado”.
7. Añade una pantalla de revisión docente del blueprint y de los distractores antes de imprimir/publicar.
8. Conserva fallback seguro: si una combinación curricular no está cubierta, no inventes contenido; informa y permite edición manual.

Tests:
- Matemáticas, Lengua, Ciencias e Inglés;
- distractores distintos producen códigos distintos;
- post mantiene habilidad y cambia superficie;
- una sola respuesta nunca confirma patrón;
- ninguna actividad no matemática recibe ticket de fracciones.

Aceptación: el ciclo inicial→refuerzo→post puede auditarse por skillId y toda decisión significativa requiere confirmación docente.
```

## Prompt 3 — Implementar identidad y OMR fiable con abstención

```text
Crea backup; modifica la base existente, no dist/, no producción y no añadas servicios externos.

Objetivo: reemplazar student=A07 y el escáner de coordenadas fijas por un flujo local verificable.

1. Decodifica localmente el QR de la ficha o, si no es posible, exige selección/confirmación manual antes de guardar.
2. Valida checksum/version/activityId/studentId y detecta duplicados.
3. Detecta marcadores, calcula homografía y normaliza a la plantilla canónica.
4. Conserva original y recorte por respuesta; implementa blank, multiple, low-quality y review.
5. Renombra la confianza heurística; sólo muestra probabilidad si se calibra. Implementa abstención segura.
6. Crea cola IndexedDB reanudable con estados pending/processed/review/error y progreso real.
7. Proporciona corpus de pruebas sin datos personales y un script reproducible de evaluación.

Aceptación:
- cero asociaciones silenciosas erróneas en el corpus final;
- blancos y dobles nunca se convierten en respuestas seguras;
- 24 capturas sobreviven recarga y modo offline;
- informe por ángulo/luz/dispositivo con IC 95%;
- el profesor puede corregir y queda auditado.
```

## Prompt 4 — Versionar intervención, aprobación y seguimiento

```text
Haz backup y trabaja sobre reinforcement.js, product-core.js, learning-history.js, class-review.js y tests. Mantén compatibilidad y no despliegues.

Objetivo: que el control docente sea real y trazable.

1. Modela Intervention con id, version, evidenceIds, studentIds, skillIds, proposedContent, teacherEdits, status, approvedAt, completedAt y decision.
2. Al editar una intervención aprobada, crea nueva versión pendiente; no sobrescribas la aprobada.
3. Separa aprobar, publicar/aplicar, ajustar grupo y cerrar.
4. Implementa diff legible, undo y motivo opcional de override.
5. El selector mantener/ajustar/cerrar debe producir un evento real y actualizar historial.
6. Integra retención demorada sin enviar automáticamente ni decidir por el profesor.
7. Incluye todo en exportación/importación y elimina con borrado total.

Tests: versionado, doble aprobación, edición posterior, grupo modificado, rollback, export/import y dos alumnos concurrentes.

Aceptación: cualquier plan mostrado puede vincularse a evidencia, versión, decisión y autor local; ningún cambio significativo ocurre sin acción docente explícita.
```

## Prompt 5 — Release reproducible, seguridad de renderizado, accesibilidad e impresión

```text
Crea backup. No elimines módulos ni publiques producción.

Objetivo: cerrar riesgos de ingeniería y calidad antes del piloto.

1. Corrige .github/workflows/quality.yml: suite estática con http.server y suite LAN con classroom_server.py, puertos aislados y teardown fiable.
2. Añade commit/hash/buildId al manifiesto y verifica build determinista desde checkout limpio.
3. Sustituye innerHTML con contenido editable por construcción DOM/textContent o sanitización local probada.
4. Corrige el editor avanzado usando data-field/rutas explícitas; prueba por separado enunciado, cada opción, habilidad, clave, dificultad y explicación, incluida recarga, preview, impresión y exportación.
5. Implementa navegación ARIA tablist/tab/tabpanel, foco visible y objetivos táctiles ≥24×24 o espaciado conforme.
6. Completa inventario i18n y snapshots por idioma; no traduzcas contenido curricular sin revisión.
7. Añade preflight de impresión: A4/Letter, páginas por alumno, escala y aviso; crea regresión visual y prueba QR/OMR impreso-fotografiado.
8. Añade E2E offline real y matrices Chrome/Firefox/WebKit donde sea viable.

Aceptación:
- CI verde y reproducible;
- checkout limpio produce hashes esperados;
- payloads HTML/CSS/SVG no crean nodos activos;
- WCAG 2.2 AA sin bloqueos críticos;
- impresión tiene paginación prevista y sigue siendo legible por el escáner;
- no se modifica producción.
```

---

# 14. Conclusión estratégica

Cuaderno Vivo Pro ya contiene una demostración extensa, pero su ventaja competitiva dependerá de **reducir promesas y aumentar evidencia**. Para Hack4Edu, una historia honesta y potente sería:

1. el profesor imprime una actividad identificada;
2. el sistema captura localmente y se abstiene cuando no sabe;
3. el profesor revisa sólo excepciones;
4. las respuestas generan indicios por habilidad, no diagnósticos absolutos;
5. el profesor aprueba una intervención versionada;
6. una forma paralela mide respuesta inmediata;
7. una comprobación demorada evalúa consolidación;
8. cualquier conclusión se puede rastrear hasta la evidencia original.

Si se implementa ese recorrido con fiabilidad medida, privacidad local y control docente demostrable, Cuaderno Vivo podrá diferenciarse. Añadir más módulos o utilizar la palabra “IA” no compensará una asociación incorrecta, un progreso ficticio o una reevaluación que mida otra habilidad.

---

# 15. Fuentes externas

Sources:

[1] ZipGrade, sitio oficial y funciones del producto: https://www.zipgrade.com/  
[2] Plickers, “Cards Overview”: https://help.plickers.com/hc/en-us/articles/360009089113-Cards-Overview  
[3] Gradescope, sitio oficial y funciones: https://www.gradescope.com/  
[4] Formative para docentes: https://www.formative.com/teachers  
[5] W3C, WCAG 2.2, criterio 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html  
[6] Gradient, Classroom Features: https://gradientk12.com/classroom-features/  
[7] Akindi, Create Assessments / Features: https://www.akindi.com/features
[8] ZipGrade, privacidad y almacenamiento/sincronización: https://www.zipgrade.com/privacy/  
[9] Plickers, política de privacidad: https://help.plickers.com/hc/en-us/articles/1260804063769-Privacy-Policy  
[10] Remark Office OMR, producto y FAQ: https://remarksoftware.com/products/office-omr/  
[11] CoGrader, AI Handwritten Grading: https://www.cograder.com/ai-handwritten-grading/  
[12] CoGrader, AI Transparency Note: https://www.cograder.com/ai-transparency-note/  
[13] CoGrader, Privacy Policy: https://www.cograder.com/privacy-policy/

---

## Anexo A. Resumen de evidencias de ejecución

- Paridad de contenido: 27/27 activos remotos comparables coinciden con `dist/`.
- Suite service worker: 7/7.
- Suite producto remota: 29/30 correctos; 1 error por API LAN ausente.
- Offline tras instalación: navegación 200 y aplicación utilizable.
- OMR sintético: 8/8 a 0°, 1° y 2°; error a 3° y 5°.
- Caso de fila en blanco: `answer=null`, `flag=blank`, `confidence=100`.
- Impresión de una ficha: dos páginas A4 en Chrome headless.
- i18n en inglés: mezcla de inglés y español confirmada.
- Accesibilidad exploratoria: sin nombres vacíos visibles ni IDs duplicados; tabs sin roles y varios controles <24 px.
- Inyección de contenido: HTML editable creó un nodo dentro de la vista previa.
- Editor avanzado: editar la opción A sustituyó el enunciado y no actualizó el primer elemento de `options`.
- Refuerzo: la vista previa reutiliza literalmente P5–P7 de la evaluación inicial.
- Catálogo inglés: A2, B1, C1 y C2 caen silenciosamente en el banco B2.
- Reglas de dominio: una única evidencia de retención correcta puede activar “Consolidado”.
- Producción y código de aplicación no fueron modificados durante las pruebas.

## Anexo B. Límites de esta auditoría

- No se realizó un pentest completo.
- No se midió el OMR con fotografías reales ni se puede afirmar una precisión.
- No se observó una clase real ni se puede afirmar ahorro docente.
- No se ejecutó un estudio de aprendizaje ni se puede afirmar impacto pedagógico.
- No se probaron impresoras físicas, Safari/iOS ni dispositivos Android reales.
- No se verificó el estado histórico de despliegues o ejecuciones de GitHub Actions; sólo la configuración y el artefacto accesible.
