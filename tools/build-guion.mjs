// @ts-check
/**
 * Genera docs/guion.md (guion con tiempos y notas del ponente) desde content/presentacion.json
 * y comprueba la regla de auditorio: como mucho 20 palabras visibles por diapositiva.
 * Ejecutar a mano: `npm run guion`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** @param {string} p */
const read = (p) => JSON.parse(readFileSync(new URL(`../content/${p}.json`, import.meta.url), 'utf8'));
const deck = read('presentacion');
/** @type {Record<string, any>} */
const votes = Object.fromEntries(read('votaciones').map((/** @type {any} */ v) => [v.id, v]));
/** @type {Record<string, any>} */
const sources = Object.fromEntries(read('fuentes').items.map((/** @type {any} */ s) => [s.id, s]));
const site = read('site');

/** Texto visible de una diapositiva en un idioma. */
const visible = (/** @type {any} */ s, /** @type {'es' | 'en'} */ l) => {
  /** @type {string[]} */
  const parts = [];
  /** @param {any} x */
  const add = (x) => x && parts.push(x[l]);
  add(s.title);
  add(s.text);
  add(s.small);
  add(s.from);
  add(s.to);
  add(s.good);
  add(s.bad);
  add(s.before);
  add(s.after);
  for (const it of s.items ?? []) add(it.text ?? it);
  for (const it of s.items ?? []) add(it.label);
  for (const st of s.steps ?? []) add(st);
  for (const tg of s.targets ?? []) add(tg.label);
  if (s.type === 'vote') add(votes[s.vote].question);
  if (s.type === 'title') return []; // la portada lleva el título oficial completo
  return parts.filter(Boolean);
};

const count = (/** @type {string[]} */ parts) => parts.join(' ').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

/** @type {string[]} */
const problems = [];
const mmss = (/** @type {number} */ m) => `${String(Math.floor(m)).padStart(2, '0')}:${String(Math.round((m % 1) * 60)).padStart(2, '0')}`;

let md = `# Guion · Competencia Digital Docente como medio para generar conocimiento en el alumnado

GENERADO por \`tools/build-guion.mjs\` desde \`content/presentacion.json\`. Para cambiar textos o notas, edita el JSON y regenera.

- Duración: 45 minutos · ${deck.slides.length} diapositivas.
- Presentación: ${site.url}presentacion/ · Notas del ponente: ${site.url}presentacion/?notas
- Teclas: → / Av Pág / espacio (siguiente) · ← / Re Pág (anterior) · Inicio/Fin · B o . (pantalla negra) · F (pantalla completa) · N (abrir notas) · T (reiniciar cronómetro) · número + Intro (ir a esa diapositiva).
- Votaciones: v1–v4 (ver \`docs/votaciones.md\`). Sin conexión, la diapositiva propone votar a mano alzada.
`;

for (const b of deck.blocks) {
  md += `\n## ${b.from}–${b.to} min · ${b.title.es}\n`;
  for (const [i, s] of deck.slides.entries()) {
    if (s.block !== b.id) continue;
    const words = count(visible(s, 'es'));
    const wordsEn = count(visible(s, 'en'));
    if (words > 20) problems.push(`${s.id}: ${words} palabras (es)`);
    if (wordsEn > 20) problems.push(`${s.id}: ${wordsEn} palabras (en)`);
    const head = s.type === 'vote' ? `Votación ${s.vote}: ${votes[s.vote].question.es}` : (s.title ?? s.text ?? { es: s.number }).es ?? s.number;
    md += `\n### ${i + 1}. [${mmss(s.at)}] ${head}\n\n`;
    if (s.type !== 'title' && s.type !== 'vote') md += `> ${visible(s, 'es').join(' · ')}\n\n`;
    md += `${s.notes}\n`;
    if (s.cite) md += `\n_Fuente: ${sources[s.cite]?.cite ?? s.cite}_\n`;
  }
}

writeFileSync(new URL('../docs/guion.md', import.meta.url), md);
console.log(`docs/guion.md: ${deck.slides.length} diapositivas.`);
if (problems.length) {
  console.log(`Diapositivas con más de 20 palabras:\n  ${problems.join('\n  ')}`);
  process.exitCode = 1;
}
