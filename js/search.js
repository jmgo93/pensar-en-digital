// @ts-check
/**
 * Buscador global sobre content/search-index.json.
 * Tolera tildes, mayúsculas y errores leves (distancia de edición ≤ 1, o ≤ 2 en palabras largas).
 * Resalta las coincidencias. Atajo `/` (js/app.js) enfoca el campo.
 */
import { fetchJson, fromRoot } from './router.js';
import { getLang, t } from './i18n.js';
import { h, icon } from './ui.js';

/** @typedef {{ u: string, s: string, t: string, x: string }} Entry */
/** @typedef {Entry & { nt: string[], nx: string[] }} Indexed */

/** @param {string} s */
export const normalize = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** @param {string} s */
const tokens = (s) => normalize(s).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1);

/**
 * Distancia de Levenshtein con corte temprano.
 * @param {string} a
 * @param {string} b
 * @param {number} max
 */
export const distance = (a, b, max) => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length] ?? max + 1;
};

/**
 * ¿Coincide la palabra buscada con alguna del texto? Devuelve las palabras del texto que coinciden.
 * @param {string} q palabra normalizada
 * @param {string[]} words
 */
const matchWord = (q, words) => {
  const max = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0;
  return words.filter(
    (w) => w.startsWith(q) || (max > 0 && (distance(q, w, max) <= max || (w.length > q.length && distance(q, w.slice(0, q.length), max) <= max))),
  );
};

/**
 * @param {Indexed[]} entries
 * @param {string} query
 * @returns {{ entry: Indexed, score: number, hits: string[] }[]}
 */
export const search = (entries, query) => {
  const qs = tokens(query);
  if (!qs.length) return [];
  /** @type {{ entry: Indexed, score: number, hits: string[] }[]} */
  const out = [];
  for (const entry of entries) {
    let score = 0;
    /** @type {string[]} */
    const hits = [];
    let all = true;
    for (const q of qs) {
      const inTitle = matchWord(q, entry.nt);
      const inText = matchWord(q, entry.nx);
      if (!inTitle.length && !inText.length) {
        all = false;
        break;
      }
      score += inTitle.length * 5 + Math.min(inText.length, 5) + (inTitle.includes(q) || inText.includes(q) ? 2 : 0);
      hits.push(...inTitle, ...inText);
    }
    if (all) out.push({ entry, score, hits: [...new Set(hits)] });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 30);
};

/**
 * Resalta en `text` las palabras cuya forma normalizada está en `hits` (sin innerHTML).
 * @param {string} text
 * @param {string[]} hits
 * @returns {DocumentFragment}
 */
export const highlight = (text, hits) => {
  const frag = document.createDocumentFragment();
  const set = new Set(hits);
  for (const part of text.split(/([\p{L}\p{N}]+)/u)) {
    if (part && set.has(normalize(part))) frag.append(h('mark', {}, part));
    else if (part) frag.append(part);
  }
  return frag;
};

/**
 * Fragmento del texto alrededor de la primera coincidencia.
 * @param {string} text
 * @param {string[]} hits
 */
const snippet = (text, hits) => {
  const n = normalize(text);
  const pos = Math.min(...hits.map((w) => n.indexOf(w)).filter((i) => i >= 0), text.length);
  const start = Math.max(0, pos - 60);
  return `${start > 0 ? '…' : ''}${text.slice(start, start + 200)}${start + 200 < text.length ? '…' : ''}`;
};

/** Pinta la página del buscador en #view. */
export const renderSearch = async () => {
  const view = document.getElementById('view');
  if (!view) return;
  /** @type {Record<string, Entry[]>} */
  const raw = await fetchJson('content/search-index.json');
  const lang = getLang();
  /** @type {Indexed[]} */
  const entries = (raw[lang] ?? raw.es ?? []).map((e) => ({ ...e, nt: tokens(e.t), nx: tokens(e.x) }));

  const input = /** @type {HTMLInputElement} */ (
    h('input', { id: 'search-input', type: 'search', class: 'search-input', autocomplete: 'off', spellcheck: 'false', placeholder: t('search.placeholder'), 'aria-describedby': 'search-status' })
  );
  const status = h('p', { id: 'search-status', class: 'muted', role: 'status' }, t('search.hint'));
  const list = h('ol', { class: 'search-results' });

  let timer = 0;
  const run = () => {
    const q = input.value.trim();
    const params = new URLSearchParams(location.search);
    if (q) params.set('q', q);
    else params.delete('q');
    history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
    if (!q) {
      list.replaceChildren();
      status.textContent = t('search.hint');
      return;
    }
    const results = search(entries, q);
    status.textContent = results.length === 1 ? t('search.one') : results.length ? t('search.count', { n: results.length }) : t('search.none');
    list.replaceChildren(
      ...results.map(({ entry, hits }) =>
        h(
          'li',
          {},
          h(
            'a',
            { class: 'card card-outlined search-result interactive', href: fromRoot(entry.u).href },
            h('span', { class: 'label-medium muted' }, t(`route.${entry.s}`)),
            h('span', { class: 'title-medium' }, highlight(entry.t, hits)),
            entry.x ? h('span', { class: 'body-medium' }, highlight(snippet(entry.x, hits), hits)) : null,
          ),
        ),
      ),
    );
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(run, 120);
  });

  view.replaceChildren(
    h('form', { class: 'search-bar', role: 'search', onsubmit: (/** @type {Event} */ e) => { e.preventDefault(); run(); } },
      h('label', { for: 'search-input', class: 'visually-hidden' }, t('search.label')),
      icon('search'),
      input,
    ),
    h('p', { class: 'body-small muted' }, t('search.shortcut')),
    status,
    list,
  );
  view.removeAttribute('aria-busy');
  const q = new URLSearchParams(location.search).get('q');
  if (q) {
    input.value = q;
    run();
  }
  input.focus();
};
