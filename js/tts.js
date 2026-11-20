// @ts-check
/**
 * Lectura en voz alta con Web Speech API (speechSynthesis), voz del sistema:
 * Android → normalmente Google TTS; iOS/iPadOS → solo voces de Apple (limitación del sistema).
 * - Botón reproducir/pausar en cada bloque [data-tts] y botón para leer toda la página.
 * - Lee fragmento a fragmento (título, párrafo, elemento de lista) y resalta el que suena.
 * - "Pausa" detiene y recuerda el fragmento: más fiable que speechSynthesis.pause() en Android.
 */
import { h, icon, snackbar } from './ui.js';
import { t, getLang } from './i18n.js';

export const supported = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';

/** @type {SpeechSynthesisVoice[]} */
let voices = [];

/** Carga asíncrona de voces (Chrome las entrega tras `voiceschanged`). */
const loadVoices = () =>
  new Promise((resolve) => {
    const got = speechSynthesis.getVoices();
    if (got.length) {
      voices = got;
      resolve(voices);
      return;
    }
    const done = () => {
      voices = speechSynthesis.getVoices();
      resolve(voices);
    };
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500); // algunos navegadores nunca disparan el evento
  });

/** @param {'es' | 'en'} lang */
const pickVoice = (lang) => {
  const prefs = lang === 'es' ? ['es-ES', 'es'] : ['en-GB', 'en-US', 'en'];
  for (const p of prefs) {
    const v = voices.find((x) => x.lang.replace('_', '-').toLowerCase().startsWith(p.toLowerCase()));
    if (v) return v;
  }
  return null;
};

/** Fragmentos legibles de un bloque, en orden. */
const fragments = (/** @type {Element} */ root) =>
  [...root.querySelectorAll('h1, h2, h3, p, li, dt, dd, blockquote')]
    .filter((el) => !el.closest('button, .tts-btn, .picto-strip, .prompt-actions, .no-tts'))
    .filter((el) => !el.querySelector('p, li'))
    .filter((el) => (/** @type {HTMLElement} */ (el)).offsetParent !== null && el.textContent?.trim());

/** @type {{ queue: Element[], index: number, owner: HTMLButtonElement | null, playing: boolean }} */
const state = { queue: [], index: 0, owner: null, playing: false };

const clearHighlight = () => document.querySelectorAll('.tts-reading').forEach((el) => el.classList.remove('tts-reading'));

/** @param {HTMLButtonElement | null} btn @param {boolean} playing */
const setButton = (btn, playing) => {
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(playing));
  btn.replaceChildren(icon(playing ? 'pause' : btn.dataset.page ? 'volume_up' : 'play_arrow'), btn.dataset.page ? h('span', {}, playing ? t('tts.pause') : t('tts.page')) : '');
  btn.setAttribute('aria-label', playing ? t('tts.pause') : btn.dataset.page ? t('tts.page') : t('tts.block'));
};

const stop = () => {
  state.playing = false;
  speechSynthesis.cancel();
  clearHighlight();
  setButton(state.owner, false);
};

const speakNext = () => {
  const el = state.queue[state.index];
  if (!state.playing) return;
  if (!el) {
    stop();
    state.owner = null;
    state.index = 0;
    return;
  }
  clearHighlight();
  el.classList.add('tts-reading');
  el.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const lang = /** @type {'es' | 'en'} */ (getLang());
  const u = new SpeechSynthesisUtterance(el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? (lang === 'es' ? 'es-ES' : 'en-GB');
  u.rate = 1;
  u.onend = () => {
    if (!state.playing) return;
    state.index++;
    speakNext();
  };
  u.onerror = (e) => {
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    stop();
    snackbar(t('tts.error'));
  };
  speechSynthesis.speak(u);
};

/**
 * Reproduce o pausa la lectura de `root` controlada por `btn`.
 * @param {Element} root
 * @param {HTMLButtonElement} btn
 */
const toggle = async (root, btn) => {
  if (state.owner === btn && state.playing) {
    stop(); // pausa: recordamos state.index
    return;
  }
  if (state.owner !== btn) {
    stop();
    state.queue = fragments(root);
    state.index = 0;
    state.owner = btn;
  }
  if (!voices.length) await loadVoices();
  if (!pickVoice(/** @type {'es' | 'en'} */ (getLang()))) snackbar(t('tts.noVoice'));
  state.playing = true;
  setButton(btn, true);
  speakNext();
};

/** Añade o quita los controles de lectura según la preferencia. */
export const applyTts = () => {
  document.querySelectorAll('.tts-btn, .tts-fab').forEach((b) => b.remove());
  if (state.playing) stop();
  if (!window.pdPrefs.get().tts || !supported()) return;
  loadVoices();

  for (const block of document.querySelectorAll('[data-tts]')) {
    const btn = /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'icon-btn icon-btn-tonal interactive tts-btn', 'aria-pressed': 'false' }));
    setButton(btn, false);
    btn.addEventListener('click', () => toggle(block, btn));
    const header = block.querySelector('.card-header') ?? block;
    header.append(btn);
  }

  const main = document.getElementById('main');
  if (!main) return;
  const fab = /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'fab fab-extended interactive tts-fab', 'data-page': '1', 'aria-pressed': 'false' }));
  setButton(fab, false);
  fab.addEventListener('click', () => toggle(main, fab));
  document.body.append(fab);
};

// Al salir de la página, cortar la voz (si no, sigue hablando en algunos navegadores).
addEventListener('pagehide', () => supported() && speechSynthesis.cancel());
