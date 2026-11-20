// @ts-check
/**
 * Perfil del docente: etapa (Primaria, ESO/Bachillerato, EOI, Conservatorio) y especialidad opcional.
 * Sirve para filtrar y ordenar ejemplos y prompts. Se guarda con el resto de preferencias.
 */
import { loadContent, loc } from './content.js';
import { h, icon, openModal, snackbar } from './ui.js';
import { t } from './i18n.js';

/**
 * @typedef {{ id: string, label: import('./types').Localized, icon: string, specialties: import('./types').Localized[] }} Stage
 * @typedef {{ stages: Stage[], other: import('./types').Localized }} Profiles
 */

/** @returns {Promise<Profiles>} */
export const loadProfiles = () => loadContent('perfiles');

/** @returns {string | null} */
export const getStage = () => window.pdPrefs.get().stage;

/**
 * Ordena elementos poniendo primero los de la etapa del perfil.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string[]} stagesOf
 * @returns {T[]}
 */
export const byProfile = (items, stagesOf) => {
  const stage = getStage();
  if (!stage) return items;
  return [...items].sort((a, b) => Number(stagesOf(b).includes(stage)) - Number(stagesOf(a).includes(stage)));
};

const emitChange = () => document.dispatchEvent(new CustomEvent('pd:profilechange'));

/** @type {HTMLDialogElement | null} */
let dialog = null;

/**
 * Bottom sheet / side sheet para elegir el perfil.
 * @param {HTMLElement | null} [opener]
 */
export const openProfilePicker = async (opener = null) => {
  const profiles = await loadProfiles();
  dialog?.remove();
  const prefs = window.pdPrefs.get();
  let stage = prefs.stage;

  const specialtySelect = /** @type {HTMLSelectElement} */ (h('select', { id: 'profile-specialty', class: 'select' }));
  const fillSpecialties = () => {
    const st = profiles.stages.find((s) => s.id === stage);
    specialtySelect.replaceChildren(
      h('option', { value: '' }, loc(profiles.other)),
      ...(st?.specialties ?? []).map((sp) => h('option', { value: sp.es, selected: sp.es === prefs.specialty }, loc(sp))),
    );
    specialtySelect.disabled = !st;
  };
  fillSpecialties();

  const stageGroup = h(
    'fieldset',
    { class: 'field-group' },
    h('legend', {}, t('profile.stage')),
    h(
      'div',
      { class: 'choice-grid' },
      ...profiles.stages.map((st) =>
        h(
          'label',
          { class: 'choice interactive' },
          h('input', {
            type: 'radio',
            name: 'profile-stage',
            value: st.id,
            checked: st.id === stage,
            onchange: () => {
              stage = st.id;
              fillSpecialties();
            },
          }),
          icon(st.icon),
          h('span', {}, loc(st.label)),
        ),
      ),
    ),
  );

  const save = () => {
    const saved = window.pdPrefs.set({ stage, specialty: specialtySelect.value || null, profileAsked: true });
    dialog?.close();
    snackbar(saved ? t('profile.saved') : t('a11y.storageOff'));
    emitChange();
  };

  const skip = () => {
    window.pdPrefs.set({ profileAsked: true });
    dialog?.close();
  };

  dialog = /** @type {HTMLDialogElement} */ (
    h(
      'dialog',
      { class: 'sheet', 'aria-labelledby': 'profile-title' },
      h(
        'div',
        { class: 'sheet-inner' },
        h(
          'div',
          {},
          h('div', { class: 'drag-handle', 'aria-hidden': 'true' }),
          h(
            'div',
            { class: 'sheet-head' },
            h('h2', { id: 'profile-title' }, t('profile.title')),
            h('button', { type: 'button', class: 'icon-btn interactive', 'aria-label': t('app.close'), title: t('app.close'), onclick: skip }, icon('close')),
          ),
        ),
        h(
          'div',
          { class: 'sheet-body' },
          h('p', { class: 'body-medium muted' }, t('profile.why')),
          stageGroup,
          h('div', { class: 'field-group' }, h('label', { class: 'field-label', for: 'profile-specialty' }, t('profile.specialty')), specialtySelect),
        ),
        h(
          'div',
          { class: 'sheet-foot' },
          h('button', { type: 'button', class: 'btn btn-text interactive', onclick: skip }, t('profile.skip')),
          h('button', { type: 'button', class: 'btn btn-filled interactive', onclick: save }, t('profile.save')),
        ),
      ),
    )
  );
  document.body.append(dialog);
  openModal(dialog, opener);
};

/**
 * Tarjeta "Tu perfil" con botón para cambiarlo.
 * @returns {Promise<HTMLElement>}
 */
export const profileCard = async () => {
  const profiles = await loadProfiles();
  const prefs = window.pdPrefs.get();
  const st = profiles.stages.find((s) => s.id === prefs.stage);
  const label = st ? `${loc(st.label)}${prefs.specialty ? ` · ${loc(st.specialties.find((s) => s.es === prefs.specialty) ?? { es: prefs.specialty, en: prefs.specialty })}` : ''}` : t('profile.none');
  return h(
    'section',
    { class: 'card card-outlined profile-card', 'aria-labelledby': 'profile-card-title' },
    h('div', { class: 'card-header' }, h('span', { class: 'card-icon' }, icon(st?.icon ?? 'person')), h('div', {}, h('h2', { id: 'profile-card-title', class: 'title-small muted' }, t('profile.your')), h('p', { class: 'title-medium' }, label))),
    h(
      'div',
      { class: 'btn-row' },
      h('button', { type: 'button', class: 'btn btn-tonal interactive', onclick: (/** @type {Event} */ e) => openProfilePicker(/** @type {HTMLElement} */ (e.currentTarget)) }, icon('tune'), h('span', {}, st ? t('profile.change') : t('profile.choose'))),
    ),
  );
};

/**
 * Chips de filtro por etapa (con "Todas"). Devuelve el nodo y llama a onChange con la etapa elegida o null.
 * @param {string | null} initial
 * @param {(stage: string | null) => void} onChange
 * @returns {Promise<HTMLElement>}
 */
export const stageChips = async (initial, onChange) => {
  const profiles = await loadProfiles();
  /** @type {HTMLButtonElement[]} */
  const buttons = [];
  /** @param {string | null} id @param {string} label */
  const chip = (id, label) => {
    const b = /** @type {HTMLButtonElement} */ (
      h('button', { type: 'button', class: 'chip interactive', 'aria-pressed': String(id === initial) }, icon('check'), h('span', {}, label))
    );
    b.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === b));
      onChange(id);
    });
    buttons.push(b);
    return b;
  };
  return h(
    'div',
    { class: 'chip-set', role: 'group', 'aria-label': t('profile.filter') },
    chip(null, t('profile.all')),
    ...profiles.stages.map((s) => chip(s.id, loc(s.label))),
  );
};
