// @ts-check
/**
 * Genera los iconos PNG de la PWA en assets/icons/ con el glifo "lightbulb" de Material Symbols
 * y los colores de los tokens (primaryContainer / onPrimaryContainer):
 *  icon-192/512 (any), maskable-192/512 (zona segura 80 %), monochrome-512, apple-touch-icon (180),
 *  y accesos directos shortcut-*.png (96). Ejecutar a mano: `npm run app-icons`.
 */
import { readFileSync, existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const font = readFileSync(new URL('../assets/fonts/material-symbols-rounded.woff2', import.meta.url)).toString('base64');
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(
  (p) => p && existsSync(p),
);
if (!executablePath) throw new Error('No se encontró Chrome/Edge. Define CHROME_PATH.');

const BG = '#ef6c00';
const FG = '#4d1e00';

/**
 * @param {{ size: number, glyph: string, bg: string, fg: string, scale: number, radius: number }} o
 */
const html = (o) => `<!doctype html><html><head><style>
@font-face { font-family: MS; src: url(data:font/woff2;base64,${font}) format('woff2'); font-display: block; }
html, body { margin: 0; background: transparent; }
div { width: ${o.size}px; height: ${o.size}px; display: grid; place-items: center; background: ${o.bg}; border-radius: ${o.radius}%;
  font-family: MS; font-size: ${Math.round(o.size * o.scale)}px; color: ${o.fg}; font-feature-settings: 'liga'; font-variation-settings: 'FILL' 1; line-height: 1; }
</style></head><body><div>${o.glyph}</div></body></html>`;

/** @type {{ file: string, size: number, glyph?: string, bg?: string, fg?: string, scale: number, radius: number }[]} */
const ICONS = [
  { file: 'icon-192.png', size: 192, scale: 0.62, radius: 22 },
  { file: 'icon-512.png', size: 512, scale: 0.62, radius: 22 },
  { file: 'maskable-192.png', size: 192, scale: 0.46, radius: 0 },
  { file: 'maskable-512.png', size: 512, scale: 0.46, radius: 0 },
  { file: 'monochrome-512.png', size: 512, bg: 'transparent', fg: '#ffffff', scale: 0.62, radius: 0 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.55, radius: 0 },
  { file: 'shortcut-ia.png', size: 96, glyph: 'smart_toy', scale: 0.6, radius: 50 },
  { file: 'shortcut-plantilla.png', size: 96, glyph: 'psychology', scale: 0.6, radius: 50 },
  { file: 'shortcut-bibliografia.png', size: 96, glyph: 'library_books', scale: 0.6, radius: 50 },
];

const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  for (const ic of ICONS) {
    const page = await browser.newPage();
    await page.setViewport({ width: ic.size, height: ic.size, deviceScaleFactor: 1 });
    await page.setContent(html({ size: ic.size, glyph: ic.glyph ?? 'lightbulb', bg: ic.bg ?? BG, fg: ic.fg ?? FG, scale: ic.scale, radius: ic.radius }));
    await page.evaluate(() => document.fonts.ready);
    const path = /** @type {`${string}.png`} */ (new URL(`../assets/icons/${ic.file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
    await page.screenshot({ path, omitBackground: true, clip: { x: 0, y: 0, width: ic.size, height: ic.size } });
    await page.close();
  }
  console.log(`${ICONS.length} iconos generados en assets/icons/.`);
} finally {
  await browser.close();
}
