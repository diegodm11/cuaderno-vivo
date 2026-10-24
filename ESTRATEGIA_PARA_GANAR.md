# Estrategia para competir con Cuaderno Vivo

Fecha de revisión: 22 de octubre de 2026

## 1. Tesis de producto

**Cuaderno Vivo convierte una ficha en papel en una intervención educativa verificable, usando solo el dispositivo del profesor y sin depender de Internet.**

El producto no compite por ser “otro corrector de exámenes”. Su valor está en cerrar un ciclo que normalmente queda fragmentado:

> papel → lectura estructurada → revisión humana → diagnóstico por habilidad → refuerzo específico → segunda actividad → evidencia de mejora

Este enfoque responde de forma directa al Reto 11 de Hack4Edu: identificar dificultades concretas, proponer recuperación personalizada, adaptarse a recursos limitados, permitir supervisión docente y comprobar si hubo mejora [1]. El catálogo oficial muestra además el distintivo **Reto ProFuturo**, por lo que Cuaderno Vivo opta automáticamente al ranking transversal de 1.000 € [11].

## 2. Decisión de modalidad

La opción honesta y estratégicamente correcta es **proyectos acabados y transferibles (senior)**.

La modalidad innovadora exige que el proyecto se desarrolle exclusivamente entre el 3 y el 5 de noviembre de 2026 y permite penalizar la falta de evidencias. Cuaderno Vivo ya tiene investigación, diseño y prototipo previos. La modalidad senior admite trabajo anterior siempre que se declare qué existía antes y qué se construyó durante el hackatón [2].

La puntuación senior es:

- Acabado y calidad final: **30 %**.
- Transferencia al mercado: **30 %**.
- Creatividad e innovación: **20 %**.
- Educación digital con IA en países desfavorecidos: **20 %** [2].

Conclusión: el 60 % depende de demostrar un producto creíble y adoptable. Conviene invertir el tiempo del hackatón en una función técnica real, evidencia de uso y una demo impecable.

## 3. Cómo atacar cada criterio

### 3.1 Acabado y calidad — 30 %

Mostrar, no prometer:

- QR reales y lote imprimible de 24 fichas.
- Flujo completo con A07 y una revisión humana obligatoria.
- Un escaneo real mínimo con OpenCV.js: localizar cuatro esquinas, corregir perspectiva y leer casillas estructuradas.
- Persistencia local mediante IndexedDB.
- Estados de error: QR ilegible, hoja incompleta, fotografía borrosa y respuesta dudosa.
- Prueba automatizada del camino crítico.
- Interfaz usable en móvil y ordenador.

La demostración actual ya cubre el flujo, genera QR e imprime el lote. El reconocimiento óptico real sigue siendo la carencia técnica más importante.

### 3.2 Transferencia — 30 %

Presentar un camino de adopción, no un mercado imaginario:

1. Piloto con una profesora, un tema y 24 alumnos.
2. Medir tiempo manual frente a escaneo y revisión.
3. Ampliar a tres docentes del mismo centro.
4. Crear biblioteca revisada de actividades y errores frecuentes.
5. Ofrecer licencia de centro con almacenamiento local y soporte.

Hipótesis comercial a validar:

- Docente individual: plan gratuito limitado para probar una clase.
- Centro: licencia anual por número de docentes, biblioteca compartida y exportación.
- ONG o administración: despliegue offline y formación en contextos de baja conectividad.

No presentar precios como hechos hasta entrevistar a centros y responsables de compra.

### 3.3 Creatividad e innovación — 20 %

No afirmar que no existen competidores. La innovación defendible es la **integración** de:

- Papel para el alumno.
- Un único dispositivo del profesor.
- Procesamiento local.
- Diagnóstico explicable por habilidad y patrón de error.
- Refuerzo imprimible y editable.
- Segunda medición con preguntas distintas.
- Revisión humana y expresión de incertidumbre.
- Ausencia de cuentas infantiles.

ZipGrade, GradeCam y Akindi demuestran que la corrección de papel tiene demanda [3][5][7]. Gradescope demuestra el valor de la revisión y la analítica por pregunta [4]. Plickers demuestra que un solo dispositivo docente reduce la barrera tecnológica [6]. Cuaderno Vivo debe unir esos patrones con recuperación pedagógica y comprobación posterior.

### 3.4 Contextos vulnerables e IA responsable — 20 %

El argumento fuerte no es “usamos IA”, sino **la IA no crea una nueva dependencia**:

- El flujo base funciona offline con reglas y plantillas.
- La IA es opcional y limitada a proponer variantes o simplificar lenguaje.
- Nunca decide la calificación ni sustituye al docente.
- Cada recomendación muestra evidencia y puede editarse.
- Un centro sin conexión conserva generación, corrección, diagnóstico y refuerzo local.
- El alumno solo necesita papel y lápiz.

El reto oficial menciona conectividad limitada y supervisión docente [1]. El Reto 11 lleva el distintivo ProFuturo [11], cuya rúbrica valora por igual impacto social, inclusión/equidad, sostenibilidad/escalabilidad e IA ética y responsable [2]. La demo debe atacar expresamente esos cuatro bloques, además de la modalidad senior.

## 4. Aprendizajes de productos profesionales

| Producto | Patrón útil | Lo que Cuaderno Vivo debe añadir |
|---|---|---|
| ZipGrade | Escaneo rápido, hojas de respuesta y resultados inmediatos [3] | Diagnóstico por habilidad, refuerzo y reevaluación |
| Gradescope | Revisión, rúbricas, agrupación y estadísticas por pregunta [4] | Papel accesible en Primaria, flujo offline y recuperación imprimible |
| Akindi | Flujo de alto volumen con papel ordinario, integración y soporte [5] | Un dispositivo móvil, intervención por error y evidencia de mejora |
| Plickers | Participación física con el dispositivo del profesor [6] | Trabajo escrito, trazabilidad individual y segunda oportunidad |
| GradeCam | Resultados en tiempo real a partir de papel [7] | Incertidumbre visible, explicación pedagógica y ciclo de recuperación |

Decisiones adoptadas en la app profesional:

- Panel de trabajo con decisiones pendientes, no una portada comercial.
- Una acción principal por pantalla.
- Cola de escaneo y umbral de confianza visibles.
- Evidencia original al lado de la decisión docente.
- Diagnóstico que indica preguntas y patrón observado.
- Borrador de refuerzo editable antes de imprimir.
- Comparación “antes/después” con instrumentos diferentes.
- Registro de datos local y controles de borrado visibles.

## 5. Producto mínimo que sí puede ganar

### Debe funcionar de verdad

1. Crear una actividad de ocho preguntas.
2. Relacionar preguntas con cuatro habilidades.
3. Generar 24 fichas y QR válidos.
4. Imprimir o exportar el lote.
5. Fotografiar una ficha real.
6. Corregir perspectiva.
7. Leer casillas A–D.
8. Separar lecturas seguras y dudosas.
9. Confirmar una respuesta como docente.
10. Calcular el perfil por habilidades.
11. Elegir un refuerzo de una biblioteca local.
12. Guardar el resultado en el dispositivo.
13. Procesar un exit ticket y comparar.

### Puede ser demostración controlada

- Una única clase.
- Una asignatura.
- Un tema.
- Ocho preguntas.
- Cuatro habilidades.
- Una biblioteca pequeña de errores y refuerzos.
- Un único modelo de ficha.

### Debe quedar fuera

- Escritura manuscrita libre.
- Redacciones o dibujos.
- Diagnósticos clínicos o psicológicos.
- Recomendaciones autónomas sin revisión.
- Sincronización obligatoria con una nube.
- Promesas de precisión universal.

## 6. Uso responsable de los datos

La versión de concurso debe aplicar minimización real:

- QR con actividad, versión y código anónimo; nunca nombre o nota.
- Relación código–nombre separada y opcional.
- Imágenes temporales eliminadas tras confirmar.
- Datos locales cifrables y exportables.
- Plazo de conservación configurable.
- Borrado completo desde una sola pantalla.
- Registro comprensible de qué datos existen.

El RGPD establece un marco europeo para el tratamiento de datos personales [8]. Antes de pilotar con menores reales, el centro debe definir base jurídica, responsables, retención, información a familias y evaluación de riesgos con su delegado de protección de datos. La app no debe presentar “cumple RGPD” como una certificación automática.

## 7. Accesibilidad

Objetivo: **WCAG 2.2 AA**, que organiza los requisitos alrededor de contenido perceptible, operable, comprensible y robusto [9]. Además, el Diseño Universal para el Aprendizaje recomienda ofrecer múltiples formas de implicación, representación y acción/expresión; en Cuaderno Vivo esto se traduce en combinar papel, explicación visual, ejemplo guiado y práctica contextualizada [10].

Checklist mínima:

- Navegación completa por teclado.
- Foco visible.
- Contraste suficiente.
- Etiquetas de formularios y nombres accesibles.
- Estados que no dependan solo del color.
- Objetivos táctiles amplios.
- Respeto por “reducir movimiento”.
- Mensajes de error concretos y recuperables.
- Lenguaje docente directo.

## 8. Validación que convencerá al jurado

Realizar un piloto pequeño antes de la final o, como mínimo, una prueba controlada durante el hackatón:

| Métrica | Método | Umbral inicial propuesto |
|---|---|---|
| Tiempo por 24 fichas | Cronometrar corrección manual y flujo CV | Ahorro ≥ 30 % |
| Lectura de marcas | Comparar con etiquetado humano | ≥ 95 % en fotos aceptables |
| Revisión requerida | Porcentaje bajo el umbral de confianza | ≤ 15 % |
| Acuerdo diagnóstico | Profesor vs. sistema por habilidad | ≥ 85 % |
| Preparación del refuerzo | Tiempo hasta ficha imprimible | < 3 minutos |
| Mejora | Actividad inicial vs. exit ticket paralelo | Reportar, no fijar de antemano |
| Usabilidad docente | Escala breve y entrevista | ≥ 4/5 |

Estos son objetivos de validación, no resultados actuales. No inventar cifras.

## 9. Plan de trabajo durante el hackatón

### Antes del evento

- Congelar y fechar el prototipo previo.
- Preparar 30–50 fotografías reales bajo distintas luces y ángulos.
- Definir la “verdad de referencia” de cada respuesta.
- Confirmar modalidad senior y el reto exacto.

### Días 3–5 de noviembre

- **Bloque 1:** OpenCV.js y lectura real de una ficha.
- **Bloque 2:** IndexedDB y estados de error.
- **Bloque 3:** biblioteca local de errores/refuerzos.
- **Bloque 4:** pruebas con fichas reales y medición.
- **Bloque 5:** vídeo de tres minutos, presentación de cinco minutos y repositorio.

Las bases exigen presentación de cinco minutos, vídeo de tres minutos y enlace al código; la fase final también limita la presentación a cinco minutos [2]. El código debe publicarse con licencia libre y debe diferenciarse claramente el trabajo previo del realizado durante el evento [2].

## 10. Preguntas difíciles del jurado

**“¿Esto no es ZipGrade?”**
ZipGrade corrige papel. Cuaderno Vivo utiliza esa lectura como inicio: explica la habilidad, propone una intervención y comprueba si funcionó.

**“¿Dónde está la IA?”**
En una capa opcional y supervisada para adaptar lenguaje o crear variantes. El diagnóstico central es explicable y puede funcionar con reglas offline.

**“¿Qué ocurre si la cámara se equivoca?”**
Las lecturas con confianza baja nunca se aceptan en silencio. La profesora ve el recorte, la propuesta y decide.

**“¿Cómo protegéis a los menores?”**
Sin cuentas infantiles, QR seudónimos, procesamiento local, imágenes temporales y borrado controlado por el centro.

**“¿Cómo sabéis que aprende?”**
No comparamos la misma pregunta: usamos un exit ticket diferente que mide la misma habilidad.

**“¿Qué habéis validado?”**
Responder solo con datos realmente medidos. Separar prototipo, hipótesis y resultados.

## Sources

[1] https://profuturo.education/hack4edu — Hack4Edu 2026 — página oficial, retos y calendario
[2] https://drive.google.com/file/d/1L151uGDggEYGm7MJs4u6ZzBib7a7gXii/view — Hack4Edu 2026 — Bases de participación
[3] https://www.zipgrade.com — ZipGrade — paper grading and standards tracking
[4] https://www.gradescope.com — Gradescope — grading, analytics and AI-assisted review
[5] https://www.akindi.com — Akindi — paper and online test scoring
[6] https://get.plickers.com — Plickers — one-device formative assessment
[7] https://gradecam.com — GradeCam — scan-to-score assessment
[8] https://commission.europa.eu/law/law-topic/data-protection/legal-framework-eu-data-protection_en — European Commission — EU data protection framework
[9] https://www.w3.org/WAI/standards-guidelines/wcag — W3C — WCAG 2 overview
[10] https://www.cast.org/what-we-do/universal-design-for-learning — CAST — Universal Design for Learning
[11] https://view.genially.com/687788b1fe4977c4e0387fc3 — Hack4Edu 2026 — catálogo oficial y distintivo Reto ProFuturo
