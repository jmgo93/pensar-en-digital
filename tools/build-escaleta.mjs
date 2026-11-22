// @ts-check
/**
 * Genera docs/escaleta.md (escaleta del ponente: tiempos, idea fuerza, transiciones y notas completas)
 * desde content/presentacion.json y comprueba la regla de auditorio: como mucho 20 palabras visibles
 * por diapositiva. La versión en PDF la genera `npm run docs:pdf` (docs/escaleta.pdf).
 * Ejecutar a mano: `npm run escaleta` (lo hace `npm run build:all`).
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
/** @param {any} s */
const head = (s) => (s.type === 'vote' ? `Votación ${s.vote}: ${votes[s.vote].question.es}` : s.type === 'big' ? `${s.number} · ${s.text.es}` : (s.title ?? s.text)?.es ?? '');
/** @param {string} s */
const cell = (s) => s.replace(/\|/g, '\\|');
const REQUIRED = ['key', 'notes', 'do', 'bridge', 'cut'];

let md = `# Escaleta · Competencia Digital Docente como medio para generar conocimiento en el alumnado

GENERADO por \`tools/build-escaleta.mjs\` desde \`content/presentacion.json\`. Para cambiar textos o notas, edita el JSON y regenera. Versión para imprimir: \`docs/escaleta.pdf\` (\`npm run docs:pdf\`).

- Duración: 45 minutos · ${deck.slides.length} diapositivas · ${deck.blocks.length} actos.
- Presentación: ${site.url}presentacion/ · Notas del ponente en directo: ${site.url}presentacion/?notas (o tecla N).
- Teclas: → / Av Pág / espacio (siguiente) · ← / Re Pág (anterior) · Inicio/Fin · B o . (pantalla negra) · F (pantalla completa) · N (abrir notas) · T (reiniciar cronómetro) · número + Intro (ir a esa diapositiva).
- Votaciones: v1–v4 (ver \`docs/votaciones.md\`). Sin conexión, la diapositiva propone votar a mano alzada.
- Hilo conductor: *¿Qué tiene que pensar el alumno ahora que antes no pensaba?*

## Escaleta en una página

| Min | Nº | Diapositiva | Idea fuerza | Transición |
|---|---|---|---|---|
`;

for (const b of deck.blocks) {
  md += `| **${b.from}–${b.to}** | | **${cell(b.title.es)}** | | |\n`;
  for (const [i, s] of deck.slides.entries()) {
    if (s.block !== b.id) continue;
    md += `| ${mmss(s.at)} | ${i + 1} | ${cell(head(s))} | ${cell(s.key ?? '')} | ${cell(s.bridge ?? '')} |\n`;
  }
}

md += `\n## Notas del ponente\n`;

for (const b of deck.blocks) {
  md += `\n### ${b.from}–${b.to} min · ${b.title.es}\n`;
  for (const [i, s] of deck.slides.entries()) {
    if (s.block !== b.id) continue;
    const words = count(visible(s, 'es'));
    const wordsEn = count(visible(s, 'en'));
    if (words > 20) problems.push(`${s.id}: ${words} palabras (es)`);
    if (wordsEn > 20) problems.push(`${s.id}: ${wordsEn} palabras (en)`);
    for (const k of REQUIRED) if (!s[k] && !(k === 'bridge' && i === deck.slides.length - 1)) problems.push(`${s.id}: falta «${k}» en las notas`);
    md += `\n#### ${i + 1}. [${mmss(s.at)}] ${head(s)}\n\n`;
    if (s.type !== 'title' && s.type !== 'vote') md += `> En pantalla: ${visible(s, 'es').join(' · ')}\n\n`;
    if (s.key) md += `**Idea fuerza:** ${s.key}\n\n`;
    md += `${s.notes}\n\n`;
    if (s.do) md += `- **Haz:** ${s.do}\n`;
    if (s.data) md += `- **Dato y fuente:** ${s.data}\n`;
    if (s.bridge) md += `- **Transición:** *${s.bridge}*\n`;
    if (s.cut) md += `- **Si vas tarde:** ${s.cut}\n`;
    if (s.cite) md += `- **Cita en pantalla:** ${sources[s.cite]?.cite ?? s.cite}\n`;
  }
}

writeFileSync(new URL('../docs/escaleta.md', import.meta.url), md);
console.log(`docs/escaleta.md: ${deck.slides.length} diapositivas.`);
if (problems.length) {
  console.log(`Problemas:\n  ${problems.join('\n  ')}`);
  process.exitCode = 1;
}
