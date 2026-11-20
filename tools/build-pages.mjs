// @ts-check
/**
 * Genera el index.html de cada sección a partir de content/routes.json, content/ui.json y content/site.json.
 * Todas las páginas comparten shell (top bar, rail, bar, drawer, footer); el HTML sale en español y
 * js/i18n.js lo retraduce si el usuario elige inglés. Ejecutar a mano: `npm run pages`. El resultado se versiona.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

/** @param {string} p */
const readJson = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));

/** @type {import('../js/types').Route[]} */
const routes = readJson('content/routes.json');
/** @type {import('../js/types').UiStrings} */
const ui = readJson('content/ui.json');
/** @type {import('../js/types').Site} */
const site = readJson('content/site.json');
const es = ui.es;

/** @param {string} s */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** @param {string} key */
const tx = (key) => {
  const v = es[key];
  if (v == null) throw new Error(`Falta la clave "${key}" en content/ui.json`);
  return esc(v);
};

/** @param {string} key  Atributos aria-label + title traducibles. */
const label = (key) => `aria-label="${tx(key)}" title="${tx(key)}" data-i18n-attr="aria-label:${key};title:${key}"`;

/** @param {string} name */
const icon = (name) => `<span class="icon" aria-hidden="true">${name}</span>`;

/**
 * @param {import('../js/types').Route} r
 * @param {string} current
 * @param {string} rel
 */
const navItem = (r, current, rel) =>
  `<a class="nav-item" href="${rel}${r.path}"${r.id === current ? ' aria-current="page"' : ''}><span class="indicator">${icon(r.icon)}</span><span class="label" data-i18n="route.${r.id}.short">${tx(`route.${r.id}.short`)}</span></a>`;

/** Secciones cuyo contenido pinta js/sections.js o js/search.js. */
const RENDERED = new Set(['ponencia', 'marco', 'plantilla', 'inclusiva', 'ia', 'lunes', 'bibliografia', 'buscar']);

/** Contenido principal: cabecera estática + #view que rellena JS. */
const mainContent = (/** @type {import('../js/types').Route} */ route, /** @type {string} */ rel) => {
  if (route.id === 'inicio') {
    const cards = routes
      .filter((r) => r.id !== 'inicio')
      .map(
        (r) => `
          <a class="card card-elevated interactive" href="${rel}${r.path}">
            <span class="card-header"><span class="card-icon">${icon(r.icon)}</span><span class="title-medium" data-i18n="route.${r.id}">${tx(`route.${r.id}`)}</span></span>
          </a>`,
      )
      .join('');
    return `
      <section class="hero" aria-labelledby="page-title">
        <h1 id="page-title" data-i18n="app.name">${tx('app.name')}</h1>
        <p data-i18n="app.subtitle">${tx('app.subtitle')}</p>
        <div class="btn-row">
          <a class="btn btn-filled interactive" href="${rel}plantilla/">${icon('psychology')}<span data-i18n="home.cta.plantilla">${tx('home.cta.plantilla')}</span></a>
          <a class="btn btn-outlined interactive" href="${rel}ia/">${icon('smart_toy')}<span data-i18n="home.cta.ia">${tx('home.cta.ia')}</span></a>
        </div>
      </section>
      <section aria-labelledby="sections-title" class="stack">
        <h2 id="sections-title" class="title-large" data-i18n="home.sections">${tx('home.sections')}</h2>
        <div class="grid-cards">${cards}
        </div>
      </section>
      <div id="view" class="stack home-view" aria-busy="true"></div>`;
  }
  return `
      <header class="page-header">
        <h1 id="page-title" data-i18n="route.${route.id}">${tx(`route.${route.id}`)}</h1>
      </header>
      <div id="view" class="stack"${RENDERED.has(route.id) ? ' aria-busy="true"' : ''}>
        ${RENDERED.has(route.id) ? `<p class="muted" data-i18n="app.loading">${tx('app.loading')}</p>` : `<div class="card card-filled"><p data-i18n="app.placeholder">${tx('app.placeholder')}</p></div>`}
      </div>`;
};

/**
 * @param {import('../js/types').Route} route
 * @returns {string}
 */
const page = (route) => {
  const depth = route.path.split('/').filter(Boolean).length;
  const rel = depth ? '../'.repeat(depth) : './';
  const title = route.id === 'inicio' ? `${es['app.name']} · ${es['app.subtitle']}` : `${es[`route.${route.id}`]} · ${es['app.name']}`;
  const css = ['tokens-color', 'tokens', 'base', 'components', 'a11y'].map((f) => `  <link rel="stylesheet" href="${rel}css/${f}.css">`).join('\n');

  return `<!doctype html>
<!-- GENERADO por tools/build-pages.mjs — no editar a mano. -->
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${tx('app.subtitle')}">
  <meta name="author" content="${esc(site.author)}">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#fff8f6">
  <link rel="icon" href="${rel}assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="${site.url}${route.path}">
  <link rel="preload" href="${rel}assets/fonts/material-symbols-rounded.woff2" as="font" type="font/woff2" crossorigin>
${css}
  <script src="${rel}js/boot.js"></script>
  <script type="module" src="${rel}js/app.js"></script>
</head>
<body data-route="${route.id}">
  <a class="skip-link" href="#main" data-i18n="app.skip">${tx('app.skip')}</a>
  <div class="app">
    <header class="top-app-bar">
      <a class="brand" href="${rel}">
        <span class="brand-mark" aria-hidden="true">${icon('lightbulb')}</span>
        <span class="brand-name" data-i18n="app.name">${tx('app.name')}</span>
      </a>
      <div class="actions">
        <a class="icon-btn interactive" href="${rel}buscar/" ${label('app.search')}>${icon('search')}</a>
        <button type="button" class="icon-btn interactive" data-action="a11y" aria-haspopup="dialog" ${label('a11y.open')}>${icon('accessibility_new')}</button>
      </div>
    </header>

    <nav class="nav-rail" ${label('app.nav').replace(/ title="[^"]*"/, '').replace(';title:app.nav', '')}>
      <button type="button" class="icon-btn interactive menu-btn" data-action="drawer" aria-haspopup="dialog" ${label('app.menu')}>${icon('menu')}</button>
      ${routes.filter((r) => r.rail).map((r) => navItem(r, route.id, rel)).join('\n      ')}
    </nav>

    <main id="main" tabindex="-1" aria-labelledby="page-title">${mainContent(route, rel)}
    </main>

    <footer class="site-footer">
      <p>© ${site.year} ${esc(site.author)} · <span data-i18n="footer.licensePre">${tx('footer.licensePre')}</span> <a href="${site.licenseContentUrl}" rel="license" data-i18n="footer.license">${tx('footer.license')}</a> · <span data-i18n="footer.claude">${tx('footer.claude')}</span></p>
      <p><span data-i18n="footer.cep">${tx('footer.cep')}</span> <a href="${site.cepUrl}" data-i18n="footer.cepLink">${tx('footer.cepLink')}</a> <span data-i18n="footer.cepAfter">${tx('footer.cepAfter')}</span></p>
      <p><span data-i18n="footer.arasaacPre">${tx('footer.arasaacPre')}</span> <a href="${site.arasaacUrl}">ARASAAC</a>. <span data-i18n="footer.arasaacLic">${tx('footer.arasaacLic')}</span> <a href="${site.licenseArasaacUrl}">CC BY-NC-SA 4.0</a> <span data-i18n="footer.arasaacNote">${tx('footer.arasaacNote')}</span> <span data-i18n="footer.icons">${tx('footer.icons')}</span></p>
    </footer>

    <nav class="nav-bar" ${label('app.nav').replace(/ title="[^"]*"/, '').replace(';title:app.nav', '')}>
      ${routes.filter((r) => r.bar).map((r) => navItem(r, route.id, rel)).join('\n      ')}
      <button type="button" class="nav-item" data-action="drawer" aria-haspopup="dialog"><span class="indicator">${icon('menu')}</span><span class="label" data-i18n="app.more">${tx('app.more')}</span></button>
    </nav>
  </div>

  <dialog id="nav-drawer" class="nav-drawer" aria-labelledby="drawer-title">
    <div class="drawer-inner">
      <div class="drawer-head">
        <h2 id="drawer-title" data-i18n="app.menu">${tx('app.menu')}</h2>
        <button type="button" class="icon-btn interactive" data-action="close" ${label('app.close')}>${icon('close')}</button>
      </div>
      <ul class="drawer-list">
        ${routes
          .map(
            (r) =>
              `<li><a class="drawer-item interactive" href="${rel}${r.path}"${r.id === route.id ? ' aria-current="page"' : ''}>${icon(r.icon)}<span data-i18n="route.${r.id}">${tx(`route.${r.id}`)}</span></a></li>`,
          )
          .join('\n        ')}
      </ul>
    </div>
  </dialog>

  <div class="snackbar-host" role="status" aria-live="polite"></div>
</body>
</html>
`;
};

for (const route of routes) {
  const dir = new URL(`../${route.path}`, import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), page(route));
}
console.log(`${routes.length} páginas generadas.`);
