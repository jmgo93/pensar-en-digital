// @ts-check
/**
 * Precalcula content/picto-map.json: para cada palabra con significado de los textos "lecturaFacil"
 * (es y en), el id del pictograma de ARASAAC. Así el modo pictográfico funciona sin latencia
 * y sin conexión (las imágenes las cachea el service worker).
 * API verificada el 20/11/2026: https://api.arasaac.org/v1/pictograms/{lang}/bestsearch|search/{word}
 * Ejecutar a mano: `npm run picto`.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { SKIP, LEMMA, words } from '../js/picto-words.js';

const API = 'https://api.arasaac.org/v1/pictograms';

/** Recorre cualquier JSON y devuelve los objetos lecturaFacil. */
const collect = (/** @type {unknown} */ node, /** @type {{ es: string, en: string }[]} */ out = []) => {
  if (Array.isArray(node)) node.forEach((n) => collect(n, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'lecturaFacil' && v && typeof v === 'object') out.push(/** @type {any} */ (v));
      else collect(v, out);
    }
  }
  return out;
};

const dir = new URL('../content/', import.meta.url);
const texts = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !['search-index.json', 'picto-map.json'].includes(f))
  .flatMap((f) => collect(JSON.parse(readFileSync(new URL(f, dir), 'utf8'))));

/**
 * @param {'es' | 'en'} lang
 * @param {string} word
 * @returns {Promise<number | null>}
 */
const lookup = async (lang, word) => {
  for (const mode of ['bestsearch', 'search']) {
    const res = await fetch(`${API}/${lang}/${mode}/${encodeURIComponent(word)}`);
    if (res.ok) {
      /** @type {{ _id: number }[]} */
      const data = await res.json();
      if (Array.isArray(data) && data[0]) return data[0]._id;
    }
  }
  return null;
};

/** Variantes sencillas para plurales y formas comunes. */
const variants = (/** @type {'es' | 'en'} */ lang, /** @type {string} */ w) => {
  const lemma = LEMMA[lang][w];
  const v = lemma ? [lemma, w] : [w];
  if (lang === 'es') {
    if (w.endsWith('es')) v.push(w.slice(0, -2));
    if (w.endsWith('s')) v.push(w.slice(0, -1));
  } else {
    if (w.endsWith('ies')) v.push(`${w.slice(0, -3)}y`);
    if (w.endsWith('s')) v.push(w.slice(0, -1));
  }
  return v;
};

/** @type {{ es: Record<string, number>, en: Record<string, number> }} */
const map = { es: {}, en: {} };
let missing = 0;
for (const lang of /** @type {const} */ (['es', 'en'])) {
  const unique = [...new Set(texts.flatMap((tx) => words(tx[lang] ?? '', lang)))].filter((w) => !SKIP[lang].has(w));
  for (const w of unique) {
    let id = null;
    for (const cand of variants(lang, w)) {
      id = await lookup(lang, cand);
      if (id) break;
    }
    // 0 = sin pictograma: así el navegador no vuelve a buscarla.
    map[lang][w] = id ?? 0;
    if (!id) missing++;
  }
  console.log(`${lang}: ${Object.values(map[lang]).filter(Boolean).length} palabras con pictograma de ${unique.length}`);
}
writeFileSync(new URL('picto-map.json', dir), JSON.stringify(map));
console.log(`content/picto-map.json escrito (${missing} palabras sin pictograma).`);
