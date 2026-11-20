// @ts-check
/**
 * Resultados de votación en directo: consulta la aplicación web de Apps Script (tools/apps-script/votaciones.gs)
 * cada pocos segundos. Usa fetch y, si el navegador bloquea CORS, JSONP. Modo demo sin conexión para ensayar.
 */

/**
 * @typedef {{ v: string, options: string[], counts: number[], total: number, accepting?: boolean, updated?: string, error?: string }} VoteResult
 */

let jsonpSeq = 0;

/**
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<VoteResult>}
 */
const jsonp = (url, timeoutMs) =>
  new Promise((resolve, reject) => {
    const name = `pdVote${++jsonpSeq}`;
    const script = document.createElement('script');
    const w = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (window));
    const cleanup = () => {
      delete w[name];
      script.remove();
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo de espera agotado'));
    }, timeoutMs);
    w[name] = (/** @type {VoteResult} */ data) => {
      cleanup();
      resolve(data);
    };
    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${name}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Error de red'));
    };
    document.head.append(script);
  });

/** @type {'fetch' | 'jsonp'} */
let transport = 'fetch';

/**
 * @param {string} endpoint URL /exec de la aplicación web
 * @param {string} id p. ej. "v1"
 * @returns {Promise<VoteResult>}
 */
export const fetchResults = async (endpoint, id) => {
  const url = `${endpoint}?v=${encodeURIComponent(id)}`;
  if (transport === 'fetch') {
    try {
      const res = await fetch(url, { cache: 'no-store', redirect: 'follow' });
      if (!res.ok) throw new Error(String(res.status));
      return /** @type {VoteResult} */ (await res.json());
    } catch {
      transport = 'jsonp'; // CORS u otro bloqueo: probar JSONP a partir de ahora
    }
  }
  return jsonp(url, 10000);
};

/**
 * Generador de datos ficticios para ensayar sin formulario ni conexión.
 * @param {string} id
 * @param {string[]} options
 * @returns {() => VoteResult}
 */
export const demoSource = (id, options) => {
  const counts = options.map(() => 0);
  const weights = options.map((_, i) => options.length - i + Math.random() * 2);
  return () => {
    const arrivals = Math.floor(Math.random() * 6);
    for (let k = 0; k < arrivals; k++) {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      const i = weights.findIndex((wt) => (r -= wt) <= 0);
      counts[i < 0 ? 0 : i] = (counts[i < 0 ? 0 : i] ?? 0) + 1;
    }
    return { v: id, options, counts: [...counts], total: counts.reduce((a, b) => a + b, 0) };
  };
};

/**
 * Consulta periódica. Se pausa con la pestaña oculta. Devuelve una función para parar.
 * @param {() => Promise<VoteResult>} source
 * @param {(r: VoteResult) => void} onData
 * @param {(e: unknown) => void} onError
 * @param {number} [intervalMs]
 * @returns {() => void}
 */
export const poll = (source, onData, onError, intervalMs = 4000) => {
  let stopped = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  const tick = async () => {
    if (stopped) return;
    if (!document.hidden) {
      try {
        const r = await source();
        if (r.error) throw new Error(r.error);
        if (!stopped) onData(r);
      } catch (e) {
        if (!stopped) onError(e);
      }
    }
    if (!stopped) timer = setTimeout(tick, intervalMs);
  };
  tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
};
