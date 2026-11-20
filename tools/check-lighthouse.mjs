// @ts-check
/**
 * Lighthouse móvil sobre todas las rutas, con la MEDIANA de varias pasadas (el rendimiento simulado
 * varía según la carga del equipo). Objetivo del proyecto: ≥ 95 en las cuatro categorías.
 * Uso: node tools/check-lighthouse.mjs [urlBase] [pasadas] [ruta, p. ej. ia/]
 *   por defecto: https://jmgo93.github.io/pensar-en-digital/ y 3 pasadas. Necesita Chrome/Edge (CHROME_PATH).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [base = 'https://jmgo93.github.io/pensar-en-digital/', runsArg = '3', only = ''] = process.argv.slice(2);
const runs = Number(runsArg);
const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(
  (p) => p && existsSync(p),
);
if (!chrome) throw new Error('No se encontró Chrome/Edge. Define CHROME_PATH.');

/** @type {{ path: string }[]} */
const routes = JSON.parse(readFileSync(new URL('../content/routes.json', import.meta.url), 'utf8'));
const paths = [...routes.map((r) => r.path), 'presentacion/'].filter((p) => !only || p === only);
const dir = mkdtempSync(join(tmpdir(), 'lh-'));
const lhBin = new URL('../node_modules/lighthouse/cli/index.js', import.meta.url);

/** @param {number[]} xs */
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

let failing = 0;
for (const path of paths) {
  /** @type {Record<string, number[]>} */
  const scores = { performance: [], accessibility: [], 'best-practices': [], seo: [] };
  for (let i = 0; i < runs; i++) {
    const out = join(dir, `r${i}.json`);
    execFileSync(process.execPath, [lhBin.pathname.replace(/^\/([A-Za-z]:)/, '$1'), `${base}${path}`, '--quiet', '--only-categories=performance,accessibility,best-practices,seo', '--form-factor=mobile', '--chrome-flags=--headless=new', '--output=json', `--output-path=${out}`], {
      env: { ...process.env, CHROME_PATH: chrome },
      stdio: 'ignore',
    });
    const r = JSON.parse(readFileSync(out, 'utf8'));
    for (const k of Object.keys(scores)) scores[k]?.push(Math.round((r.categories[k]?.score ?? 0) * 100));
  }
  const med = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, median(v)]));
  const ok = Object.values(med).every((v) => v >= 95);
  if (!ok) failing++;
  console.log(`${ok ? '✓' : '✗'} /${path.padEnd(14)} rend. ${med.performance} · acc. ${med.accessibility} · b.p. ${med['best-practices']} · SEO ${med.seo}   (rend. por pasada: ${scores.performance?.join(', ')})`);
}
console.log(failing ? `\n${failing} ruta(s) por debajo de 95.` : '\nTodas las rutas ≥ 95.');
process.exitCode = failing ? 1 : 0;
