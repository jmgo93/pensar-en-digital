// @ts-check
/**
 * Comprueba que responden los enlaces externos del contenido: bibliografía, site.json y enlaces
 * [texto](url) dentro de content/*.json. Algunos sitios bloquean a los robots (403/429): se
 * marcan como "aviso" para revisarlos a mano, no como error.
 * Uso: `npm run check:links`.
 */
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../content/', import.meta.url);
/** @type {Set<string>} */
const urls = new Set();
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json') && x !== 'search-index.json')) {
  const text = readFileSync(new URL(f, dir), 'utf8');
  for (const m of text.matchAll(/https?:\/\/[^\s"')\]]+/g)) urls.add(m[0].replace(/[.,]$/, ''));
}
// Plantillas de API (llevan {}) y URL de servicios de IA (se prueban a mano) no se comprueban aquí.
const skip = [/\{/, /chatgpt\.com|claude\.ai|gemini\.google\.com/];
const list = [...urls].filter((u) => !skip.some((re) => re.test(u))).sort();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
let errors = 0;
let warnings = 0;
await Promise.all(
  list.map(async (url) => {
    let status = 0;
    // doi.org bloquea a los robots (403): los DOI se comprueban con su API oficial de handles.
    const doi = /^https:\/\/doi\.org\/(.+)$/.exec(url)?.[1];
    if (doi) {
      try {
        const r = await fetch(`https://doi.org/api/handles/${doi}`, { signal: AbortSignal.timeout(30000) });
        const j = r.ok ? await r.json() : null;
        if (j?.responseCode === 1) return;
      } catch {
        /* se informa abajo */
      }
      errors++;
      console.log(`ERROR DOI no resuelto ${url}`);
      return;
    }
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' }, signal: AbortSignal.timeout(30000) });
      status = res.status;
      await res.body?.cancel();
    } catch {
      status = 0;
    }
    if (status >= 200 && status < 400) return;
    if ([401, 403, 429, 202].includes(status)) {
      warnings++;
      console.log(`AVISO ${status} ${url}`);
    } else {
      errors++;
      console.log(`ERROR ${status || 'sin respuesta'} ${url}`);
    }
  }),
);
console.log(`${list.length} enlaces · ${errors} errores · ${warnings} avisos (revisar a mano).`);
process.exitCode = errors ? 1 : 0;
