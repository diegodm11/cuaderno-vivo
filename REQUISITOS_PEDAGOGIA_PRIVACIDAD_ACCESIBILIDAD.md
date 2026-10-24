# Cuaderno Vivo: evidencia y requisitos de producto

**Contexto asumido:** Primaria; menores; identificadores seudónimos; uso principal docente; captura desde papel; funcionamiento sin conexión; diagnóstico por habilidades. **Corte de investigación:** octubre de 2026.

## Decisiones ejecutivas

1. La unidad central del producto debe ser **habilidad → evidencia → decisión docente → apoyo → nueva evidencia**, no «actividad → nota».
2. El feedback solo cuenta como completado cuando el alumno dispone de una ocasión para usarlo; medir comentarios emitidos incentivaría trabajo visible, no aprendizaje.
3. La segunda oportunidad debe ser parte normal del modelo de dominio: conservar el historial, pero no castigar el aprendizaje posterior promediando mecánicamente intentos antiguos.
4. La reducción de carga es un resultado de producto que debe instrumentarse y validarse, no una promesa: tiempo por clase, duplicación evitada y correcciones pendientes.
5. La seudonimización reduce riesgo, pero **no saca los datos del RGPD**: Cuaderno Vivo seguirá tratando datos personales indirectamente identificables.[8]
6. El objetivo técnico debe ser WCAG 2.2 AA y compatibilidad con EN 301 549; si el servicio se presta desde un colegio u organismo público, el Real Decreto 1112/2018 exige accesibilidad integral, revisión y declaración.[10][11]

---

## 1. Evaluación formativa y diagnóstico por habilidades

La EEF define la evaluación formativa como actividades que informan al docente del nivel de comprensión sin contribuir a la evaluación formal o la calificación; además, señala que comprender brechas concretas y decidir cómo hacer progresar al alumno forma parte de las bases del feedback eficaz.[5]

| Hallazgo | Exigencia concreta de producto | Pantalla / control | Métrica de aceptación o resultado |
|---|---|---|---|
| La evaluación formativa debe cambiar la instrucción, no limitarse a registrar puntuaciones.[4][5] | Toda evidencia deberá enlazarse a **una o más habilidades y criterios de éxito**, y terminar en una decisión: «seguir», «volver a explicar», «practicar», «ampliar» o «observar». | Ficha de evidencia con habilidad, criterio, observación y «siguiente acción» obligatoria cuando haya brecha. | `% de evidencias con siguiente acción`; `% de acciones ejecutadas`; evolución de la habilidad tras la acción. |
| Una puntuación total oculta conceptos erróneos distintos. | Mostrar diagnóstico por habilidad y error/concepción, no solo promedio. No combinar habilidades diferentes en un único semáforo sin desglose. | **Mapa de clase por habilidades**: filas de alumnos seudónimos, columnas de habilidades; cada celda abre evidencias, fecha, fuente y error observado. | Cobertura de evidencia por habilidad; número de habilidades sin evidencia reciente; distribución de errores por habilidad. |
| Una sola respuesta no justifica una conclusión estable. | Separar «evidencia observada» de «inferencia de dominio». Mostrar recencia, número y diversidad de evidencias y permitir estado **insuficiente/incierto**. | Chip de confianza («baja/media/alta») explicable; enlace «por qué aparece este estado». | Falsos cambios de estado; `% de dominio basado en ≥2 evidencias y ≥2 momentos`; tasa de correcciones manuales. |
| La evaluación formativa no es calificación sumativa.[5] | Las actividades serán **formativas por defecto** y no alimentarán boletines/notas salvo acción explícita y autorizada. | Selector «formativa / sumativa» con explicación; bloqueo de exportación a nota desde una evidencia formativa sin confirmación. | `% de evidencias formativas convertidas en nota`; auditoría de quién/cuándo confirmó. |
| El docente necesita decidir para grupos, no revisar 30 fichas una a una. | Proponer agrupamientos por necesidad común, siempre editables y sin etiquetas permanentes de capacidad. | Panel «próxima clase»: habilidades prioritarias, alumnos que comparten error y actividad sugerida; botón «reagrupar». | Tiempo hasta plan de reenseñanza; `% de sugerencias editadas`; progreso del grupo tras intervención. |
| El contexto incluye papel y conectividad irregular. | La captura esencial deberá funcionar offline y con entrada rápida desde papel, sin obligar a digitalizar cada trabajo. | Cuadrícula de lista de clase con códigos configurables, notas cortas/voz opcional y cola de sincronización visible. | Tiempo mediano para registrar una clase; tasa de registros incompletos; errores/conflictos de sincronización. |

**Prohibiciones de diseño:** ranking público de alumnado; etiqueta fija «bajo/alto»; colorear sin texto/icono; convertir ausencia de evidencia en «no sabe»; presentar una recomendación algorítmica como diagnóstico definitivo.

## 2. Feedback que se puede usar

La EEF encuentra un efecto medio alto del feedback (+6 meses en su escala comparativa; 155 estudios, revisión de 2021), pero advierte de gran variabilidad y posibles efectos negativos. El feedback eficaz se centra en tarea, materia y autorregulación, da información específica para mejorar, puede ser verbal, escrito, entre pares o digital y debe incluir oportunidades de actuación.[5] Su guía resume tres principios: bases de buena enseñanza y evaluación formativa; feedback oportuno que haga avanzar; y planificación de cómo se recibirá y utilizará.[4]

| Hallazgo | Exigencia concreta de producto | Pantalla / control | Métrica correcta |
|---|---|---|---|
| El feedback útil aclara la meta, qué se logró y cómo mejorar.[4][5] | Editor estructurado en **«Logrado / Siguiente paso / Ayuda o ejemplo»**, vinculado al criterio; evitar comentario libre como única opción. | Plantillas breves editables por habilidad; soporte de texto, código y registro de feedback verbal. | `% con siguiente paso específico`; legibilidad; muestra auditada por rúbrica de calidad. |
| El feedback sobre la persona es menos eficaz que el centrado en tarea/proceso/autorregulación.[5] | Detector no bloqueante de elogio vacío o etiquetas personales («eres listo/malo») y sugerencia de reformulación objetiva. | Aviso contextual, nunca autocorrección silenciosa. | Tasa de reformulación; revisión humana de falsos positivos. |
| La frecuencia óptima no debe sobreespecificarse y el método importa menos que los principios.[4][5] | No exigir X comentarios por semana, color de bolígrafo ni «sello» de feedback verbal. Admitir feedback grupal, verbal y códigos compartidos. | Configuración de centro basada en principios, sin cuotas obligatorias por alumno. | No usar «número de comentarios» como KPI de desempeño docente. |
| El alumno debe recibir tiempo y ocasión para usar el feedback.[4][5] | Al publicar feedback, asignar «corregir», «explicar», «reintentar» o «aplicar en nueva tarea»; la tarjeta queda **abierta** hasta aportar nueva evidencia o cierre docente. | Bandeja «Feedback por actuar» para docente/alumno; en papel, hoja imprimible con casilla/espacio de revisión. | **Cierre del bucle** = feedback con respuesta posterior / feedback emitido; tiempo a actuación; mejora en la habilidad. |
| La oportunidad depende del momento y del contenido.[4] | Permitir feedback inmediato o diferido; mostrar vencimiento por valor pedagógico, no una SLA universal. | Control «cuándo debe verlo/usar» y prioridad. | Mediana evidencia→feedback y feedback→acción, segmentadas por tipo de tarea, sin convertirlas en cuota rígida. |
| El feedback digital puede ayudar, pero su efecto medio es menor que el global y requiere prudencia.[5] | La generación automática será solo borrador; el docente deberá revisar, editar y publicar. No generar inferencias psicológicas ni diagnósticos. | Etiqueta «borrador generado», fuentes/evidencias visibles, confirmación humana y registro de edición. | Tasa de aceptación sin cambios (alerta si excesiva); errores detectados; reclamaciones/correcciones. |

## 3. Aprendizaje para dominio y segunda oportunidad

El modelo de aprendizaje para dominio mantiene constantes los objetivos y permite variar tiempo y apoyo: unidades pequeñas con objetivos claros, comprobación formativa, apoyo correctivo y nueva oportunidad para demostrar aprendizaje.[6] La EEF también describe que estos enfoques combinan feedback con apoyo adicional a quienes van rezagados.[5]

| Hallazgo | Exigencia concreta de producto | Pantalla / control | Métrica correcta |
|---|---|---|---|
| El avance se decide por habilidad, no por acabar una ficha. | Estados por habilidad: «sin evidencia», «en desarrollo», «listo para comprobar», «dominio provisional», «dominio confirmado». Umbral configurable por centro/docente; nunca umbral universal oculto. | Línea de progreso por habilidad con criterio, evidencias y decisión docente. | Tiempo a dominio; `% que alcanza dominio`; distribución de apoyos e intentos, sin convertir intentos en castigo. |
| Quien aún no domina necesita apoyo diferente antes de repetir. | Un reintento requerirá registrar apoyo (reenseñanza, ejemplo trabajado, práctica guiada, compañero, material manipulativo), salvo anulación razonada. | Flujo **evidencia → brecha → apoyo → reintento**. | Ganancia apoyo→reintento; eficacia por tipo de apoyo y habilidad. |
| Una segunda oportunidad debe reflejar aprendizaje nuevo. | Mantener todos los intentos para trazabilidad, pero el estado actual usará evidencia reciente y relevante; **no promediar automáticamente** el primer fallo con el logro posterior. | Historial cronológico y control «evidencia que sustenta el estado actual»; exportación distingue intento y estado. | `% de alumnos que dominan tras apoyo`; cambio entre intentos; no «nota media de intentos» como KPI de dominio. |
| El acierto inmediato puede no transferir ni mantenerse. | «Dominio confirmado» exigirá comprobación posterior o en contexto distinto configurable; si no existe, mostrar «provisional». | Recordatorio de retención/transferencia en calendario docente. | Retención a 2–6 semanas (ventana configurable); transferencia a tarea nueva. |
| El algoritmo no sustituye el juicio docente. | Toda recomendación y cambio automático será explicable, reversible y con anulación docente; no habrá decisiones académicas exclusivamente automatizadas. | Panel «por qué» con evidencias; override con motivo breve; log. | Tasa y causas de override; discrepancias por grupos; auditoría de sesgos. |

## 4. Carga docente y adopción real

La EEF advierte del coste de oportunidad: algunas formas de feedback escrito consumen mucho tiempo y pueden reducir planificación y bienestar; recomienda vigilar carga y favorecer métodos con propósito y eficiencia.[4][5] El grupo oficial de revisión del Department for Education resume la corrección eficaz como **significativa, manejable y motivadora**.[7]

| Hallazgo | Exigencia concreta de producto | Pantalla / control | Métrica / umbral de piloto |
|---|---|---|---|
| Registrar dos veces destruye valor. | Fuente única de evidencia: una captura alimenta mapa de habilidades, seguimiento y exportaciones; importación/exportación CSV y API donde proceda. | Flujo de importación con previsualización y deshacer; no pedir el mismo dato en dos módulos. | Entradas duplicadas por clase; minutos de recaptura; tasa de importación correcta. |
| Corregir de forma individual no siempre es la mejor intervención. | Acciones masivas editables: feedback grupal, código por error común, asignar apoyo/reintento a un grupo, atajos de teclado. | Selección múltiple en mapa de clase; plantillas nunca publicadas sin previsualización. | Tiempo para procesar una clase; clics por alumno; porcentaje resuelto en lote. |
| La herramienta debe probar que ahorra tiempo. | Telemetría de carga **privada para el docente y agregada para producto**, sin vigilancia individual del rendimiento. | Panel personal «tiempo invertido / tareas evitadas» y opt-out de analítica no esencial. | Objetivo a validar en piloto: mediana ≤10 min para registrar una comprobación de 25 alumnos y ≤30 s para abrir/actualizar una habilidad; reducción frente a línea base, no solo cumplimiento absoluto. |
| Offline introduce riesgo de pérdida/conflicto. | Guardado local automático cifrado, indicador de estado, reintento y resolución comprensible de conflictos; nunca borrar silenciosamente. | «Guardado en este dispositivo / pendiente / sincronizado» con fecha; comparación de versiones. | Pérdida de datos = 0 en pruebas; tasa de conflicto; tiempo de recuperación. |
| Las políticas pueden crear trabajo performativo.[4] | El panel directivo mostrará cobertura y necesidades de apoyo, no «docentes con menos comentarios»; prohibir KPI de volumen bruto. | Roles y vistas separadas; informes agregados por defecto. | Número de métricas de vigilancia individual deshabilitadas; encuesta de carga y utilidad. |

> Los umbrales de 10 min y 30 s son **hipótesis de aceptación del piloto**, no cifras derivadas de la literatura; deberán contrastarse con línea base observada en docentes de Primaria.

## 5. Privacidad infantil y RGPD

El EDPB recuerda que un identificador indirecto sigue siendo dato personal; exige licitud/transparencia, limitación de finalidad, minimización, exactitud, conservación limitada y seguridad.[8] La AEPD señala que el centro/Administración suele ser responsable y el proveedor encargado; el tratamiento necesario para la función educativa normalmente no se basa en consentimiento, pero debe informarse de forma clara. Para finalidades distintas se necesita base separada; en España, si se usa consentimiento, el menor puede prestarlo desde los 14 años y por debajo deben hacerlo padres/tutores. La AEPD también exige contrato con el encargado, finalidad limitada, seguridad y devolución o destrucción al terminar.[9]

| Riesgo / obligación | Exigencia concreta P0 | Pantalla / control verificable |
|---|---|---|
| Seudónimo ≠ anónimo.[8] | IDs aleatorios sin nombre en operación ordinaria; tabla identidad↔ID separada y bajo control del centro. Prohibir inferir que la seudonimización elimina RGPD. | Vista por seudónimo por defecto; permiso específico «ver identidad»; log de revelaciones. |
| Minimización y finalidad.[8] | Para diagnosticar habilidades no serán obligatorios nombre completo, foto, fecha de nacimiento, email, domicilio, salud ni datos familiares. Campos libres con aviso contra datos sensibles. Sin publicidad, tracking entre servicios, venta de datos ni entrenamiento de modelos con datos del alumnado. | Formulario de alta mínimo; catálogo de datos/finalidades/base jurídica; controles independientes para usos opcionales. |
| Base jurídica no es siempre consentimiento.[9] | Configuración por centro de responsable, encargado, finalidad y base jurídica. El uso educativo esencial no se bloqueará tras una casilla de «consentimiento» ficticio. Consentimientos opcionales serán granulares, registrables y revocables. | Asistente de puesta en marcha con validación del DPD; registro de versión y retirada del consentimiento. |
| Transparencia comprensible para menores.[8][9] | Aviso en dos capas: resumen infantil con lenguaje y visuales adecuados a edad + aviso completo para familias/centro; explicar datos, finalidad, destinatarios, conservación, derechos y contacto del DPD. | Enlace persistente «Tus datos»; prueba de comprensión con niños, no dark patterns. |
| Proveedor como encargado.[9] | Contrato art. 28/DPA antes de activar nube: instrucciones documentadas, confidencialidad, medidas, subencargados, asistencia en derechos/brechas, devolución/borrado y auditoría. | Consola de administración muestra región, subencargados y exporta DPA; cambio de subencargado genera aviso/control contractual. |
| Conservación limitada y derechos.[8] | Plazos por categoría y centro; borrado/anonimización al vencer y al terminar contrato, con bloqueo legal cuando proceda. Exportación, rectificación, limitación y supresión gestionables por el responsable. | Panel de retención con previsualización; cola de solicitudes; justificante y log de borrado. |
| Seguridad proporcional.[8][9] | Cifrado en tránsito y reposo, incluida caché offline; bloqueo/PIN del dispositivo, RBAC mínimo, MFA para administradores, backups cifrados, rotación/revocación, logs y proceso de brechas. | Matriz de permisos profesor/coordinador/admin/soporte; sesiones y dispositivos revocables; auditoría exportable. |
| Datos de menores y diagnóstico pueden elevar riesgo. | Realizar y documentar EIPD/DPIA antes del piloto si el análisis confirma alto riesgo; revisión al añadir IA, biometría, salud, monitorización amplia o nuevos usos. | Gate de lanzamiento «EIPD aprobada por responsable/DPD»; registro de riesgos, medidas y riesgo residual. |
| Nube/transferencias.[9] | Residencia EEE por defecto; inventario de localización y transferencias, mecanismo jurídico y evaluación cuando salgan del EEE. El modo offline no debe sincronizar con servicios personales del docente. | Selector de región bloqueado por tenant; pantalla de transferencias/subencargados; exportación del inventario. |
| Papel y soporte también exponen datos. | Impresos sin nombre cuando sea viable, códigos de clase rotables, sin información sensible en QR; soporte técnico sin acceso por defecto y acceso temporal aprobado. | Generador de hojas seudónimas; «acceso de soporte» con caducidad y log. |

**Gate de lanzamiento P0:** no piloto con menores hasta tener registro de tratamientos, DPA, roles, retención/borrado probado, cifrado offline, control de subencargados/transferencias, procedimiento de brecha, aviso infantil/familiar y evaluación de necesidad de EIPD. La guía AEPD exige además conocer y revisar política de privacidad/condiciones de las aplicaciones antes de usarlas y rechazar las que no informen del tratamiento.[9]

## 6. Accesibilidad e inclusión

WCAG 2.2 organiza la accesibilidad en contenido perceptible, operable, comprensible y robusto e incorpora criterios relevantes para móvil, foco, arrastre, tamaño de objetivos y autenticación accesible.[10] El RD 1112/2018 exige esos cuatro principios, integrar accesibilidad en diseño, gestión, mantenimiento y actualización, y publicar/revisar al menos anualmente una declaración de accesibilidad en servicios públicos.[11]

| Hallazgo | Exigencia concreta de pantalla/control | Prueba / métrica |
|---|---|---|
| No depender de visión del color. | Cada estado de habilidad tendrá texto + icono/patrón; contraste WCAG AA (texto normal ≥4,5:1; grande ≥3:1; controles/gráficos esenciales ≥3:1). Modo impresión monocromo. | Tests automáticos + revisión manual de todos los estados y heatmaps. |
| Todo debe ser operable por teclado y tecnología asistiva. | Orden lógico; foco siempre visible y no oculto; saltar a contenido; modales que devuelven foco; sin trampas; todas las acciones masivas y conflictos offline operables sin ratón. | 100% de flujos críticos completos solo con teclado y con lector de pantalla. |
| Las tablas/heatmaps son difíciles para lector de pantalla. | Tabla semántica con encabezados, resumen textual («5 alumnos necesitan apoyo en fracciones») y vista de lista equivalente; nombres, roles y estados programáticos. | Axe/ARIA + prueba NVDA/VoiceOver; cero celdas sin encabezado/nombre. |
| Objetivos pequeños perjudican uso táctil y motor. | Objetivos de al menos 24×24 CSS px o separación equivalente (preferencia de diseño: 44×44 para Primaria), alternativa a arrastrar y soltar. | Auditoría 2.5.7/2.5.8; prueba táctil en tablet. |
| Zoom/reflow y lectura. | Funcional a 200% y a 320 CSS px sin scroll bidimensional salvo tablas justificadas, con alternativa de lista; texto seleccionable, idioma declarado, encabezados reales. | Capturas/regresión a 320 px y 200%; sin pérdida de contenido/acción. |
| Errores y sincronización deben anunciarse. | Etiqueta, instrucción, error específico y cómo corregir; `aria-live` para guardado/sincronización/feedback publicado sin mover foco; no depender de toast efímero. | Todos los errores de formulario identifican campo y solución; lector anuncia cambios. |
| Autenticación cognoscitivamente accesible. | Permitir gestores de contraseñas y pegar; no exigir recordar/transcribir acertijos; MFA con opciones accesibles y códigos de recuperación. | Prueba WCAG 3.3.8; flujo completo sin prueba cognitiva. |
| El papel también debe ser accesible. | Exportación HTML accesible y PDF etiquetado, además de versión imprimible con cuerpo legible, alto contraste, lenguaje claro, espacio para escritura y opción de letra grande. No usar QR como único acceso. | PDF/UA cuando aplique; comprobación de etiquetas/orden; prueba con familias/docentes. |
| Accesibilidad es proceso continuo.[11] | Declaración de accesibilidad enlazada, canal de aviso, inventario de excepciones y revisión en cada release; auditoría externa antes de despliegue público y anual. | `% criterios WCAG 2.2 AA superados`; defectos críticos abiertos; tiempo de resolución; declaración actualizada ≤12 meses. |

**Criterio contractual recomendado:** conformidad WCAG 2.2 AA para web/PWA y EN 301 549 para adquisición pública, sin aceptar un overlay como sustituto de código accesible. El mínimo legal exacto deberá confirmarse para cada despliegue y versión armonizada vigente; el objetivo WCAG 2.2 AA es deliberadamente más duradero.

---

## Cuadro de mando mínimo (sin incentivos perversos)

1. **Aprendizaje:** dominio provisional/confirmado por habilidad; cambio tras apoyo; retención/transferencia; habilidades sin evidencia suficiente.
2. **Bucle formativo:** `% feedback actuado`, tiempo feedback→acción, mejora tras acción, brechas con siguiente paso pendiente.
3. **Equidad:** resultados y falsos cambios de estado por grupos solo cuando exista base jurídica, tamaño suficiente y riesgo de reidentificación controlado; nunca mostrar grupos diminutos.
4. **Carga:** tiempo activo por flujo y clase, recaptura, clics, conflictos offline y percepción docente; no ranking de profesores.
5. **Privacidad:** accesos privilegiados, solicitudes de derechos, borrados vencidos, dispositivos revocados, incidentes y subencargados; sin datos de alumnado en analítica de producto cuando baste agregación.
6. **Accesibilidad:** cobertura de flujos críticos, fallos AA, prueba teclado/lector, incidencias y antigüedad de la declaración.

## Sources

[4] https://d2tic4wvo1iusb.cloudfront.net/production/eef-guidance-reports/feedback/Teacher_Feedback_to_Improve_Pupil_Learning.pdf — EEF — Teacher Feedback to Improve Pupil Learning
[5] https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/feedback — EEF Teaching and Learning Toolkit — Feedback
[6] https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/mastery-learning — EEF Teaching and Learning Toolkit — Mastery learning
[7] https://www.gov.uk/government/publications/reducing-teacher-workload-marking-policy-review-group-report — DfE — Reducing teacher workload: marking policy review group report
[8] https://www.edpb.europa.eu/sme/learn-the-basics/data-protection-basics_en — EDPB — Data protection basics
[9] https://www.aepd.es/guias/guia-centros-educativos.pdf — AEPD — Guía para centros educativos
[10] https://www.w3.org/TR/WCAG22 — W3C — Web Content Accessibility Guidelines (WCAG) 2.2
[11] https://www.boe.es/buscar/act.php?id=BOE-A-2018-12699 — BOE — Real Decreto 1112/2018 sobre accesibilidad web y apps del sector público
