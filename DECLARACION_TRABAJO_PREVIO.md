# Declaración de trabajo previo y trazabilidad

Fecha de corte previa al Hack4Edu 2026: **2 de noviembre de 2026, 23:59 CET**.

Este documento debe actualizarse y firmarse por el equipo antes de la entrega. Su finalidad es distinguir el prototipo existente del trabajo realizado durante el evento.

## Componentes existentes antes del hackathon

- Identidad visual y navegación de Cuaderno Vivo Pro.
- Catálogo curricular de ocho materias e Inglés A1–C2.
- Generación local de fichas y códigos QR seudónimos.
- Perfil docente local, idiomas y modo RTL.
- Tutorial audiovisual de Alba, identificado como simulación generada con IA.
- Estudio de refuerzos basado en reglas y plantillas locales.
- Modo de clase activa y materiales imprimibles.
- PWA, caché offline y configuración de publicación.
- Lectura OMR limitada a una plantilla controlada de ocho filas.
- Persistencia local del ciclo actividad–lectura–revisión–diagnóstico–refuerzo–reevaluación.
- Suite E2E, CI, licencias y avisos de terceros.

## Trabajo que deberá identificarse durante el hackathon

Registrar para cada cambio:

1. Fecha y hora.
2. Persona responsable.
3. Problema resuelto.
4. Archivos modificados.
5. Prueba o evidencia.
6. Commit correspondiente.

| Fecha | Responsable | Cambio | Evidencia | Commit |
|---|---|---|---|---|
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

## Componentes externos

- QRCode.js, licencia MIT; detalle y hash en `THIRD_PARTY_NOTICES.md`.
- Navegador y APIs web estándar para Canvas, almacenamiento, impresión y PWA.
- No hay servicios de IA remotos, telemetría ni backend en la versión declarada.

## Limitaciones que no deben ocultarse

- La lectura no corrige perspectiva ni procesa una hoja completa arbitraria.
- El QR de la fotografía no se decodifica todavía.
- La confianza OMR no se ha validado con un corpus real.
- Los diagnósticos son reglas pedagógicas explicables, no inferencias clínicas.
- No existen todavía resultados reales de ahorro de tiempo o impacto educativo.
