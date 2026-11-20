// @ts-check
/**
 * Genera los QR en SVG (assets/qr/) para cada sección, la presentación y, si ya existen,
 * los formularios de votación (formUrl en content/votaciones.json). Ejecutar a mano: `npm run qr`.
 * Dependencia de desarrollo: qrcode (versión fija); el resultado se versiona, sin librería en producción.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import QRCode from 'qrcode';

/** @param {string} p */
const read = (p) => JSON.parse(readFileSync(new URL(`../content/${p}.json`, import.meta.url), 'utf8'));
const site = read('site');
/** @type {{ id: string, path: string }[]} */
const routes = read('routes');
/** @type {{ id: string, formUrl: string }[]} */
const votes = read('votaciones');

const out = new URL('../assets/qr/', import.meta.url);
mkdirSync(out, { recursive: true });

/** @type {[string, string][]} */
const targets = [
  ...routes.map((r) => /** @type {[string, string]} */ ([r.id, `${site.url}${r.path}`])),
  ['presentacion', `${site.url}presentacion/`],
  ...votes.filter((v) => v.formUrl).map((v) => /** @type {[string, string]} */ ([v.id, v.formUrl])),
];

for (const [name, url] of targets) {
  const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#251912', light: '#ffffff' } });
  writeFileSync(new URL(`${name}.svg`, out), svg.replace('<svg ', `<svg role="img" aria-label="QR: ${url}" `));
}
writeFileSync(new URL('index.json', out), JSON.stringify(Object.fromEntries(targets), null, 2));
console.log(`${targets.length} QR generados en assets/qr/.`);
