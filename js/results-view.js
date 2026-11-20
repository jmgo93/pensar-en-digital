// @ts-check
/**
 * Pantalla de resultados en directo (presentacion/resultados.html?v=v1).
 * Parámetros: v (id de votación), demo (datos ficticios para ensayar).
 * Teclas: ← / → cambian de votación. Se reutilizará dentro de las diapositivas (Fase 5).
 */
import { fetchJson } from './router.js';
import { loadStrings, t, getLang, applyI18n } from './i18n.js';
import { fetchResults, demoSource, poll } from './votes.js';
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
  const max = Math.max(1, ...counts);

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
    fill.style.inlineSize = `${(n / max) * 100}%`;
    row.classList.toggle('is-top', total > 0 && n === max);
    /** @type {HTMLElement} */ (row.querySelector('.vote-num')).textContent = total ? `${pct} %` : '';
    /** @type {HTMLElement} */ (row.querySelector('.vote-label')).textContent = labels[i] ?? '';
  });
};

const init = async () => {
  await loadStrings();
  applyI18n();
  const params = new URLSearchParams(location.search);
  const demo = params.has('demo');
  /** @type {import('./types').Vote[]} */
  const votes = await fetchJson('content/votaciones.json');
  /** @type {import('./types').Site} */
  const site = await fetchJson('content/site.json');

  let index = Math.max(0, votes.findIndex((v) => v.id === params.get('v')));
  const root = /** @type {HTMLElement} */ (document.getElementById('results'));
  const status = /** @type {HTMLElement} */ (document.getElementById('status'));
  const totalEl = /** @type {HTMLElement} */ (document.getElementById('total'));
  /** @type {() => void} */
  let stop = () => {};

  /** @param {string} key @param {'ok' | 'warn'} kind */
  const setStatus = (key, kind) => {
    status.textContent = t(key);
    status.dataset.kind = kind;
  };

  const show = () => {
    stop();
    const vote = /** @type {import('./types').Vote} */ (votes[index]);
    const lang = getLang();
    history.replaceState(null, '', `?v=${vote.id}${demo ? '&demo' : ''}`);
    /** @type {HTMLElement} */ (document.getElementById('block')).textContent = vote.block[lang];
    /** @type {HTMLElement} */ (document.getElementById('question')).textContent = vote.question[lang];
    /** @type {HTMLElement} */ (document.getElementById('form-url')).textContent = vote.formUrl.replace(/^https?:\/\//, '');
    /** @type {HTMLElement} */ (document.getElementById('scan')).hidden = !vote.formUrl;
    renderResults(root, vote, null);
    totalEl.textContent = t('votes.waiting');

    /** @type {(() => Promise<import('./votes.js').VoteResult>) | null} */
    let source = null;
    if (demo) {
      const gen = demoSource(vote.id, vote.options.map((o) => o.es));
      source = async () => gen();
      setStatus('votes.demo', 'warn');
    } else if (site.votingEndpoint) {
      source = () => fetchResults(site.votingEndpoint, vote.id);
      setStatus('votes.live', 'ok');
    } else {
      setStatus('votes.notConfigured', 'warn');
    }
    if (!source) return;

    stop = poll(
      source,
      (r) => {
        renderResults(root, vote, r);
        totalEl.textContent = r.total === 1 ? t('votes.totalOne') : r.total ? t('votes.total', { n: r.total }) : t('votes.waiting');
        if (!demo) setStatus('votes.live', 'ok');
      },
      () => setStatus('votes.offline', 'warn'),
      demo ? 1500 : 4000,
    );
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') index = Math.min(votes.length - 1, index + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') index = Math.max(0, index - 1);
    else return;
    show();
  });

  show();
};

init();
