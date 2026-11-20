// @ts-check
/**
 * Panel de accesibilidad (side sheet en tablet/escritorio, bottom sheet en móvil).
 * Preferencias en window.pdPrefs (js/boot.js), guardadas en localStorage con try/catch.
 */
import { h, icon, openModal, snackbar } from './ui.js';
import { t, setLang, applyI18n, loadStrings } from './i18n.js';
import { supported as ttsSupported } from './tts.js';

const MIN_SCALE = 100;
const MAX_SCALE = 200;
const STEP = 10;

/** @param {boolean} saved */
const notifySaved = (saved) => {
  if (!saved) snackbar(t('a11y.storageOff'));
};

/**
 * Grupo de segmented buttons (radios nativos).
 * @param {string} name
 * @param {string} legendKey
 * @param {{ value: string, labelKey?: string, label?: string, icon?: string, lang?: string }[]} options
 * @param {string} selected
 * @param {(value: string) => void} onChange
 */
const segmented = (name, legendKey, options, selected, onChange) =>
  h(
    'fieldset',
    { class: 'field-group' },
    h('legend', { 'data-i18n': legendKey }, t(legendKey)),
    h(
      'div',
      { class: 'segmented' },
      ...options.map((opt) =>
        h(
          'label',
          { class: 'interactive', lang: opt.lang },
          h('input', {
            type: 'radio',
            name,
            value: opt.value,
            checked: opt.value === selected,
            onchange: () => onChange(opt.value),
          }),
          opt.icon ? icon(opt.icon) : null,
          opt.labelKey ? h('span', { 'data-i18n': opt.labelKey }, t(opt.labelKey)) : h('span', {}, opt.label ?? opt.value),
        ),
      ),
    ),
  );

/**
 * Fila con switch M3.
 * @param {string} id
 * @param {string} labelKey
 * @param {boolean} checked
 * @param {(checked: boolean) => void} onChange
 * @param {{ disabled?: boolean, hintKey?: string }} [opts]
 */
const switchRow = (id, labelKey, checked, onChange, opts = {}) =>
  h(
    'label',
    { class: 'switch-row', for: id },
    h(
      'span',
      {},
      h('span', { class: 'field-label', 'data-i18n': labelKey }, t(labelKey)),
      opts.hintKey ? h('span', { class: 'hint', 'data-i18n': opts.hintKey }, t(opts.hintKey)) : null,
    ),
    h('input', {
      id,
      class: 'switch',
      type: 'checkbox',
      role: 'switch',
      checked,
      disabled: opts.disabled,
      onchange: (/** @type {Event} */ e) => onChange(/** @type {HTMLInputElement} */ (e.currentTarget).checked),
    }),
  );

/** Control de tamaño de letra: slider 100–200 % con botones −/+. */
const fontControl = () => {
  const initial = Math.round(window.pdPrefs.get().fontScale * 100);
  const output = h('output', { for: 'a11y-font', id: 'a11y-font-out' }, `${initial} %`);
  const range = /** @type {HTMLInputElement} */ (
    h('input', {
      id: 'a11y-font',
      type: 'range',
      min: MIN_SCALE,
      max: MAX_SCALE,
      step: STEP,
      value: initial,
      'aria-valuetext': `${initial} %`,
    })
  );

  /** @param {number} pct */
  const setScale = (pct) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pct));
    range.value = String(clamped);
    range.setAttribute('aria-valuetext', `${clamped} %`);
    output.textContent = `${clamped} %`;
    notifySaved(window.pdPrefs.set({ fontScale: clamped / 100 }));
  };

  range.addEventListener('input', () => setScale(Number(range.value)));

  /** @param {number} delta @param {string} name @param {string} key */
  const stepBtn = (delta, name, key) =>
    h(
      'button',
      {
        type: 'button',
        class: 'icon-btn icon-btn-tonal interactive',
        'data-i18n-attr': `aria-label:${key};title:${key}`,
        'aria-label': t(key),
        title: t(key),
        onclick: () => setScale(Number(range.value) + delta),
      },
      icon(name),
    );

  return h(
    'div',
    { class: 'field-group' },
    h('label', { class: 'field-label', for: 'a11y-font', 'data-i18n': 'a11y.fontSize' }, t('a11y.fontSize')),
    h('div', { class: 'slider-row' }, stepBtn(-STEP, 'text_decrease', 'a11y.fontSmaller'), range, stepBtn(STEP, 'text_increase', 'a11y.fontBigger'), output),
  );
};

/** Construye el contenido del panel a partir de las preferencias actuales. */
const buildBody = () => {
  const prefs = window.pdPrefs.get();
  const hcNow = prefs.highContrast ?? matchMedia('(prefers-contrast: more)').matches;

  return h(
    'div',
    { class: 'sheet-body' },
    fontControl(),
    segmented(
      'a11y-theme',
      'a11y.theme',
      [
        { value: 'light', labelKey: 'a11y.theme.light', icon: 'light_mode' },
        { value: 'dark', labelKey: 'a11y.theme.dark', icon: 'dark_mode' },
        { value: 'system', labelKey: 'a11y.theme.system', icon: 'settings_brightness' },
      ],
      prefs.theme,
      (value) => notifySaved(window.pdPrefs.set({ theme: /** @type {import('./types').Theme} */ (value) })),
    ),
    switchRow('a11y-contrast', 'a11y.contrast', hcNow, (on) => notifySaved(window.pdPrefs.set({ highContrast: on }))),
    switchRow('a11y-spacing', 'a11y.spacing', prefs.spacing, (on) => notifySaved(window.pdPrefs.set({ spacing: on }))),
    segmented(
      'a11y-lang',
      'a11y.language',
      [
        { value: 'es', label: 'Español', lang: 'es' },
        { value: 'en', label: 'English', lang: 'en' },
      ],
      prefs.lang,
      (value) => notifySaved(setLang(/** @type {import('./types').Lang} */ (value))),
    ),
    switchRow('a11y-tts', 'a11y.tts', prefs.tts && ttsSupported(), (on) => {
      notifySaved(window.pdPrefs.set({ tts: on }));
      document.dispatchEvent(new CustomEvent('pd:prefschange'));
    }, {
      disabled: !ttsSupported(),
      hintKey: ttsSupported() ? 'a11y.ttsHint' : 'a11y.ttsUnsupported',
    }),
    switchRow('a11y-picto', 'a11y.picto', prefs.picto, (on) => {
      notifySaved(window.pdPrefs.set({ picto: on }));
      document.dispatchEvent(new CustomEvent('pd:prefschange'));
    }, {
      hintKey: 'a11y.pictoHint',
    }),
  );
};

/** @returns {HTMLDialogElement} */
const buildPanel = () => {
  const dialog = /** @type {HTMLDialogElement} */ (h('dialog', { class: 'sheet', id: 'a11y-panel', 'aria-labelledby': 'a11y-title' }));
  const body = buildBody();

  const reset = () => {
    const saved = window.pdPrefs.reset();
    applyI18n();
    document.dispatchEvent(new CustomEvent('pd:langchange', { detail: window.pdPrefs.get().lang }));
    const fresh = buildBody();
    snackbar(saved ? t('a11y.resetDone') : t('a11y.storageOff'));
    document.dispatchEvent(new CustomEvent('pd:prefschange'));
    inner.querySelector('.sheet-body')?.replaceWith(fresh);
  };

  const inner = h(
    'div',
    { class: 'sheet-inner' },
    h(
      'div',
      {},
      h('div', { class: 'drag-handle', 'aria-hidden': 'true' }),
      h(
        'div',
        { class: 'sheet-head' },
        h('h2', { id: 'a11y-title', 'data-i18n': 'a11y.title' }, t('a11y.title')),
        h(
          'button',
          {
            type: 'button',
            class: 'icon-btn interactive',
            'data-i18n-attr': 'aria-label:app.close;title:app.close',
            'aria-label': t('app.close'),
            title: t('app.close'),
            onclick: () => dialog.close(),
          },
          icon('close'),
        ),
      ),
    ),
    body,
    h(
      'div',
      { class: 'sheet-foot' },
      h('button', { type: 'button', class: 'btn btn-text interactive', onclick: reset }, icon('restart_alt'), h('span', { 'data-i18n': 'a11y.reset' }, t('a11y.reset'))),
    ),
  );
  dialog.append(inner);
  document.body.append(dialog);
  return dialog;
};

/** @type {HTMLDialogElement | null} */
let panel = null;

/** Conecta los botones `[data-action="a11y"]`. El panel se construye en la primera apertura. */
export const initA11yPanel = () => {
  for (const btn of document.querySelectorAll('[data-action="a11y"]')) {
    btn.addEventListener('click', async () => {
      await loadStrings().catch(() => undefined);
      panel ??= buildPanel();
      openModal(panel, /** @type {HTMLElement} */ (btn));
    });
  }
};
