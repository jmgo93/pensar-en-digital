// @ts-check
/**
 * Modo pictográfico (ARASAAC). Muestra, bajo cada bloque clave, su resumen en lectura fácil
 * como tira de pictogramas con la palabra debajo.
 * - Mapa precalculado: content/picto-map.json (sin latencia, sin conexión).
 * - Palabras que falten: búsqueda en la API con caché en localStorage; las imágenes las cachea el SW.
 * Pictogramas: Sergio Palao. Propiedad: Gobierno de Aragón. Origen: ARASAAC. Licencia CC BY-NC-SA 4.0.
 */
import { fetchJson } from './router.js';
import { getLang, t } from './i18n.js';
import { h } from './ui.js';
import { STOPWORDS, words } from './picto-words.js';

const API = 'https://api.arasaac.org/v1/pictograms';
const IMG = (/** @type {number} */ id) => `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;
const CACHE_KEY = 'pd-picto-cache';

/** @type {{ es: Record<string, number>, en: Record<string, number> } | null} */
let map = null;

/** @returns {Record<string, number | 0>} */
const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
};

/** @param {Record<string, number | 0>} c */
const writeCache = (c) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* sin almacenamiento */
  }
};

/**
 * Id del pictograma para una palabra (mapa → caché → API). 0 = sin pictograma conocido.
 * @param {'es' | 'en'} lang
 * @param {string} word
 * @returns {Promise<number>}
 */
const pictoFor = async (lang, word) => {
  const pre = map?.[lang]?.[word];
  if (pre !== undefined) return pre;
  const cache = readCache();
  const key = `${lang}:${word}`;
  if (key in cache) return cache[key] ?? 0;
  if (!navigator.onLine) return 0;
  try {
    const res = await fetch(`${API}/${lang}/bestsearch/${encodeURIComponent(word)}`);
    /** @type {{ _id: number }[]} */
    const data = res.ok ? await res.json() : [];
    const id = data[0]?._id ?? 0;
    writeCache({ ...readCache(), [key]: id });
    return id;
  } catch {
    return 0;
  }
};

/**
 * Pinta la tira de pictogramas de un bloque de lectura fácil.
 * @param {HTMLElement} box
 */
const renderStrip = async (box) => {
  if (box.querySelector('.picto-strip')) return;
  const lang = /** @type {'es' | 'en'} */ (box.lang === 'en' ? 'en' : 'es');
  const text = box.querySelector('p')?.textContent ?? '';
  const strip = h('ul', { class: 'picto-strip', 'aria-hidden': 'true' });
  box.append(strip);
  for (const w of words(text, lang)) {
    const id = STOPWORDS[lang].has(w) ? 0 : await pictoFor(lang, w);
    strip.append(
      h(
        'li',
        { class: id ? 'picto' : 'picto is-word' },
        id ? h('img', { src: IMG(id), alt: '', width: 300, height: 300, loading: 'lazy', decoding: 'async' }) : null,
        h('span', {}, w),
      ),
    );
  }
};

/** Atribución visible dentro del modo pictográfico (además del footer). */
const attribution = () =>
  h('p', { class: 'picto-attrib body-small' }, t('picto.attribution'));

/** Activa o desactiva el modo en la página actual. */
export const applyPicto = async () => {
  const on = window.pdPrefs.get().picto;
  const main = document.getElementById('main');
  main?.querySelector('.picto-attrib')?.remove();
  if (!on) return;
  try {
    map ??= await fetchJson('content/picto-map.json');
  } catch {
    map = { es: {}, en: {} };
  }
  main?.prepend(attribution());
  const lang = getLang();
  for (const box of document.querySelectorAll('[data-easy-read]')) {
    const el = /** @type {HTMLElement} */ (box);
    if (el.lang !== lang) continue;
    renderStrip(el);
  }
};
