# Chat Socket.IO UNA

Aplicación de chat en tiempo real desarrollada con Node.js, Express y Socket.IO. Además de mensajes de texto, el chat reconoce URLs de imágenes y videos y las muestra directamente en la conversación.

## Características

- Chat en tiempo real con Socket.IO.
- Nombre de usuario y color asignado por cliente.
- Renderizado de imágenes mediante etiquetas `<img>`.
- Reproducción de videos de YouTube mediante `<iframe>`.
- Reproducción de archivos de video directos (`.mp4`, `.webm`, `.ogg`) con `<video controls>`.
- Validación y sanitización de todo el contenido enviado por los usuarios.
- Pruebas unitarias, de integración y E2E.

## Requisitos

- Node.js 18 o superior.
- npm 9 o superior.

## Instalación

```bash
npm install
```

Para las pruebas E2E, instala el navegador de Playwright una sola vez:

```bash
npx playwright install chromium
```

## Ejecución

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador. Para usar otro puerto:

```bash
PORT=4000 npm start
```

En PowerShell:

```powershell
$env:PORT=4000; npm start
```

## Uso

1. Escribe un nombre en el campo **Username** (si lo dejas vacío se mostrará como `Anomimo`).
2. Escribe un mensaje o una URL de medio en el campo de texto.
3. Presiona **Send**.

### URLs soportadas

La URL debe ocupar todo el mensaje, sin texto adicional.

| Tipo | Extensiones / formato | Resultado |
|---|---|---|
| Imagen | `.jpg`, `.jpeg`, `.gif`, `.png`, `.bmp` | `<img>` en el chat |
| YouTube | `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/embed/...` | `<iframe>` embebido |
| Video directo | `.mp4`, `.webm`, `.ogg` | `<video controls>` |

Ejemplos:

```text
http://image.com/image.jpg
https://www.youtube.com/watch?v=qYwlqx-JLok
https://cdn.example.com/clip.mp4
```

Si la URL está dentro de una frase, por ejemplo `mira esto https://cdn.example.com/clip.mp4`, el mensaje se muestra como texto.

## Seguridad

La validación se concentra en `libs/unalib.js`:

- Solo se aceptan URLs con esquema `http` o `https`.
- Se rechazan comillas, apóstrofos, backticks, espacios, paréntesis angulares y caracteres de control.
- Solo las extensiones incluidas en la lista blanca pueden generar etiquetas de medio.
- Los esquemas `javascript:`, `data:`, `blob:`, `file:` y `vbscript:` se muestran como texto escapado.
- El nombre, el mensaje y los atributos generados se escapan con entidades HTML.
- El color se valida contra una lista blanca hexadecimal; en caso contrario se usa `#000000`.
- Los identificadores de YouTube se limitan a 11 caracteres `[A-Za-z0-9_-]`.

Los mensajes retransmitidos mantienen el contrato del evento `Evento-Mensaje-Server`: un string JSON con `nombre`, `mensaje`, `color` y `tipo` (`imagen`, `video` o `texto`).

## Pruebas

| Comando | Runner | Alcance |
|---|---|---|
| `npm test` | Mocha | Pruebas unitarias de `libs/unalib.js` |
| `npm run test:integration` | Jest | Servidor real + Socket.IO de extremo a extremo |
| `npm run test:e2e` | Playwright | Navegador Chromium sobre el chat real |
| `npm run test:all` | Todos | Unitarias + integración + E2E |

### Pruebas unitarias

```bash
npm test
```

Cubren validación de teléfonos, URLs de imagen, YouTube y video directo, clasificación de mensajes, normalización de entradas y protección contra inyección de scripts.

### Pruebas de integración

```bash
npm run test:integration
```

Levantan `server.js` como proceso hijo en un puerto libre, conectan clientes con `socket.io-client` y verifican el evento `Evento-Mensaje-Server`, el broadcast a varios clientes y el rechazo de entradas maliciosas.

### Pruebas E2E

```bash
npm run test:e2e
```

Usan Chromium en modo visible con un retraso (`slowMo`) de 1 segundo por acción y una pausa de 1 segundo al final de cada escenario. Esto permite observar cómo se completan las pruebas. En entornos con `CI` definido, Playwright se ejecuta en modo headless.

Las pruebas sirven jQuery, Socket.IO, la imagen, el video y el iframe de YouTube desde fixtures locales, por lo que no dependen de CDNs externos.

## Análisis de seguridad

El proyecto incluye [Snyk](https://snyk.io/) como dependencia de desarrollo:

```bash
npx snyk auth
npx snyk test
npx snyk test --severity-threshold=high
```

Para revisar solo las dependencias de producción:

```bash
npm audit --omit=dev
```

## Estructura del proyecto

```text
despues/
├── index.html                     # Cliente del chat (jQuery + Socket.IO)
├── server.js                      # Servidor Express + Socket.IO
├── libs/
│   └── unalib.js                  # Validación, sanitización y renderizado de medios
├── test/
│   └── test.js                    # Pruebas unitarias (Mocha)
├── test-integration/
│   └── chat.socket.test.js        # Pruebas de integración (Jest)
├── e2e/
│   ├── chat.spec.js               # Pruebas E2E (Playwright)
│   └── fixtures/                  # jQuery y video usados por las pruebas E2E
├── jest.config.js
├── playwright.config.js
├── openspec/                      # Especificaciones y cambio activo (ignorado por git)
├── package.json
└── README.md
```

## Tecnologías

- Node.js
- Express
- Socket.IO
- jQuery
- Mocha
- Jest
- Playwright
- Snyk

## Contexto académico

Proyecto desarrollado para el laboratorio de Paradigmas de Programación. El cambio `add-chat-media-urls` documenta el comportamiento de detección y renderizado de medios en `openspec/changes/add-chat-media-urls/`.
