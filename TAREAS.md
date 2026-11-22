# TAREAS · Pensar en Digital

Leyenda: `[ ]` pendiente · `[x]` hecha · `[~]` en curso · `[!]` bloqueada (ver "Pendiente de decidir").
Cada fase termina con un commit. Push autorizado (20/11): cada push publica en Pages.

---

## Pendiente de decidir

| # | Asunto | Bloquea | Estado |
|---|---|---|---|
| P7 | Votaciones conectadas el 22/11: 6 formularios (v0–v5) y contador `/exec` comprobados; falta el ensayo real con móvil (pasos 8 y 9 de `docs/votaciones.md`) | — | **Hecho (falta ensayo)** |

### Decisiones tomadas

- Fecha: 25 y 26 de noviembre de 2026, Almería. **La fecha, la hora y el lugar no aparecen en la web.** **Plazo real: la web tiene que estar publicada y probada antes del 25/11.** Prioridad: lo que se proyecta y lo que usa el público ese día.
- Contacto del CEP para el footer: https://www.juntadeandalucia.es/educacion/portales/web/cep-almeria
- Votación: Google Forms (opción b del §0), gratuito, sin registro para el público y sin límite de participantes. Se descartan Mentimeter y Wooclap: no hay cuenta, y Forms con Apps Script es gratuito y se integra en la web. Los límites de sus planes gratuitos no se han verificado. Resultados: un contador en Apps Script alimenta la pantalla propia `presentacion/resultados.html` (ver `docs/votaciones.md`).
- Inglés: PWA, plantilla, prompts y presentación bilingües; guion solo en español.
- Votación sin conexión: la diapositiva muestra la pregunta y se vota a mano alzada.

- Título oficial en la presentación; "Pensar en Digital" es el nombre de la web.
- Sin foto ni logotipo: identidad solo tipográfica y con iconos.
- La ponencia anterior se menciona de forma genérica (sin nombre ni enlace).
- Especialidades: listas cerradas por etapa, con la opción "Otra / General".
- Idiomas: español (por defecto) e inglés, elegibles.
- Licencias: **CC BY-NC-SA 4.0 para contenido y código** (cambio pedido el 20/11: sin uso comercial, como ARASAAC). Sustituye a la propuesta inicial CC BY 4.0 + MIT.
- Todo funciona 100 % offline; las funciones online (votación, Abrir en IA, ARASAAC no precalculado) se usan si hay wifi.
- Proyección desde el equipo de la sala (1920×1080 por defecto), con mando y teclado.
- Sin fecha límite.
- Scripts Node en `tools/`, ejecutados a mano, y sus salidas se versionan; sin build en Pages.
- Subset de Material Symbols Rounded y pila tipográfica del sistema (sin Roboto Flex).
- La instalabilidad de la PWA se comprueba con DevTools y una checklist, porque Lighthouse ya no puntúa PWA.
- URL de los QR: `jmgo93.github.io/pensar-en-digital`, sin acortador.
- Sin analítica.
- Pruebas en dispositivos reales (Android e iOS) a cargo del usuario.
- Prompts: se entrega una hoja de pruebas completa y el usuario los prueba con la web ya publicada.
- El repositorio está en `c:\Dev\Ponencia\pensar-en-digital`.
- **Arquitectura multipágina** (decisión de la Fase 1):
  - Cada sección es una carpeta con su `index.html` (`ponencia/`, `marco/`, `plantilla/`, `inclusiva/`, `ia/`, `lunes/`, `bibliografia/`, `buscar/`). Así cada sección tiene URL propia para QR y accesos directos y funciona sin JS de enrutado.
  - Las páginas las genera `tools/build-pages.mjs` desde `content/`.
  - Las transiciones entre páginas usan View Transitions entre documentos y, sin soporte, la navegación es normal.
  - La sección 4 de la especificación ("¿Digitalización o innovación?") vive en `plantilla/`.
- `@material/material-color-utilities` está fijada en 0.3.0, porque la 0.4.0 publica imports ESM rotos.
- Panel de accesibilidad: la lectura en voz alta y los pictogramas aparecen como "Próximamente" hasta la Fase 4.

---

## Fase 0 · Preparación

- [x] **0.1 Preguntas del §0 y dudas.** Respondidas.
- [x] **0.2 Repositorio local.** `git init`, rama `main`, `.gitignore`.
- [x] **0.3 `README.md`, `CLAUDE.md` y `docs/especificacion.md`** (copia de la especificación).
- [x] **0.4 Workflow `pages.yml`** (solo despliegue; las comprobaciones llegan en 6.3).
- [x] **0.5 Remoto** `jmgo93/pensar-en-digital` (público) creado y añadido como `origin`, sin push.
- [x] **0.6 Aprobación de TAREAS.md** (19/11/2026) y commit inicial ("Fase 0: estructura del repositorio").
  - Criterio: el usuario aprueba este documento.

## Fase 1 · Tokens M3, layout, navegación y panel de accesibilidad

Depende de: 0.6.

> **Resultado (20/11):**
> - `npm run check:ui` pasa sin problemas: axe-core (WCAG 2.2 A/AA y buenas prácticas) en las 9 rutas, en claro, oscuro, los 2 de alto contraste e inglés.
> - Sin scroll horizontal de 320 a 1440 px, también con letra al 200 % e interlineado amplio.
> - Sin errores de consola. `npm run typecheck` (TS estricto sobre JSDoc) da 0 errores.
> - Informe de contraste en `docs/contraste.md`: 0 fallos en los 4 esquemas.
> - Fuente de iconos: 62 iconos, 10,9 KB.
> - Con letra ≥ 150 % en móvil, el cromo se compacta: el nombre de la barra y las etiquetas de la barra inferior quedan solo para lectores de pantalla.

- [x] **1.1 Tokens M3** (`css/tokens.css`) a partir de la semilla naranja: esquemas claro, oscuro y de alto contraste (claro y oscuro), más escala tipográfica, formas, elevación y movimiento.
  - Generados una sola vez con `material-color-utilities` (script en `tools/`); el resultado se guarda en CSS.
  - Criterio: un informe de contraste (`tools/` → `docs/contraste.md`) muestra ≥ 4.5:1 en texto y ≥ 3:1 en la interfaz para cada par de roles usado. No hay texto naranja claro sobre blanco.
- [x] **1.2 Fuentes e iconos locales:** subset de Material Symbols Rounded (woff2) con los iconos usados y pila del sistema.
  - Criterio: la fuente de iconos pesa menos de 100 KB y no hay peticiones externas.
- [x] **1.3 Layout responsive:** top app bar, navigation bar inferior (móvil) y navigation rail (≥ 600 px), con `viewport-fit=cover` y `env(safe-area-inset-*)`.
  - Criterio: sin scroll horizontal de 320 px a 1920 px; las áreas táctiles miden ≥ 48 dp.
- [x] **1.4 Router y transiciones:** rutas relativas al subdirectorio, View Transitions con alternativa, `prefers-reduced-motion`, ripple y snackbar.
  - Criterio: funciona servido en `/pensar-en-digital/` (prueba local con un subdirectorio) y con el botón atrás.
- [x] **1.5 Panel de accesibilidad** (`accessibility_new`): letra al 100–200 %, tema claro/oscuro/sistema, alto contraste, interlineado WCAG 1.4.12 e idioma es/en.
  - TTS y pictogramas aparecen como interruptores ya maquetados, pero se conectan en la Fase 4.
  - Las preferencias se guardan en `localStorage` con try/catch.
  - Criterio: con la letra al 200 % nada se corta; se maneja entero con teclado; el foco queda atrapado en el diálogo y vuelve al cerrarlo.
- [x] **1.6 Footer común:** licencias, atribución de Claude, ARASAAC, Material Symbols y línea del CEP (enlace pendiente de P2).
  - Criterio: aparece en todas las rutas.
- [x] **1.7 Infraestructura i18n** (`js/i18n.js`): cambia `lang` y los textos de la interfaz desde `content/`.
- [x] **1.8 Landmarks, "Saltar al contenido" y foco visible.**
  - Criterio: axe sin errores en el esqueleto.
- [x] **1.9 DEMO al usuario** (aprobada el 20/11) → parar hasta recibir el visto bueno. Commit "Fase 1".

## Fase 2 · Contenido verificado y buscador

> **Resultado (20/11):**
> - 25 referencias APA 7 en `content/fuentes.json`, todas comprobadas: DOI resueltos y metadatos sacados de Crossref; BOE, BOJA y EUR-Lex consultados directamente.
> - MRCDD verificado en el BOE: áreas, las 15 competencias de las áreas 3 a 6 y las etapas A, B y C. Sigue vigente: no hay actualización publicada.
> - Marco andaluz verificado:
>   - Orden de 29/03/2021: DigCompOrg para centros, DigCompEdu para profesorado y DigComp para alumnado.
>   - Resolución de 01/08/2025 (Código Escuela 4.0, PAD en Séneca, Rúbrica TDE; vigente en 2025-26 y 2026-27).
>   - Orden de 11/05/2025 (acreditación).
> - DigComp vigente: 3.0 (JRC, 2025).
> - Contenido en español e inglés en `content/` (inicio, ponencia, marco, inclusiva, lunes, perfiles); se pinta con `js/sections.js`.
> - Perfil (etapa + especialidad): se pregunta en el primer acceso a Inicio y ordena y filtra los ejemplos.
> - Buscador `buscar/` (`js/search.js`): índice generado con `npm run search`; tolera tildes y errores (distancia ≤ 1–2), resalta coincidencias, atajo `/` y enlazable con `?q=`.
> - `npm run check:ui` sin problemas.

Depende de: Fase 1 aprobada; P1 y P4 para algunas piezas.

- [x] **2.1 Esquema de contenido** (JSDoc `@typedef`): bloques con `es`/`en`, `lecturaFacil`, etapas, icono y fuentes.
- [x] **2.2 Verificación de los marcos con fuente oficial:** MRCDD (BOE 16/05/2022) y DigCompEdu, DigComp en su versión vigente, CAST UDL 3.0, ICAP (Chi & Wylie, 2014), SAMR, TPACK, Reglamento (UE) 2024/1689 art. 4, RGPD/LOPDGDD y marco andaluz (Plan de Actuación Digital, Séneca, Moodle Centros).
  - Criterio: cada afirmación normativa enlaza a su fuente; lo que no se pueda verificar queda en "Pendiente".
- [x] **2.3 Secciones:** Inicio, La ponencia, Marco CDD (áreas 3–6 y niveles A1–C2), Escuela inclusiva + digital (tabla puente y antes/después por etapa), Ideas para el lunes.
- [x] **2.4 Bibliografía APA 7** con filtros por tema.
  - Criterio: todos los enlaces responden; ninguna referencia es inventada.
- [x] **2.5 Perfil** (etapa y especialidad) que filtra y ordena los ejemplos, con selección en el primer acceso y posibilidad de cambiarlo.
- [x] **2.6 Buscador:** índice generado (`tools/build-search-index`), tolerante a tildes y errores leves, con resaltado y atajo `/`.
- [x] **2.7 Traducción al inglés** del contenido (según P4). Commit "Fase 2".

## Fase 3 · Plantilla socrática y banco de prompts

> **Resultado (20/11):**
> - Plantilla `plantilla/`: 7 dimensiones con repreguntas por respuesta, resultado (espectro y barras) con propuestas citadas, impresión/PDF, texto, "Abrir en IA" y PDF en blanco es/en (`npm run blank`).
> - Banco `ia/`: guía de 6 puntos y 23 tarjetas en 10 categorías con variantes por etapa, variables rellenables y Copiar/Gemini/ChatGPT/Claude/Compartir.
> - "Abrir en IA" comprobado el 20/11: ChatGPT `?q=` funciona; Claude `/new?q=` conserva el parámetro tras iniciar sesión (precarga por verificar); Gemini no precarga, así que se copia y se avisa.
> - `docs/pruebas-prompts.md` (`npm run prompt-tests`) para la prueba real.

Depende de: Fase 2 (contenido y perfil).

- [x] **3.1 Stepper socrático** sobre una actividad concreta. Dimensiones: ICAP, SAMR, exigencia cognitiva, DUA, resistencia a la IA, evaluación y datos.
  - Repreguntas según la respuesta.
- [x] **3.2 Resultado:** perfil visual (barras o radar M3 accesibles, con tabla alternativa) entre "Digitalización" e "Innovación que genera aprendizaje", más propuestas de mejora.
- [x] **3.3 Exportar:** impresión/PDF (CSS de impresión), copiar como texto y "Abrir en IA". Además, una versión PDF en blanco.
- [x] **3.4 Comprobar hoy los parámetros de URL** de ChatGPT (`?q=`), Claude (`/new?q=`) y Gemini (si no admite prompt precargado: copiar al portapapeles, abrir la web y mostrar un snackbar).
  - Criterio: lo comprobado y la alternativa quedan documentados.
- [x] **3.5 Guía breve de prompts** (rol, contexto, tarea, formato, restricciones; verificación, sesgos, RGPD, cuentas corporativas, andamiaje).
- [x] **3.6 Tarjetas:** 10 categorías × al menos 2–3 tarjetas, con variantes por etapa, `[variables]` rellenables, ejemplo de resultado y botones Copiar / Gemini / ChatGPT / Claude / Compartir.
  - Criterio: ningún prompt pide datos personales.
- [x] **3.7 Hoja de pruebas** `docs/pruebas-prompts.md`: prompt × servicio, resultado esperado y OK/KO, para que el usuario la rellene con la web publicada. Commit "Fase 3".

## Fase 4 · TTS, ARASAAC y PWA offline

> **Resultado (20/11):**
> - Lectura en voz alta (`js/tts.js`):
>   - Botón en cada bloque y FAB "Escuchar la página". Lee por fragmentos y resalta el que suena.
>   - Gestiona `voiceschanged` y los errores. La pausa recuerda la posición.
>   - El panel avisa de que en iOS solo hay voces de Apple. Probado con la voz es-ES del sistema.
> - ARASAAC: endpoints verificados (`/v1/pictograms/{es|en}/bestsearch|search/{palabra}`, imágenes `_300.png`, CORS).
>   - `content/picto-map.json` precalculado (`npm run picto`; 0 = sin pictograma).
>   - Caché en localStorage y SW stale-while-revalidate. Atribución en el modo y en el footer.
> - PWA:
>   - Manifest con iconos any, maskable y monochrome, y accesos directos a IA, Plantilla y Bibliografía. Metadatos de iOS.
>   - DevTools: **0 errores** de instalabilidad y de manifest.
>   - SW con precarga generada (`npm run sw`): las 9 rutas funcionan **sin conexión** tras la primera visita.
>   - Aviso "Nueva versión disponible" probado.
>   - Instalación: botón propio con `beforeinstallprompt` y bottom sheet de iOS.
> - **Antes de cada push: `npm run build:all`**; si no, la versión del SW no cambia.

Depende de: Fases 2 y 3.

- [x] **4.1 TTS:** reproducir/pausar en cada bloque y leer toda la página, con voz `es-ES` o `en-*` según el idioma.
  - Resalta el fragmento que se lee y gestiona `voiceschanged` y los errores.
  - La ayuda explica que en iOS solo hay voces de Apple.
- [x] **4.2 Verificar los endpoints de ARASAAC** en la documentación oficial (búsqueda y URLs de imagen; idioma `es`/`en`).
- [x] **4.3 Modo pictográfico:** tokenizado, palabras vacías, tira de pictogramas, caché (Cache API + `localStorage`) y `content/picto-map.json` precalculado (`tools/`).
  - Atribución visible en el modo y en el footer.
- [x] **4.4 Manifest:** rutas relativas, iconos de 192/512 (maskable y monochrome), `shortcuts` (IA, Plantilla, Bibliografía) y metadatos de iOS.
- [x] **4.5 Service worker:** precache del shell y del contenido, stale-while-revalidate para ARASAAC y banner de "Nueva versión disponible".
  - Criterio: con DevTools offline, todas las rutas funcionan tras la primera visita.
- [x] **4.6 Instalación:** botón propio en Android (`beforeinstallprompt`) y bottom sheet de iOS.
  - Criterio: DevTools → Manifest sin errores de instalabilidad. Commit "Fase 4".

## Fase 5 · Presentación, QR y guion

> **Resultado (20/11):**
> - `presentacion/` (`js/slides.js`, `css/slides.css`, `content/presentacion.json`): 35 diapositivas en 6 bloques, en español e inglés.
>   - Lienzo 1920×1080 escalado; texto de 40 px o más; 20 palabras como máximo por diapositiva (lo comprueba `npm run guion`).
>   - Revisada a 1920×1080 vista al 25 %.
> - Control:
>   - Teclado y mando: ←/→, Av/Re Pág, espacio, Inicio/Fin, B/. (negro), F (pantalla completa), N (notas), T (cronómetro), número + Intro.
>   - Gestos y Gamepad API.
> - Notas `?notas`: sincronizadas por BroadcastChannel en las dos direcciones, con diapositiva actual y siguiente, cronómetro con marcas previstas y "vas tarde / vas pronto".
> - Impresión a PDF: una diapositiva por página (35 páginas). axe sin errores en la presentación y en las notas.
> - QR SVG (`npm run qr`) para las 9 secciones y la presentación; los de las votaciones se generan al rellenar `formUrl`. En diapositiva miden 520 px (48 % del alto) y llevan la URL corta debajo.
> - `docs/guion.md` generado desde la misma fuente (`npm run guion`).

Depende de: Fase 2 (contenido), P1, P3 y P4.

- [x] **5.1 Motor de diapositivas** 16:9, con los mismos tokens.
  - Teclado y mando: flechas, PageUp/PageDown, espacio, Inicio/Fin, `B`/`.` para pantalla negra y `F` para pantalla completa. También gamepad y gestos.
- [x] **5.2 Notas en otra ventana** (`?notas`), sincronizadas con BroadcastChannel; temporizador con las marcas del guion; impresión a PDF.
- [x] **5.3 Diapositivas por bloques (45 min):** máximo 20 palabras por diapositiva, cuerpo de 32 px o más y una idea por diapositiva.
- [~] **5.4 Votación en directo.**
  - [x] Preguntas en `content/votaciones.json` (v1 gancho, v2 ICAP, v3 IA, v4 cierre), 1 pregunta por formulario para cumplir los 3 toques.
  - [x] Apps Script `tools/apps-script/votaciones.gs`: crea los formularios, publica un contador en JSON/JSONP y vacía las respuestas entre sesiones.
  - [x] `js/votes.js` (consulta cada 4 s, JSONP de respaldo, modo demo) y `presentacion/resultados.html` (pantalla de proyección, ← / →).
  - [x] Instrucciones en `docs/votaciones.md`.
  - [ ] Conectar: `votingEndpoint` en `content/site.json` y `formUrl` en cada votación (P7). Prueba real de extremo a extremo.
  - [x] Integrar las barras en las diapositivas (4 diapositivas de votación con sondeo en directo y mensaje de mano alzada sin conexión).
- [x] **5.5 QR en SVG** (`tools/` → `assets/qr/`) para cada sección. En las diapositivas ocupan ≥ 35 % del alto, con la URL legible debajo.
- [x] **5.6 `docs/guion.md`** con tiempos y notas del ponente.
  - Criterio: legible al simular 1920×1080 al 25 %. Commit "Fase 5".

## Fase 6 · Verificación y publicación

> **Resultado (20/11):**
> - Lighthouse móvil en la web publicada (antes de las optimizaciones de esta fase):
>   - Accesibilidad, Buenas prácticas y SEO: **100**.
>   - Rendimiento al principio de la fase: 77–99 (por CLS y por el pintado de tarjetas).
>   - Después de las optimizaciones (reserva de espacio, módulos bajo demanda, pintado tarjeta a tarjeta), **mediana de 3 pasadas (`npm run check:lighthouse`): rendimiento 97–100 en las 10 rutas y 100 en Accesibilidad, Buenas prácticas y SEO**.
> - axe sin errores en todas las rutas, en 4 esquemas, inglés y letra al 200 %, también en la presentación, las notas y los resultados.
> - HTML válido (`npm run check:html`).
> - Enlaces externos: 30/30 correctos (`npm run check:links`; los DOI se comprueban con la API de doi.org).
> - CI: `pages.yml` con `check → build → deploy`. La comprobación incluye tipos, archivos generados al día, HTML, axe, enlaces internos y Lighthouse CI (rendimiento como aviso, porque el servidor de CI no comprime); los enlaces externos solo avisan.
> - Licencia cambiada a **CC BY-NC-SA 4.0** para todo (petición del 20/11), en `LICENSE`, el pie, las diapositivas y los PDF.
> - `docs/pruebas-dispositivos.md`: checklist para Android e iOS reales.

Depende de: Fases 1–5.

- [x] **6.1 Lighthouse móvil** ≥ 95 en Rendimiento, Accesibilidad, Buenas prácticas y SEO, en todas las rutas.
- [x] **6.2 axe-core sin errores** y contraste comprobado en los 3 esquemas.
- [x] **6.3 Job de comprobación en `pages.yml`** (validación HTML, enlaces rotos, axe, Lighthouse CI); el despliegue depende de él.
- [x] **6.4 Checklist de pruebas en dispositivos** (`docs/pruebas-dispositivos.md`) para el usuario: instalación, offline, TTS, pictogramas, safe areas y letra al 200 %, en Android e iOS.
- [x] **6.5 `LICENSE`** (CC BY-NC-SA 4.0 para contenido y código) y README final.
- [x] **6.6 Footer en todas las rutas** y enlace del CEP (P2).
- [x] **6.7a Pages activado** (Source: GitHub Actions) y primer despliegue OK el 20/11.
- [x] **6.7b Comprobación final** de la URL publicada (20/11): todas las rutas y recursos responden 200; el pie muestra la licencia nueva.

## Fase 7 · Revisión con el informe «A Incluir» (22/11)

> **Resultado (22/11):**
> - Fuente: `A Incluir/Competencia Digital Docente y Conocimiento.md` (informe de evidencia con unas 60 referencias). Solo se ha incorporado lo verificable.
> - **Bibliografía: de 25 a 51 referencias**, todas comprobadas (DOI en Crossref y enlace en `npm run check:links`: 56 enlaces, 0 errores). Tema nuevo «Evidencia».
> - Cifras usadas en web y diapositivas comprobadas en el resumen oficial (Crossref, Semantic Scholar o ERIC): Tamim et al. 2011 (0,35 / 0,33), Hillmayr et al. 2020 (g = 0,65; k = 92), Sailer et al. 2021, Kirschner y De Bruyckere 2017, Strelan et al. 2020 (g = 0,50), Sung et al. 2026 (−11,31 puntos; prohibiciones no significativas), Fan et al. 2025 y Bastani et al. 2025.
> - **Presentación: de 35 a 25 diapositivas en cinco actos** con un único hilo («¿qué tiene que pensar el alumno ahora que antes no pensaba?»). Se quitan los puentes de la escuela inclusiva y los cuatro antes/después por etapa (siguen en la web y en las notas). Nuevo tipo de diapositiva `keys` (7 claves).
> - **Notas del ponente** ampliadas en cada diapositiva: idea fuerza, guion, qué hacer, dato y fuente, transición y qué recortar si vas tarde. Se ven en `?notas` y en la **escaleta** (`docs/escaleta.md`, `docs/escaleta.pdf`), que sustituye a `docs/guion.md`. `npm run escaleta` comprueba ≤ 20 palabras y que no falte ningún campo.
> - **Sección nueva «Las 7 claves»** (`claves/`): cinco datos de evidencia, tres lentes (ICAP, PICRAT, modo diseño), siete claves con anclaje MRCDD, mecanismo, ejemplos por etapa, pregunta de autorrevisión, antipatrón y prompts enlazados; marcos convergentes.
> - **Sección nueva «Descargas»** (`recursos/`): guía para analizar tareas en 8 pasos (PDF y .md), cuaderno de prompts (PDF y .md), siete claves en una página (PDF) y plantilla en blanco, en es/en. Generados desde `content/` por `tools/build-docs.mjs`.
> - **Banco de prompts: de 23 a 32.** Categoría nueva «Analiza tu tarea» (radiografía, ICAP, PICRAT, competencia digital del alumnado) y prompts de evaluación del proceso, ejemplares y revisión entre pares, IA como alumno que se equivoca, sesión con fricción productiva y diario de práctica reflexiva. Variables con **desplegables** (`options`), enlaces a las claves (`see`), **siguiente paso** (`next`) y fuentes (`sources`).
> - typecheck 0 errores · HTML válido · axe, desbordes y consola sin problemas en las 11 rutas.

- [x] 7.1 Verificar referencias y cifras del informe; incorporar solo las comprobadas.
- [x] 7.2 Presentación más corta y directa + notas del ponente + escaleta (MD y PDF).
- [x] 7.3 Sección «Las 7 claves» y actualización de «La ponencia» y de los minutos de las votaciones.
- [x] 7.4 Descargables (guía de análisis de tareas, cuaderno de prompts, siete claves) en es/en.
- [x] 7.5 Prompts con desplegables, enlazados entre sí y con las claves y las fuentes.
- [ ] 7.6 Revisión del usuario: ensayar con la escaleta y cronometrar (objetivo: 45 min).

### Ampliación del 22/11 (tarde)

- [x] 7.7 Votación antes/después (v0 → v5) y diapositiva «¿Ha cambiado algo?».
- [x] 7.8 Votaciones conectadas (6 formularios, contador, QR). Arreglado el recuento con respuestas (`getResponseForItem`).
- [x] 7.9 Pictogramas: lemas, partículas omitidas y frases de lectura fácil reescritas; 0 palabras sin pictograma (es/en).
- [x] 7.10 Barras proporcionales al porcentaje; v2 antes de ICAP (activar práctica propia) y v3 como predicción antes del dato.
- [x] 7.11 Animaciones de atención (énfasis subrayado, escalón ICAP clave, cifras que cuentan, entradas escalonadas); nada con `prefers-reduced-motion`.
- [x] 7.12 Botones en pantalla (anterior, siguiente, pantalla completa) y red de seguridad anti-desborde. Auditoría: 28/28 diapositivas sin desborde en es/en; texto ≥ 40 px salvo la línea legal final.
- [x] 7.13 Perfil de ponente (contraseña, huella PBKDF2 en `site.json`) y **Archivar resultados y reiniciar** (Apps Script valida `PONENTE_CLAVE`, guarda en hoja de cálculo y pone a cero).
- [ ] 7.14 Usuario: `npm run ponente`, código nuevo del script, `PONENTE_CLAVE`, `prepararArchivo`, `actualizarFormularios`, nueva versión (docs/votaciones.md).

### Del informe, sin verificar (no se usa)

- Cifras de ICILS 2023 (España 495, media UE 493, internacional 476; 43 % del alumnado de la UE por debajo del nivel básico; brecha de 69 puntos por ISEC): no se pudo acceder al informe del INEE ni al de la Comisión.
- Subgrupos de Hillmayr et al. (2020): formación docente g = 0,84; parejas g = 0,72 frente a 0,46; visualizaciones dinámicas g = 1,02. El artículo (acceso abierto) no se pudo leer desde aquí; solo se usa el efecto global del resumen.
- Datos de OCDE 2026 y TALIS 2024 (37 % del profesorado usa IA; −31 % de tiempo de planificación; 72 % preocupado por la integridad): el informe está en la bibliografía, pero esas cifras no se citan.
- Estudio CEDEC–Universidad de Jaén sobre el Proyecto EDIA y las experiencias de centros concretos: no localizado.
- Lohr et al. (2024): existe (DOI 10.1016/j.tate.2024.104788), pero su contenido no se ha comprobado; no se cita.

---

## Pendiente fuera de las fases (por el usuario)

- [x] **Votaciones (P7) conectadas el 22/11.** Pendiente: ensayo con móvil y `vaciarRespuestas`. Antes: seguir `docs/votaciones.md` y enviar las 6 URL de los formularios (v0–v5) y la URL `/exec`. Después: rellenar `formUrl` y `votingEndpoint`, ejecutar `npm run qr` y `npm run build:all`, y hacer push.
- [ ] Probar los prompts publicados con `docs/pruebas-prompts.md`, sobre todo la precarga de Claude con sesión iniciada.
- [ ] Probar en Android e iOS reales con `docs/pruebas-dispositivos.md`, y el mando real del auditorio.
