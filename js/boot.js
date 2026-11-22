// @ts-check
/**
 * Script clásico y bloqueante en <head>: aplica las preferencias guardadas ANTES del primer pintado
 * (tema, contraste, tamaño de letra, interlineado, idioma) para evitar parpadeos.
 * Expone `window.pdPrefs`; el resto de módulos lo usan a través de js/prefs.js.
 */
(() => {
  const KEY = 'pd-prefs';

  /** @type {import('./types').Prefs} */
  const DEFAULTS = {
    fontScale: 1,
    theme: 'system',
    highContrast: null,
    spacing: false,
    lang: 'es',
    tts: false,
    picto: false,
    stage: null,
    specialty: null,
    profileAsked: false,
  };

  let storageOk = true;

  /** @returns {import('./types').Prefs} */
  const read = () => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
      storageOk = false;
      return { ...DEFAULTS };
    }
  };

  /**
   * @param {import('./types').Prefs} prefs
   * @returns {boolean} si se pudo guardar
   */
  const write = (prefs) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
      return true;
    } catch {
      storageOk = false;
      return false;
    }
  };

  const mqDark = matchMedia('(prefers-color-scheme: dark)');
  const mqContrast = matchMedia('(prefers-contrast: more)');

  /**
   * @param {import('./types').Prefs} prefs
   * @returns {import('./types').SchemeId}
   */
  const resolveScheme = (prefs) => {
    const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && mqDark.matches);
    const hc = prefs.highContrast ?? mqContrast.matches;
    return /** @type {import('./types').SchemeId} */ (`${dark ? 'dark' : 'light'}${hc ? '-hc' : ''}`);
  };

  /** @param {import('./types').Prefs} prefs */
  const apply = (prefs) => {
    const root = document.documentElement;
    root.dataset.scheme = resolveScheme(prefs);
    const scale = Math.min(2, Math.max(1, prefs.fontScale));
    root.style.setProperty('--pd-font-scale', String(scale));
    // Texto grande: el shell compacta su cromo en pantallas estrechas (css/a11y.css).
    if (scale >= 1.5) root.dataset.large = '';
    else delete root.dataset.large;
    if (prefs.picto) root.dataset.picto = '';
    else delete root.dataset.picto;
    if (prefs.spacing) root.dataset.spacing = 'wide';
    else delete root.dataset.spacing;
    root.lang = prefs.lang;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const surface = getComputedStyle(root).getPropertyValue('--md-sys-color-surface').trim();
      if (surface) meta.setAttribute('content', surface);
    }
  };

  let current = read();
  apply(current);
  // Perfil de ponente (js/speaker.js): oculta o muestra lo relativo a la presentación sin parpadeo.
  try {
    if (localStorage.getItem('pd-ponente') === '1') document.documentElement.dataset.role = 'ponente';
  } catch {
    /* sin almacenamiento */
  }

  const reapply = () => apply(current);
  mqDark.addEventListener('change', reapply);
  mqContrast.addEventListener('change', reapply);

  window.pdPrefs = {
    DEFAULTS,
    get: () => ({ ...current }),
    /** @param {Partial<import('./types').Prefs>} patch */
    set: (patch) => {
      current = { ...current, ...patch };
      apply(current);
      return write(current);
    },
    reset: () => {
      // Restablecer accesibilidad no borra el perfil.
      current = { ...DEFAULTS, stage: current.stage, specialty: current.specialty, profileAsked: current.profileAsked };
      apply(current);
      return write(current);
    },
    storageOk: () => storageOk,
    resolveScheme,
  };
})();
