// @ts-check
/** Barras de resultados de una votación (pantalla de resultados y diapositivas). */
import { getLang } from './i18n.js';
import { h } from './ui.js';

/**
 * Pinta (o actualiza) el bloque de resultados dentro de `root`.
 * @param {HTMLElement} root
 * @param {import('./types').Vote} vote
 * @param {import('./votes.js').VoteResult | null} result
 */
export const renderResults = (root, vote, result) => {
  const lang = getLang();
  const labels = vote.options.map((o) => o[lang]);
  const counts = result?.counts ?? labels.map(() => 0);
  const total = result?.total ?? 0;
  const max = Math.max(...counts);

  let list = root.querySelector('.vote-bars');
  if (!list || list.childElementCount !== labels.length) {
    list = h(
      'ol',
      { class: 'vote-bars' },
      ...labels.map((label) =>
        h(
          'li',
          { class: 'vote-row' },
          h('span', { class: 'vote-label' }, label),
          h('span', { class: 'vote-track', 'aria-hidden': 'true' }, h('span', { class: 'vote-fill' })),
          h('span', { class: 'vote-num' }),
        ),
      ),
    );
    root.querySelector('.vote-bars')?.remove();
    root.append(list);
  }

  [...list.children].forEach((row, i) => {
    const n = counts[i] ?? 0;
    const pct = total ? Math.round((n / total) * 100) : 0;
    const fill = /** @type {HTMLElement} */ (row.querySelector('.vote-fill'));
    fill.style.inlineSize = `${pct}%`;
    row.classList.toggle('is-top', total > 0 && n === max);
    /** @type {HTMLElement} */ (row.querySelector('.vote-num')).textContent = total ? `${pct} %` : '';
    /** @type {HTMLElement} */ (row.querySelector('.vote-label')).textContent = labels[i] ?? '';
  });
};

