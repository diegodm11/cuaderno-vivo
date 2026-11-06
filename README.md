# Cuaderno Vivo Pro

Prototipo profesional para el **Reto 11 · Una segunda oportunidad para aprender** de Hack4Edu 2026. El catálogo oficial lo identifica además como **Reto ProFuturo**, por lo que el proyecto opta al ranking transversal correspondiente además de competir en la modalidad senior.

## Demo pública

**[Abrir Cuaderno Vivo Pro](https://glittery-frangollo-6e59fb.netlify.app/)**

La demo web funciona directamente en ordenador, tableta y móvil. Tras la primera carga puede instalarse como PWA y reutilizarse sin conexión. Los datos de demostración y el progreso se guardan únicamente en el navegador del dispositivo.

> Recomendación para la evaluación: abre la demo, pulsa **Crear mi primera actividad** y sigue el recorrido guiado de seis pasos.

## Ejecutar el proyecto localmente

Clona el repositorio y abre `index.html` para usar la versión autocontenida en un único dispositivo. No necesita instalar dependencias ni conectarse a servicios externos.

Para usar el flujo funcional de examen en papel o un ordenador/tableta por alumno dentro de la misma red del aula, instala una vez las dependencias locales e inicia el servidor incluido:

```bash
python3 -m pip install --user -r requirements-local.txt
python3 classroom_server.py
```

Después abre en el ordenador del profesor la dirección `Profesor` que aparece en la terminal. El servidor detecta y muestra también la dirección IP de la LAN para los dispositivos del alumnado. No hace falta Internet durante el uso. Las clases, exámenes y resultados del flujo real se guardan en `data/cuaderno-vivo.sqlite3`; las sesiones antiguas de refuerzo siguen siendo temporales hasta completar su migración a SQLite.

No necesita conexión a Internet: estilos, lógica, vídeo, subtítulos y generador de QR están incluidos en la carpeta. La apertura directa de `index.html` sigue disponible para trabajar en un único dispositivo; la participación simultánea requiere `classroom_server.py` porque los navegadores necesitan un punto local común para intercambiar respuestas.

## Política de trabajo y copias de seguridad

- `index.html` en la raíz es la única versión activa. No se crearán archivos `index-final.html`, `index (2).html` ni copias de trabajo en Descargas.
- Antes de modificar el proyecto se ejecutará `python3 tools/backup_project.py`.
- Las copias se guardan en `backups/` con fecha y hora.
- Las versiones históricas permanecen dentro de `backups/`; no se editan ni se usan como proyecto principal.
- Los recursos adicionales se organizan en `media/`, `vendor/` y `tools/`.

## Producción web y PWA

La versión preparada para publicar se genera con:

```bash
python3 tools/build_dist.py
```

El resultado está en `dist/`. Esta carpeta es autocontenida, no incluye backups ni documentación privada y es la única que debe subirse a Netlify. El manifiesto, los iconos y el service worker permiten instalar la aplicación y reutilizarla sin conexión después de completar una primera carga online.

Las instrucciones manuales desde Safari están en `NETLIFY_PUBLICACION.md`. Preparar `dist` no publica el proyecto ni contacta con Netlify.

## Recorrido recomendado

Al abrirla por primera vez aparece una guía de tres pasos. Para empezar sin conocimientos técnicos, pulsa **Crear mi primera actividad**, elige cuatro datos y deja las opciones avanzadas cerradas.

1. **Inicio:** muestra el problema de la clase y la decisión pendiente.
2. **Crear actividad:** el modo fácil solo pide asignatura, nivel, tema y número de alumnos.
3. **Crear las fichas:** genera de 1 a 40 códigos seudónimos y QR reales.
4. **Escaneos:** procesa localmente el recuadro OMR controlado de la ficha A07; requiere cuatro referencias negras y ocho filas A–D.
5. **Revisión:** muestra la respuesta con menor confianza y mantiene la decisión final en manos del profesor.
6. **Intervenciones:** deriva una dificultad de las respuestas confirmadas, muestra la evidencia y permite editar y persistir el refuerzo.
   - La vista previa enseña las cuatro respuestas posibles y un solucionario explicado.
   - El modo **Dispositivos** comparte el test en la red local y recoge las entregas del alumnado.
7. **Clase activa:** transforma el error detectado en una dinámica de movimiento o tarjetas y genera el kit imprimible.
8. **Progreso:** compara una actividad inicial con un exit ticket diferente.
9. **Privacidad:** enseña qué se guarda, dónde y durante cuánto tiempo.

## Refuerzo activo integrado

La pantalla **Clase activa** conecta movimiento, participación flexible y comprobación del aprendizaje con el ciclo pedagógico de Cuaderno Vivo:

1. Parte de un error concreto confirmado por el profesor.
2. Propone tres preguntas nuevas sobre la misma habilidad.
3. Permite elegir cuatro esquinas, tarjetas en alto o participación mixta.
4. Ofrece letra grande, apoyo visual y guion de lectura sin registrar diagnósticos médicos.
5. Imprime carteles, tarjetas, un guion docente y un exit ticket.
6. Devuelve el resultado al panel de progreso para comprobar si la intervención funcionó.

## Qué funciona realmente

- Navegación completa y persistencia local del estado.
- Bienvenida inicial, guía contextual y ayuda recuperable desde la cabecera.
- Modo fácil con valores predeterminados; las opciones técnicas permanecen ocultas.
- Catálogo curricular con ocho materias: Matemáticas, Lengua y Literatura, Ciencias Naturales, Biología y Geología, Física y Química, Geografía e Historia, Inglés y Tecnología y Competencia Digital.
- Inglés completo de A1 a C2, con ocho preguntas y habilidades adaptadas a cada nivel.
- Niveles dependientes de cada materia desde Primaria hasta Bachillerato y temas curriculares seleccionables.
- Constructor editable de ocho preguntas.
- Generación de QR reales con actividad, versión y código anónimo.
- Lote imprimible de 1 a 40 fichas.
- Selección y confirmación docente de respuestas dudosas.
- Edición del refuerzo.
- Test de refuerzo con cuatro respuestas completas por pregunta y solucionario explicado.
- Aula local multidispositivo para ordenadores y tabletas, sin Internet, cuentas ni servicios externos.
- Lectura real de píxeles en una plantilla OMR controlada, con verificación de cuatro referencias, ocho respuestas y confianza calculada por separación de densidad.
- Persistencia versionada de actividad, lectura, diagnóstico, refuerzo y evidencia posterior.
- Diagnóstico por reglas explicables a partir de la respuesta observada y la clave de cada pregunta.
- Exit ticket que parte sin resultado y solo calcula la comparación después de registrar dos respuestas nuevas.
- Modo de clase activa con tres modalidades, tres rondas y contenido adaptado al catálogo curricular.
- Generación real del kit imprimible: estaciones A–D, tarjetas, guion docente y exit ticket.
- Ajustes funcionales de acceso: letra grande, apoyo visual y guion de lectura en voz alta.
- Exportación local del estado realmente almacenado en JSON y borrado integral de claves y cachés de Cuaderno Vivo.
- Interfaz responsive para ordenador y móvil.
- Flujo accesible mediante teclado y estados con nombres comprensibles.

## Límites declarados de la versión actual

- El nuevo flujo funcional del servidor local sí corrige perspectiva, decodifica QR y lee OMR de la plantilla controlada; todavía necesita validación con un corpus de fotografías físicas.
- La primera versión del flujo real admite ocho preguntas tipo test y una página por alumno. La ampliación multipágina, las respuestas numéricas y las abiertas siguen pendientes.
- El recorrido heredado del navegador conserva pantallas y datos ficticios etiquetados —incluido A07— mientras se migran al modelo SQLite; no deben confundirse con expedientes reales.
- Una marca ambigua del flujo real queda sin respuesta y no se guarda como nota. No existe OCR genérico de escritura manuscrita.
- El diagnóstico actual usa reglas locales explicables y editables; no es un diagnóstico clínico ni una inferencia generativa.
- Los refuerzos se basan en plantillas curriculares locales. No existe IA generativa remota.
- El panel inicial y las filas A12/A18 son datos ficticios y se etiquetan expresamente como demostración.

El estado verificable y los bloqueos por fase están en `ESTADO_REAL_CUADERNO_VIVO.md`. No se afirma precisión, ahorro de tiempo ni impacto educativo hasta ejecutar un piloto real.

## Archivos

- `index.html`: estructura de la aplicación.
- `styles.css`: sistema visual y diseño responsive.
- `app.js`: flujo, estados, impresión, QR y exportación.
- `reinforcement.js`: planes adaptativos y materiales de refuerzo para las ocho materias.
- `classroom.js`: interfaz docente y portal de respuesta del alumnado en la red local.
- `classroom_server.py`: servidor de aula local; usa las dependencias declaradas en `requirements-local.txt` y no necesita servicios externos.
- `curriculum-engine.js`: preguntas, respuestas posibles, claves y explicaciones por materia, nivel y tema.
- `product-core.js`: estado pedagógico versionado, OMR controlado, trazabilidad, borrado, exportación y reevaluación.
- `product-core.css`: estilos de validación, evidencia posterior y recuadro OMR.
- `profile-i18n.js`: perfil docente local, idiomas de interfaz y dirección RTL.
- `media/tutorial/`: vídeo, póster y subtítulos del tutorial con profesora virtual.
- `vendor/qrcode.min.js`: generador de QR almacenado localmente.
- `tools/backup_project.py`: crea una copia completa antes de cada modificación.
- `tools/build_dist.py`: construye y valida la carpeta pública `dist/`.
- `tools/generate_pwa_icons.py`: regenera los iconos instalables.
- `manifest.webmanifest`, `service-worker.js` y `pwa.js`: instalación y funcionamiento offline.
- `deployment/`: cabeceras y redirecciones para Netlify.
- `tests/`: contratos estáticos y pruebas E2E reproducibles; `.github/workflows/quality.yml` replica las verificaciones en CI.
- `LICENSE`, `CONTENT_LICENSE.md` y `THIRD_PARTY_NOTICES.md`: licencias del código, contenidos y componente QR.
- `DECLARACION_TRABAJO_PREVIO.md`: inventario honesto del prototipo previo y plantilla de trazabilidad para el hackathon.
- `NETLIFY_PUBLICACION.md`: guía de publicación manual y límites offline.
- `dist/`: resultado de producción listo para subir; no se edita directamente.
- `backups/`: instantáneas y versiones históricas; no contiene el proyecto activo.
- `ESTRATEGIA_PARA_GANAR.md`: decisiones de producto, criterios del jurado y plan de validación.
- `ANALISIS_COMPETITIVO.md`: investigación detallada de ZipGrade, Gradescope, Akindi, Gradient, Plickers y Formative.
- `REQUISITOS_PEDAGOGIA_PRIVACIDAD_ACCESIBILIDAD.md`: requisitos basados en evidencia sobre feedback, dominio, carga docente, RGPD y WCAG.
- `GUION_DEMO_5_MINUTOS.md`: presentación cronológica para el jurado.

## Estado de verificación

Se ha probado automáticamente el recorrido completo en Chrome:

- 8 preguntas.
- 24 alumnos y 24 QR.
- Cambio entre las ocho materias y todos los niveles de Inglés A1–C2, con preguntas, habilidades, QR, revisión y refuerzo adaptados.
- Perfil docente editable con nombre, correo, función, universidad o centro y fotografía local redimensionada.
- Apartado `Tutorial IA` con una profesora virtual, vídeo MP4 narrado de 1:33, cinco capítulos, subtítulos WebVTT y transcripción accesible. Se identifica expresamente como simulación sintética.
- Estudio de refuerzo adaptativo para las ocho materias: grupos flexibles por patrón de error, objetivo y criterio de éxito, cuatro estrategias de explicación, secuencia graduada editable, bifurcación si persiste el error o si se supera, duración y modalidad configurables, apoyos graduados y comprobación espaciada.
- Cada refuerzo conserva el control docente: la propuesta local se presenta como borrador, puede revisarse o regenerarse, requiere aprobación y genera un paquete imprimible de cuatro páginas (guía, test, soluciones y seguimiento).
- El mismo test se ha verificado en un segundo navegador móvil de 390 px: 3 preguntas, 12 respuestas posibles, entrega seudónima, 3 soluciones explicadas y recepción en el panel docente por red local.
- Selector de interfaz con detección automática y paquetes para español, inglés, portugués, francés, alemán, italiano, catalán, gallego, euskera, árabe y chino; incluye dirección RTL para árabe.
- El idioma de la interfaz es independiente del idioma curricular de las actividades. El contenido creado por el profesor no se traduce automáticamente ni se envía a servicios externos.
- Primera experiencia, ayuda y modo fácil verificados.
- Imagen PNG controlada → lectura de ocho marcas → persistencia → revisión → diagnóstico → intervención editable → evidencia posterior.
- Clase activa → selección del modo → ajustes de acceso → generación del kit → impresión.
- Sin errores de JavaScript.
- Sin desbordamiento horizontal en escritorio ni en móvil de 390 px.

## Licencias

- Código propio: MIT, en `LICENSE`.
- Contenidos y recursos propios: CC BY-NC-SA 4.0, en `CONTENT_LICENSE.md`.
- QRCode.js: MIT; origen, hash y aviso en `THIRD_PARTY_NOTICES.md`.
