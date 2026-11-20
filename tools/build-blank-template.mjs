// @ts-check
/**
 * Genera la plantilla socrática en blanco en PDF (A4) a partir de content/plantilla.json:
 * assets/plantilla-en-blanco-es.pdf y assets/plantilla-en-blanco-en.pdf.
 * Usa Chrome/Edge instalado vía puppeteer-core. Ejecutar a mano: `npm run blank`.
 */
import { readFileSync, existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const tpl = JSON.parse(readFileSync(new URL('../content/plantilla.json', import.meta.url), 'utf8'));
const site = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url), 'utf8'));
const ui = JSON.parse(readFileSync(new URL('../content/ui.json', import.meta.url), 'utf8'));

const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(
  (p) => p && existsSync(p),
);
if (!executablePath) throw new Error('No se encontró Chrome/Edge. Define CHROME_PATH.');

/** @param {string} s */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** @param {string} s */
const md = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

const TEXT = {
  es: { title: '¿Digitalización o innovación?', sub: 'Plantilla socrática para analizar una actividad', write: 'Tu reflexión', position: 'Mi conclusión: ¿qué tiene que pensar ahora mi alumnado que antes no pensaba?', improve: 'Una mejora que voy a probar', scale: 'Digitalización ← → Innovación que genera aprendizaje' },
  en: { title: 'Digitisation or innovation?', sub: 'Socratic template to analyse an activity', write: 'Your reflection', position: 'My conclusion: what do my students now have to think about that they did not before?', improve: 'One improvement I will try', scale: 'Digitisation ← → Innovation that generates learning' },
};

/** @param {'es' | 'en'} lang */
const html = (lang) => {
  const T = TEXT[lang];
  const dims = tpl.dimensions
    .map(
      (/** @type {any} */ d, /** @type {number} */ i) => `
    <section class="dim">
      <h2>${i + 1}. ${esc(d.title[lang])}</h2>
      <p class="q">${esc(d.question[lang])}</p>
      <ul>${d.options.map((/** @type {any} */ o) => `<li><span class="box"></span>${esc(o.label[lang])}</li>`).join('')}</ul>
      <p class="label">${T.write}</p><div class="lines"></div>
    </section>`,
    )
    .join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${T.title}</title>
<style>
  @page { size: A4; margin: 14mm 14mm 16mm; }
  body { font: 10.5pt/1.4 system-ui, "Segoe UI", Roboto, Arial, sans-serif; color: #251912; }
  header { border-bottom: 3px solid #9c4400; padding-bottom: 6pt; margin-bottom: 10pt; }
  h1 { margin: 0; font-size: 20pt; color: #9c4400; }
  .sub { margin: 2pt 0 0; color: #57423a; }
  .intro { margin: 0 0 8pt; }
  .label { margin: 6pt 0 2pt; font-weight: 600; font-size: 9.5pt; color: #57423a; }
  .lines { height: 38pt; background: repeating-linear-gradient(transparent 0 17pt, #c9b3a8 17pt 18pt); }
  .lines.big { height: 74pt; }
  .dim { break-inside: avoid; margin-bottom: 9pt; padding: 7pt 9pt; border: 1px solid #d8c2b8; border-radius: 6pt; }
  h2 { margin: 0 0 2pt; font-size: 11.5pt; color: #9c4400; }
  .q { margin: 0 0 4pt; font-weight: 600; }
  ul { margin: 0; padding: 0; list-style: none; columns: 2; column-gap: 14pt; }
  li { display: flex; gap: 6pt; align-items: flex-start; margin-bottom: 2pt; break-inside: avoid; }
  .box { flex: none; width: 9pt; height: 9pt; margin-top: 2pt; border: 1.2px solid #57423a; border-radius: 2pt; }
  .end { break-inside: avoid; }
  .scale { margin: 6pt 0; text-align: center; font-weight: 600; letter-spacing: .02em; }
  .bar { height: 10pt; border-radius: 5pt; border: 1px solid #57423a; background: linear-gradient(90deg, #fff, #ffdbcb, #ef6c00); print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  footer { margin-top: 10pt; font-size: 8pt; color: #57423a; }
</style></head><body>
<header><h1>${T.title}</h1><p class="sub">${T.sub} · ${esc(ui[lang]['app.name'])}</p></header>
<p class="intro">${md(tpl.intro[lang])}</p>
<p class="label">${esc(tpl.activity.label[lang])}</p><div class="lines big"></div>
${dims}
<section class="end">
  <p class="scale">${T.scale}</p><div class="bar"></div>
  <p class="label">${T.position}</p><div class="lines big"></div>
  <p class="label">${T.improve}</p><div class="lines"></div>
</section>
<footer>© ${site.year} ${esc(site.author)} · CC BY 4.0 · ${esc(ui[lang]['footer.claude'])} · ${site.url}plantilla/</footer>
</body></html>`;
};

const browser = await puppeteer.launch({ executablePath, headless: true });
try {
  for (const lang of /** @type {const} */ (['es', 'en'])) {
    const page = await browser.newPage();
    await page.setContent(html(lang), { waitUntil: 'load' });
    const out = new URL(`../assets/plantilla-en-blanco-${lang}.pdf`, import.meta.url);
    await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.close();
    console.log(`PDF: ${out.pathname}`);
  }
} finally {
  await browser.close();
}
