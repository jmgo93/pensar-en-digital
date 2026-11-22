# Pensar en Digital

**Competencia Digital Docente para generar conocimiento**

Web de apoyo a la ponencia *"Competencia Digital Docente como medio para generar conocimiento en el alumnado"* (Juan María Gámez Ortiz), dirigida al profesorado en prácticas de la provincia de Almería: Primaria, ESO y Bachillerato, Escuelas Oficiales de Idiomas y Conservatorios.

- Web (PWA instalable, funciona sin conexión): <https://jmgo93.github.io/pensar-en-digital/>
- Presentación: <https://jmgo93.github.io/pensar-en-digital/presentacion/> · notas del ponente: `?notas`

## Qué incluye

| Entregable | Ruta |
|---|---|
| PWA: Inicio, La ponencia, Las 7 claves, Marco CDD, Escuela inclusiva + digital, Ideas para el lunes, Descargas, Bibliografía, Buscador | `/`, `/ponencia/`, `/claves/`, `/marco/`, `/inclusiva/`, `/lunes/`, `/recursos/`, `/bibliografia/`, `/buscar/` |
| Plantilla socrática "¿Digitalización o innovación?" (+ PDF en blanco) | `/plantilla/` |
| Banco de prompts de IA (con desplegables, enlazados entre sí y con las claves) | `/ia/` |
| Descargables: guía para analizar tareas, cuaderno de prompts y las siete claves (PDF y .md, es/en) | [`assets/descargas/`](assets/descargas/) |
| Presentación 16:9 con votaciones en directo | `/presentacion/` |
| Pantalla de resultados de votación (solo ponente) | `/presentacion/resultados.html?v=v0` |
| Panel del ponente: presentación, notas, escaleta y «Archivar resultados y reiniciar» (contraseña: `npm run ponente`) | `/ponente/` |
| Escaleta del ponente con tiempos, idea fuerza, transiciones y notas | [`docs/escaleta.md`](docs/escaleta.md) · [`docs/escaleta.pdf`](docs/escaleta.pdf) |
| QR en SVG | [`assets/qr/`](assets/qr/) |

Accesibilidad: WCAG 2.2 AA, tamaño de letra del 100 al 200 %, tema claro, oscuro o del sistema, alto contraste, interlineado amplio, lectura en voz alta, modo pictográfico (ARASAAC) y español o inglés.

## Previsualizar en local

Es HTML, CSS y JavaScript nativos (ES modules). No hay paso de build para publicar.

```bash
git clone https://github.com/jmgo93/pensar-en-digital.git
cd pensar-en-digital
python3 -m http.server 8000      # en Windows: python -m http.server 8000
```

Abre <http://localhost:8000/>. No abras los archivos con doble clic (`file://`): el service worker necesita `http://localhost` o HTTPS.

Para reproducir el subdirectorio de GitHub Pages, sirve la **carpeta padre** y abre `http://localhost:8000/pensar-en-digital/`.

## Actualizar el contenido

Todo el texto está en [`content/`](content/), en JSON y en español e inglés. Es la única fuente para la PWA, la presentación, el buscador, la escaleta y los descargables.

| Archivo | Contenido |
|---|---|
| `ui.json` | Textos de la interfaz |
| `routes.json` | Secciones y menú |
| `inicio.json`, `ponencia.json`, `claves.json`, `marco.json`, `inclusiva.json`, `lunes.json`, `recursos.json` | Secciones |
| `guia.json` | Guía descargable para analizar tareas |
| `fuentes.json` | Bibliografía APA 7 (cítala en el texto con `[@id]`) |
| `prompts.json` | Banco de prompts |
| `plantilla.json` | Plantilla socrática |
| `presentacion.json` | Diapositivas y notas del ponente (`notes`, `key`, `do`, `data`, `bridge`, `cut`; máximo 20 palabras visibles por diapositiva) |
| `votaciones.json` | Preguntas de votación |
| `perfiles.json` | Etapas y especialidades |
| `site.json` | URL, licencia, contacto del CEP y endpoint de votación |

Después de editar, regenera los archivos derivados y comprueba:

```bash
npm install                 # una vez (solo herramientas de desarrollo)
npm run build:all           # páginas, índice de búsqueda, QR, escaleta, descargables .md, hoja de pruebas y precarga del service worker
npm run docs:pdf            # PDF descargables y docs/escaleta.pdf (a mano, con Chrome o Edge; no son deterministas)
npm run typecheck           # TypeScript estricto sobre JSDoc
npm run check:html          # validación HTML
npm run check:links         # enlaces externos (bibliografía)
npm run check:ui            # axe + desbordes en todas las rutas (necesita el servidor del puerto 8765 sirviendo la carpeta padre)
```

**Ejecuta siempre `npm run build:all` antes de subir cambios.** Si no, el service worker no detecta la nueva versión y los móviles con la app instalada seguirán viendo la anterior.

Otros generadores (raramente necesarios): `npm run tokens` (colores M3), `icons` (subset de iconos), `app-icons` (iconos PWA), `picto` (mapa ARASAAC) y `blank` (PDF de la plantilla en blanco).

## Publicar en GitHub Pages

1. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Cada `push` a `main` ejecuta [`.github/workflows/pages.yml`](.github/workflows/pages.yml) en tres pasos: **check → build → deploy**. El primero incluye:
   - tipos;
   - archivos generados al día;
   - validación HTML;
   - axe en todas las rutas y esquemas;
   - enlaces internos;
   - Lighthouse CI;
   - enlaces externos (solo avisa, no bloquea).

   Si falla una comprobación, no se publica.

## Votaciones en directo

Google Forms y un contador en Apps Script alimentan las barras de la presentación. Puesta en marcha en [`docs/votaciones.md`](docs/votaciones.md).

## Pruebas manuales

- [`docs/pruebas-prompts.md`](docs/pruebas-prompts.md): prompts y "Abrir en IA" en Gemini, ChatGPT y Claude.
- [`docs/pruebas-dispositivos.md`](docs/pruebas-dispositivos.md): instalación, modo sin conexión, voz, pictogramas, safe areas y letra al 200 % en Android e iOS.

## Licencias

- **Contenido y código: CC BY-NC-SA 4.0** (Atribución-NoComercial-CompartirIgual). No se permite el uso comercial. Ver [`LICENSE`](LICENSE).
- Pictogramas: Sergio Palao. Propiedad: Gobierno de Aragón. Origen: ARASAAC. Licencia CC BY-NC-SA 4.0.
- Iconos: Material Symbols (Apache 2.0).

Elaborado con la ayuda de Claude (Anthropic).
