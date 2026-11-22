// @ts-check
/**
 * Descarga y aloja en local los pictogramas de ARASAAC que usa content/picto-map.json:
 * assets/picto/{id}.webp (240 px). Así el modo pictográfico no depende de static.arasaac.org
 * (el 22/11/2026 servía un certificado incompleto y los navegadores rechazaban imágenes nuevas)
 * y funciona sin conexión una vez visto.
 * Origen de la imagen: API oficial https://api.arasaac.org/v1/pictograms/{id} (PNG 500 px).
 * Conversión a WebP con Chrome/Edge (puppeteer-core), sin dependencias nuevas.
 * Pictogramas: Sergio Palao. Propiedad: Gobierno de Aragón. Origen: ARASAAC. Licencia CC BY-NC-SA 4.0.
 * Ejecutar a mano tras `npm run picto`: `npm run picto-img`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const SIZE = 240;
const map = JSON.parse(readFileSync(new URL('../content/picto-map.json', import.meta.url), 'utf8'));
const ids = [...new Set([...Object.values(map.es), ...Object.values(map.en)].filter(Boolean))].map(Number).sort((a, b) => a - b);
const out = new URL('../assets/picto/', import.meta.url);
mkdirSync(out, { recursive: true });

const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(
  (p) => p && existsSync(p),
);
if (!executablePath) throw new Error('No se encontró Chrome/Edge. Define CHROME_PATH.');
const browser = await puppeteer.launch({ executablePath, headless: true });
const page = await browser.newPage();

let done = 0;
try {
  for (const id of ids) {
    const file = new URL(`${id}.webp`, out);
    if (existsSync(file)) continue;
    const res = await fetch(`https://api.arasaac.org/v1/pictograms/${id}`);
    if (!res.ok) throw new Error(`Pictograma ${id}: HTTP ${res.status}`);
    const png = Buffer.from(await res.arrayBuffer()).toString('base64');
    /** @type {string} */
    const webp = await page.evaluate(
      async (/** @type {string} */ b64, /** @type {number} */ size) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        return c.toDataURL('image/webp', 0.82).split(',')[1] ?? '';
      },
      png,
      SIZE,
    );
    writeFileSync(file, Buffer.from(webp, 'base64'));
    done++;
  }
} finally {
  await browser.close();
}

// Quitar los que ya no se usan.
const keep = new Set(ids.map((id) => `${id}.webp`));
let removed = 0;
for (const f of readdirSync(out)) {
  if (!keep.has(f)) {
    unlinkSync(new URL(f, out));
    removed++;
  }
}
console.log(`assets/picto: ${ids.length} pictogramas (${done} nuevos, ${removed} retirados).`);
