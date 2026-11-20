// @ts-check
/**
 * Motor de diapositivas ligero (presentacion/). Lienzo 16:9 de 1920×1080 escalado a la ventana.
 * - Teclado y mando de presentación: → ← Av/Re Pág, espacio, Inicio/Fin, B/. (negro), F (pantalla completa),
 *   N (ventana de notas), T (reiniciar cronómetro), número + Intro (ir a).
 * - Gestos (deslizar) y mando de juego (Gamepad API).
 * - Ventana de notas (?notas) sincronizada por BroadcastChannel, con cronómetro y marcas del guion.
 * - Impresión a PDF: una diapositiva por página.
 */
import { fetchJson, fromRoot, transition } from './router.js';
import { loadStrings, t, getLang } from './i18n.js';
import { loadSources, loc, citeLabel } from './content.js';
import { h, icon } from './ui.js';
import { renderResults } from './vote-bars.js';
import { fetchResults, poll } from './votes.js';

/** @typedef {import('./types').Localized} L */
/** @typedef {Record<string, any> & { id: string, block: string, at: number, type: string, notes: string }} Slide */
/** @typedef {{ blocks: { id: string, from: number, to: number, title: L }[], slides: Slide[] }} Deck */

const CHANNEL = 'pd-presentacion';
const W = 1920;
const H = 1080;

/**
 * @param {Slide} s
 * @param {{ votes: Record<string, import('./types').Vote>, site: import('./types').Site, sources: Map<string, import('./content.js').Source> }} ctx
 * @returns {HTMLElement}
 */
const slideContent = (s, ctx) => {
  const cite = s.cite && ctx.sources.get(s.cite) ? h('p', { class: 's-cite' }, `(${citeLabel(/** @type {any} */ (ctx.sources.get(s.cite)))})`) : null;
  /** @param {string} name */
  const qr = (name) => h('img', { class: 's-qr', src: fromRoot(`assets/qr/${name}.svg`).href, alt: '', width: 520, height: 520 });
  const shortUrl = (/** @type {string} */ path) => `${ctx.site.shortUrl}/${path}`.replace(/\/$/, '');

  switch (s.type) {
    case 'title':
      return h('div', { class: 's-title' }, h('p', { class: 's-brand' }, icon('lightbulb'), ' Pensar en Digital'), h('h1', {}, loc(s.title)), h('p', { class: 's-author' }, loc(s.subtitle)));
    case 'statement':
      return h('div', { class: 's-statement' }, h('h2', {}, loc(s.text)), s.small ? h('p', { class: 's-small' }, loc(s.small)) : null, cite);
    case 'compare':
      return h(
        'div',
        { class: 's-compare' },
        h('h2', {}, loc(s.title)),
        h('div', { class: 's-cols' }, ...s.items.map((/** @type {any} */ it) => h('div', { class: 's-col' }, h('p', { class: 's-label' }, loc(it.label)), h('p', { class: 's-text' }, loc(it.text))))),
      );
    case 'list':
      return h('div', { class: 's-list' }, h('h2', {}, loc(s.title)), h('ul', {}, ...s.items.map((/** @type {L} */ it) => h('li', {}, loc(it)))), cite);
    case 'ladder':
      return h('div', { class: 's-ladder' }, h('h2', {}, loc(s.title)), h('ol', {}, ...s.steps.map((/** @type {L} */ st, /** @type {number} */ i) => h('li', { style: `--i:${i}` }, loc(st)))), cite);
    case 'bridge':
      return h(
        'div',
        { class: 's-bridge' },
        h('h2', {}, loc(s.from), h('span', { class: 's-arrow', 'aria-hidden': 'true' }, ' → '), h('span', { class: 'visually-hidden' }, ': '), loc(s.to)),
        h('div', { class: 's-cols' }, h('div', { class: 's-col good' }, h('p', { class: 's-label' }, icon('trending_up'), t('inclusiva.multiplies')), h('p', { class: 's-text' }, loc(s.good))), h('div', { class: 's-col bad' }, h('p', { class: 's-label' }, icon('trending_down'), t('inclusiva.destroys')), h('p', { class: 's-text' }, loc(s.bad)))),
        cite,
      );
    case 'ba':
      return h(
        'div',
        { class: 's-ba' },
        h('h2', {}, t(`slides.stage.${s.stage}`)),
        h('div', { class: 's-cols' }, h('div', { class: 's-col before' }, h('p', { class: 's-label' }, t('inclusiva.before')), h('p', { class: 's-text' }, loc(s.before))), h('div', { class: 's-col after' }, h('p', { class: 's-label' }, t('inclusiva.after')), h('p', { class: 's-text' }, loc(s.after)))),
      );
    case 'big':
      return h('div', { class: 's-big' }, h('p', { class: 's-number' }, s.number), h('p', { class: 's-text' }, loc(s.text)), cite);
    case 'qr':
      return h(
        'div',
        { class: 's-qrs' },
        h('h2', {}, loc(s.title)),
        h('div', { class: 's-qr-row' }, ...s.targets.map((/** @type {any} */ tg) => h('figure', {}, qr(tg.qr), h('figcaption', {}, h('strong', {}, loc(tg.label)), h('span', {}, shortUrl(tg.qr === 'inicio' ? '' : `${tg.qr}/`)))))),
      );
    case 'vote': {
      const vote = ctx.votes[s.vote];
      if (!vote) return h('div');
      const results = h('div', { class: 's-results' });
      renderResults(results, vote, null);
      return h(
        'div',
        { class: 's-vote', 'data-vote': vote.id },
        h('div', { class: 's-vote-main' }, h('p', { class: 's-kicker' }, icon('how_to_vote'), t('slides.vote')), h('h2', {}, loc(vote.question)), results, h('p', { class: 's-status' })),
        vote.formUrl ? h('figure', { class: 's-vote-qr' }, qr(vote.id), h('figcaption', {}, vote.formUrl.replace(/^https?:\/\//, ''))) : null,
      );
    }
    case 'end':
      return h(
        'div',
        { class: 's-end' },
        h('h2', {}, loc(s.title)),
        h('p', { class: 's-small' }, ctx.site.shortUrl),
        h('p', { class: 's-legal' }, `© ${ctx.site.year} ${ctx.site.author} · ${t('footer.licensePre')} ${t('footer.license')} · ${t('footer.claude')}`),
        h('p', { class: 's-legal' }, `${t('footer.cep')} ${t('footer.cepLink')} ${t('footer.cepAfter')}`),
        h('p', { class: 's-legal' }, t('footer.icons')),
      );
    default:
      return h('div');
  }
};

/**
 * @param {Slide} s
 * @param {number} i
 * @param {number} total
 * @param {any} ctx
 */
const slideEl = (s, i, total, ctx) =>
  h(
    'section',
    { class: `slide slide-${s.type}`, 'data-index': i, 'aria-roledescription': t('slides.slide'), 'aria-label': `${i + 1} / ${total}` },
    slideContent(s, ctx),
    h('footer', { class: 's-footer' }, h('span', {}, `© ${ctx.site.year} ${ctx.site.author} · CC BY 4.0 · ${t('footer.claude')}`), h('span', {}, `${i + 1} / ${total}`)),
  );

/** Escala el lienzo 1920×1080 a la ventana. */
const fit = (/** @type {HTMLElement} */ stage, /** @type {HTMLElement} */ box = document.documentElement) => {
  const r = box.getBoundingClientRect();
  const w = box === document.documentElement ? innerWidth : r.width;
  const hh = box === document.documentElement ? innerHeight : r.height;
  stage.style.setProperty('--scale', String(Math.min(w / W, hh / H)));
};

const mmss = (/** @type {number} */ secs) => `${secs < 0 ? '−' : ''}${String(Math.floor(Math.abs(secs) / 60)).padStart(2, '0')}:${String(Math.floor(Math.abs(secs) % 60)).padStart(2, '0')}`;

const init = async () => {
  await loadStrings();
  const [deck, votesArr, site, sourcesData] = await Promise.all([
    /** @type {Promise<Deck>} */ (fetchJson('content/presentacion.json')),
    /** @type {Promise<import('./types').Vote[]>} */ (fetchJson('content/votaciones.json')),
    /** @type {Promise<import('./types').Site>} */ (fetchJson('content/site.json')),
    loadSources(),
  ]);
  const ctx = { votes: Object.fromEntries(votesArr.map((v) => [v.id, v])), site, sources: new Map(sourcesData.items.map((s) => [s.id, s])) };
  const total = deck.slides.length;
  const notesMode = new URLSearchParams(location.search).has('notas');
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;
  document.documentElement.lang = getLang();
  document.body.classList.toggle('notes-mode', notesMode);

  let index = Math.min(total - 1, Math.max(0, Number(location.hash.replace('#/', '')) - 1 || 0));
  /** @type {number | null} */
  let startTime = Number(sessionStorage.getItem('pd-timer')) || null;
  /** @type {() => void} */
  let stopPoll = () => {};

  const live = /** @type {HTMLElement} */ (document.getElementById('announcer'));

  /* -------- Vista de proyección -------- */
  const stage = /** @type {HTMLElement} */ (document.getElementById('stage'));
  const deckEl = h('div', { class: 'deck', role: 'region', 'aria-roledescription': t('slides.deck'), 'aria-label': loc(deck.slides[0]?.title) });
  const slideEls = deck.slides.map((s, i) => slideEl(s, i, total, ctx));
  deckEl.append(...slideEls);
  const blackout = h('div', { class: 'blackout', hidden: true });

  /* -------- Vista de notas -------- */
  const notesRoot = document.getElementById('notes');

  /** Arranca el sondeo de resultados si la diapositiva es una votación. */
  const startVote = () => {
    stopPoll();
    const s = deck.slides[index];
    if (notesMode || s?.type !== 'vote') return;
    const vote = ctx.votes[s.vote];
    const el = slideEls[index];
    if (!vote || !el) return;
    const results = /** @type {HTMLElement} */ (el.querySelector('.s-results'));
    const status = /** @type {HTMLElement} */ (el.querySelector('.s-status'));
    if (!site.votingEndpoint) {
      status.textContent = t('votes.notConfigured');
      return;
    }
    stopPoll = poll(
      () => fetchResults(site.votingEndpoint, vote.id),
      (r) => {
        renderResults(results, vote, r);
        status.textContent = r.total === 1 ? t('votes.totalOne') : r.total ? t('votes.total', { n: r.total }) : t('votes.waiting');
      },
      () => (status.textContent = t('votes.offline')),
    );
  };

  const renderNotes = () => {
    if (!notesRoot) return;
    const s = deck.slides[index];
    const next = deck.slides[index + 1];
    const block = deck.blocks.find((b) => b.id === s?.block);
    const curPrev = h('div', { class: 'preview' }, h('div', { class: 'stage' }, slideEl(/** @type {Slide} */ (s), index, total, ctx)));
    const nextPrev = next ? h('div', { class: 'preview' }, h('div', { class: 'stage' }, slideEl(next, index + 1, total, ctx))) : h('div', { class: 'preview empty' }, t('slides.end'));
    notesRoot.replaceChildren(
      h('header', { class: 'n-head' }, h('p', { class: 'n-block' }, block ? `${block.from}–${block.to} min · ${loc(block.title)}` : ''), h('p', { class: 'n-count' }, `${index + 1} / ${total}`), h('p', { class: 'n-timer', id: 'timer' }), h('p', { class: 'n-plan', id: 'plan' })),
      h('div', { class: 'n-previews' }, h('div', {}, h('p', { class: 'n-label' }, t('slides.current')), curPrev), h('div', {}, h('p', { class: 'n-label' }, t('slides.next')), nextPrev)),
      h('div', { class: 'n-notes' }, h('p', {}, s?.notes ?? '')),
      h(
        'nav',
        { class: 'n-controls' },
        h('button', { type: 'button', class: 'btn btn-tonal interactive', onclick: () => go(index - 1) }, icon('arrow_back'), t('plantilla.back')),
        h('button', { type: 'button', class: 'btn btn-text interactive', onclick: resetTimer }, icon('timer'), t('slides.resetTimer')),
        h('button', { type: 'button', class: 'btn btn-filled interactive', onclick: () => go(index + 1) }, t('plantilla.next'), icon('arrow_forward')),
      ),
    );
    for (const p of notesRoot.querySelectorAll('.preview')) fit(/** @type {HTMLElement} */ (p.querySelector('.stage') ?? p), /** @type {HTMLElement} */ (p));
    tick();
  };

  const tick = () => {
    const timer = document.getElementById('timer');
    const plan = document.getElementById('plan');
    if (!timer || !plan) return;
    const s = deck.slides[index];
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    const planned = (s?.at ?? 0) * 60;
    const delta = elapsed - planned;
    timer.textContent = mmss(elapsed);
    plan.textContent = `${t('slides.planned')} ${mmss(planned)} · ${delta >= 0 ? t('slides.behind') : t('slides.ahead')} ${mmss(Math.abs(delta))}`;
    plan.dataset.state = !startTime ? '' : delta > 90 ? 'late' : delta < -90 ? 'early' : 'ok';
  };
  setInterval(tick, 1000);

  const resetTimer = () => {
    startTime = Date.now();
    sessionStorage.setItem('pd-timer', String(startTime));
    channel?.postMessage({ type: 'timer', startTime });
    tick();
  };

  /** @param {number} i @param {boolean} [fromChannel] */
  const go = async (i, fromChannel = false) => {
    const target = Math.max(0, Math.min(total - 1, i));
    if (target === index && slideEls[index]?.classList.contains('is-current')) return;
    if (!startTime && target > 0) resetTimer();
    index = target;
    history.replaceState(null, '', `${location.search}#/${index + 1}`);
    if (!fromChannel) channel?.postMessage({ type: 'goto', index });
    if (notesMode) {
      renderNotes();
      return;
    }
    await transition(() => {
      slideEls.forEach((el, k) => {
        const cur = k === index;
        el.classList.toggle('is-current', cur);
        el.toggleAttribute('inert', !cur);
        el.setAttribute('aria-hidden', String(!cur));
      });
    });
    live.textContent = `${t('slides.slide')} ${index + 1} / ${total}`;
    startVote();
  };

  channel?.addEventListener('message', (e) => {
    const msg = e.data;
    if (msg?.type === 'goto') go(msg.index, true);
    if (msg?.type === 'timer') {
      startTime = msg.startTime;
      sessionStorage.setItem('pd-timer', String(startTime));
    }
    if (msg?.type === 'hello' && !notesMode) channel.postMessage({ type: 'goto', index });
  });

  /* -------- Entrada: teclado, gestos, mando -------- */
  let typed = '';
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k) && !(k === 'Enter' && typed)) {
      if (k === ' ' && e.shiftKey) go(index - 1);
      else go(index + 1);
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) go(index - 1);
    else if (k === 'Home') go(0);
    else if (k === 'End') go(total - 1);
    else if (k === 'b' || k === 'B' || k === '.') blackout.hidden = !blackout.hidden;
    else if (k === 'f' || k === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else if (k === 'n' || k === 'N') window.open(`${location.pathname}?notas#/${index + 1}`, 'pd-notas', 'popup,width=1280,height=800');
    else if (k === 't' || k === 'T') resetTimer();
    else if (/^\d$/.test(k)) {
      typed += k;
      return;
    } else if (k === 'Enter' && typed) {
      go(Number(typed) - 1);
    } else return;
    typed = '';
    e.preventDefault();
  });

  let touchX = 0;
  addEventListener('touchstart', (e) => (touchX = e.changedTouches[0]?.clientX ?? 0), { passive: true });
  addEventListener('touchend', (e) => {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  });

  /** Mando de juego: A/RB/derecha → siguiente; B/LB/izquierda → anterior. */
  let padPrev = { next: false, prev: false };
  const padLoop = () => {
    const pad = [...(navigator.getGamepads?.() ?? [])].find(Boolean);
    if (pad) {
      const next = Boolean(pad.buttons[0]?.pressed || pad.buttons[5]?.pressed || pad.buttons[15]?.pressed || (pad.axes[0] ?? 0) > 0.6);
      const prev = Boolean(pad.buttons[1]?.pressed || pad.buttons[4]?.pressed || pad.buttons[14]?.pressed || (pad.axes[0] ?? 0) < -0.6);
      if (next && !padPrev.next) go(index + 1);
      if (prev && !padPrev.prev) go(index - 1);
      padPrev = { next, prev };
      requestAnimationFrame(padLoop);
    }
  };
  addEventListener('gamepadconnected', () => requestAnimationFrame(padLoop));

  /* -------- Montaje -------- */
  if (notesMode) {
    document.title = `${t('slides.notes')} · ${document.title}`;
    stage.remove();
    channel?.postMessage({ type: 'hello' });
    addEventListener('resize', () => renderNotes());
    renderNotes();
  } else {
    notesRoot?.remove();
    stage.append(deckEl, blackout);
    addEventListener('resize', () => fit(stage));
    fit(stage);
    slideEls.forEach((el, k) => {
      el.classList.toggle('is-current', k === index);
      el.toggleAttribute('inert', k !== index);
      el.setAttribute('aria-hidden', String(k !== index));
    });
    startVote();
    /** @type {HTMLElement | null} */ (document.getElementById('help'))?.removeAttribute('hidden');
    setTimeout(() => document.getElementById('help')?.setAttribute('hidden', ''), 6000);
  }
  document.body.removeAttribute('aria-busy');
};

init();
