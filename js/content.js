// @ts-check
/**
 * Acceso al contenido (content/*.json) y marcado en línea mínimo:
 *   **negrita**, *cursiva*, [texto](url) y citas [@id] → enlace a la bibliografía.
 */
import { fetchJson, fromRoot } from './router.js';
import { getLang } from './i18n.js';
import { h } from './ui.js';

/** @type {Map<string, Promise<unknown>>} */
const cache = new Map();

/**
 * @template T
 * @param {string} name nombre sin extensión dentro de content/
 * @returns {Promise<T>}
 */
export const loadContent = (name) => {
  if (!cache.has(name)) cache.set(name, fetchJson(`content/${name}.json`));
  return /** @type {Promise<T>} */ (cache.get(name));
};

/**
 * Valor en el idioma activo.
 * @template T
 * @param {import('./types').Localized<T> | undefined | null} value
 * @returns {T}
 */
export const loc = (value) => /** @type {T} */ (value ? value[getLang()] ?? value.es : '');

/**
 * @typedef {{ id: string, cite: string, apa: string, url: string, topics: string[] }} Source
 * @typedef {{ verified: string, topics: Record<string, import('./types').Localized>, items: Source[] }} Sources
 */

/** @type {Map<string, Source>} */
let sourceIndex = new Map();

/** Carga las fuentes para poder resolver las citas [@id]. */
export const loadSources = async () => {
  /** @type {Sources} */
  const sources = await loadContent('fuentes');
  sourceIndex = new Map(sources.items.map((s) => [s.id, s]));
  return sources;
};

/**
 * Etiqueta de cita en el idioma activo.
 * @param {Source} source
 */
export const citeLabel = (source) => (getLang() === 'en' ? source.cite.replace(' y ', ' & ').replace('s. f.', 'n.d.') : source.cite);

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[@[\w-]+\]|\[[^\]]+\]\([^)]+\))/g;

/**
 * Convierte el marcado en línea en nodos (sin innerHTML).
 * @param {string} text
 * @returns {DocumentFragment}
 */
export const inline = (text) => {
  const frag = document.createDocumentFragment();
  for (const part of text.split(TOKEN)) {
    if (!part) continue;
    if (part.startsWith('**')) frag.append(h('strong', {}, part.slice(2, -2)));
    else if (part.startsWith('[@')) {
      const id = part.slice(2, -1);
      const src = sourceIndex.get(id);
      if (!src) {
        frag.append(part);
        continue;
      }
      frag.append(
        h('a', { class: 'cite', href: `${fromRoot('bibliografia/').href}#${id}` }, `(${citeLabel(src)})`),
      );
    } else if (part.startsWith('[')) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      frag.append(m ? h('a', { href: m[2] ?? '#' }, m[1] ?? '') : part);
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) frag.append(h('em', {}, part.slice(1, -1)));
    else frag.append(part);
  }
  return frag;
};

/**
 * Lista de párrafos con marcado en línea.
 * @param {string[]} paragraphs
 * @returns {HTMLElement[]}
 */
export const paragraphs = (paragraphs) => paragraphs.map((p) => h('p', {}, inline(p)));

/**
 * Bloque de "lectura fácil" (visible solo en modo pictográfico; js/picto.js le añade los pictogramas).
 * @param {import('./types').Localized | undefined} value
 */
export const easyRead = (value) =>
  value ? h('div', { class: 'easy-read', 'data-easy-read': '', lang: getLang() }, h('p', {}, loc(value))) : null;

/** Texto sin marcado (para el índice de búsqueda y la lectura en voz alta). */
export const plain = (/** @type {string} */ text) =>
  text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\s?\[@[\w-]+\]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
