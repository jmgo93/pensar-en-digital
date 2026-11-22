// @ts-check
/**
 * Genera content/search-index.json a partir de content/*.json (es y en).
 * Ejecutar a mano tras cambiar el contenido: `npm run search`. El resultado se versiona.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

/** @param {string} name */
const read = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
/** @param {string} name */
const readOpt = (name) => (existsSync(new URL(`../content/${name}.json`, import.meta.url)) ? read(name) : null);

/** @param {string} s */
const plain = (s) =>
  s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\s?\[@[\w-]+\]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

/** @typedef {{ u: string, s: string, t: string, x: string }} Entry */
/** @type {Record<'es' | 'en', Entry[]>} */
const index = { es: [], en: [] };

/**
 * @param {string} url relativa a la raíz
 * @param {string} section id de ruta
 * @param {Record<string, string>} title
 * @param {Record<string, string | string[] | undefined>[]} texts
 */
const add = (url, section, title, ...texts) => {
  for (const lang of /** @type {const} */ (['es', 'en'])) {
    const x = texts
      .map((tx) => tx[lang])
      .flat()
      .filter(Boolean)
      .map((v) => plain(String(v)))
      .join(' ');
    index[lang].push({ u: url, s: section, t: plain(title[lang] ?? ''), x });
  }
};

const ui = read('ui');
/** @type {{ id: string, path: string }[]} */
const routes = read('routes');
/** @param {string} id */
const routeTitle = (id) => ({ es: ui.es[`route.${id}`], en: ui.en[`route.${id}`] });
for (const r of routes) if (r.id !== 'buscar' && !(/** @type {any} */ (r).speaker)) add(r.path, r.id, routeTitle(r.id), {});

const inicio = read('inicio');
add('#tesis', 'inicio', inicio.thesis.title, inicio.thesis.body);
add('#puente', 'inicio', inicio.bridge.title, inicio.bridge.body);

const ponencia = read('ponencia');
for (const b of ponencia.blocks) add(`ponencia/#${b.id}`, 'ponencia', b.title, b.summary);

const claves = read('claves');
for (const e of claves.evidence.items) add(`claves/#${e.id}`, 'claves', e.figure, e.text);
for (const l of claves.threshold.lenses) add(`claves/#${l.id}`, 'claves', l.title, l.body);
for (const k of claves.keys)
  add(`claves/#${k.id}`, 'claves', { es: `${k.n}. ${k.title.es}`, en: `${k.n}. ${k.title.en}` }, k.anchor, k.mechanism, k.antipattern, k.check, ...Object.values(k.examples));
add('claves/#marcos', 'claves', claves.frameworks.title, claves.frameworks.body);

const recursos = read('recursos');
for (const f of recursos.files) add(`recursos/#${f.id}`, 'recursos', f.title, f.body);

const marco = read('marco');
for (const a of marco.areas) {
  const comps = { es: a.competences.map((/** @type {any} */ k) => `${k.code} ${k.es}`), en: a.competences.map((/** @type {any} */ k) => `${k.code} ${k.en}`) };
  add(`marco/#${a.id}`, 'marco', { es: `Área ${a.number}. ${a.title.es}`, en: `Area ${a.number}. ${a.title.en}` }, a.plain, comps, ...Object.values(a.examples));
}
add('marco/#andalucia', 'marco', marco.andalucia.title, marco.andalucia.body);
add('marco/#niveles', 'marco', marco.levels.title, ...marco.levels.stages.flatMap((/** @type {any} */ s) => [s.title, ...s.levels]));

const inclusiva = read('inclusiva');
for (const b of inclusiva.bridge) add(`inclusiva/#${b.id}`, 'inclusiva', { es: `${b.from.es} → ${b.to.es}`, en: `${b.from.en} → ${b.to.en}` }, b.multiplies, b.destroys);
for (const x of inclusiva.beforeAfter) add('inclusiva/', 'inclusiva', { es: `Antes y después · ${x.stage}`, en: `Before and after · ${x.stage}` }, x.before, x.after);

const lunes = read('lunes');
for (const c of lunes.challenges) add(`lunes/#${c.id}`, 'lunes', c.title, c.body);

const fuentes = read('fuentes');
for (const f of fuentes.items) add(`bibliografia/#${f.id}`, 'bibliografia', { es: f.cite, en: f.cite }, { es: f.apa, en: f.apa });

// Fase 3: prompts y plantilla (si existen).
const prompts = readOpt('prompts');
if (prompts) for (const p of prompts.cards) add(`ia/#${p.id}`, 'ia', p.title, p.goal, p.prompt);
const plantilla = readOpt('plantilla');
if (plantilla) for (const d of plantilla.dimensions) add(`plantilla/`, 'plantilla', d.title, d.question);

writeFileSync(new URL('../content/search-index.json', import.meta.url), JSON.stringify(index));
console.log(`Índice: ${index.es.length} entradas por idioma.`);
