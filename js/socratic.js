// @ts-check
/**
 * Plantilla socrática "¿Digitalización o innovación?" (plantilla/).
 * Stepper: actividad → 7 dimensiones (con repreguntas según la respuesta) → resultado.
 * El borrador se guarda en este dispositivo (localStorage con try/catch). Exporta: imprimir/PDF, texto, Abrir en IA.
 */
import { loadContent, loc, inline } from './content.js';
import { h, icon, snackbar } from './ui.js';
import { t, getLang } from './i18n.js';
import { transition, fromRoot } from './router.js';
import { AI_SERVICES, copyWithFeedback, openInAI } from './ai.js';

/**
 * @typedef {import('./types').Localized} L
 * @typedef {{ score: number, label: L, followUp: L }} Option
 * @typedef {{ id: string, icon: string, short: L, title: L, question: L, options: Option[], proposal: L, source: string }} Dimension
 * @typedef {{ intro: L, activity: { label: L, hint: L, placeholder: L }, dimensions: Dimension[], spectrum: { low: L, mid: L, high: L, explain: L }, aiPrompt: L }} Template
 * @typedef {{ activity: string, step: number, answers: Record<string, { score: number, reflection: string }> }} State
 */

const KEY = 'pd-plantilla';

/** @returns {State} */
const loadState = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { activity: '', step: 0, answers: {}, ...JSON.parse(raw) };
  } catch {
    /* sin almacenamiento: empezamos de cero */
  }
  return { activity: '', step: 0, answers: {} };
};

/** @param {State} s */
const saveState = (s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* se mantiene en memoria */
  }
};

/**
 * Puntuación global 0–100.
 * @param {Template} tpl
 * @param {State} s
 */
export const overall = (tpl, s) => {
  const max = tpl.dimensions.length * 3;
  const sum = tpl.dimensions.reduce((acc, d) => acc + (s.answers[d.id]?.score ?? 0), 0);
  return Math.round((sum / max) * 100);
};

/**
 * Resumen en texto plano (para copiar y para el prompt de IA).
 * @param {Template} tpl
 * @param {State} s
 */
export const summaryText = (tpl, s) =>
  tpl.dimensions
    .map((d) => {
      const a = s.answers[d.id];
      const opt = d.options.find((o) => o.score === a?.score);
      return `- ${loc(d.title)} (${a?.score ?? '–'}/3): ${opt ? loc(opt.label) : '—'}${a?.reflection ? `\n  ${t('plantilla.reflection')}: ${a.reflection}` : ''}`;
    })
    .join('\n');

/** Pinta la plantilla en #view. */
export const renderSocratic = async () => {
  const view = document.getElementById('view');
  if (!view) return;
  /** @type {Template} */
  const tpl = await loadContent('plantilla');
  const state = loadState();
  const total = tpl.dimensions.length + 2; // actividad + dimensiones + resultado

  const progress = /** @type {HTMLProgressElement} */ (h('progress', { max: total - 1, value: state.step, 'aria-labelledby': 'step-label' }));
  const stepLabel = h('p', { id: 'step-label', class: 'label-large' });
  const panel = h('div', { class: 'stepper-panel' });

  /** @param {number} step */
  const go = async (step) => {
    state.step = Math.max(0, Math.min(total - 1, step));
    saveState(state);
    await transition(() => draw());
    panel.querySelector('h2')?.focus();
    panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  /** @param {boolean} canNext @param {string} [nextLabel] */
  const nav = (canNext, nextLabel = t('plantilla.next')) =>
    h(
      'div',
      { class: 'stepper-nav' },
      state.step > 0 ? h('button', { type: 'button', class: 'btn btn-text interactive', onclick: () => go(state.step - 1) }, icon('arrow_back'), h('span', {}, t('plantilla.back'))) : h('span'),
      h('button', { type: 'button', class: 'btn btn-filled interactive', disabled: !canNext, 'data-next': '', onclick: () => go(state.step + 1) }, h('span', {}, nextLabel), icon('arrow_forward')),
    );

  const drawActivity = () => {
    const area = /** @type {HTMLTextAreaElement} */ (h('textarea', { id: 'activity', class: 'field', rows: 5, placeholder: loc(tpl.activity.placeholder), 'aria-describedby': 'activity-hint' }));
    area.value = state.activity;
    const navEl = nav(state.activity.trim().length > 10);
    area.addEventListener('input', () => {
      state.activity = area.value;
      saveState(state);
      /** @type {HTMLButtonElement} */ (navEl.querySelector('[data-next]')).disabled = state.activity.trim().length <= 10;
    });
    return [
      h('h2', { class: 'headline-small', tabindex: '-1' }, t('plantilla.start')),
      h('p', {}, inline(loc(tpl.intro))),
      h('div', { class: 'field-wrap' }, h('label', { for: 'activity', class: 'title-small' }, loc(tpl.activity.label)), h('p', { id: 'activity-hint', class: 'body-small muted' }, loc(tpl.activity.hint)), area),
      navEl,
    ];
  };

  /** @param {Dimension} d */
  const drawDimension = (d) => {
    const answer = state.answers[d.id];
    const follow = h('div', { class: 'follow-up', 'aria-live': 'polite' });
    const reflection = /** @type {HTMLTextAreaElement} */ (h('textarea', { id: `refl-${d.id}`, class: 'field', rows: 3, placeholder: t('plantilla.reflectionHint') }));
    reflection.value = answer?.reflection ?? '';
    reflection.addEventListener('input', () => {
      const a = state.answers[d.id];
      if (a) {
        a.reflection = reflection.value;
        saveState(state);
      }
    });
    const navEl = nav(Boolean(answer), state.step === total - 2 ? t('plantilla.seeResult') : t('plantilla.next'));

    /** @param {Option | undefined} opt */
    const showFollow = (opt) => {
      follow.replaceChildren(
        ...(opt
          ? [
              h('p', { class: 'label-large follow-label' }, icon('help'), t('plantilla.think')),
              h('p', { class: 'title-medium follow-q' }, loc(opt.followUp)),
              h('label', { for: `refl-${d.id}`, class: 'label-medium' }, t('plantilla.reflection')),
              reflection,
            ]
          : []),
      );
    };
    showFollow(d.options.find((o) => o.score === answer?.score));

    return [
      h('p', { class: 'label-large dim-kicker' }, icon(d.icon), loc(d.title)),
      h('h2', { class: 'headline-small', tabindex: '-1', id: `q-${d.id}` }, loc(d.question)),
      h(
        'fieldset',
        { class: 'options', 'aria-labelledby': `q-${d.id}` },
        ...d.options.map((o, i) =>
          h(
            'label',
            { class: 'option interactive' },
            h('input', {
              type: 'radio',
              name: `dim-${d.id}`,
              value: o.score,
              checked: answer?.score === o.score,
              onchange: () => {
                state.answers[d.id] = { score: o.score, reflection: state.answers[d.id]?.reflection ?? '' };
                saveState(state);
                showFollow(o);
                /** @type {HTMLButtonElement} */ (navEl.querySelector('[data-next]')).disabled = false;
              },
            }),
            h('span', { class: 'option-letter', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
            h('span', {}, loc(o.label)),
          ),
        ),
      ),
      follow,
      navEl,
    ];
  };

  const drawResult = () => {
    const pct = overall(tpl, state);
    const band = pct < 40 ? tpl.spectrum.low : pct < 70 ? tpl.spectrum.mid : tpl.spectrum.high;
    const weak = tpl.dimensions.filter((d) => (state.answers[d.id]?.score ?? 0) <= 1);
    const fullPrompt = () =>
      loc(tpl.aiPrompt).replace('{activity}', state.activity.trim()).replace('{answers}', summaryText(tpl, state));
    const plainText = () => `${t('route.plantilla')}\n\n${t('plantilla.activity')}: ${state.activity.trim()}\n\n${summaryText(tpl, state)}\n\n${t('plantilla.position')}: ${loc(band)} (${pct} %)`;

    return [
      h('h2', { class: 'headline-small', tabindex: '-1' }, t('plantilla.result')),
      h('section', { class: 'card card-filled print-keep' }, h('p', { class: 'label-large muted' }, t('plantilla.activity')), h('p', {}, state.activity)),
      h(
        'section',
        { class: 'spectrum', 'aria-labelledby': 'spectrum-t' },
        h('h3', { id: 'spectrum-t', class: 'title-medium' }, t('plantilla.position'), ': ', h('strong', {}, loc(band))),
        h('div', { class: 'spectrum-bar', role: 'img', 'aria-label': `${loc(band)}: ${pct} %` }, h('span', { class: 'spectrum-marker', style: `inset-inline-start: ${pct}%` })),
        h('div', { class: 'spectrum-labels body-small' }, h('span', {}, loc(tpl.spectrum.low)), h('span', {}, loc(tpl.spectrum.high))),
        h('p', { class: 'body-small muted' }, loc(tpl.spectrum.explain)),
      ),
      h(
        'section',
        { 'aria-labelledby': 'dims-t' },
        h('h3', { id: 'dims-t', class: 'title-medium' }, t('plantilla.profile')),
        h(
          'ul',
          { class: 'dim-bars' },
          ...tpl.dimensions.map((d) => {
            const a = state.answers[d.id];
            const opt = d.options.find((o) => o.score === a?.score);
            return h(
              'li',
              { class: 'dim-bar' },
              h('span', { class: 'dim-name label-large' }, loc(d.short)),
              h('span', { class: 'dim-track', 'aria-hidden': 'true' }, h('span', { class: 'dim-fill', style: `inline-size: ${((a?.score ?? 0) / 3) * 100}%` })),
              h('span', { class: 'dim-score label-large' }, `${a?.score ?? 0}/3`),
              h('span', { class: 'dim-answer body-small muted' }, opt ? loc(opt.label) : '—', a?.reflection ? ` · ${t('plantilla.reflection')}: ${a.reflection}` : ''),
            );
          }),
        ),
      ),
      h(
        'section',
        { class: 'card card-outlined', 'aria-labelledby': 'props-t', 'data-tts': '' },
        h('h3', { id: 'props-t', class: 'title-medium' }, icon('rocket_launch'), ' ', t('plantilla.proposals')),
        weak.length
          ? h('ul', { class: 'proposals' }, ...weak.map((d) => h('li', {}, h('strong', {}, `${loc(d.short)}: `), loc(d.proposal), ' ', inline(`[@${d.source}]`))))
          : h('p', {}, t('plantilla.allGood')),
      ),
      h(
        'div',
        { class: 'result-actions no-print' },
        h('button', { type: 'button', class: 'btn btn-filled interactive', onclick: () => window.print() }, icon('print'), h('span', {}, t('plantilla.print'))),
        h('button', { type: 'button', class: 'btn btn-tonal interactive', onclick: () => copyWithFeedback(plainText()) }, icon('content_copy'), h('span', {}, t('plantilla.copy'))),
      ),
      h(
        'div',
        { class: 'result-actions no-print' },
        h('span', { class: 'label-large' }, t('plantilla.openAi')),
        ...AI_SERVICES.map((s) => h('button', { type: 'button', class: 'btn btn-outlined interactive', 'aria-label': t('ia.openIn', { service: s.label }), onclick: () => openInAI(s, fullPrompt()) }, icon('open_in_new'), h('span', {}, s.label))),
      ),
      h(
        'div',
        { class: 'result-actions no-print' },
        h('a', { class: 'btn btn-text interactive', href: fromRoot(`assets/plantilla-en-blanco-${getLang()}.pdf`).href, download: '' }, icon('download'), h('span', {}, t('plantilla.blank'))),
        h('button', {
          type: 'button',
          class: 'btn btn-text interactive',
          onclick: () => {
            state.activity = '';
            state.answers = {};
            go(0);
            snackbar(t('plantilla.cleared'));
          },
        }, icon('restart_alt'), h('span', {}, t('plantilla.restart'))),
      ),
      nav(false, t('plantilla.next')).firstElementChild ?? h('span'),
    ];
  };

  const draw = () => {
    const step = state.step;
    progress.value = step;
    stepLabel.textContent = step === 0 ? t('plantilla.stepActivity', { total }) : step === total - 1 ? t('plantilla.stepResult', { total }) : t('plantilla.step', { n: step + 1, total });
    const dim = tpl.dimensions[step - 1];
    panel.replaceChildren(...(step === 0 ? drawActivity() : dim ? drawDimension(dim) : drawResult()));
  };

  draw();
  view.replaceChildren(h('div', { class: 'stepper card card-elevated' }, h('div', { class: 'stepper-head no-print' }, stepLabel, progress), panel));
  view.removeAttribute('aria-busy');
};
