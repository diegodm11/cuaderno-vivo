# Publicación manual en Netlify

Este documento prepara la publicación, pero no la realiza. La única carpeta que debe subirse es `dist`.

## 1. Generar una versión nueva

Desde Terminal, dentro de la carpeta principal:

```bash
cd /Users/administrador/Desktop/Cuaderno_Vivo_Hack4Edu
python3 tools/backup_project.py
python3 tools/build_dist.py
```

La compilación limpia y reconstruye `dist/`. No subas la raíz completa porque contiene documentos internos y copias de seguridad.

## 2. Subir desde Safari

1. Abre Finder y entra en `/Users/administrador/Desktop/Cuaderno_Vivo_Hack4Edu`.
2. Comprueba que dentro de `dist` están `index.html`, `manifest.webmanifest`, `service-worker.js`, `_headers`, `_redirects`, `icons`, `media` y `vendor`.
3. Abre Safari y visita `https://app.netlify.com/drop`.
4. Arrastra la carpeta `dist` completa sobre el área “Drag & drop to publish instantly”. También puedes pulsar el selector de carpeta de esa página y elegir `dist`.
5. Espera a que Netlify termine. Recibirás una dirección HTTPS terminada en `.netlify.app`.
6. Abre la dirección en una pestaña privada o en otro dispositivo y revisa Inicio, Crear actividad, Tutorial IA y Preparar refuerzos.
7. Si Netlify ofrece reclamar o personalizar el proyecto, inicia sesión solo si quieres conservarlo y cambiar el subdominio. Comprueba que la visibilidad sea pública antes de compartirlo.
8. Copia la URL HTTPS y envíala por WhatsApp. No envíes una ruta `file://` ni `localhost` porque solo funcionan en tu Mac.

## 3. Instalar la PWA

La primera carga necesita Internet para descargar y almacenar la aplicación.

- iPhone o iPad: abre la URL en Safari, pulsa Compartir y elige “Añadir a pantalla de inicio”.
- Mac: abre la URL en Safari y utiliza Archivo → Añadir al Dock cuando esté disponible.
- Android: abre la URL en Chrome y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.

Después de que la primera carga haya terminado, la aplicación, el vídeo, los subtítulos y el generador QR están disponibles sin conexión.

## 4. Actualizaciones futuras

1. Modifica siempre el proyecto principal, nunca `dist` directamente.
2. Crea la copia de seguridad obligatoria.
3. Ejecuta `python3 tools/build_dist.py`.
4. Vuelve a arrastrar la nueva carpeta `dist` al panel de despliegues del mismo sitio de Netlify.
5. Abre la aplicación una vez con Internet para que la PWA descargue la nueva caché.

Cada compilación genera un identificador de caché diferente para evitar conservar JavaScript o CSS antiguos.

## Privacidad y límites

- `dist` no contiene nombres, correos ni expedientes reales de alumnos.
- Los códigos A01–A40, resultados y perfiles iniciales son demostraciones ficticias.
- Los datos introducidos en el perfil se guardan en `localStorage` del dispositivo; Netlify no los recibe ni los sincroniza.
- No existe autenticación ni backend. Cualquier persona que tenga el enlace público puede abrir la demostración.
- El escaneo y el reconocimiento óptico son una simulación. Cargar una foto funciona sin conexión, pero no ejecuta OCR real.
- Los QR se generan localmente y funcionan sin conexión.
- La impresión funciona sin conexión; “Guardar como PDF” depende del cuadro de impresión de Safari o del sistema operativo.
- El almacenamiento local es independiente en cada navegador y puede perderse al borrar los datos del sitio, usar navegación privada o desinstalar la PWA.

## Referencias oficiales

- Netlify Drop: https://app.netlify.com/drop
- Documentación de despliegue manual: https://docs.netlify.com/deploy/create-deploys/#drag-and-drop
