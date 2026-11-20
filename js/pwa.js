// @ts-check
/**
 * PWA: registro del service worker, aviso de nueva versión e instalación.
 * - Android/escritorio Chromium: botón propio con `beforeinstallprompt`.
 * - iOS/iPadOS: ese evento no existe → bottom sheet con los pasos Compartir → Añadir a pantalla de inicio.
 */
import { fromRoot } from './router.js';
import { h, icon, openModal, snackbar } from './ui.js';
import { t } from './i18n.js';

/** @typedef {Event & { prompt: () => Promise<void>, userChoice: Promise<{ outcome: string }> }} InstallEvent */

/** @type {InstallEvent | null} */
let deferred = null;

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || /** @type {any} */ (navigator).standalone === true;

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** El usuario ha aceptado actualizar: solo entonces recargamos al cambiar de SW. */
let updateAccepted = false;

/** Registra el SW y muestra "Nueva versión disponible" cuando hay una esperando. */
export const registerSW = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register(fromRoot('sw.js').href, { scope: fromRoot('./').pathname });
    /** @param {ServiceWorker | null} worker */
    const offerUpdate = (worker) => {
      if (!worker || !navigator.serviceWorker.controller) return;
      snackbar(t('pwa.update'), {
        action: t('pwa.reload'),
        onAction: () => {
          updateAccepted = true;
          worker.postMessage('SKIP_WAITING');
        },
      });
    };
    if (reg.waiting) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed') offerUpdate(nw);
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // En la primera visita clients.claim() también dispara este evento: ahí no hay que recargar.
      if (!updateAccepted) return;
      updateAccepted = false;
      location.reload();
    });
  } catch (err) {
    console.error('No se pudo registrar el service worker', err);
  }
};

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = /** @type {InstallEvent} */ (e);
  document.dispatchEvent(new CustomEvent('pd:installable'));
});

addEventListener('appinstalled', () => {
  deferred = null;
  document.querySelectorAll('.install-card').forEach((el) => el.remove());
  snackbar(t('install.done'));
});

/** @param {HTMLElement} opener */
const showIOSSheet = (opener) => {
  const dialog = /** @type {HTMLDialogElement} */ (
    h(
      'dialog',
      { class: 'sheet', 'aria-labelledby': 'ios-title' },
      h(
        'div',
        { class: 'sheet-inner' },
        h('div', {}, h('div', { class: 'drag-handle', 'aria-hidden': 'true' }), h('div', { class: 'sheet-head' }, h('h2', { id: 'ios-title' }, t('install.ios.title')), h('button', { type: 'button', class: 'icon-btn interactive', 'aria-label': t('app.close'), onclick: () => dialog.close() }, icon('close')))),
        h('ol', { class: 'sheet-body ios-steps' }, h('li', {}, icon('share'), h('span', {}, t('install.ios.step1'))), h('li', {}, icon('install_mobile'), h('span', {}, t('install.ios.step2'))), h('li', {}, icon('check_circle'), h('span', {}, t('install.ios.step3')))),
        h('div', { class: 'sheet-foot' }, h('button', { type: 'button', class: 'btn btn-filled interactive', onclick: () => dialog.close() }, t('app.close'))),
      ),
    )
  );
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  openModal(dialog, opener);
};

/**
 * @param {HTMLElement} btn
 */
const install = async (btn) => {
  if (deferred) {
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
  } else if (isIOS()) showIOSSheet(btn);
  else snackbar(t('install.other'), 8000);
};

/**
 * Tarjeta "Instala la app" (no aparece si ya está instalada).
 * @returns {HTMLElement | null}
 */
export const installCard = () => {
  if (isStandalone()) return null;
  return h(
    'section',
    { class: 'card card-outlined install-card', 'aria-labelledby': 'install-t' },
    h('div', { class: 'card-header' }, h('span', { class: 'card-icon' }, icon('install_mobile')), h('div', {}, h('h2', { id: 'install-t', class: 'title-medium' }, t('install.title')), h('p', { class: 'body-medium muted' }, t('install.body')))),
    h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-filled interactive', onclick: (/** @type {Event} */ e) => install(/** @type {HTMLElement} */ (e.currentTarget)) }, icon('download'), h('span', {}, t('install.button')))),
  );
};
