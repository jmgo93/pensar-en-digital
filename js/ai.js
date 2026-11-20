// @ts-check
/**
 * Copiar, compartir y "Abrir en IA". Comprobado el 20/11/2026 (ver docs/pruebas-prompts.md):
 * - ChatGPT: chatgpt.com/?q= precarga el prompt (incluso sin sesión).
 * - Claude: claude.ai/new?q= conserva el parámetro tras iniciar sesión; la precarga la verifica el usuario.
 * - Gemini: no admite prompt precargado → se copia y se abre gemini.google.com con aviso.
 * En los tres casos el prompt se copia antes al portapapeles, por si el servicio cambia.
 */
import { snackbar } from './ui.js';
import { t } from './i18n.js';

/** @typedef {{ id: 'gemini' | 'chatgpt' | 'claude', label: string, url: (prompt: string) => string, prefill: boolean }} AiService */

/** @type {AiService[]} */
export const AI_SERVICES = [
  { id: 'gemini', label: 'Gemini', url: () => 'https://gemini.google.com/app', prefill: false },
  { id: 'chatgpt', label: 'ChatGPT', url: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}`, prefill: true },
  { id: 'claude', label: 'Claude', url: (p) => `https://claude.ai/new?q=${encodeURIComponent(p)}`, prefill: true },
];

/**
 * Copia texto al portapapeles (Clipboard API con alternativa para navegadores antiguos).
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;opacity:0;inset:0 auto auto 0';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
};

/**
 * Copia y avisa.
 * @param {string} text
 */
export const copyWithFeedback = async (text) => {
  snackbar((await copyText(text)) ? t('ai.copied') : t('ai.copyFailed'));
};

/**
 * Abre el prompt en un servicio de IA. La ventana se abre de forma síncrona (dentro del gesto del usuario)
 * para que Safari no la bloquee; la copia se lanza a la vez.
 * @param {AiService} service
 * @param {string} prompt
 */
export const openInAI = async (service, prompt) => {
  const copying = copyText(prompt);
  window.open(service.url(prompt), '_blank', 'noopener');
  const copied = await copying;
  if (!service.prefill) snackbar(copied ? t('ai.pasteIn', { service: service.label }) : t('ai.copyFailed'));
  else snackbar(copied ? t('ai.openedIn', { service: service.label }) : t('ai.opened', { service: service.label }));
};

/**
 * Comparte con Web Share API; si no existe, copia el enlace.
 * @param {{ title: string, text: string, url: string }} data
 */
export const share = async (data) => {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }
  snackbar((await copyText(data.url)) ? t('ai.linkCopied') : t('ai.copyFailed'));
};
