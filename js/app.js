// @ts-check
/**
 * Punto de entrada de todas las páginas de la PWA.
 * El shell (top bar, navegación, footer) viene en el HTML generado por tools/build-pages.mjs;
 * aquí se traduce, se conecta y se activa el comportamiento.
 */
import { loadStrings, applyI18n, getLang, t } from './i18n.js';
import { initA11yPanel } from './a11y.js';
import { initRipple, openModal } from './ui.js';
import { fromRoot, currentRouteId } from './router.js';

/** Título del documento en el idioma activo. */
const updateTitle = () => {
  const id = currentRouteId();
  document.title = id === 'inicio' ? `${t('app.name')} · ${t('app.subtitle')}` : `${t(`route.${id}`)} · ${t('app.name')}`;
};

/** Top bar con fondo "scrolled" (M3) cuando el contenido pasa por debajo. */
const initTopBarElevation = () => {
  const bar = document.querySelector('.top-app-bar');
  if (!bar) return;
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;inset:0 0 auto;height:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => bar.classList.toggle('is-scrolled', !entry?.isIntersecting)).observe(sentinel);
};

/** Botones `[data-action="drawer"]` abren el navigation drawer modal. */
const initDrawer = () => {
  const drawer = /** @type {HTMLDialogElement | null} */ (document.getElementById('nav-drawer'));
  if (!drawer) return;
  for (const btn of document.querySelectorAll('[data-action="drawer"]')) {
    btn.addEventListener('click', () => openModal(drawer, /** @type {HTMLElement} */ (btn)));
  }
  drawer.querySelector('[data-action="close"]')?.addEventListener('click', () => drawer.close());
};

/** Atajo `/` → buscador (salvo si se está escribiendo). */
const initShortcuts = () => {
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (document.querySelector('dialog[open]')) return;
    e.preventDefault();
    const search = /** @type {HTMLInputElement | null} */ (document.querySelector('#search-input'));
    if (search) search.focus();
    else location.href = fromRoot('buscar/').href;
  });
};

const init = async () => {
  initRipple();
  initA11yPanel();
  initDrawer();
  initTopBarElevation();
  initShortcuts();
  try {
    await loadStrings();
    // El HTML llega en español; solo hace falta retraducir si el idioma es otro.
    if (getLang() !== 'es') {
      applyI18n();
      updateTitle();
    }
    document.addEventListener('pd:langchange', updateTitle);
  } catch (err) {
    console.error('No se pudieron cargar los textos de interfaz', err);
  }
};

init();
