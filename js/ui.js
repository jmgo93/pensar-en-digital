// @ts-check
/** Utilidades de interfaz: creación de nodos, iconos, ripple y snackbar. */

/**
 * @typedef {Record<string, string | number | boolean | null | undefined | EventListener>} Attrs
 */

/**
 * Crea un elemento. Atributos `on*` con función se registran como eventos; `false`/`null` se omiten.
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} tag
 * @param {Attrs} [attrs]
 * @param {...(Node | string | null | undefined | false)} children
 * @returns {HTMLElementTagNameMap[K]}
 */
export const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (typeof value === 'function') el.addEventListener(name.slice(2).toLowerCase(), value);
    else el.setAttribute(name, value === true ? '' : String(value));
  }
  for (const child of children) if (child) el.append(child);
  return el;
};

/**
 * Icono Material Symbols decorativo.
 * @param {string} name
 * @returns {HTMLSpanElement}
 */
export const icon = (name) => h('span', { class: 'icon', 'aria-hidden': 'true' }, name);

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Ripple en cualquier `.interactive` (delegado en el documento).
 * @param {PointerEvent} event
 */
const spawnRipple = (event) => {
  if (reducedMotion() || event.button !== 0) return;
  const target = /** @type {HTMLElement | null} */ (
    event.target instanceof Element ? event.target.closest('.interactive') : null
  );
  if (!target || target.matches(':disabled, [aria-disabled="true"]')) return;
  const rect = target.getBoundingClientRect();
  const size = Math.hypot(rect.width, rect.height) * 2;
  const ripple = h('span', { class: 'ripple', 'aria-hidden': 'true' });
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px`;
  target.append(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
};

export const initRipple = () => document.addEventListener('pointerdown', spawnRipple);

/** @type {HTMLElement | null} */
let snackHost = null;

/**
 * Muestra un snackbar (anunciado por lectores de pantalla mediante aria-live).
 * @param {string} message
 * @param {number} [ms]
 */
export const snackbar = (message, ms = 4000) => {
  snackHost ??= document.querySelector('.snackbar-host');
  if (!snackHost) return;
  snackHost.replaceChildren();
  const bar = h('div', { class: 'snackbar' }, message);
  snackHost.append(bar);
  setTimeout(() => {
    bar.classList.add('is-leaving');
    bar.addEventListener('animationend', () => bar.remove(), { once: true });
    if (reducedMotion()) bar.remove();
  }, ms);
};

/**
 * Abre un <dialog> modal y devuelve el foco al elemento que lo abrió al cerrarlo.
 * Cierra al pulsar en el fondo (backdrop).
 * @param {HTMLDialogElement} dialog
 * @param {HTMLElement | null} [opener]
 */
export const openModal = (dialog, opener = /** @type {HTMLElement | null} */ (document.activeElement)) => {
  if (dialog.open) return;
  dialog.showModal();
  const onClick = (/** @type {MouseEvent} */ e) => {
    if (e.target === dialog) dialog.close();
  };
  dialog.addEventListener('click', onClick);
  dialog.addEventListener(
    'close',
    () => {
      dialog.removeEventListener('click', onClick);
      opener?.focus();
    },
    { once: true },
  );
};
