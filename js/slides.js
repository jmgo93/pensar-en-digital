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
import { requireSpeaker, archiveButton } from './speaker.js';

/** @typedef {import('./types').Localized} L */
/**
 * Notas del ponente (solo en español): notes = qué decir; key = idea fuerza; do = acción; data = dato y fuente;
 * bridge = frase de transición; cut = qué recortar si vas tarde.
 * @typedef {Record<string, any> & { id: string, block: string, at: number, type: string, notes: string, key?: string, do?: string, data?: string, bridge?: string, cut?: string }} Slide
 */
/** @typedef {{ blocks: { id: string, from: number, to: number, title: L }[], slides: Slide[] }} Deck */

const CHANNEL = 'pd-presentacion';

/**
 * Texto con énfasis: **palabras** → <mark class="s-hl"> (subrayado que se dibuja al entrar la diapositiva).
 * @param {string} text
 * @returns {(string | HTMLElement)[]}
 */
const rich = (text) =>
  text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((p) => (p.startsWith('**') ? h('mark', { class: 's-hl' }, p.slice(2, -2)) : p));

/**
 * Copia de una votación con etiquetas de opción más cortas (mismo orden).
 * @param {import('./types').Vote | undefined} vote
 * @param {L[] | undefined} labels
 * @returns {import('./types').Vote | undefined}
 */
const shortLabels = (vote, labels) => (vote && labels?.length === vote.options.length ? { ...vote, options: labels } : vote);

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cuenta desde 0 hasta la cifra de una diapositiva «big» (−17 %, 0,35…). Solo decora: el lector
 * de pantalla lee la cifra final, que está en un span aparte.
 * @param {HTMLElement} slide
 */
const countUp = (slide) => {
  const el = /** @type {HTMLElement | null} */ (slide.querySelector('.s-count'));
  if (!el) return;
  const final = el.dataset.final ?? el.textContent ?? '';
  el.dataset.final = final;
  const m = /(\d+)(?:,(\d+))?/.exec(final);
  if (!m || reducedMotion()) {
    el.textContent = final;
    return;
  }
  const decimals = m[2]?.length ?? 0;
  const value = Number(`${m[1]}.${m[2] ?? '0'}`);
  const start = performance.now();
  const DURATION = 700;
  /** @param {number} now */
  const step = (now) => {
    const p = Math.min(1, (now - start) / DURATION);
    const eased = 1 - (1 - p) ** 3;
    el.textContent = final.replace(m[0], (value * eased).toFixed(decimals).replace('.', ','));
    if (p < 1 && slide.classList.contains('is-current')) requestAnimationFrame(step);
    else el.textContent = final;
  };
  requestAnimationFrame(step);
};
/** Cuenta atrás de las votaciones: empieza la primera vez que se muestra la diapositiva y desaparece al llegar a cero. */
const COUNTDOWN_MS = 60_000;
/** @type {WeakMap<HTMLElement, number>} */
const countdownTimers = new WeakMap();
/** @param {HTMLElement} slide @param {boolean} [restart] desde las notas o con la tecla C */
const startCountdown = (slide, restart = false) => {
  const el = /** @type {HTMLElement | null} */ (slide.querySelector('.s-countdown'));
  if (!el || (el.dataset.started && !restart)) return;
  clearInterval(countdownTimers.get(el));
  el.classList.remove('is-done', 'is-ending');
  el.dataset.started = '1';
  const end = Date.now() + COUNTDOWN_MS;
  el.setAttribute('aria-label', t('slides.countdown'));
  el.removeAttribute('hidden');
  const tick = () => {
    const left = Math.max(0, end - Date.now());
    const secs = Math.ceil(left / 1000);
    el.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    el.style.setProperty('--p', String(left / COUNTDOWN_MS));
    el.classList.toggle('is-ending', secs <= 10);
    if (left > 0) return;
    clearInterval(timer);
    el.classList.add('is-done');
    setTimeout(() => el.setAttribute('hidden', ''), 400);
  };
  const timer = setInterval(tick, 250);
  countdownTimers.set(el, timer);
  tick();
};
/** Logo del centro sobre un círculo blanco (el sello tiene texto negro y fondo transparente). @param {import('./types').Site} site @param {string} cls */
const schoolLogo = (site, cls) => h('img', { class: cls, src: fromRoot(site.schoolLogo).href, alt: site.school, width: 512, height: 509, decoding: 'async' });
const W = 1920;
const H = 1080;

/**
 * @param {Slide} s
 * @param {{ votes: Record<string, import('./types').Vote>, site: import('./types').Site, sources: Map<string, import('./content.js').Source>, tools?: any }} ctx
 * @returns {HTMLElement}
 */
const slideContent = (s, ctx) => {
  const citeText = s.cite && ctx.sources.get(s.cite) ? `(${citeLabel(/** @type {any} */ (ctx.sources.get(s.cite)))})` : '';
  // Cita y procedencia del dato («25 metaanálisis · 1055 estudios») en la misma línea.
  const cite = citeText || s.src ? h('p', { class: 's-cite' }, s.src ? h('span', { class: 's-src' }, icon('science'), ' ', loc(s.src)) : null, s.src && citeText ? ` · ${citeText}` : citeText) : null;
  /** @param {string} name */
  const qr = (name) => h('img', { class: 's-qr', src: fromRoot(`assets/qr/${name}.svg`).href, alt: '', width: 520, height: 520 });
  const shortUrl = (/** @type {string} */ path) => `${ctx.site.shortUrl}/${path}`.replace(/\/$/, '');

  switch (s.type) {
    case 'title':
      return h(
        'div',
        { class: 's-title' },
        h('p', { class: 's-brand' }, icon('lightbulb'), ' Pensar en Digital'),
        h('h1', {}, loc(s.title)),
        h('div', { class: 's-byline' }, schoolLogo(ctx.site, 's-school-logo'), h('p', { class: 's-author' }, loc(s.subtitle), h('span', { class: 's-school' }, ctx.site.school))),
      );
    case 'statement':
      return h('div', { class: 's-statement' }, h('h2', {}, ...rich(loc(s.text))), s.small ? h('p', { class: 's-small' }, ...rich(loc(s.small))) : null, cite);
    case 'compare':
      return h(
        'div',
        { class: 's-compare' },
        h('h2', {}, loc(s.title)),
        h('div', { class: 's-cols' }, ...s.items.map((/** @type {any} */ it) => h('div', { class: 's-col' }, h('p', { class: 's-label' }, loc(it.label)), h('p', { class: 's-text' }, ...rich(loc(it.text)))))),
        cite,
      );
    case 'keys':
      return h('div', { class: 's-keys' }, h('h2', {}, loc(s.title)), h('ol', {}, ...s.items.map((/** @type {L} */ it, /** @type {number} */ i) => h('li', { style: `--i:${i}` }, h('span', { class: 's-key-n', 'aria-hidden': 'true' }, String(i + 1)), h('span', {}, loc(it))))), cite);
    case 'list':
      return h('div', { class: 's-list' }, h('h2', {}, loc(s.title)), h('ul', {}, ...s.items.map((/** @type {L} */ it, /** @type {number} */ i) => h('li', { style: `--i:${i}` }, ...rich(loc(it))))), cite);
    case 'ladder':
      return h('div', { class: 's-ladder' }, h('h2', {}, loc(s.title)), h('ol', {}, ...s.steps.map((/** @type {L} */ st, /** @type {number} */ i) => h('li', { style: `--i:${i}`, class: i === s.highlight ? 'is-key' : undefined }, loc(st)))), cite);
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
      return h(
        'div',
        { class: 's-big' },
        h('p', { class: 's-number' }, h('span', { class: 's-count', 'aria-hidden': 'true' }, s.number), h('span', { class: 'visually-hidden' }, s.number)),
        h('p', { class: 's-text' }, ...rich(loc(s.text))),
        cite,
      );
    case 'qr':
      return h(
        'div',
        { class: 's-qrs' },
        h('h2', {}, ...rich(loc(s.title))),
        h('div', { class: 's-qr-row' }, ...s.targets.map((/** @type {any} */ tg) => h('figure', {}, qr(tg.qr), h('figcaption', {}, h('strong', {}, loc(tg.label)), h('span', {}, shortUrl(tg.qr === 'inicio' ? '' : `${tg.qr}/`)))))),
      );
    case 'vote': {
      const vote = ctx.votes[s.vote];
      if (!vote) return h('div');
      const results = h('div', { class: 's-results' });
      renderResults(results, vote, null);
      return h(
        'div',
        // Pregunta + opciones largas: letra algo menor para que todo quepa por encima del pie.
        { class: `s-vote${loc(vote.question).length + vote.options.reduce((n, o) => n + loc(o).length, 0) > 220 ? ' is-long' : ''}`, 'data-vote': vote.id },
        h(
          'div',
          { class: 's-vote-main' },
          h('p', { class: 's-kicker' }, icon('how_to_vote'), t('slides.vote'), h('span', { class: 's-countdown', role: 'timer', hidden: '' })),
          s.show ? h('div', { class: 's-show' }, ...s.show.map((/** @type {any} */ x) => h('p', { class: 's-show-item' }, h('span', { class: 's-show-label' }, x.icon ? icon(x.icon) : null, x.label), h('span', {}, loc(x.text))))) : null,
          h('h2', {}, loc(vote.question)),
          results,
          h('p', { class: 's-status' }),
        ),
        vote.formUrl ? h('figure', { class: 's-vote-qr' }, qr(vote.id), h('figcaption', {}, vote.formUrl.replace(/^https?:\/\//, ''))) : null,
      );
    }
    case 'prepost': {
      // Etiquetas cortas (s.labels) para que las dos columnas quepan; el recuento va por posición.
      const pre = shortLabels(ctx.votes[s.pre], s.labels);
      const post = shortLabels(ctx.votes[s.post], s.labels);
      if (!pre || !post) return h('div');
      /** @param {import('./types').Vote} v @param {string} label @param {string} cls */
      const col = (v, label, cls) => {
        const box = h('div', { class: 's-results', 'data-vote': v.id });
        renderResults(box, v, null);
        return h('div', { class: `s-col ${cls}` }, h('p', { class: 's-label' }, label), box);
      };
      return h(
        'div',
        { class: 's-prepost' },
        h('h2', {}, loc(s.title)),
        h('div', { class: 's-cols' }, col(pre, t('inclusiva.before'), 'before'), col(post, t('inclusiva.after'), 'after')),
        h('p', { class: 's-delta', 'aria-live': 'polite' }),
        h('p', { class: 's-status' }),
      );
    }
    case 'competences':
      return h(
        'div',
        { class: 's-comp' },
        h('h2', {}, icon(s.icon), h('span', { class: 's-comp-n' }, `${t('slides.area')} ${s.n} · `), loc(s.title)),
        h(
          'ul',
          { class: 's-comp-list' },
          ...s.items.map((/** @type {any} */ c, /** @type {number} */ i) =>
            h(
              'li',
              { class: c.focus ? 'is-focus' : undefined, style: `--i:${i}` },
              h('span', { class: 's-comp-code' }, c.code),
              h('span', { class: 's-comp-body' }, h('strong', {}, loc(c.title)), h('span', {}, loc(c.text))),
              c.where ? h('span', { class: 's-comp-where' }, icon('arrow_forward'), c.where.map((/** @type {L} */ w) => loc(w)).join(' · ')) : null,
            ),
          ),
        ),
        cite,
      );
    case 'areas':
      return h(
        'div',
        { class: 's-areas' },
        h('h2', {}, ...rich(loc(s.title))),
        h(
          'ol',
          { class: `s-area-grid${s.items.some((/** @type {any} */ a) => a.text) ? ' has-text' : ''}` },
          ...s.items.map((/** @type {any} */ a, /** @type {number} */ i) =>
            h('li', { class: a.focus ? 'is-focus' : undefined, style: `--i:${i}` }, h('span', { class: 's-area-n', 'aria-hidden': 'true' }, String(a.n)), icon(a.icon), a.text ? h('span', { class: 's-area-body' }, h('strong', {}, loc(a.title)), h('span', {}, loc(a.text))) : h('span', {}, loc(a.title))),
          ),
        ),
        s.small ? h('p', { class: 's-small' }, ...rich(loc(s.small))) : null,
        cite,
      );
    case 'columns':
      return h(
        'div',
        { class: 's-columns' },
        h('h2', {}, ...rich(loc(s.title))),
        h(
          'div',
          { class: 's-cols' },
          ...s.cols.map((/** @type {any} */ c, /** @type {number} */ i) =>
            h('div', { class: 's-col', style: `--i:${i}` }, h('p', { class: 's-col-q' }, c.icon ? icon(c.icon) : null, h('span', {}, loc(c.q))), h('ul', {}, ...c.items.map((/** @type {L} */ it, /** @type {number} */ k) => h('li', { style: `--k:${k}` }, ...rich(loc(it)))))),
          ),
        ),
        cite,
      );
    case 'section':
      return h('div', { class: 's-section' }, h('p', { class: 's-sec-n', 'aria-hidden': 'true' }, String(s.n)), h('h2', {}, ...rich(loc(s.title))), s.small ? h('p', { class: 's-small' }, loc(s.small)) : null);
    case 'case':
      return h(
        'div',
        { class: 's-case' },
        h('p', { class: 's-badges' }, h('span', { class: 's-badge' }, loc(s.where)), h('span', { class: 's-badge s-badge-tag' }, icon('lightbulb'), t('slides.example'))),
        h('h2', {}, ...rich(loc(s.title))),
        s.context ? h('p', { class: 's-context' }, icon('info'), ' ', loc(s.context)) : null,
        h('p', { class: 's-text' }, ...rich(loc(s.text))),
        s.ask ? h('p', { class: 's-ask' }, icon('groups'), h('span', {}, ...rich(loc(s.ask)))) : null,
      );
    case 'improve':
      return h(
        'div',
        { class: 's-improve' },
        h('p', { class: 's-kicker' }, icon('trending_up'), t('slides.improve')),
        h('h2', {}, ...rich(loc(s.title))),
        h('p', { class: 's-text' }, ...rich(loc(s.text))),
        s.loop ? h('div', { class: 's-loop' }, ...s.loop.map((/** @type {any} */ x, /** @type {number} */ i) => h('p', { class: 's-loop-item', style: `--i:${i}` }, icon(x.icon), h('span', {}, loc(x.label))))) : null,
        h('dl', { class: 's-analysis' }, ...s.analysis.map((/** @type {any} */ a, /** @type {number} */ i) => h('div', { style: `--i:${i}` }, h('dt', {}, a.icon ? icon(a.icon) : null, a.k), h('dd', {}, typeof a.v === 'string' ? a.v : loc(a.v))))),
        cite,
      );
    case 'tool': {
      /** @type {any[]} */
      const list = (s.tools ?? []).map((/** @type {string} */ id) => ctx.tools?.tools.find((/** @type {any} */ x) => x.id === id)).filter(Boolean);
      return h(
        'div',
        { class: 's-tool' },
        h('p', { class: 's-kicker' }, icon('handyman'), t('slides.tool')),
        h('h2', {}, ...rich(loc(s.title))),
        h(
          'div',
          { class: 's-tool-row' },
          ...list.map((x) =>
            h(
              'figure',
              { class: 's-tool-card' },
              qr(`tool-${x.id}`),
              h(
                'figcaption',
                {},
                h('strong', {}, x.name),
                h('ul', { class: 's-tool-flags' }, ...x.flags.filter((/** @type {string} */ f) => f !== 'gratis' || !x.flags.includes('libre')).map((/** @type {string} */ f) => h('li', {}, loc(ctx.tools.flags[f])))),
              ),
            ),
          ),
        ),
      );
    }
    case 'end':
      return h(
        'div',
        { class: 's-end' },
        h('div', { class: 's-end-head' }, h('h2', {}, loc(s.title)), schoolLogo(ctx.site, 's-school-logo')),
        h('p', { class: 's-small' }, ctx.site.shortUrl),
        h('p', { class: 's-legal' }, `© ${ctx.site.year} ${ctx.site.author} · ${t('footer.licensePre')} ${t('footer.license')} · ${t('footer.claude')}`),
        h('p', { class: 's-legal' }, `${t('footer.cep')} ${t('footer.cepLink')} ${t('footer.cepAfter')}`),
        h('p', { class: 's-legal' }, t('footer.icons')),
        h('div', { class: 's-archive' }, archiveButton(ctx.site)),
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
    h('footer', { class: 's-footer' }, h('span', {}, `© ${ctx.site.year} ${ctx.site.author} · ${ctx.site.licenseShort} · ${t('footer.claude')}`), h('span', {}, `${i + 1} / ${total}`)),
  );

/**
 * Panel de notas del ponente: idea fuerza destacada, guion, acción, dato, transición y recorte.
 * @param {Slide} s
 */
const notesPanel = (s) => {
  /** @param {string} cls @param {string} label @param {string | undefined} text */
  const row = (cls, label, text) => (text ? h('div', { class: `n-row ${cls}` }, h('p', { class: 'n-label' }, label), h('p', {}, text)) : null);
  return h(
    'div',
    { class: 'n-notes' },
    s?.key ? h('p', { class: 'n-key' }, s.key) : null,
    h('p', {}, s?.notes ?? ''),
    row('n-example', t('slides.example2'), s?.example),
    row('n-do', t('slides.do'), s?.do),
    row('n-data', t('slides.data'), s?.data),
    row('n-bridge', t('slides.bridge'), s?.bridge),
    row('n-cut', t('slides.cut'), s?.cut),
  );
};

/**
 * Red de seguridad contra desbordes: si el contenido de la diapositiva no cabe encima del pie,
 * lo reduce (CSS zoom) lo justo para que quepa. El contenido está pensado para no necesitarlo
 * (lo comprueba la auditoría de diapositivas); data-fit guarda el factor aplicado.
 * @param {HTMLElement} slide
 */
const shrinkToFit = (slide) => {
  const body = /** @type {HTMLElement | null} */ (slide.firstElementChild);
  if (!body || !body.isConnected || getComputedStyle(slide).display === 'none') return;
  // Sin transición: si no, el zoom no se aplica al momento y la medida sale mal (p. ej. con movimiento reducido).
  body.style.setProperty('transition', 'none');
  body.style.removeProperty('zoom');
  delete body.dataset.fit;
  let z = 1;
  while ((body.scrollHeight > body.clientHeight + 2 || body.scrollWidth > body.clientWidth + 2) && z > 0.62) {
    z = Math.round((z - 0.04) * 100) / 100;
    body.style.setProperty('zoom', String(z));
  }
  if (z < 1) body.dataset.fit = String(z);
};

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
  // Solo el ponente ve la presentación, las notas y los resultados.
  const pageParts = [...document.body.children].filter((el) => el instanceof HTMLElement);
  pageParts.forEach((el) => (/** @type {HTMLElement} */ (el).hidden = true));
  const gateHost = h('div', { class: 'gate-host' });
  document.body.append(gateHost);
  await requireSpeaker(gateHost);
  gateHost.remove();
  pageParts.forEach((el) => (/** @type {HTMLElement} */ (el).hidden = false));
  const [deck, votesArr, site, sourcesData, tools] = await Promise.all([
    /** @type {Promise<Deck>} */ (fetchJson('content/presentacion.json')),
    /** @type {Promise<import('./types').Vote[]>} */ (fetchJson('content/votaciones.json')),
    /** @type {Promise<import('./types').Site>} */ (fetchJson('content/site.json')),
    loadSources(),
    /** @type {Promise<any>} */ (fetchJson('content/herramientas.json')),
  ]);
  const ctx = { votes: Object.fromEntries(votesArr.map((v) => [v.id, v])), site, sources: new Map(sourcesData.items.map((s) => [s.id, s])), tools };
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

  /**
   * Comparación antes/después: sondea las dos votaciones y muestra el cambio en la opción buscada.
   * @param {Slide} s
   * @param {HTMLElement} el
   */
  const startPrePost = (s, el) => {
    const pre = shortLabels(ctx.votes[s.pre], s.labels);
    const post = shortLabels(ctx.votes[s.post], s.labels);
    const status = /** @type {HTMLElement} */ (el.querySelector('.s-status'));
    const delta = /** @type {HTMLElement} */ (el.querySelector('.s-delta'));
    if (!pre || !post) return;
    if (!site.votingEndpoint) {
      status.textContent = t('votes.notConfigured');
      return;
    }
    /** @type {Record<string, import('./votes.js').VoteResult>} */
    const last = {};
    const target = pre.target ?? 0;
    /** @param {import('./votes.js').VoteResult | undefined} r */
    const pct = (r) => (r && r.total ? Math.round(((r.counts[target] ?? 0) / r.total) * 100) : 0);
    const update = () => {
      const a = last[pre.id];
      const b = last[post.id];
      if (!a || !b) return;
      const text = t('slides.delta', { option: loc(pre.options[target]), pre: String(pct(a)), post: String(pct(b)) });
      if (text === delta.textContent) return;
      delta.textContent = text;
      // Destello breve para llevar la vista al cambio.
      delta.classList.remove('is-flash');
      void delta.offsetWidth;
      delta.classList.add('is-flash');
    };
    const stops = [pre, post].map((v) =>
      poll(
        () => fetchResults(site.votingEndpoint, v.id),
        (r) => {
          last[v.id] = r;
          renderResults(/** @type {HTMLElement} */ (el.querySelector(`.s-results[data-vote="${v.id}"]`)), v, r);
          status.textContent = '';
          update();
        },
        () => (status.textContent = t('votes.offline')),
      ),
    );
    stopPoll = () => stops.forEach((f) => f());
  };

  /** Arranca el sondeo de resultados si la diapositiva es una votación. */
  const startVote = () => {
    stopPoll();
    const s = deck.slides[index];
    if (!notesMode && s?.type === 'prepost' && slideEls[index]) {
      startPrePost(s, /** @type {HTMLElement} */ (slideEls[index]));
      return;
    }
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
      notesPanel(/** @type {Slide} */ (s)),
      h(
        'nav',
        { class: 'n-controls' },
        h('button', { type: 'button', class: 'btn btn-tonal interactive', onclick: () => go(index - 1) }, icon('arrow_back'), t('plantilla.back')),
        h('button', { type: 'button', class: 'btn btn-text interactive', onclick: resetTimer }, icon('timer'), t('slides.resetTimer')),
        s?.type === 'vote' ? h('button', { type: 'button', class: 'btn btn-tonal interactive', onclick: () => channel?.postMessage({ type: 'countdown' }) }, icon('how_to_vote'), t('slides.restartCountdown')) : null,
        archiveButton(site, 'btn btn-text interactive'),
        h('a', { class: 'btn btn-text interactive', href: fromRoot('ponente/').href }, icon('home'), t('slides.backToWeb')),
        h('button', { type: 'button', class: 'btn btn-filled interactive', onclick: () => go(index + 1) }, t('plantilla.next'), icon('arrow_forward')),
      ),
    );
    for (const p of notesRoot.querySelectorAll('.preview')) {
      fit(/** @type {HTMLElement} */ (p.querySelector('.stage') ?? p), /** @type {HTMLElement} */ (p));
      const sl = /** @type {HTMLElement | null} */ (p.querySelector('.slide'));
      if (sl) shrinkToFit(sl);
    }
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
    const current = slideEls[index];
    // La cuenta atrás aparece antes de medir, para que el ajuste de tamaño la tenga en cuenta.
    if (current && deck.slides[index]?.type === 'vote') startCountdown(current);
    if (current) shrinkToFit(current);
    updateControls();
    if (current && deck.slides[index]?.type === 'big') countUp(current);
    startVote();
  };

  channel?.addEventListener('message', (e) => {
    const msg = e.data;
    if (msg?.type === 'goto') go(msg.index, true);
    if (msg?.type === 'countdown' && !notesMode && slideEls[index] && deck.slides[index]?.type === 'vote') startCountdown(/** @type {HTMLElement} */ (slideEls[index]), true);
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
    if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select, dialog')) return;
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
    else if ((k === 'c' || k === 'C') && !notesMode && slideEls[index] && deck.slides[index]?.type === 'vote') startCountdown(/** @type {HTMLElement} */ (slideEls[index]), true);
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

  /* -------- Botones en pantalla: anterior, siguiente y pantalla completa -------- */
  const fsIcon = h('span', { class: 'icon', 'aria-hidden': 'true' }, 'fullscreen');
  const fsBtn = /** @type {HTMLButtonElement} */ (
    h('button', { type: 'button', class: 'icon-btn icon-btn-tonal interactive', onclick: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => undefined)) }, fsIcon)
  );
  const prevBtn = /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'icon-btn icon-btn-tonal interactive', 'aria-label': t('slides.prev'), title: t('slides.prev'), onclick: () => go(index - 1) }, icon('chevron_left')));
  const nextBtn = /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'icon-btn icon-btn-filled interactive', 'aria-label': t('slides.nextBtn'), title: t('slides.nextBtn'), onclick: () => go(index + 1) }, icon('chevron_right')));
  // Volver a la web (al panel del ponente) por si se sale de la presentación sin teclado.
  const homeBtn = h('a', { class: 'icon-btn icon-btn-tonal interactive', href: fromRoot('ponente/').href, 'aria-label': t('slides.backToWeb'), title: t('slides.backToWeb') }, icon('home'));
  const controls = h('nav', { class: 'slide-controls', 'aria-label': t('slides.deck') }, homeBtn, prevBtn, fsBtn, nextBtn);
  function updateControls() {
    const full = Boolean(document.fullscreenElement);
    fsIcon.textContent = full ? 'fullscreen_exit' : 'fullscreen';
    const label = full ? t('slides.exitFullscreen') : t('slides.fullscreen');
    fsBtn.setAttribute('aria-label', label);
    fsBtn.title = label;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
  }
  document.addEventListener('fullscreenchange', updateControls);
  // Se ocultan solos para no distraer: reaparecen al mover el ratón, tocar la pantalla o tabular.
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let hideTimer;
  const showControls = () => {
    controls.classList.remove('is-idle');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!controls.contains(document.activeElement)) controls.classList.add('is-idle');
    }, 3000);
  };
  addEventListener('pointermove', showControls, { passive: true });
  addEventListener('pointerdown', showControls, { passive: true });
  controls.addEventListener('focusin', showControls);

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
    document.body.append(controls);
    updateControls();
    showControls();
    addEventListener('resize', () => fit(stage));
    fit(stage);
    slideEls.forEach((el, k) => {
      el.classList.toggle('is-current', k === index);
      el.toggleAttribute('inert', k !== index);
      el.setAttribute('aria-hidden', String(k !== index));
    });
    const first = slideEls[index];
    if (first) {
      if (deck.slides[index]?.type === 'vote') startCountdown(first);
      shrinkToFit(first);
      if (deck.slides[index]?.type === 'big') countUp(first);
    }
    // Por si las fuentes terminan de cargar después.
    document.fonts?.ready.then(() => slideEls[index] && shrinkToFit(/** @type {HTMLElement} */ (slideEls[index])));
    startVote();
    /** @type {HTMLElement | null} */ (document.getElementById('help'))?.removeAttribute('hidden');
    setTimeout(() => document.getElementById('help')?.setAttribute('hidden', ''), 6000);
  }
  document.body.removeAttribute('aria-busy');
};

init();
