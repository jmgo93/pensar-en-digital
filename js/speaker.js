// @ts-check
/**
 * Perfil de ponente: acceso con contraseña a la presentación, las notas, los resultados y la gestión de
 * las votaciones (archivar y poner a cero). El público general no ve nada de eso.
 *
 * Seguridad, con honestidad:
 * - En el navegador solo se comprueba una huella PBKDF2-SHA256 de la contraseña (content/site.json → speaker),
 *   que funciona sin conexión. Sirve para separar perfiles, no para proteger datos: el repositorio es público.
 * - La acción que sí importa (archivar y borrar respuestas) la valida el servidor: Apps Script compara la
 *   contraseña con su propiedad privada PONENTE_CLAVE antes de tocar nada.
 */
import { h, icon, openModal, snackbar } from './ui.js';
import { t } from './i18n.js';
import { fetchJson, fromRoot } from './router.js';

const ROLE_KEY = 'pd-ponente';

/** @typedef {{ salt: string, iterations: number, hash: string }} SpeakerHash */
/** @typedef {import('./types').Site & { speaker?: SpeakerHash }} SiteWithSpeaker */
/** @typedef {{ v: string, question: string, options: string[], counts: number[], total: number }} VoteSummary */
/** @typedef {{ ok: boolean, error?: string, url?: string, sheet?: string, summary?: VoteSummary[] }} ArchiveResult */

/** @returns {boolean} */
export const isSpeaker = () => {
  try {
    return localStorage.getItem(ROLE_KEY) === '1';
  } catch {
    return document.documentElement.dataset.role === 'ponente';
  }
};

/** @param {boolean} on */
const setSpeaker = (on) => {
  try {
    if (on) localStorage.setItem(ROLE_KEY, '1');
    else localStorage.removeItem(ROLE_KEY);
  } catch {
    /* sin almacenamiento: el perfil dura lo que la página */
  }
  if (on) document.documentElement.dataset.role = 'ponente';
  else delete document.documentElement.dataset.role;
};

/** @param {SiteWithSpeaker} site */
export const passwordConfigured = (site) => Boolean(site.speaker?.hash && site.speaker.salt);

/** @param {string} hex */
const fromHex = (hex) => new Uint8Array((hex.match(/../g) ?? []).map((b) => parseInt(b, 16)));
/** @param {ArrayBuffer} buf */
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Comprueba la contraseña contra la huella PBKDF2 de site.json.
 * @param {string} password
 * @param {SiteWithSpeaker} site
 * @returns {Promise<boolean>}
 */
export const checkPassword = async (password, site) => {
  const sp = site.speaker;
  if (!sp || !passwordConfigured(site)) return true;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(sp.salt), iterations: sp.iterations }, key, 256);
  return toHex(bits) === sp.hash;
};

/**
 * Formulario de acceso. Llama a onSuccess cuando la contraseña es correcta.
 * @param {SiteWithSpeaker} site
 * @param {() => void} onSuccess
 */
export const loginForm = (site, onSuccess) => {
  const input = /** @type {HTMLInputElement} */ (h('input', { id: 'speaker-pw', class: 'field', type: 'password', autocomplete: 'current-password', required: true }));
  const error = h('p', { class: 'field-error', role: 'alert' });
  const form = h(
    'form',
    { class: 'card card-filled speaker-login stack' },
    h('h2', { class: 'title-large' }, icon('lock'), ' ', t('speaker.title')),
    h('p', {}, t('speaker.intro')),
    passwordConfigured(site) ? null : h('p', { class: 'muted' }, icon('warning'), ' ', t('speaker.notSet')),
    h('div', { class: 'field-wrap' }, h('label', { for: 'speaker-pw', class: 'label-medium' }, t('speaker.password')), input),
    error,
    h('div', { class: 'btn-row' }, h('button', { type: 'submit', class: 'btn btn-filled interactive' }, icon('lock_open'), h('span', {}, t('speaker.enter')))),
  );
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (await checkPassword(input.value, site)) {
      setSpeaker(true);
      onSuccess();
    } else {
      error.textContent = t('speaker.wrong');
      input.select();
    }
  });
  return form;
};

/**
 * Páginas solo para el ponente (presentación, resultados): si no lo es, muestra el acceso y espera.
 * @param {HTMLElement} host dónde pintar el formulario
 * @returns {Promise<SiteWithSpeaker>}
 */
export const requireSpeaker = async (host) => {
  /** @type {SiteWithSpeaker} */
  const site = await fetchJson('content/site.json');
  if (isSpeaker()) return site;
  await new Promise((resolve) => {
    const wrap = h('div', { class: 'speaker-gate' }, loginForm(site, () => resolve(undefined)), h('p', {}, h('a', { href: fromRoot('').href }, icon('home'), ' ', t('speaker.backHome'))));
    host.replaceChildren(wrap);
    document.body.removeAttribute('aria-busy');
    /** @type {HTMLInputElement | null} */ (wrap.querySelector('input'))?.focus();
  });
  host.replaceChildren();
  return site;
};

/**
 * Copia CSV del archivo (separador ; para que Excel en español lo abra bien).
 * @param {VoteSummary[]} summary
 * @param {string} label
 */
const toCsv = (summary, label) => {
  /** @param {string | number} v */
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [[t('speaker.label'), label].map(q).join(';'), ['id', 'pregunta', 'opción', 'votos', '%', 'total'].map(q).join(';')];
  for (const s of summary) {
    s.options.forEach((o, i) => {
      const n = s.counts[i] ?? 0;
      rows.push([s.v, s.question, o, n, s.total ? Math.round((n / s.total) * 100) : 0, s.total].map(q).join(';'));
    });
  }
  return `﻿${rows.join('\r\n')}\r\n`;
};

/**
 * Pide al servidor que archive y ponga a cero. La contraseña viaja solo en el cuerpo de la petición (HTTPS).
 * @param {string} endpoint
 * @param {string} key
 * @param {string} label
 * @returns {Promise<ArchiveResult>}
 */
const requestArchive = async (endpoint, key, label) => {
  const res = await fetch(endpoint, { method: 'POST', body: JSON.stringify({ action: 'archive', key, label }), redirect: 'follow' });
  if (!res.ok) throw new Error(String(res.status));
  return /** @type {ArchiveResult} */ (await res.json());
};

/**
 * Diálogo «Archivar resultados y reiniciar».
 * @param {SiteWithSpeaker} site
 */
export const openArchiveDialog = (site) => {
  const today = new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const label = /** @type {HTMLInputElement} */ (h('input', { id: 'archive-label', class: 'field', type: 'text', value: today, maxlength: 60, autocomplete: 'off' }));
  const pw = /** @type {HTMLInputElement} */ (h('input', { id: 'archive-pw', class: 'field', type: 'password', autocomplete: 'current-password', required: true }));
  const status = h('div', { class: 'stack', role: 'status', 'aria-live': 'polite' });
  const run = /** @type {HTMLButtonElement} */ (h('button', { type: 'submit', class: 'btn btn-filled interactive' }, icon('inventory_2'), h('span', {}, t('speaker.run'))));
  const dialog = /** @type {HTMLDialogElement} */ (
    h(
      'dialog',
      { class: 'sheet speaker-dialog', 'aria-labelledby': 'archive-title' },
      h(
        'form',
        { class: 'stack', method: 'dialog' },
        h('h2', { id: 'archive-title', class: 'title-large' }, icon('inventory_2'), ' ', t('speaker.archive')),
        h('p', {}, t('speaker.archiveIntro')),
        site.votingEndpoint ? null : h('p', { class: 'field-error' }, t('speaker.noEndpoint')),
        h('div', { class: 'field-wrap' }, h('label', { for: 'archive-label', class: 'label-medium' }, t('speaker.label')), label),
        h('div', { class: 'field-wrap' }, h('label', { for: 'archive-pw', class: 'label-medium' }, t('speaker.confirm')), pw),
        status,
        h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-text interactive', onclick: () => dialog.close() }, t('speaker.cancel')), run),
      ),
    )
  );
  const form = /** @type {HTMLFormElement} */ (dialog.querySelector('form'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!site.votingEndpoint) return;
    if (!navigator.onLine) {
      status.replaceChildren(h('p', { class: 'field-error' }, t('speaker.offline')));
      return;
    }
    run.disabled = true;
    status.replaceChildren(h('p', {}, t('speaker.working')));
    try {
      const r = await requestArchive(site.votingEndpoint, pw.value, label.value.trim());
      if (!r.ok) {
        const key = r.error === 'bad-key' ? 'speaker.wrong' : r.error === 'locked' ? 'speaker.locked' : r.error === 'no-key' ? 'speaker.noKey' : '';
        status.replaceChildren(h('p', { class: 'field-error' }, key ? t(key) : t('speaker.error', { msg: r.error ?? '?' })));
        run.disabled = false;
        return;
      }
      pw.value = '';
      const summary = r.summary ?? [];
      const csv = URL.createObjectURL(new Blob([toCsv(summary, label.value.trim())], { type: 'text/csv;charset=utf-8' }));
      status.replaceChildren(
        h('p', { class: 'title-small' }, icon('check_circle'), ' ', t('speaker.done')),
        h('ul', { class: 'archive-list' }, ...summary.map((s) => h('li', {}, h('strong', {}, s.v), ` · ${t('speaker.votesN', { n: s.total })}`))),
        h(
          'div',
          { class: 'btn-row' },
          r.url ? h('a', { class: 'btn btn-tonal interactive', href: r.url, target: '_blank', rel: 'noopener' }, icon('open_in_new'), h('span', {}, t('speaker.openSheet'))) : null,
          h('a', { class: 'btn btn-outlined interactive', href: csv, download: `votaciones-${label.value.trim().replace(/[^\p{L}\p{N}]+/gu, '-') || 'sesion'}.csv` }, icon('download'), h('span', {}, t('speaker.csv'))),
        ),
      );
      snackbar(t('speaker.done'));
    } catch (err) {
      status.replaceChildren(h('p', { class: 'field-error' }, t('speaker.error', { msg: err instanceof Error ? err.message : String(err) })));
      run.disabled = false;
    }
  });
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  openModal(dialog);
  pw.focus();
};

/** Botón que abre el diálogo de archivo. @param {SiteWithSpeaker} site @param {string} [cls] */
export const archiveButton = (site, cls = 'btn btn-tonal interactive') =>
  h('button', { type: 'button', class: cls, onclick: () => openArchiveDialog(site) }, icon('inventory_2'), h('span', {}, t('speaker.archive')));

/** Pinta el panel del ponente (ruta ponente/). */
export const renderPonente = async () => {
  const view = document.getElementById('view');
  if (!view) return;
  /** @type {SiteWithSpeaker} */
  const site = await fetchJson('content/site.json');
  const draw = () => {
    if (!isSpeaker()) {
      view.replaceChildren(loginForm(site, draw));
      view.removeAttribute('aria-busy');
      return;
    }
    /** @param {string} href @param {string} ic @param {string} key @param {boolean} [blank] */
    const link = (href, ic, key, blank = false) => h('a', { class: 'btn btn-tonal interactive', href, ...(blank ? { target: '_blank', rel: 'noopener' } : {}) }, icon(ic), h('span', {}, t(key)));
    view.replaceChildren(
      ...(passwordConfigured(site) ? [] : [h('div', { class: 'card card-outlined' }, h('p', {}, icon('warning'), ' ', t('speaker.notSet')))]),
      h(
        'section',
        { class: 'card card-filled stack' },
        h('h2', { class: 'title-large' }, icon('slideshow'), ' ', t('speaker.slides')),
        h(
          'div',
          { class: 'btn-row' },
          link(fromRoot('presentacion/').href, 'slideshow', 'speaker.openSlides'),
          link(`${fromRoot('presentacion/').href}?notas`, 'co_present', 'speaker.openNotes', true),
          link(fromRoot('presentacion/resultados.html').href, 'how_to_vote', 'speaker.openResults', true),
          link(fromRoot('docs/escaleta.pdf').href, 'picture_as_pdf', 'speaker.escaleta', true),
          link(fromRoot('docs/estudios-ponente.pdf').href, 'science', 'speaker.estudios', true),
        ),
      ),
      h('section', { class: 'card card-filled stack' }, h('h2', { class: 'title-large' }, icon('how_to_vote'), ' ', t('speaker.votes')), h('p', {}, t('speaker.archiveIntro')), h('div', { class: 'btn-row' }, archiveButton(site, 'btn btn-filled interactive'))),
      h(
        'div',
        { class: 'btn-row' },
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-outlined interactive',
            onclick: () => {
              setSpeaker(false);
              draw();
            },
          },
          icon('logout'),
          h('span', {}, t('speaker.logout')),
        ),
      ),
    );
    view.removeAttribute('aria-busy');
  };
  draw();
};
