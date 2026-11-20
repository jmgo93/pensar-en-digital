# TAREAS · Pensar en Digital

Leyenda: `[ ]` pendiente · `[x]` hecha · `[~]` en curso · `[!]` bloqueada (ver "Pendiente de decidir").
Cada fase termina con un commit. Push autorizado (20/11): cada push publica en Pages.

---

## Pendiente de decidir

| # | Asunto | Bloquea | Estado |
|---|---|---|---|
| P7 | El usuario sigue `docs/votaciones.md` y envía las 4 URL de los formularios y la URL `/exec` del contador | 5.4, 5.5 | **Esperando al usuario** |

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
- Licencias: CC BY 4.0 para el contenido y MIT para el código; ARASAAC con CC BY-NC-SA 4.0 aparte.
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

Depende de: Fase 1 aprobada; P1 y P4 para algunas piezas.

- [ ] **2.1 Esquema de contenido** (JSDoc `@typedef`): bloques con `es`/`en`, `lecturaFacil`, etapas, icono y fuentes.
- [ ] **2.2 Verificación de los marcos con fuente oficial:** MRCDD (BOE 16/05/2022) y DigCompEdu, DigComp en su versión vigente, CAST UDL 3.0, ICAP (Chi & Wylie, 2014), SAMR, TPACK, Reglamento (UE) 2024/1689 art. 4, RGPD/LOPDGDD y marco andaluz (Plan de Actuación Digital, Séneca, Moodle Centros).
  - Criterio: cada afirmación normativa enlaza a su fuente; lo que no se pueda verificar queda en "Pendiente".
- [ ] **2.3 Secciones:** Inicio, La ponencia, Marco CDD (áreas 3–6 y niveles A1–C2), Escuela inclusiva + digital (tabla puente y antes/después por etapa), Ideas para el lunes.
- [ ] **2.4 Bibliografía APA 7** con filtros por tema.
  - Criterio: todos los enlaces responden; ninguna referencia es inventada.
- [ ] **2.5 Perfil** (etapa y especialidad) que filtra y ordena los ejemplos, con selección en el primer acceso y posibilidad de cambiarlo.
- [ ] **2.6 Buscador:** índice generado (`tools/build-search-index`), tolerante a tildes y errores leves, con resaltado y atajo `/`.
- [ ] **2.7 Traducción al inglés** del contenido (según P4). Commit "Fase 2".

## Fase 3 · Plantilla socrática y banco de prompts

Depende de: Fase 2 (contenido y perfil).

- [ ] **3.1 Stepper socrático** sobre una actividad concreta. Dimensiones: ICAP, SAMR, exigencia cognitiva, DUA, resistencia a la IA, evaluación y datos.
  - Repreguntas según la respuesta.
- [ ] **3.2 Resultado:** perfil visual (barras o radar M3 accesibles, con tabla alternativa) entre "Digitalización" e "Innovación que genera aprendizaje", más propuestas de mejora.
- [ ] **3.3 Exportar:** impresión/PDF (CSS de impresión), copiar como texto y "Abrir en IA". Además, una versión PDF en blanco.
- [ ] **3.4 Comprobar hoy los parámetros de URL** de ChatGPT (`?q=`), Claude (`/new?q=`) y Gemini (si no admite prompt precargado: copiar al portapapeles, abrir la web y mostrar un snackbar).
  - Criterio: lo comprobado y la alternativa quedan documentados.
- [ ] **3.5 Guía breve de prompts** (rol, contexto, tarea, formato, restricciones; verificación, sesgos, RGPD, cuentas corporativas, andamiaje).
- [ ] **3.6 Tarjetas:** 10 categorías × al menos 2–3 tarjetas, con variantes por etapa, `[variables]` rellenables, ejemplo de resultado y botones Copiar / Gemini / ChatGPT / Claude / Compartir.
  - Criterio: ningún prompt pide datos personales.
- [ ] **3.7 Hoja de pruebas** `docs/pruebas-prompts.md`: prompt × servicio, resultado esperado y OK/KO, para que el usuario la rellene con la web publicada. Commit "Fase 3".

## Fase 4 · TTS, ARASAAC y PWA offline

Depende de: Fases 2 y 3.

- [ ] **4.1 TTS:** reproducir/pausar en cada bloque y leer toda la página, con voz `es-ES` o `en-*` según el idioma.
  - Resalta el fragmento que se lee y gestiona `voiceschanged` y los errores.
  - La ayuda explica que en iOS solo hay voces de Apple.
- [ ] **4.2 Verificar los endpoints de ARASAAC** en la documentación oficial (búsqueda y URLs de imagen; idioma `es`/`en`).
- [ ] **4.3 Modo pictográfico:** tokenizado, palabras vacías, tira de pictogramas, caché (Cache API + `localStorage`) y `content/picto-map.json` precalculado (`tools/`).
  - Atribución visible en el modo y en el footer.
- [ ] **4.4 Manifest:** rutas relativas, iconos de 192/512 (maskable y monochrome), `shortcuts` (IA, Plantilla, Bibliografía) y metadatos de iOS.
- [ ] **4.5 Service worker:** precache del shell y del contenido, stale-while-revalidate para ARASAAC y banner de "Nueva versión disponible".
  - Criterio: con DevTools offline, todas las rutas funcionan tras la primera visita.
- [ ] **4.6 Instalación:** botón propio en Android (`beforeinstallprompt`) y bottom sheet de iOS.
  - Criterio: DevTools → Manifest sin errores de instalabilidad. Commit "Fase 4".

## Fase 5 · Presentación, QR y guion

Depende de: Fase 2 (contenido), P1, P3 y P4.

- [ ] **5.1 Motor de diapositivas** 16:9, con los mismos tokens.
  - Teclado y mando: flechas, PageUp/PageDown, espacio, Inicio/Fin, `B`/`.` para pantalla negra y `F` para pantalla completa. También gamepad y gestos.
- [ ] **5.2 Notas en otra ventana** (`?notas`), sincronizadas con BroadcastChannel; temporizador con las marcas del guion; impresión a PDF.
- [ ] **5.3 Diapositivas por bloques (45 min):** máximo 20 palabras por diapositiva, cuerpo de 32 px o más y una idea por diapositiva.
- [~] **5.4 Votación en directo.**
  - [x] Preguntas en `content/votaciones.json` (v1 gancho, v2 ICAP, v3 IA, v4 cierre), 1 pregunta por formulario para cumplir los 3 toques.
  - [x] Apps Script `tools/apps-script/votaciones.gs`: crea los formularios, publica un contador en JSON/JSONP y vacía las respuestas entre sesiones.
  - [x] `js/votes.js` (consulta cada 4 s, JSONP de respaldo, modo demo) y `presentacion/resultados.html` (pantalla de proyección, ← / →).
  - [x] Instrucciones en `docs/votaciones.md`.
  - [ ] Conectar: `votingEndpoint` en `content/site.json` y `formUrl` en cada votación (P7). Prueba real de extremo a extremo.
  - [ ] Integrar las barras en las diapositivas.
- [ ] **5.5 QR en SVG** (`tools/` → `assets/qr/`) para cada sección. En las diapositivas ocupan ≥ 35 % del alto, con la URL legible debajo.
- [ ] **5.6 `docs/guion.md`** con tiempos y notas del ponente.
  - Criterio: legible al simular 1920×1080 al 25 %. Commit "Fase 5".

## Fase 6 · Verificación y publicación

Depende de: Fases 1–5.

- [ ] **6.1 Lighthouse móvil** ≥ 95 en Rendimiento, Accesibilidad, Buenas prácticas y SEO, en todas las rutas.
- [ ] **6.2 axe-core sin errores** y contraste comprobado en los 3 esquemas.
- [ ] **6.3 Job de comprobación en `pages.yml`** (validación HTML, enlaces rotos, axe, Lighthouse CI); el despliegue depende de él.
- [ ] **6.4 Checklist de pruebas en dispositivos** (`docs/pruebas-dispositivos.md`) para el usuario: instalación, offline, TTS, pictogramas, safe areas y letra al 200 %, en Android e iOS.
- [ ] **6.5 `LICENSE`** (CC BY 4.0 para el contenido y MIT para el código) y README final.
- [ ] **6.6 Footer en todas las rutas** y enlace del CEP (P2).
- [x] **6.7a Pages activado** (Source: GitHub Actions) y primer despliegue OK el 20/11.
- [ ] **6.7b Comprobación final** de la URL publicada. Commit "Fase 6".
