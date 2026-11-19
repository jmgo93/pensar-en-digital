# Pensar en Digital

**Competencia Digital Docente para generar conocimiento**

Web de apoyo a la ponencia *"Competencia Digital Docente como medio para generar conocimiento en el alumnado"* (Juan María Gámez Ortiz), dirigida al profesorado en prácticas de la provincia de Almería.

- Sitio: <https://jmgo93.github.io/pensar-en-digital/>
- Presentación: <https://jmgo93.github.io/pensar-en-digital/presentacion/>

> 🚧 En construcción. El estado del proyecto está en [TAREAS.md](TAREAS.md).

## Qué incluye

| Entregable | Ruta |
|---|---|
| PWA de apoyo (instalable, funciona sin conexión) | `/` |
| Presentación web 16:9 | `/presentacion/` |
| Plantilla socrática "¿Digitalización o innovación?" | `/plantilla/` |
| Banco de prompts de IA | `/ia/` |
| Bibliografía | `/bibliografia/` |
| Guion con notas del ponente | `/docs/guion.md` |

## Previsualizar en local

Es HTML, CSS y JavaScript nativos, sin paso de build.

```bash
git clone https://github.com/jmgo93/pensar-en-digital.git
cd pensar-en-digital
python -m http.server 8000      # en macOS/Linux: python3 -m http.server 8000
```

Abre <http://localhost:8000/>. El service worker necesita `http://localhost` o HTTPS: no abras los archivos con doble clic (`file://`).

## Actualizar el contenido

Todo el texto vive en [`content/`](content/) (JSON/Markdown, en español e inglés). La presentación, la PWA y el buscador leen de ahí.
Después de editar el contenido, regenera los archivos derivados (índice del buscador, mapa de pictogramas, QR) con los scripts de [`tools/`](tools/) y súbelos junto con el cambio. Las instrucciones detalladas se añadirán en la Fase 6.

## Publicar en GitHub Pages

1. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Cada `push` a `main` ejecuta [`.github/workflows/pages.yml`](.github/workflows/pages.yml) y publica el sitio.

## Licencias

- Contenido: CC BY 4.0 · Código: MIT (ver `LICENSE`).
- Pictogramas: Sergio Palao, propiedad del Gobierno de Aragón, distribuidos por ARASAAC bajo CC BY-NC-SA 4.0. Esta licencia es distinta de la del resto del contenido.
- Iconos: Material Symbols (Apache 2.0).

Elaborado con la ayuda de Claude (Anthropic).
