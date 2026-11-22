// @ts-check
/**
 * Genera la documentación descargable a partir de content/ (única fuente de verdad):
 *   assets/descargas/guia-analisis-tareas-{es,en}.md   · guía para analizar tareas (texto editable)
 *   assets/descargas/cuaderno-prompts-{es,en}.md       · cuaderno de prompts (texto para copiar)
 * Con `--pdf` (necesita Chrome/Edge vía puppeteer-core) genera además:
 *   assets/descargas/guia-analisis-tareas-{es,en}.pdf, cuaderno-prompts-{es,en}.pdf, siete-claves-{es,en}.pdf
 *   docs/escaleta.pdf (escaleta del ponente, solo en español)
 * Uso: `npm run docs` (solo .md, lo ejecuta build:all) · `npm run docs:pdf` (todo, a mano: los PDF no son deterministas).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

/** @param {string} name */
const read = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url), 'utf8'));
const site = read('site');
const ui = read('ui');
const guia = read('guia');
const claves = read('claves');
const marco = read('marco');
const bank = read('prompts');
const deck = read('presentacion');
const profiles = read('perfiles');
/** @type {any[]} */
const votesArr = read('votaciones');
const votes = Object.fromEntries(votesArr.map((v) => [v.id, v]));
/** @type {Map<string, any>} */
const sources = new Map(read('fuentes').items.map((/** @type {any} */ s) => [s.id, s]));

/** @typedef {'es' | 'en'} Lang */
/** @type {Lang[]} */
const LANGS = ['es', 'en'];
const OUT = new URL('../assets/descargas/', import.meta.url);
mkdirSync(OUT, { recursive: true });

/* ---------------- utilidades ---------------- */

/** @param {any} v @param {Lang} l */
const L = (v, l) => (v ? v[l] ?? v.es : '');
/** @param {string} s */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Cita [@id] → (Autor, año). @param {string} id @param {Lang} l */
const cite = (id, l) => {
  const s = sources.get(id);
  if (!s) throw new Error(`Cita desconocida: ${id}`);
  return l === 'en' ? s.cite.replace(' y ', ' & ').replace('s. f.', 'n.d.') : s.cite;
};
/** Texto con marcado mínimo → Markdown con citas resueltas. @param {string} s @param {Lang} l */
const md = (s, l) => s.replace(/\s?\[@([\w-]+)\]/g, (_, id) => ` (${cite(id, l)})`).replace(/\) \(/g, '; ');
/** Texto con marcado mínimo → HTML. @param {string} s @param {Lang} l */
const html = (s, l) =>
  esc(md(s, l))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
/** Prompt con [variables] resaltadas. @param {string} s */
const promptHtml = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<mark>[$1]</mark>');
const stageLabel = Object.fromEntries(profiles.stages.map((/** @type {any} */ s) => [s.id, s.label]));
const area6 = marco.areas.find((/** @type {any} */ a) => a.number === 6);
const footerText = (/** @type {Lang} */ l, /** @type {string} */ path) =>
  `© ${site.year} ${site.author} · ${site.licenseShort} · ${ui[l]['footer.claude']} · ${site.url}${path}`;
/** @param {string} id */
const promptUrl = (id) => `${site.url}ia/#${id}`;
/** @param {string} id */
const card = (id) => {
  const c = bank.cards.find((/** @type {any} */ x) => x.id === id);
  if (!c) throw new Error(`Prompt desconocido: ${id}`);
  return c;
};
/** Referencia APA en Markdown. @param {string} id */
const apaMd = (id) => {
  const s = sources.get(id);
  return `${s.apa} ${s.url}`;
};
/** Referencia APA en HTML. @param {string} id */
const apaHtml = (id) => {
  const s = sources.get(id);
  return `${esc(s.apa).replace(/\*([^*]+)\*/g, '<em>$1</em>')} <a href="${esc(s.url)}">${esc(s.url)}</a>`;
};

/* ---------------- Guía de análisis de tareas ---------------- */

const T = guia.labels;
const PROMPTS_TITLE = { es: 'Cuaderno de prompts', en: 'Prompt workbook' };
const LICENSE_NOTE = {
  es: 'Licencia CC BY-NC-SA 4.0. Puedes copiar y adaptar este material citando la autoría, sin fines comerciales y con la misma licencia.',
  en: 'CC BY-NC-SA 4.0 licence. You may copy and adapt this material with attribution, for non-commercial purposes and under the same licence.',
};

/** @param {Lang} l */
const guiaMd = (l) => {
  const out = [];
  out.push(`# ${L(guia.title, l)}`, '', `*${L(guia.subtitle, l)}*`, '', `${site.url}recursos/`, '');
  for (const p of L(guia.intro, l)) out.push(md(p, l), '');
  out.push(`## ${L(guia.how.title, l)}`, '');
  for (const it of L(guia.how.items, l)) out.push(`- ${it}`);
  out.push('');
  guia.steps.forEach((/** @type {any} */ st, /** @type {number} */ i) => {
    out.push(`## ${L(T.step, l)} ${i + 1}. ${L(st.title, l)}`, '', L(st.goal, l), '');
    for (const o of st.options ?? []) out.push(`- [ ] ${L(o.label, l)}`);
    if (st.options) out.push('');
    if (st.grid === 'picrat') {
      const cols = guia.picrat.cols.map((/** @type {any} */ c) => L(c, l));
      out.push(`| ${L(T.practice, l)} ↓ / ${L(T.students, l)} → | ${cols.join(' | ')} |`, `|---|${cols.map(() => ':---:').join('|')}|`);
      for (const r of guia.picrat.rows) out.push(`| **${L(r, l)}** | ${cols.map(() => '[ ]').join(' | ')} |`);
      out.push('');
    }
    if (st.table === 'claves') {
      out.push(`| ${L(T.key, l)} | ${L(T.question, l)} | ${L(T.yes, l)} | ${L(T.partly, l)} | ${L(T.no, l)} |`, '|---|---|:---:|:---:|:---:|');
      for (const k of claves.keys) out.push(`| ${k.n}. ${L(k.title, l)} | ${L(k.check, l)} | [ ] | [ ] | [ ] |`);
      out.push('');
    }
    if (st.table === 'cd') {
      out.push(`| ${L(T.competence, l)} | ${L(T.really, l)} | ${L(T.couldBe, l)} | ${L(T.na, l)} |`, '|---|:---:|:---:|:---:|');
      for (const k of area6.competences) out.push(`| ${k.code} ${k[l]} | [ ] | [ ] | [ ] |`);
      out.push('');
    }
    for (const f of st.fields ?? []) out.push(`**${L(f.label, l)}**`, '', f.big ? '> \n> \n> \n' : '> \n', '');
    if (st.tip) out.push(`> **${L(T.tip, l)}.** ${L(st.tip, l)}`, '');
  });
  out.push(`## ${L(T.example, l)}`, '', L(guia.example.task, l), '');
  for (const line of L(guia.example.lines, l)) out.push(`- ${line}`);
  out.push('', `## ${L(T.prompts, l)}`, '', L(T.promptsIntro, l), '');
  guia.prompts.forEach((/** @type {string} */ id, /** @type {number} */ i) => {
    const c = card(id);
    out.push(`${i + 1}. **${L(c.title, l)}**: ${L(c.goal, l)} ${promptUrl(id)}`);
  });
  out.push('', `## ${L(T.refs, l)}`, '');
  for (const id of guia.refs) out.push(`- ${apaMd(id)}`);
  out.push('', '---', '', `${LICENSE_NOTE[l]} ${footerText(l, 'recursos/')}`, '');
  return out.join('\n');
};

const PDF_CSS = `
  @page { size: A4; margin: 14mm 14mm 16mm; }
  * { box-sizing: border-box; }
  body { font: 10pt/1.42 system-ui, "Segoe UI", Roboto, Arial, sans-serif; color: #251912; margin: 0; }
  a { color: #8a3c00; word-break: break-all; }
  header { border-bottom: 3px solid #9c4400; padding-bottom: 6pt; margin-bottom: 10pt; }
  h1 { margin: 0; font-size: 22pt; color: #9c4400; }
  h2 { margin: 0 0 3pt; font-size: 12.5pt; color: #9c4400; }
  h3 { margin: 6pt 0 2pt; font-size: 10.5pt; }
  .sub { margin: 3pt 0 0; color: #57423a; font-size: 11pt; }
  p { margin: 0 0 5pt; }
  .goal { font-weight: 600; }
  section { break-inside: avoid; margin-bottom: 9pt; padding: 8pt 10pt; border: 1px solid #d8c2b8; border-radius: 6pt; }
  .label { margin: 6pt 0 2pt; font-weight: 600; font-size: 9.5pt; color: #57423a; }
  .lines { height: 38pt; background: repeating-linear-gradient(transparent 0 17pt, #c9b3a8 17pt 18pt); }
  .lines.big { height: 74pt; }
  ul.check { margin: 2pt 0 4pt; padding: 0; list-style: none; }
  ul.check li { display: flex; gap: 6pt; align-items: flex-start; margin-bottom: 2pt; break-inside: avoid; }
  .box { flex: none; display: inline-block; width: 9pt; height: 9pt; margin-top: 2pt; border: 1.2px solid #57423a; border-radius: 2pt; }
  table { width: 100%; border-collapse: collapse; margin: 4pt 0; }
  th, td { border: 1px solid #d8c2b8; padding: 4pt 5pt; text-align: left; vertical-align: top; }
  th { background: #fbeee8; font-size: 9pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  td.c { text-align: center; vertical-align: middle; width: 13%; }
  .picrat td { height: 30pt; text-align: center; vertical-align: middle; }
  .tip { margin-top: 5pt; padding: 5pt 8pt; border-left: 4px solid #9c4400; background: #fbeee8; border-radius: 3pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .intro { margin-bottom: 8pt; }
  .example { background: #fffaf7; }
  ol.prompts li, ul.refs li { margin-bottom: 4pt; break-inside: avoid; }
  ul.refs { padding-left: 12pt; font-size: 9pt; }
  footer, .foot { margin-top: 10pt; font-size: 8pt; color: #57423a; }
  mark { background: #ffdbcb; color: inherit; padding: 0 1pt; border-radius: 2pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .prompt { white-space: pre-wrap; padding: 6pt 8pt; border-radius: 4pt; background: #f6ece7; font-size: 9.5pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .meta { color: #57423a; font-size: 9pt; }
  .num { display: inline-grid; place-items: center; width: 18pt; height: 18pt; border-radius: 50%; background: #9c4400; color: #fff; font-weight: 700; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
`;

/** @param {Lang} l @param {string} title @param {string} body */
const page = (l, title, body) => `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PDF_CSS}</style></head><body>${body}</body></html>`;

/** @param {Lang} l */
const guiaHtml = (l) => {
  const fields = (/** @type {any[]} */ fs) => fs.map((f) => `<p class="label">${esc(L(f.label, l))}</p><div class="lines${f.big ? ' big' : ''}"></div>`).join('');
  const steps = guia.steps
    .map((/** @type {any} */ st, /** @type {number} */ i) => {
      let extra = '';
      if (st.options) extra += `<ul class="check">${st.options.map((/** @type {any} */ o) => `<li><span class="box"></span>${esc(L(o.label, l))}</li>`).join('')}</ul>`;
      if (st.grid === 'picrat') {
        extra += `<table class="picrat"><tr><th>${esc(L(T.practice, l))} ↓ / ${esc(L(T.students, l))} →</th>${guia.picrat.cols.map((/** @type {any} */ c) => `<th>${esc(L(c, l))}</th>`).join('')}</tr>${guia.picrat.rows
          .map((/** @type {any} */ r) => `<tr><th>${esc(L(r, l))}</th><td></td><td></td><td></td></tr>`)
          .join('')}</table>`;
      }
      if (st.table === 'claves') {
        extra += `<table><tr><th>${esc(L(T.key, l))}</th><th>${esc(L(T.question, l))}</th><th>${esc(L(T.yes, l))}</th><th>${esc(L(T.partly, l))}</th><th>${esc(L(T.no, l))}</th></tr>${claves.keys
          .map((/** @type {any} */ k) => `<tr><td><strong>${k.n}. ${esc(L(k.title, l))}</strong></td><td>${esc(L(k.check, l))}</td><td class="c"><span class="box"></span></td><td class="c"><span class="box"></span></td><td class="c"><span class="box"></span></td></tr>`)
          .join('')}</table>`;
      }
      if (st.table === 'cd') {
        extra += `<table><tr><th>${esc(L(T.competence, l))}</th><th>${esc(L(T.really, l))}</th><th>${esc(L(T.couldBe, l))}</th><th>${esc(L(T.na, l))}</th></tr>${area6.competences
          .map((/** @type {any} */ k) => `<tr><td>${k.code} ${esc(k[l])}</td><td class="c"><span class="box"></span></td><td class="c"><span class="box"></span></td><td class="c"><span class="box"></span></td></tr>`)
          .join('')}</table>`;
      }
      return `<section><h2>${esc(L(T.step, l))} ${i + 1}. ${esc(L(st.title, l))}</h2><p class="goal">${esc(L(st.goal, l))}</p>${extra}${fields(st.fields ?? [])}${st.tip ? `<p class="tip"><strong>${esc(L(T.tip, l))}.</strong> ${esc(L(st.tip, l))}</p>` : ''}</section>`;
    })
    .join('');
  const prompts = guia.prompts
    .map((/** @type {string} */ id) => {
      const c = card(id);
      return `<li><strong>${esc(L(c.title, l))}</strong>: ${esc(L(c.goal, l))}<br><a href="${promptUrl(id)}">${promptUrl(id)}</a></li>`;
    })
    .join('');
  return page(
    l,
    L(guia.title, l),
    `<header><h1>${esc(L(guia.title, l))}</h1><p class="sub">${esc(L(guia.subtitle, l))} · ${esc(ui[l]['app.name'])}</p></header>
<div class="intro">${L(guia.intro, l).map((/** @type {string} */ p) => `<p>${html(p, l)}</p>`).join('')}
<h3>${esc(L(guia.how.title, l))}</h3><ol>${L(guia.how.items, l).map((/** @type {string} */ it) => `<li>${esc(it)}</li>`).join('')}</ol></div>
${steps}
<section class="example"><h2>${esc(L(T.example, l))}</h2><p><em>${esc(L(guia.example.task, l))}</em></p><ul>${L(guia.example.lines, l).map((/** @type {string} */ x) => `<li>${html(x, l)}</li>`).join('')}</ul></section>
<section><h2>${esc(L(T.prompts, l))}</h2><p>${esc(L(T.promptsIntro, l))}</p><ol class="prompts">${prompts}</ol></section>
<h2>${esc(L(T.refs, l))}</h2><ul class="refs">${guia.refs.map((/** @type {string} */ id) => `<li>${apaHtml(id)}</li>`).join('')}</ul>
<footer>${esc(LICENSE_NOTE[l])}<br>${esc(footerText(l, 'recursos/'))}</footer>`,
  );
};

/* ---------------- Cuaderno de prompts ---------------- */

const NB = {
  es: { intro: 'Todos los prompts del banco. Rellena los huecos entre corchetes y cópialos en tu IA, o ábrelos desde la web con el enlace de cada tarjeta (allí los desplegables se rellenan solos).', fill: 'Huecos que rellenar', options: 'elige una opción', next: 'Siguiente paso', web: 'En la web', stages: 'Etapas', all: 'Todas las etapas', example: 'Qué esperar', keys: 'Claves', based: 'Basado en', free: 'texto libre' },
  en: { intro: 'All the prompts in the bank. Fill in the gaps in square brackets and copy them into your AI, or open them from the website using each card’s link (there, the drop-downs fill in for you).', fill: 'Gaps to fill in', options: 'choose one option', next: 'Next step', web: 'On the website', stages: 'Stages', all: 'All stages', example: 'What to expect', keys: 'Keys', based: 'Based on', free: 'free text' },
};
const keyTitle = new Map(claves.keys.map((/** @type {any} */ k) => [k.id, k]));

/** @param {any} c @param {Lang} l */
const stagesOf = (c, l) => (c.stages.length === 4 ? NB[l].all : c.stages.map((/** @type {string} */ s) => L(stageLabel[s], l)).join(' · '));

/** @param {Lang} l */
const cuadernoMd = (l) => {
  const out = [`# ${PROMPTS_TITLE[l]}`, '', `*${ui[l]['app.name']} · ${ui[l]['app.subtitle']}*`, '', NB[l].intro, '', `${site.url}ia/`, ''];
  for (const g of bank.guide) out.push(`- **${L(g.title, l)}.** ${md(L(g.body, l), l).replace(/\*\*([^*]+)\*\*/g, '$1')}`);
  for (const cat of bank.categories) {
    const cards = bank.cards.filter((/** @type {any} */ c) => c.category === cat.id);
    if (!cards.length) continue;
    out.push('', `## ${L(cat.label, l)}`, '');
    for (const c of cards) {
      out.push(`### ${L(c.title, l)}`, '', L(c.goal, l), '', `*${NB[l].stages}: ${stagesOf(c, l)}*`, '', '```text', L(c.prompt, l), '```', '');
      if (c.vars.length) {
        out.push(`**${NB[l].fill}:**`, '');
        for (const v of c.vars) {
          const name = v[l];
          if (v.options) out.push(`- [${name}] — ${NB[l].options}: ${v.options.map((/** @type {any} */ o) => `«${L(o, l)}»`).join(' / ')}`);
          else out.push(`- [${name}] — ${L(v.sample, l) ? `${l === 'es' ? 'ej.' : 'e.g.'} ${L(v.sample, l)}` : NB[l].free}`);
        }
        out.push('');
      }
      out.push(`**${NB[l].example}:** ${L(c.example, l)}`, '');
      if (c.see?.length) out.push(`**${NB[l].keys}:** ${c.see.map((/** @type {string} */ id) => `${keyTitle.get(id)?.n}. ${L(keyTitle.get(id)?.title, l)}`).join(' · ')}`, '');
      if (c.next?.length) out.push(`**${NB[l].next}:** ${c.next.map((/** @type {string} */ id) => L(card(id).title, l)).join(' → ')}`, '');
      if (c.sources?.length) out.push(`**${NB[l].based}:** ${c.sources.map((/** @type {string} */ id) => cite(id, l)).join('; ')}`, '');
      out.push(`${NB[l].web}: ${promptUrl(c.id)}`, '');
    }
  }
  out.push('---', '', `${LICENSE_NOTE[l]} ${footerText(l, 'ia/')}`, '');
  return out.join('\n');
};

/** @param {Lang} l */
const cuadernoHtml = (l) => {
  const cats = bank.categories
    .map((/** @type {any} */ cat) => {
      const cards = bank.cards.filter((/** @type {any} */ c) => c.category === cat.id);
      if (!cards.length) return '';
      return `<h2 style="margin-top:12pt">${esc(L(cat.label, l))}</h2>${cards
        .map((/** @type {any} */ c) => {
          const vars = c.vars
            .map((/** @type {any} */ v) =>
              v.options
                ? `<li><strong>[${esc(v[l])}]</strong> — ${esc(NB[l].options)}:<ul class="check">${v.options.map((/** @type {any} */ o) => `<li><span class="box"></span>${esc(L(o, l))}</li>`).join('')}</ul></li>`
                : `<li><strong>[${esc(v[l])}]</strong>${L(v.sample, l) ? ` — <span class="meta">${l === 'es' ? 'ej.' : 'e.g.'} ${esc(L(v.sample, l))}</span>` : ''}<div class="lines" style="height:18pt"></div></li>`,
            )
            .join('');
          return `<section><h3 style="margin-top:0">${esc(L(c.title, l))}</h3><p>${esc(L(c.goal, l))}</p><p class="meta">${esc(NB[l].stages)}: ${esc(stagesOf(c, l))}</p>
<div class="prompt">${promptHtml(L(c.prompt, l))}</div>
${vars ? `<p class="label">${esc(NB[l].fill)}</p><ul style="padding-left:12pt;margin:0">${vars}</ul>` : ''}
<p class="meta" style="margin-top:4pt"><strong>${esc(NB[l].example)}:</strong> ${esc(L(c.example, l))}</p>
${c.next?.length ? `<p class="meta"><strong>${esc(NB[l].next)}:</strong> ${c.next.map((/** @type {string} */ id) => esc(L(card(id).title, l))).join(' → ')}</p>` : ''}
${c.sources?.length ? `<p class="meta"><strong>${esc(NB[l].based)}:</strong> ${c.sources.map((/** @type {string} */ id) => esc(cite(id, l))).join('; ')}</p>` : ''}
<p class="meta">${esc(NB[l].web)}: <a href="${promptUrl(c.id)}">${promptUrl(c.id)}</a></p></section>`;
        })
        .join('')}`;
    })
    .join('');
  return page(
    l,
    PROMPTS_TITLE[l],
    `<header><h1>${esc(PROMPTS_TITLE[l])}</h1><p class="sub">${esc(ui[l]['app.name'])} · ${esc(ui[l]['app.subtitle'])}</p></header>
<p>${esc(NB[l].intro)}</p>
<section><ul style="margin:0;padding-left:12pt">${bank.guide.map((/** @type {any} */ g) => `<li><strong>${esc(L(g.title, l))}.</strong> ${html(L(g.body, l), l)}</li>`).join('')}</ul></section>
${cats}
<footer>${esc(LICENSE_NOTE[l])}<br>${esc(footerText(l, 'ia/'))}</footer>`,
  );
};

/* ---------------- Las siete claves en una página ---------------- */

/** @param {Lang} l */
const clavesHtml = (l) =>
  page(
    l,
    L(claves.keysTitle, l),
    `<style>@page { size: A4 landscape; margin: 10mm 12mm; } body { font-size: 9pt; } td { font-size: 8.6pt; }</style>
<header><h1>${esc(L(claves.keysTitle, l))}</h1><p class="sub">${esc(ui[l]['app.subtitle'])} · ${esc(ui[l]['app.name'])}</p></header>
<table><tr><th style="width:20%"></th><th style="width:20%">${esc(L(claves.labels.anchor, l))}</th><th style="width:32%">${esc(L(claves.labels.check, l))}</th><th>${esc(L(claves.labels.antipattern, l))}</th></tr>
${claves.keys.map((/** @type {any} */ k) => `<tr><td><span class="num">${k.n}</span> <strong>${esc(L(k.title, l))}</strong></td><td>${esc(L(k.anchor, l))}</td><td>${esc(L(k.check, l))}</td><td>${esc(L(k.antipattern, l))}</td></tr>`).join('')}
</table>
<p class="tip"><strong>${esc(l === 'es' ? '¿Qué tiene que pensar el alumno ahora que antes no pensaba?' : 'What do students have to think about now that they did not before?')}</strong></p>
<footer>${esc(footerText(l, 'claves/'))}</footer>`,
  );

/* ---------------- Escaleta del ponente (solo español) ---------------- */

const mmss = (/** @type {number} */ m) => `${String(Math.floor(m)).padStart(2, '0')}:${String(Math.round((m % 1) * 60)).padStart(2, '0')}`;
/** @param {any} s */
const slideHead = (s) => (s.type === 'vote' ? `Votación ${s.vote}: ${votes[s.vote].question.es}` : s.type === 'big' ? `${s.number} · ${s.text.es}` : (s.title ?? s.text)?.es ?? '');

const escaletaHtml = () => {
  const rows = deck.blocks
    .map((/** @type {any} */ b) => {
      const slides = deck.slides.map((/** @type {any} */ s, /** @type {number} */ i) => ({ s, i })).filter(({ s }) => s.block === b.id);
      return `<tr><th colspan="4">${b.from}–${b.to} min · ${esc(b.title.es)}</th></tr>${slides
        .map(({ s, i }) => `<tr><td class="c">${mmss(s.at)}</td><td class="c">${i + 1}</td><td><strong>${esc(slideHead(s))}</strong><br><span class="meta">${esc(s.key ?? '')}</span></td><td class="meta">${esc(s.bridge ?? '')}</td></tr>`)
        .join('')}`;
    })
    .join('');
  const detail = deck.slides
    .map(
      (/** @type {any} */ s, /** @type {number} */ i) => `<section><h3 style="margin-top:0">${i + 1}. [${mmss(s.at)}] ${esc(slideHead(s))}</h3>
${s.key ? `<p class="tip"><strong>Idea fuerza.</strong> ${esc(s.key)}</p>` : ''}
<p>${esc(s.notes)}</p>
${s.do ? `<p class="meta"><strong>Haz:</strong> ${esc(s.do)}</p>` : ''}
${s.data ? `<p class="meta"><strong>Dato y fuente:</strong> ${esc(s.data)}</p>` : ''}
${s.bridge ? `<p class="meta"><strong>Transición:</strong> <em>${esc(s.bridge)}</em></p>` : ''}
${s.cut ? `<p class="meta"><strong>Si vas tarde:</strong> ${esc(s.cut)}</p>` : ''}</section>`,
    )
    .join('');
  return page(
    'es',
    'Escaleta',
    `<header><h1>Escaleta del ponente</h1><p class="sub">${esc(deck.slides[0].title.es)} · 45 minutos · ${deck.slides.length} diapositivas</p></header>
<p class="meta">Presentación: ${site.url}presentacion/ · Notas en directo: ${site.url}presentacion/?notas (tecla N). Teclas: → siguiente · ← anterior · B pantalla negra · F pantalla completa · T reiniciar cronómetro · número + Intro para saltar.</p>
<table><tr><th style="width:9%">Min</th><th style="width:6%">Nº</th><th>Diapositiva e idea fuerza</th><th style="width:30%">Transición</th></tr>${rows}</table>
<h2 style="margin-top:12pt; break-before: page">Notas por diapositiva</h2>${detail}
<footer>${esc(footerText('es', 'presentacion/'))}</footer>`,
  );
};

/* ---------------- Escritura ---------------- */

for (const l of LANGS) {
  writeFileSync(new URL(`guia-analisis-tareas-${l}.md`, OUT), guiaMd(l));
  writeFileSync(new URL(`cuaderno-prompts-${l}.md`, OUT), cuadernoMd(l));
}
console.log('assets/descargas: guía y cuaderno de prompts en .md (es, en).');

// Depuración: `node tools/build-docs.mjs --html <carpeta>` vuelca el HTML de cada PDF para revisarlo.
const htmlDir = process.argv[process.argv.indexOf('--html') + 1];
if (process.argv.includes('--html') && htmlDir) {
  mkdirSync(htmlDir, { recursive: true });
  for (const l of LANGS) {
    writeFileSync(`${htmlDir}/guia-${l}.html`, guiaHtml(l));
    writeFileSync(`${htmlDir}/cuaderno-${l}.html`, cuadernoHtml(l));
    writeFileSync(`${htmlDir}/claves-${l}.html`, clavesHtml(l));
  }
  writeFileSync(`${htmlDir}/escaleta.html`, escaletaHtml());
  console.log(`HTML en ${htmlDir}`);
}

if (process.argv.includes('--pdf')) {
  const { default: puppeteer } = await import('puppeteer-core');
  const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(
    (p) => p && existsSync(p),
  );
  if (!executablePath) throw new Error('No se encontró Chrome/Edge. Define CHROME_PATH.');
  const browser = await puppeteer.launch({ executablePath, headless: true });
  /** @param {string} content @param {URL} out */
  const pdf = async (content, out) => {
    const p = await browser.newPage();
    await p.setContent(content, { waitUntil: 'load' });
    await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await p.close();
    console.log(`PDF: ${decodeURIComponent(out.pathname)}`);
  };
  try {
    for (const l of LANGS) {
      await pdf(guiaHtml(l), new URL(`guia-analisis-tareas-${l}.pdf`, OUT));
      await pdf(cuadernoHtml(l), new URL(`cuaderno-prompts-${l}.pdf`, OUT));
      await pdf(clavesHtml(l), new URL(`siete-claves-${l}.pdf`, OUT));
    }
    await pdf(escaletaHtml(), new URL('../docs/escaleta.pdf', import.meta.url));
  } finally {
    await browser.close();
  }
}
