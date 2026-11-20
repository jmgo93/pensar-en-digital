# CLAUDE.md · Pensar en Digital

Especificación completa: [docs/especificacion.md](docs/especificacion.md). Estado y decisiones: [TAREAS.md](TAREAS.md).
Si algo de aquí contradice la especificación, manda la especificación salvo decisión registrada en TAREAS.md.

## Proyecto

- Web "Pensar en Digital" · subtítulo "Competencia Digital Docente para generar conocimiento".
- Título oficial de la ponencia (portada de la presentación): "Competencia Digital Docente como medio para generar conocimiento en el alumnado".
- Ponente: Juan María Gámez Ortiz. Público: profesorado en prácticas de Almería (Primaria, ESO/Bach, EOI, Conservatorios).
- URL: https://jmgo93.github.io/pensar-en-digital/ (repo `jmgo93/pensar-en-digital`, rama `main`).

## Reglas no negociables

1. **Nada inventado.** Ni referencias, ni datos de contacto, ni normativa, ni URLs. Toda cita bibliográfica se verifica (existe y el enlace funciona) y se cita en APA 7. Si no se puede verificar, se marca como pendiente en TAREAS.md.
2. **Sin paso de build.** HTML + CSS + JS nativo (ES modules) servido tal cual por GitHub Pages.
3. **Offline primero.** Todo funciona sin conexión tras la primera visita; las funciones online (votación, "Abrir en IA", ARASAAC no precalculado) degradan con un mensaje claro.
4. **Sin CDN en producción.** Las dependencias (librería QR, fuentes) se alojan en local con versión fija.
5. **Accesibilidad WCAG 2.2 AA** como requisito: teclado, lector de pantalla, foco visible, 48 dp táctiles, contraste comprobado en claro/oscuro/alto contraste.
6. **Privacidad:** sin analítica, sin cookies de terceros, ningún prompt pide datos personales del alumnado.
7. **Si algo no puede cumplirse** (API cambiada, limitación de iOS…), avisar con alternativa; no resolverlo en silencio.

## Convenciones de código

- Cada módulo JS empieza con `// @ts-check` y usa JSDoc con tipos estrictos (`@param`, `@returns`, `@typedef`). Sin `any` implícito.
- Estilo funcional, DRY y KISS. Funciones pequeñas y puras cuando se pueda; efectos (DOM, storage) en los bordes.
- Rutas **relativas** siempre (`./`, `../`); nunca `/` absoluto, porque el sitio vive en el subdirectorio `/pensar-en-digital/`.
- `localStorage` siempre dentro de `try/catch`; la app funciona igual si falla.
- CSS: tokens M3 como custom properties en `css/tokens.css` (claro, oscuro, alto contraste). Componentes en `components.css`, ajustes de accesibilidad en `a11y.css`. Sin colores sueltos fuera de los tokens.
- Unidades relativas (`rem`) para que la escala de letra 100–200 % no rompa el layout.
- Movimiento M3 (`emphasized`, 200–400 ms) y todo desactivado con `prefers-reduced-motion`.
- Iconos: subset local de Material Symbols Rounded. Tipografía: pila del sistema.
- Nombres de archivo en minúsculas con guiones; identificadores JS en camelCase e inglés; textos visibles nunca en el código, siempre en `content/`.

## Contenido e idiomas

- Única fuente de verdad: `content/*.json` / `*.md`. La PWA, la presentación y el buscador leen de ahí.
- Bilingüe **es / en**, elegible por el usuario (por defecto `es`). Cada texto tiene su versión en ambos idiomas; `<html lang>` se actualiza al cambiar.
- Los bloques clave llevan `lecturaFacil` (resumen en lectura fácil) para el modo pictográfico.
- Archivos derivados (índice del buscador, `content/picto-map.json`, `assets/qr/*.svg`) se generan con scripts Node en `tools/`, ejecutados a mano, y **se versionan**. Nunca se editan a mano.

## Estructura

Multipágina: cada sección es una carpeta con `index.html` **generado** por `tools/build-pages.mjs` (no editar a mano;
cambiar `content/` o el generador y ejecutar `npm run pages`). Rutas en `content/routes.json`.

```
/                  index.html (Inicio), manifest.webmanifest, sw.js
ponencia/ marco/ plantilla/ inclusiva/ ia/ lunes/ bibliografia/ buscar/   (secciones)
presentacion/      motor de diapositivas (notas: ?notas)
plantilla/         plantilla socrática
ia/                banco de prompts
bibliografia/
content/           texto (es/en)
css/               tokens-color.css (generado), tokens.css, base.css, components.css, a11y.css
js/                boot (clásico, en <head>), app, router, i18n, ui, a11y, types.d.ts; después tts, picto, search, prompts, socratic
assets/            icons/, qr/, img/, fonts/
tools/             scripts Node de desarrollo (no se ejecutan en producción)
docs/              guion.md, especificacion.md, pruebas de prompts
```

## Previsualizar y comprobar

- `python -m http.server 8000` en la raíz y abrir http://localhost:8000/. No usar `file://`.
- Para simular el subdirectorio de Pages, sirve la carpeta padre en el puerto 8765 y abre http://127.0.0.1:8765/pensar-en-digital/.
- `npm run typecheck`: TypeScript estricto sobre el JSDoc; tiene que dar 0 errores.
- `npm run check:ui`: axe, overflow y errores de consola en todas las rutas y esquemas (necesita el servidor del 8765 y Chrome o Edge).
- `npm run tokens` / `icons` / `app-icons` / `picto` / `blank`: regeneran recursos derivados (raramente).
- **Antes de cada commit que se vaya a publicar: `npm run build:all`** (páginas, índice de búsqueda, hoja de pruebas y lista de precarga del SW). Si no se regenera `sw-precache.js`, los usuarios no reciben la nueva versión.

## Workflow de GitHub Pages

- `.github/workflows/pages.yml`: en cada push a `main` sube la raíz del repo como artefacto y la publica con `actions/deploy-pages`.
- Pages debe estar configurado en *Settings → Pages → Source: GitHub Actions*.
- En la Fase 6 se añade un job previo de comprobación (validación HTML, enlaces rotos, axe, Lighthouse CI); el despliegue depende de él.
- Lighthouse ya no tiene categoría PWA (eliminada en v12): la instalabilidad se verifica con DevTools → Application → Manifest y la lista de TAREAS.md.

## Forma de trabajar

- Trabajo por fases según TAREAS.md; marcar cada tarea al terminarla y actualizar "Pendiente de decidir".
- Commit al final de cada fase con mensaje descriptivo en español.
- **Nunca `git push` sin permiso explícito.**
- Tras la Fase 1, parar y enseñar el resultado antes de seguir.
