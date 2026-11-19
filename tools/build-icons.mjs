// @ts-check
/**
 * Descarga un subset de Material Symbols Rounded (Apache 2.0) con solo los iconos de tools/icons.json
 * y lo guarda en assets/fonts/. Ejecutar a mano (`npm run icons`) al añadir iconos. El resultado se versiona.
 * Ejes fijados para reducir peso: opsz 24, wght 400, GRAD 0; FILL variable (0..1).
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** @type {string[]} */
const icons = JSON.parse(readFileSync(new URL('./icons.json', import.meta.url), 'utf8'));
const names = [...new Set(icons)].sort().join(',');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const cssUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${names}&display=block`;

const css = await (await fetch(cssUrl, { headers: { 'User-Agent': UA } })).text();
const fontUrl = css.match(/url\((https:[^)]+)\) format\('woff2'\)/)?.[1];
if (!fontUrl) throw new Error(`No se encontró woff2 en la respuesta:\n${css}`);
const buf = Buffer.from(await (await fetch(fontUrl)).arrayBuffer());
writeFileSync(new URL('../assets/fonts/material-symbols-rounded.woff2', import.meta.url), buf);
console.log(`${icons.length} iconos · ${(buf.length / 1024).toFixed(1)} KB`);
