// @ts-check
/**
 * Banco de prompts (ia/): guía breve + tarjetas con [variables] rellenables,
 * Copiar · Gemini · ChatGPT · Claude · Compartir. Filtros por categoría y etapa.
 */
import { loadContent, loadSources, loc, inline } from './content.js';
import { fromRoot } from './router.js';
import { h, icon } from './ui.js';
import { t, getLang } from './i18n.js';
import { getStage, byProfile, stageChips, loadProfiles } from './profile.js';
import { AI_SERVICES, copyWithFeedback, openInAI, share } from './ai.js';

/**
 * @typedef {import('./types').Localized} L
 * @typedef {{ es: string, en: string, sample: L, options?: L[] }} PromptVar
 * @typedef {{ id: string, category: string, stages: string[], title: L, goal: L, prompt: L, vars: PromptVar[], example: L, see?: string[], next?: string[], sources?: string[] }} PromptCard
 * @typedef {{ titles: Map<string, string>, keys: Map<string, { n: number, title: L }>, goTo: (id: string) => void }} CardLinks
 * @typedef {{ id: string, icon: string, label: L }} Category
 * @typedef {{ checked: string, guide: { icon: string, title: L, body: L }[], categories: Category[], cards: PromptCard[] }} PromptBank
 */

/**
 * Sustituye [variable] por su valor (o la deja entre corchetes si está vacía).
 * @param {string} template
 * @param {Record<string, string>} values
 */
export const fillPrompt = (template, values) => template.replace(/\[([^\]]+)\]/g, (m, name) => values[name]?.trim() || m);

/**
 * Vista del prompt con las variables resaltadas.
 * @param {string} template
 * @param {Record<string, string>} values
 */
const promptView = (template, values) => {
  const frag = document.createDocumentFragment();
  for (const part of template.split(/(\[[^\]]+\])/g)) {
    if (!part) continue;
    const m = /^\[([^\]]+)\]$/.exec(part);
    if (m) {
      const v = values[m[1] ?? '']?.trim();
      frag.append(h('mark', { class: v ? 'var is-filled' : 'var' }, v || part));
    } else frag.append(part);
  }
  return frag;
};

/** ¿Variable para pegar un texto largo? */
const isLong = (/** @type {string} */ name) => /^(pega|paste)/i.test(name);

/**
 * @param {PromptCard} card
 * @param {Category | undefined} cat
 * @param {Record<string, string>} stageLabels
 * @param {CardLinks} links
 */
const renderCard = (card, cat, stageLabels, links) => {
  const lang = getLang();
  const template = card.prompt[lang];
  /** @type {Record<string, string>} */
  const values = {};
  const view = h('p', { class: 'prompt-text', id: `${card.id}-prompt` });
  const refresh = () => view.replaceChildren(promptView(template, values));
  refresh();

  const fields = card.vars.map((v, i) => {
    const name = v[lang];
    const id = `${card.id}-v${i}`;
    const sample = loc(v.sample);
    const input = v.options
      ? h('select', { id, class: 'field' }, h('option', { value: '' }, t('ia.choose')), ...v.options.map((o) => h('option', { value: loc(o) }, loc(o))))
      : isLong(name)
      ? h('textarea', { id, class: 'field', rows: 4, placeholder: t('ia.pasteHint') })
      : h('input', { id, class: 'field', type: 'text', placeholder: sample ? `${t('ia.eg')} ${sample}` : '', autocomplete: 'off' });
    input.addEventListener('input', () => {
      values[name] = /** @type {HTMLInputElement} */ (input).value;
      refresh();
    });
    return h('div', { class: 'field-wrap' }, h('label', { for: id, class: 'label-medium' }, name), input);
  });

  const current = () => fillPrompt(template, values);
  const shareUrl = `${location.origin}${location.pathname}#${card.id}`;

  return h(
    'article',
    { class: 'card card-elevated prompt-card', id: card.id, 'aria-labelledby': `${card.id}-t`, 'data-tts': '' },
    h('div', { class: 'card-header' }, h('span', { class: 'card-icon' }, icon(cat?.icon ?? 'smart_toy')), h('div', {}, h('p', { class: 'label-medium muted' }, cat ? loc(cat.label) : ''), h('h3', { id: `${card.id}-t`, class: 'title-medium', tabindex: '-1' }, loc(card.title)))),
    h('p', {}, loc(card.goal)),
    h('p', { class: 'stage-list label-medium' }, card.stages.length === 4 ? t('profile.allStages') : card.stages.map((s) => stageLabels[s]).join(' · ')),
    h('div', { class: 'prompt-box' }, h('p', { class: 'label-medium muted' }, t('ia.prompt')), view),
    fields.length ? h('details', { class: 'prompt-form' }, h('summary', { class: 'label-large' }, icon('edit'), t('ia.fill')), h('div', { class: 'stack' }, ...fields)) : null,
    h('details', { class: 'prompt-example' }, h('summary', { class: 'label-large' }, icon('lightbulb'), t('ia.example')), h('p', {}, loc(card.example))),
    relatedLinks(card, links),
    h(
      'div',
      { class: 'prompt-actions' },
      h('button', { type: 'button', class: 'btn btn-filled interactive', onclick: () => copyWithFeedback(current()) }, icon('content_copy'), h('span', {}, t('ia.copy'))),
      ...AI_SERVICES.map((s) =>
        h('button', { type: 'button', class: 'btn btn-outlined interactive', onclick: () => openInAI(s, current()), 'aria-label': t('ia.openIn', { service: s.label }) }, icon('open_in_new'), h('span', {}, s.label)),
      ),
      h('button', { type: 'button', class: 'icon-btn icon-btn-tonal interactive', 'aria-label': t('ia.share'), title: t('ia.share'), onclick: () => share({ title: loc(card.title), text: current(), url: shareUrl }) }, icon('share')),
    ),
  );
};

/**
 * Enlaces de la tarjeta: claves relacionadas, siguiente paso y fuentes.
 * @param {PromptCard} card
 * @param {CardLinks} links
 */
const relatedLinks = (card, links) => {
  const keys = (card.see ?? []).flatMap((id) => {
    const k = links.keys.get(id);
    return k ? [h('a', { class: 'chip-link', href: `${fromRoot('claves/').href}#${id}` }, `${k.n}. ${loc(k.title)}`)] : [];
  });
  const next = (card.next ?? [])
    .filter((id) => links.titles.has(id))
    .map((id) => h('a', { class: 'chip-link', href: `#${id}`, onclick: (/** @type {Event} */ e) => { e.preventDefault(); links.goTo(id); } }, links.titles.get(id) ?? id));
  const sources = card.sources ?? [];
  if (!keys.length && !next.length && !sources.length) return null;
  return h(
    'div',
    { class: 'prompt-links' },
    keys.length ? h('p', { class: 'link-row' }, h('span', { class: 'label-medium muted' }, icon('key'), t('ia.see')), ...keys) : null,
    next.length ? h('p', { class: 'link-row' }, h('span', { class: 'label-medium muted' }, icon('east'), t('ia.next')), ...next) : null,
    sources.length ? h('p', { class: 'body-small muted' }, t('ia.basedOn'), ' ', inline(sources.map((s) => `[@${s}]`).join(' '))) : null,
  );
};

/** Pinta la página del banco de prompts en #view. */
export const renderPrompts = async () => {
  const view = document.getElementById('view');
  if (!view) return;
  /** @type {PromptBank} */
  const bank = await loadContent('prompts');
  await loadSources();
  /** @type {{ keys: { id: string, n: number, title: L }[] }} */
  const claves = await loadContent('claves');
  /** @type {CardLinks} */
  const links = {
    titles: new Map(bank.cards.map((c) => [c.id, loc(c.title)])),
    keys: new Map(claves.keys.map((k) => [k.id, { n: k.n, title: k.title }])),
    goTo: (id) => {
      const target = document.getElementById(id);
      if (target) {
        history.replaceState(null, '', `#${id}`);
        target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        target.querySelector('details.prompt-form')?.setAttribute('open', '');
        /** @type {HTMLElement | null} */ (target.querySelector('h3'))?.focus({ preventScroll: true });
        return;
      }
      // La tarjeta está oculta por un filtro: se recarga sin filtros apuntando a ella.
      location.hash = id;
      location.reload();
    },
  };
  const profiles = await loadProfiles();
  const stageLabels = Object.fromEntries(profiles.stages.map((s) => [s.id, loc(s.label)]));
  const cats = new Map(bank.categories.map((c) => [c.id, c]));

  /** @type {{ category: string | null, stage: string | null }} */
  const filter = { category: null, stage: location.hash ? null : getStage() };
  const grid = h('div', { class: 'prompt-grid' });
  const count = h('p', { class: 'muted', role: 'status' });

  /** @type {symbol | null} */
  let drawToken = null;
  const draw = () => {
    const cards = byProfile(bank.cards, (c) => c.stages).filter(
      (c) => (!filter.category || c.category === filter.category) && (!filter.stage || c.stages.includes(filter.stage)),
    );
    // Primeras tarjetas al momento; el resto por tandas para no bloquear el hilo principal.
    const FIRST = location.hash ? cards.length : 2;
    grid.replaceChildren(...cards.slice(0, FIRST).map((c) => renderCard(c, cats.get(c.category), stageLabels, links)));
    count.textContent = t('ia.count', { n: cards.length });
    const rest = cards.slice(FIRST);
    const token = (drawToken = Symbol('draw'));
    /** @type {(cb: (d: { timeRemaining: () => number }) => void) => void} */
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(() => cb({ timeRemaining: () => 8 }), 16));
    if (rest.length) grid.dataset.pending = '';
    /** Una tarjeta cada vez, mientras quede tiempo libre en el fotograma: sin tareas largas. */
    const step = (/** @type {{ timeRemaining: () => number }} */ deadline) => {
      if (token !== drawToken) return;
      do {
        const next = rest.shift();
        if (next) grid.append(renderCard(next, cats.get(next.category), stageLabels, links));
      } while (rest.length && deadline.timeRemaining() > 6);
      if (rest.length) idle(step);
      else delete grid.dataset.pending;
    };
    idle(step);
  };

  /** @type {HTMLButtonElement[]} */
  const catButtons = [];
  /** @param {string | null} id @param {string} label */
  const catChip = (id, label) => {
    const b = /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'chip interactive', 'aria-pressed': String(id === null) }, icon('check'), h('span', {}, label)));
    b.addEventListener('click', () => {
      for (const o of catButtons) o.setAttribute('aria-pressed', String(o === b));
      filter.category = id;
      draw();
    });
    catButtons.push(b);
    return b;
  };

  draw();
  view.replaceChildren(
    h('p', { class: 'lead' }, t('ia.intro')),
    h('div', { class: 'btn-row' }, h('a', { class: 'btn btn-tonal interactive', href: `${fromRoot('recursos/').href}#prompts` }, icon('download'), h('span', {}, t('ia.download')))),
    h(
      'details',
      { class: 'card card-filled guide', open: true },
      h('summary', {}, icon('info'), h('h2', { class: 'title-medium' }, t('ia.guide'))),
      h('div', { class: 'guide-grid' }, ...bank.guide.map((g) => h('section', { class: 'guide-item', 'data-tts': '' }, h('h3', { class: 'title-small' }, icon(g.icon), loc(g.title)), h('p', {}, inline(loc(g.body)))))),
    ),
    h('h2', { class: 'section-title headline-small' }, t('ia.cards')),
    h('div', { class: 'filter-row' }, h('span', { class: 'label-large' }, t('ia.category')), h('div', { class: 'chip-set', role: 'group', 'aria-label': t('ia.category') }, catChip(null, t('profile.all')), ...bank.categories.map((c) => catChip(c.id, loc(c.label))))),
    h('div', { class: 'filter-row' }, h('span', { class: 'label-large' }, t('profile.examplesFor')), await stageChips(filter.stage, (s) => { filter.stage = s; draw(); })),
    count,
    grid,
    h('p', { class: 'body-small muted' }, t('ia.checked', { date: new Date(bank.checked).toLocaleDateString(document.documentElement.lang) })),
  );
  view.removeAttribute('aria-busy');
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView();
    target?.querySelector('details.prompt-form')?.setAttribute('open', '');
  }
};
