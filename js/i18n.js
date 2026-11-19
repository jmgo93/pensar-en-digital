// @ts-check
/**
 * Textos de interfaz en español e inglés (content/ui.json).
 * Marcado: data-i18n="clave" (textContent) y data-i18n-attr="atributo:clave;atributo:clave".
 */
import { fetchJson } from './router.js';

/** @type {import('./types').UiStrings | null} */
let strings = null;

/** @returns {import('./types').Lang} */
export const getLang = () => window.pdPrefs.get().lang;

/** @returns {Promise<void>} */
export const loadStrings = async () => {
  strings ??= await fetchJson('content/ui.json');
};

/**
 * @param {string} key
 * @param {Record<string, string | number>} [vars] sustituye {nombre}
 * @returns {string}
 */
export const t = (key, vars = {}) => {
  const lang = getLang();
  const raw = strings?.[lang]?.[key] ?? strings?.es?.[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
};

/**
 * Traduce todos los elementos marcados dentro de `root`.
 * @param {ParentNode} [root]
 */
export const applyI18n = (root = document) => {
  for (const el of root.querySelectorAll('[data-i18n]')) {
    const key = /** @type {HTMLElement} */ (el).dataset.i18n;
    if (key) el.textContent = t(key);
  }
  for (const el of root.querySelectorAll('[data-i18n-attr]')) {
    const spec = /** @type {HTMLElement} */ (el).dataset.i18nAttr ?? '';
    for (const pair of spec.split(';')) {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr, t(key));
    }
  }
};

/**
 * Cambia el idioma, lo guarda y retraduce la página.
 * @param {import('./types').Lang} lang
 * @returns {boolean} si se pudo guardar
 */
export const setLang = (lang) => {
  const saved = window.pdPrefs.set({ lang });
  applyI18n();
  document.dispatchEvent(new CustomEvent('pd:langchange', { detail: lang }));
  return saved;
};
