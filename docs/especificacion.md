# PROMPT MAESTRO · Claude Code
## Proyecto: "Competencia Digital Docente como medio para generar conocimiento en el alumnado"

> Uso: crea una carpeta vacía en el escritorio (p. ej. `~/Desktop/cdd-almeria`), copia este archivo dentro, abre Claude Code en esa carpeta y escribe:
> `Lee PROMPT_CLAUDE_CODE.md y ejecútalo por fases. Antes de empezar, hazme las preguntas del apartado 0.`

---

## 0. Antes de escribir código: pregúntame

Pregunta solo lo que falte (en un único bloque de preguntas):

1. Nombre del repositorio y usuario de GitHub (para la URL `https://<usuario>.github.io/<repo>/`).
2. Fecha, hora y lugar de la ponencia.
3. Dato de contacto del CEP de Almería para el footer (URL o correo oficial). **No inventes ningún dato de contacto.**
4. Herramienta de votación en directo: (a) Mentimeter/Wooclap embebido, (b) Google Forms con resultados en directo, (c) solo QR a secciones de la PWA, sin votación.
5. ¿Hay una foto o logotipo propios para incluir? (Nunca uses logotipos institucionales sin permiso.)

---

## 1. Contexto

- **Ponente:** Juan María Gámez Ortiz.
- **Formato:** ponencia de 45 min, obligatoria, en un gran auditorio.
- **Público:** funcionarios de carrera en prácticas de la provincia de Almería (Andalucía). Todas las especialidades de:
  - Primaria
  - ESO y Bachillerato
  - Escuelas Oficiales de Idiomas (EOI)
  - Conservatorios de Música y Danza
- **Ponencia anterior (no repetirla, enlazar con ella):** escuela inclusiva para la igualdad, la equidad y la calidad (atención a la diversidad, convivencia, igualdad) y gestión de ambientes de aprendizaje (clima de aula, motivación, aprendizaje cooperativo).
- **Tesis:** la CDD no es dominar herramientas, sino diseñar situaciones en las que el alumnado *construye* conocimiento con lo digital. Digitalizar ≠ innovar.
- **Hilo conductor:** "La ponencia anterior habló de *para quién* y *en qué clima*; esta, de *con qué y cómo* lo digital multiplica (o destruye) eso mismo".
- **Marcos de referencia** (comprueba siempre la versión vigente y cita la fuente oficial):
  - Marco de Referencia de la Competencia Digital Docente (MRCDD, Resolución de 4 de mayo de 2022, BOE 16/05/2022) y DigCompEdu.
  - DigComp (versión vigente).
  - CAST UDL Guidelines 3.0 (DUA).
  - Modelo ICAP (Chi & Wylie, 2014).
  - SAMR (Puentedura) y TPACK.
  - Reglamento (UE) 2024/1689 de IA (art. 4, alfabetización en IA).
  - RGPD/LOPDGDD.
  - Marco andaluz de la competencia digital (Plan de Actuación Digital, Séneca, Moodle Centros): **verifícalo, no lo supongas.**

---

## 2. Entregables

| # | Entregable | Ruta |
|---|---|---|
| 1 | Presentación web (para proyectar) | `/presentacion/` |
| 2 | PWA de apoyo (móvil Android/iOS) | `/` (raíz) |
| 3 | Guion con notas del ponente y tiempos | `/docs/guion.md` |
| 4 | Plantilla socrática "¿Digitalización o innovación?" (interactiva + PDF imprimible) | `/plantilla/` |
| 5 | Banco de prompts de IA en tarjetas | `/ia/` |
| 6 | QR generados (SVG) para cada sección | `/assets/qr/` |
| 7 | `README.md`, `CLAUDE.md`, `LICENSE` | raíz |

---

## 3. Stack y restricciones técnicas

- **Sin paso de build.** HTML + CSS + JavaScript nativo (ES modules), desplegable tal cual en GitHub Pages. Nativo antes que dependencias.
  - Dependencias permitidas, solo si se justifican (versión fija y alojada en local, sin CDN en producción para que funcione offline): una librería de QR y, opcionalmente, `material-color-utilities` **solo para generar los tokens una vez** (el resultado se guarda en CSS).
- **Rutas relativas** compatibles con el subdirectorio `/<repo>/` de GitHub Pages.
- **JSDoc con tipado estricto** + `// @ts-check` en cada módulo JS. Funcional, DRY y KISS.
- **El contenido va separado de la presentación:** todo el texto en `/content/*.json` o `*.md`. Una sola fuente para la presentación, la PWA y el buscador.
- **Despliegue:** GitHub Actions (`.github/workflows/pages.yml`) que publica en Pages. Incluye un job de comprobación (validación de HTML, enlaces rotos, axe y Lighthouse CI).

### Estructura de carpetas

```
/
├─ index.html              # PWA
├─ manifest.webmanifest
├─ sw.js                   # service worker
├─ presentacion/index.html
├─ plantilla/index.html
├─ ia/index.html
├─ bibliografia/index.html
├─ content/                # JSON/MD: única fuente de verdad
├─ css/ (tokens.css, base.css, components.css, a11y.css)
├─ js/  (app.js, router.js, a11y.js, tts.js, picto.js, search.js, prompts.js, socratic.js)
├─ assets/ (icons/, qr/, img/)
├─ docs/guion.md
└─ .github/workflows/pages.yml
```

---

## 4. Diseño: Material 3

- **Sigue la guía de Material Design 3** (m3.material.io): tokens de color, tipografía, formas, elevación y movimiento (*easing* `emphasized`, duraciones de 200 a 400 ms).
- **Color semilla: naranja.** Genera el esquema tonal completo de M3 para modo claro, oscuro y alto contraste.
  - El naranja va en los roles `primary` y `primaryContainer`, solo donde cumpla el contraste WCAG 2.2 AA: 4.5:1 para texto y 3:1 para elementos de interfaz.
  - Si un naranja no alcanza el contraste, usa su tono oscuro (tone 40) o el que corresponda en modo oscuro. **Nunca pongas texto naranja claro sobre fondo blanco.**
- **Iconos:** Material Symbols Rounded (fuente variable, alojada en local), con un icono coherente por sección.
- **Tipografía:** Roboto Flex o la pila del sistema. Escala tipográfica de M3.
- **Componentes M3 hechos con CSS propio:**
  - Top app bar y navigation bar inferior (móvil); navigation rail (tablet/escritorio).
  - Cards (elevated y filled), FAB, chips de filtro, search bar, snackbar, dialogs y bottom sheets.
- **Movimiento:**
  - Transiciones entre secciones con View Transitions API, con alternativa si no está disponible.
  - Ripple al pulsar y respuesta inmediata en cada acción (snackbar del tipo "Prompt copiado").
  - `prefers-reduced-motion` desactiva las animaciones.
- **Estética:** profesional, sobria y muy visual. Nada de clipart. Ilustraciones (si se usan) en SVG propio y con la paleta del proyecto.

---

## 5. Accesibilidad (requisito, no extra)

Panel de accesibilidad siempre a mano (icono `accessibility_new` en la top bar), con preferencias guardadas en `localStorage` (con try/catch):

| Opción | Implementación |
|---|---|
| Tamaño de letra | Escala de 100 a 200 % mediante una variable CSS en `:root`, sin romper el layout |
| Tema claro / oscuro / sistema | `prefers-color-scheme` + `data-theme` |
| Alto contraste | Esquema M3 de alto contraste + `prefers-contrast: more` |
| Interlineado amplio | `line-height` 1.8, `letter-spacing` y `word-spacing` según WCAG 1.4.12 |
| Leer en voz alta | Web Speech API (`speechSynthesis`), voz `es-ES` |
| Modo pictográfico | ARASAAC (ver §6) |

**Requisitos generales:**
- WCAG 2.2 AA.
- Navegación completa con teclado y lector de pantalla (TalkBack y VoiceOver).
- Foco visible, enlace "Saltar al contenido" y landmarks ARIA.
- Áreas táctiles de 48 dp como mínimo.
- `lang="es"`.

**Text to speech:**
- Botón de reproducir/pausar en cada bloque de contenido y opción de leer toda la página.
- Usa la voz del sistema: en Android será Google TTS; **en iOS el sistema solo ofrece las voces de Apple** (indícalo en la ayuda; no hay forma de usar Google TTS en iOS desde la web).
- Resalta el fragmento que se está leyendo.
- Gestiona los errores de `speechSynthesis` y la carga asíncrona de voces (`voiceschanged`).

---

## 6. Modo pictográfico ARASAAC

- **API:** `https://api.arasaac.org/v1/` (búsqueda por palabra en `es`).
  - Imágenes: `https://static.arasaac.org/pictograms/{id}/{id}_300.png`.
  - **Verifica los endpoints en la documentación oficial antes de implementarlo.**
- **Estrategia:**
  1. Para cada bloque de texto clave hay un resumen en lectura fácil en `content/` (campo `lecturaFacil`).
  2. Se tokeniza, se eliminan las palabras vacías y se busca el pictograma de cada palabra con significado.
  3. Se muestra una tira de pictogramas con la palabra debajo.
  4. Los resultados se guardan en caché (Cache API + `localStorage`). Los pictogramas de los resúmenes se precalculan y se guardan en `content/picto-map.json` para que funcionen offline y sin latencia.
- **Atribución obligatoria** (visible en el modo pictográfico y en el footer): pictogramas de Sergio Palao, propiedad del Gobierno de Aragón, distribuidos por ARASAAC bajo licencia **CC BY-NC-SA 4.0**. Aclara que esta licencia es distinta de la del resto del contenido.

---

## 7. PWA (Android + iOS)

- `manifest.webmanifest`:
  - `name`, `short_name`, `start_url` y `scope` relativos al repositorio.
  - `display: standalone`, `theme_color` y `background_color` según los tokens.
  - Iconos de 192 y 512 px, *maskable* y *monochrome*.
  - `shortcuts` a IA, Plantilla y Bibliografía.
- **Service worker:** *precache* de la *app shell* y del contenido; *stale-while-revalidate* para ARASAAC; funciona offline completo tras la primera visita; banner de "Nueva versión disponible".
- **Instalación:**
  - Android: botón propio usando `beforeinstallprompt`.
  - iOS: ese evento no existe, así que muestra un bottom sheet con los pasos "Compartir → Añadir a pantalla de inicio".
  - iOS necesita además: `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` y `viewport-fit=cover` con `env(safe-area-inset-*)`.
- **Personalización por perfil:** en el primer acceso, el usuario elige su etapa (Primaria, ESO/Bachillerato, EOI, Conservatorio) y, opcionalmente, su especialidad. Con eso se filtran y ordenan los ejemplos y prompts. Se puede cambiar en cualquier momento.

---

## 8. Secciones de la PWA

Cada sección lleva su icono Material Symbols.

1. **Inicio:** tesis, el puente con la ponencia anterior, botón de instalar y selección de perfil.
2. **La ponencia:** resumen por bloques, sincronizado con la presentación.
3. **Marco CDD:** las áreas 3, 4, 5 y 6 del MRCDD explicadas con ejemplos según el perfil. Los niveles A1–C2 en lenguaje claro.
4. **¿Digitalización o innovación?:** herramienta socrática (ver §9).
5. **Escuela inclusiva + digital:** tabla puente con cinco temas (diversidad → DUA; convivencia → ciberconvivencia y bienestar digital; igualdad → sesgos de la IA y brecha de uso; clima y motivación → retroalimentación y gamificación con sentido; cooperativo → coautoría con interdependencia real). Un ejemplo de antes y después por etapa.
6. **IA en el aula:** guía y banco de prompts (ver §10).
7. **Ideas para el lunes:** retos breves según el perfil.
8. **Bibliografía:** fuentes oficiales y académicas en formato APA 7, con enlace y filtros por tema. **Solo referencias verificadas que existan; nada inventado.**
9. **Buscador global:** índice JSON generado a partir de `content/`, búsqueda que tolera tildes y errores leves, resultados con resaltado y atajo `/`.

---

## 9. Plantilla socrática "¿Digitalización o innovación digital?"

- **Asistente paso a paso** (un stepper M3) que guía al docente con preguntas socráticas sobre **una actividad concreta** que escribe al principio.
- **Dimensiones que evalúa:**
  - ICAP: ¿el alumno recibe, manipula, genera o co-construye conocimiento?
  - SAMR: ¿sustituye o redefine la tarea?
  - Exigencia cognitiva: ¿qué tiene que pensar ahora que antes no pensaba?
  - DUA: barreras y alternativas en representación, acción y expresión, e implicación.
  - Resistencia a la IA: ¿una IA podría hacer la tarea sola?
  - Evaluación: ¿se evalúa el proceso o solo el producto?
  - Datos y privacidad.
- Cada pregunta tiene **repreguntas** según la respuesta (al estilo socrático: no juzga, hace pensar).
- **Resultado:** un perfil visual (radar o barras M3) que la sitúa entre "Digitalización" e "Innovación que genera aprendizaje", con propuestas de mejora concretas.
- **Exportar:**
  - Imprimir o PDF con una hoja de estilos de impresión.
  - Copiar como texto.
  - "Abrir en IA" con un prompt que contiene la actividad y las respuestas, para que la IA continúe el diálogo socrático.
- Incluye además una versión **PDF imprimible en blanco** de la plantilla.

---

## 10. Banco de prompts de IA (tarjetas)

- **Guía breve antes de las tarjetas:**
  - Cómo escribir un buen prompt (rol, contexto, tarea, formato, restricciones).
  - Verificar siempre lo que genera la IA.
  - Sesgos.
  - **No introducir datos personales del alumnado (RGPD).**
  - Usar las cuentas corporativas del centro cuando existan.
  - La IA como andamiaje, no como sustituto del pensamiento.
- **Cada tarjeta (M3 card) contiene:**
  - Título e icono.
  - Objetivo.
  - Etapas para las que sirve.
  - El prompt con `[variables]` resaltadas y rellenables mediante un formulario dentro de la tarjeta.
  - Ejemplo de resultado esperado.
  - Botones: **Copiar** (Clipboard API + snackbar) · **Abrir en Gemini** · **Abrir en ChatGPT** · **Abrir en Claude** · **Compartir** (Web Share API).
- **Apertura directa en la IA:** usa parámetros de URL solo si **comprobaste que funcionan hoy** (por ejemplo, `chatgpt.com/?q=` o `claude.ai/new?q=`). Para Gemini, comprueba si admite prompt precargado; si no, copia el prompt al portapapeles, abre `gemini.google.com` y avisa con un snackbar: "Prompt copiado: pégalo en Gemini".
- **Categorías** (mínimo 2 o 3 tarjetas por categoría, con variantes para Primaria, ESO/Bachillerato, EOI y Conservatorio):
  1. **Crear contenido**: materiales, textos graduados (MCER en EOI) y ejercicios de lectura musical o análisis en Conservatorio.
  2. **Auditar contenido existente**: errores, sesgos, nivel, accesibilidad y lectura fácil.
  3. **Detectar barreras DUA** y proponer alternativas.
  4. **Planificar**: situaciones de aprendizaje según la LOMLOE y la normativa andaluza.
  5. **Evaluar**: rúbricas, listas de cotejo y retroalimentación formativa.
  6. **Tutor socrático para el alumnado**: un prompt que *no da la respuesta*.
  7. **Diseñar tareas resistentes a la IA**: pasar de "copiable" a "generadora de conocimiento".
  8. **Convivencia y bienestar digital**: casos para el aula.
  9. **Igualdad**: detectar estereotipos en materiales y en respuestas de la IA.
  10. **Atención a la diversidad**: adaptaciones de acceso, NEAE y altas capacidades.
- Los prompts **se prueban de verdad** antes de darlos por buenos. Ninguno puede pedir datos personales.

---

## 11. Presentación (`/presentacion/`)

- Motor de diapositivas propio y ligero con los mismos tokens M3 y en formato 16:9.
  - Navegación con teclado, mando y gestos.
  - Notas del ponente en una ventana aparte (`?notas`).
  - Temporizador con las marcas de tiempo del guion.
  - Modo de impresión a PDF.
- **Diseñada para un auditorio:** como mucho 20 palabras por diapositiva, cuerpo de letra de 32 px o más, contraste alto y una idea por diapositiva.
- **Estructura (45 min):**

| Min | Bloque |
|---|---|
| 0–5 | Puente con la ponencia anterior + gancho: votación sobre una tarea que la IA resuelve sola frente a la misma tarea rediseñada |
| 5–10 | El MRCDD en una diapositiva: la competencia se mide por lo que logra el alumnado |
| 10–20 | De consumir a construir: ICAP como filtro; SAMR como antipatrón |
| 20–32 | Lo digital al servicio de la escuela inclusiva (tabla puente + ejemplos de antes y después por etapa, incluidas EOI y Conservatorio) |
| 32–40 | IA generativa: descarga cognitiva frente a tutor socrático, sesgos, evaluación del proceso, RGPD y Reglamento de IA |
| 40–45 | Cierre: "¿Qué tiene que pensar el alumno que antes no pensaba?" + reto + QR a la plantilla |

- **Diapositivas QR:** al principio (instalar la PWA), en cada votación y al final (plantilla y prompts). QR grandes (35 % del alto de la diapositiva como mínimo), con la URL corta legible debajo.
- **Interacción:** según la respuesta a la pregunta 0.4. Las votaciones deben hacerse en 3 clics como máximo y sin registro.

---

## 12. Footer (en todas las pantallas, también en la presentación)

- `© 2026 Juan María Gámez Ortiz · Contenido bajo licencia CC BY 4.0 (Atribución) · Elaborado con la ayuda de Claude (Anthropic)`
- Línea sutil, en tipografía `bodySmall`, sin destacar: *"¿Formación en tu centro, grupo de trabajo o curso? Contacta con el CEP de Almería y pregunta por Juan María Gámez."* (el enlace se rellena con el dato de la pregunta 0.3).
- Atribución de ARASAAC (ver §6) y "Iconos: Material Symbols (Apache 2.0)".
- Archivo `LICENSE`: CC BY 4.0 para el contenido y MIT para el código (proponlo y confírmalo conmigo).

---

## 13. Calidad y verificación (definición de "terminado")

- [ ] Lighthouse móvil ≥ 95 en Rendimiento, Accesibilidad, Buenas prácticas y SEO; PWA instalable.
- [ ] axe-core sin errores; contraste comprobado en los 3 esquemas (claro, oscuro, alto contraste).
- [ ] Probado en Chrome Android y en Safari iOS (o en sus emuladores): instalación, modo offline, TTS, pictogramas, áreas seguras (*safe areas*) y letra al 200 %.
- [ ] Todos los enlaces de la bibliografía y los prompts funcionan; ninguna referencia es inventada.
- [ ] Probado "Abrir en IA" en cada servicio, con alternativa documentada si falla.
- [ ] La presentación se lee desde la última fila: simula una proyección de 1920×1080 vista al 25 %.
- [ ] Footer presente en todas las rutas.
- [ ] Un `README.md` con los pasos: clonar, previsualizar en local (`python3 -m http.server`), activar Pages (Settings → Pages → GitHub Actions) y actualizar el contenido editando `/content/`.

---

## 14. Forma de trabajar

1. **Fase 0:** preguntas del §0 → `CLAUDE.md` con las convenciones del proyecto → `git init` + `.gitignore`.
2. **Fase 1:** tokens M3 + layout + navegación + panel de accesibilidad (enséñamelo antes de seguir).
3. **Fase 2:** el contenido en `/content/` (redactado y verificado con fuentes) + buscador.
4. **Fase 3:** plantilla socrática + banco de prompts.
5. **Fase 4:** TTS + ARASAAC + PWA offline.
6. **Fase 5:** presentación + QR + guion con notas.
7. **Fase 6:** verificación del §13 + workflow de Pages + `README.md`.
- Haz un commit al final de cada fase, con un mensaje descriptivo. **No hagas push sin pedírmelo.**
- Si algo no puede cumplirse (una API cambiada, una limitación de iOS), avísame con la alternativa propuesta; no lo resuelvas en silencio.
