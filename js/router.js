// @ts-check
/**
 * Rutas del sitio (fuente: content/routes.json). El sitio es multipágina: cada sección es una
 * carpeta con su index.html, y las transiciones entre páginas las hace la View Transitions API
 * entre documentos (css/a11y.css). Aquí: raíz relativa, enlaces y transiciones dentro de una página.
 */

/** Raíz del sitio, derivada de la ubicación de este módulo (funciona en /pensar-en-digital/ y en local). */
export const ROOT = new URL('../', import.meta.url);

/**
 * @param {string} path relativa a la raíz
 * @returns {URL}
 */
export const fromRoot = (path) => new URL(path, ROOT);

/**
 * @template T
 * @param {string} path relativa a la raíz
 * @returns {Promise<T>}
 */
export const fetchJson = async (path) => {
  const res = await fetch(fromRoot(path));
  if (!res.ok) throw new Error(`${res.status} al cargar ${path}`);
  return /** @type {Promise<T>} */ (res.json());
};

/** @returns {Promise<import('./types').Route[]>} */
export const loadRoutes = () => fetchJson('content/routes.json');

/** @returns {string} id de la ruta actual (atributo data-route del body) */
export const currentRouteId = () => document.body.dataset.route ?? 'inicio';

/**
 * Ejecuta un cambio de DOM dentro de la página con View Transition si está disponible
 * y el usuario no pide movimiento reducido; si no, lo aplica sin animar.
 * @param {() => void | Promise<void>} update
 * @returns {Promise<void>}
 */
export const transition = async (update) => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || document.hidden || typeof document.startViewTransition !== 'function') {
    await update();
    return;
  }
  const vt = document.startViewTransition(update);
  // Si la transición se aborta (pestaña oculta, otra transición), el cambio de DOM ya se ha hecho.
  vt.ready.catch(() => undefined);
  vt.finished.catch(() => undefined);
  await vt.updateCallbackDone.catch(() => undefined);
};
