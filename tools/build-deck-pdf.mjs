// @ts-check
/**
 * Plan B sin conexión: genera docs/presentacion-es.pdf (y -en con `--en`) con una página por diapositiva,
 * capturada con todo ya en pantalla (movimiento reducido, sin controles ni cuenta atrás).
 * Simula estar sin conexión para que las votaciones muestren «votamos a mano alzada».
 * Sirve la web con un servidor estático propio (no necesita el del puerto 8765) y usa Chrome o Edge.
 * Ejecutar a mano: `npm run deck:pdf` cuando cambie la presentación.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = '/pensar-en-digital/';
const LANGS = process.argv.includes('--en') ? ['es', 'en'] : ['es'];
/** @type {Record<string, string>} */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf' };

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  if (!path.startsWith(BASE)) return void res.writeHead(404).end();
  let file = normalize(join(ROOT, path.slice(BASE.length)));
  if (!file.startsWith(normalize(ROOT))) return void res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', () => r(undefined)));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const origin = `http://127.0.0.1:${port}${BASE}`;

const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && existsSync(p));
if (!executablePath) throw new Error('No se encontró Chrome/Edge. Define CHROME_PATH.');
const browser = await puppeteer.launch({ executablePath, headless: true });

const HIDE = '.slide-controls, .rotate-hint, #help, .s-countdown, .toast { display: none !important; }';
/** @param {number} ms */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const lang of LANGS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  // Sin conexión con el exterior: solo se sirve la web local.
  await page.setRequestInterception(true);
  page.on('request', (r) => (r.url().startsWith(origin) ? r.continue() : r.abort()));
  await page.goto(`${origin}presentacion/`, { waitUntil: 'networkidle0' });
  await page.evaluate((l) => {
    localStorage.setItem('pd-ponente', '1');
    localStorage.setItem('pd-prefs', JSON.stringify({ lang: l, profileAsked: true }));
  }, lang);
  // Solo cambia el hash: hay que recargar para que la página lea el rol y el idioma.
  await page.goto(`${origin}presentacion/#/1`, { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.deck .slide.is-current', { timeout: 20000 });
  await page.addStyleTag({ content: HIDE });
  await page.evaluate(() => document.fonts.ready);
  const total = await page.evaluate(() => document.querySelectorAll('.deck .slide').length);
  /** @type {string[]} */
  const shots = [];
  for (let i = 0; i < total; i++) {
    if (i > 0) await page.keyboard.press('ArrowRight');
    // Deja que terminen la carga de imágenes, el ajuste de tamaño y el aviso de «sin conexión».
    await wait(900);
    await page.evaluate(() => Promise.all([...document.querySelectorAll('.slide.is-current img')].map((img) => /** @type {HTMLImageElement} */ (img).decode().catch(() => undefined))));
    const png = /** @type {string} */ (await page.screenshot({ type: 'png', encoding: 'base64' }));
    shots.push(png);
    process.stdout.write(`\r${lang}: ${i + 1}/${total}`);
  }
  await page.close();

  const doc = await browser.newPage();
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:1920px 1080px;margin:0}html,body{margin:0}img{display:block;width:1920px;height:1080px;break-after:page}</style></head><body>${shots.map((s) => `<img src="data:image/png;base64,${s}">`).join('')}</body></html>`;
  await doc.setContent(html, { waitUntil: 'load' });
  const out = fileURLToPath(new URL(`../docs/presentacion-${lang}.pdf`, import.meta.url));
  await doc.pdf({ path: out, width: '1920px', height: '1080px', printBackground: true, pageRanges: `1-${total}` });
  await doc.close();
  console.log(`\nPDF: ${out} (${total} páginas)`);
}
await browser.close();
server.close();
