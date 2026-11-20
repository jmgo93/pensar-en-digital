// @ts-check
/**
 * Comprobación local de la interfaz con un Chromium instalado (Chrome o Edge) vía puppeteer-core:
 * - axe-core (WCAG 2.2 A/AA) en cada ruta y en los 4 esquemas de color,
 * - sin scroll horizontal de 320 a 1440 px, también con letra al 200 % e interlineado amplio,
 * - sin errores de consola ni peticiones fallidas,
 * - capturas opcionales.
 *
 * Uso: node tools/check-ui.mjs <urlBase> [carpetaCapturas]
 *   urlBase: p. ej. http://127.0.0.1:8765/pensar-en-digital/ (sirviendo la carpeta padre, como en Pages)
 *   CHROME_PATH: ruta al navegador si no se detecta.
 */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const [base = 'http://127.0.0.1:8765/pensar-en-digital/', shotsDir] = process.argv.slice(2);
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = /** @type {string} */ (CANDIDATES.find((p) => p && existsSync(p)));
if (!executablePath) throw new Error('No se encontró Chrome/Edge. Define CHROME_PATH.');

/** @type {{ id: string, path: string }[]} */
const routes = JSON.parse(readFileSync(new URL('../content/routes.json', import.meta.url), 'utf8'));

const VIEWPORTS = [
  { name: 'movil', width: 360, height: 780 },
  { name: 'movil320', width: 320, height: 640 },
  { name: 'tablet', width: 800, height: 1100 },
  { name: 'escritorio', width: 1440, height: 900 },
];

/** @type {{ name: string, prefs: Record<string, unknown> }[]} */
const VARIANTS = [
  { name: 'claro', prefs: { theme: 'light' } },
  { name: 'oscuro', prefs: { theme: 'dark' } },
  { name: 'claro-ac', prefs: { theme: 'light', highContrast: true } },
  { name: 'oscuro-ac', prefs: { theme: 'dark', highContrast: true } },
  { name: 'letra200', prefs: { theme: 'light', fontScale: 2 } },
  { name: 'letra200-interlineado', prefs: { theme: 'dark', fontScale: 2, spacing: true } },
  { name: 'ingles', prefs: { theme: 'light', lang: 'en' } },
];

const browser = await puppeteer.launch({ executablePath, headless: true });
let problems = 0;

/** @param {string} msg */
const fail = (msg) => {
  problems++;
  console.log(`  ✗ ${msg}`);
};

try {
  for (const route of routes) {
    console.log(`· ${route.id}`);
    for (const variant of VARIANTS) {
      for (const vp of VIEWPORTS) {
        // Las variantes de color se comprueban en un tamaño; la de letra 200 % en todos.
        if (!variant.name.startsWith('letra') && vp.name !== 'movil' && !(variant.name === 'claro')) continue;
        const page = await browser.newPage();
        /** @type {string[]} */
        const errors = [];
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('requestfailed', (r) => errors.push(`fallo de red: ${r.url()}`));
        page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
        await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
        await page.evaluateOnNewDocument((p) => {
          localStorage.setItem('pd-prefs', JSON.stringify({ profileAsked: true, ...p }));
        }, variant.prefs);
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await page.goto(new URL(route.path, base).href, { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => !document.querySelector('#view[aria-busy], [data-pending]'), { timeout: 15000 }).then(() => new Promise((r) => setTimeout(r, 400))).catch(() => errors.push('#view sigue en aria-busy'));

        const tag = `${variant.name} @ ${vp.name}`;
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 0) fail(`${tag}: scroll horizontal de ${overflow}px`);
        for (const e of errors) fail(`${tag}: ${e}`);

        if (vp.name === 'movil' || vp.name === 'escritorio') {
          await page.evaluate(axeSource);
          const result = /** @type {{ violations: { id: string, impact: string, nodes: { target: string[] }[] }[] }} */ (
            await page.evaluate(() =>
              // @ts-expect-error axe se inyecta en la página
              window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }),
            )
          );
          for (const v of result.violations) fail(`${tag}: axe ${v.id} (${v.impact}) → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
        }

        if (shotsDir && ['inicio', 'marco', 'inclusiva', 'bibliografia'].includes(route.id) && vp.name !== 'movil320') {
          await page.screenshot({ path: `${shotsDir}/${route.id}-${variant.name}-${vp.name}.png`, fullPage: false });
        }
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

console.log(problems ? `\n${problems} problema(s).` : '\nSin problemas.');
process.exitCode = problems ? 1 : 0;
