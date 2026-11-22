// @ts-check
/**
 * Renderizado de las secciones de contenido a partir de content/*.json.
 * Cada sección pinta en #view; se vuelve a pintar al cambiar el idioma o el perfil.
 */
import { loadContent, loadSources, loc, paragraphs, easyRead, inline, citeLabel } from './content.js';
import { h, icon } from './ui.js';
import { t, getLang } from './i18n.js';
import { fromRoot } from './router.js';
import { installCard } from './pwa.js';
import { getStage, byProfile, stageChips, profileCard, openProfilePicker, loadProfiles } from './profile.js';

/** @typedef {import('./types').Localized} L */

/**
 * Tarjeta de contenido estándar: título, párrafos y lectura fácil. Marcada para lectura en voz alta.
 * @param {{ id?: string, icon?: string, title: string, body?: string[], easy?: L, extra?: (Node | null)[], variant?: string, level?: 'h2' | 'h3' }} o
 */
const blockCard = (o) =>
  h(
    'section',
    { class: `card ${o.variant ?? 'card-filled'} content-block`, id: o.id, 'data-tts': '', 'aria-labelledby': o.id ? `${o.id}-t` : undefined },
    h('div', { class: 'card-header' }, o.icon ? h('span', { class: 'card-icon' }, icon(o.icon)) : null, h(o.level ?? 'h2', { id: o.id ? `${o.id}-t` : undefined, class: 'title-large' }, o.title)),
    ...(o.body ? paragraphs(o.body) : []),
    ...(o.extra ?? []),
    easyRead(o.easy),
  );

/** @param {string} key */
const sectionTitle = (key, id = '') => h('h2', { class: 'section-title headline-small', id: id || undefined }, t(key));

/** Nombre de la etapa en el idioma activo. */
const stageLabels = async () => {
  const p = await loadProfiles();
  return Object.fromEntries(p.stages.map((s) => [s.id, loc(s.label)]));
};

/* ---------------- Inicio ---------------- */

/** @param {HTMLElement} view */
const renderInicio = async (view) => {
  /** @type {any} */
  const c = await loadContent('inicio');
  view.replaceChildren(
    ...[installCard()].filter((x) => x !== null),
    blockCard({ id: 'tesis', icon: 'lightbulb', title: loc(c.thesis.title), body: loc(c.thesis.body), easy: c.thesis.lecturaFacil, variant: 'card-accent' }),
    blockCard({ id: 'puente', icon: 'swap_horiz', title: loc(c.bridge.title), body: loc(c.bridge.body), easy: c.bridge.lecturaFacil }),
    h('blockquote', { class: 'pull-quote', 'data-tts': '' }, icon('format_quote'), h('p', {}, loc(c.question))),
    await profileCard(),
  );
  // Primer acceso: se ofrece elegir perfil cuando la página ya está tranquila.
  if (!window.pdPrefs.get().profileAsked) {
    const idle = window.requestIdleCallback ?? ((/** @type {() => void} */ cb) => setTimeout(cb, 200));
    setTimeout(() => idle(() => openProfilePicker()), 1500);
  }
};

/* ---------------- La ponencia ---------------- */

/** @param {HTMLElement} view */
const renderPonencia = async (view) => {
  /** @type {any} */
  const c = await loadContent('ponencia');
  view.replaceChildren(
    h('p', { class: 'lead' }, loc(c.intro)),
    h('div', { class: 'btn-row', 'data-speaker-only': '' }, h('a', { class: 'btn btn-tonal interactive', href: fromRoot('presentacion/').href }, icon('slideshow'), h('span', {}, t('ponencia.open')))),
    h(
      'ol',
      { class: 'timeline' },
      ...c.blocks.map((/** @type {any} */ b) =>
        h(
          'li',
          { class: 'timeline-item' },
          h('span', { class: 'timeline-time label-large' }, `${b.minutes[0]}–${b.minutes[1]} min`),
          blockCard({ id: b.id, icon: b.icon, title: loc(b.title), body: loc(b.summary), easy: b.lecturaFacil }),
        ),
      ),
    ),
  );
};

/* ---------------- Marco CDD ---------------- */

/** @param {HTMLElement} view */
const renderMarco = async (view) => {
  /** @type {any} */
  const c = await loadContent('marco');
  const labels = await stageLabels();
  const areasBox = h('div', { class: 'stack' });

  /** @param {string | null} stage */
  const drawAreas = (stage) => {
    areasBox.replaceChildren(
      ...c.areas.map((/** @type {any} */ a) => {
        const entries = Object.entries(a.examples).filter(([s]) => !stage || s === stage);
        return blockCard({
          id: a.id,
          icon: a.icon,
          title: `${t('marco.area')} ${a.number}. ${loc(a.title)}`,
          body: [loc(a.plain)],
          easy: a.lecturaFacil,
          extra: [
            h('h3', { class: 'title-small' }, t('marco.competences')),
            h('ul', { class: 'competences' }, ...a.competences.map((/** @type {any} */ k) => h('li', {}, h('span', { class: 'code' }, k.code), ' ', loc(k)))),
            h('h3', { class: 'title-small' }, entries.length > 1 ? t('marco.examples') : t('marco.example')),
            h(
              'ul',
              { class: 'examples' },
              ...entries.map(([s, ex]) => h('li', { class: 'example' }, h('span', { class: 'stage-tag label-medium' }, labels[s] ?? s), h('p', {}, inline(loc(/** @type {L} */ (ex)))))),
            ),
          ],
        });
      }),
    );
  };
  drawAreas(getStage());

  view.replaceChildren(
    ...paragraphs(loc(c.intro)).map((p) => {
      p.classList.add('lead');
      return p;
    }),
    sectionTitle('marco.areas'),
    h('div', { class: 'filter-row' }, h('span', { class: 'label-large' }, t('profile.examplesFor')), await stageChips(getStage(), drawAreas)),
    areasBox,
    sectionTitle('marco.levels', 'niveles'),
    h('p', { class: 'muted' }, inline(loc(c.levels.note))),
    h(
      'div',
      { class: 'levels' },
      ...c.levels.stages.map((/** @type {any} */ s) =>
        h(
          'section',
          { class: `card card-outlined level level-${s.id}`, 'data-tts': '' },
          h('h3', { class: 'title-medium' }, loc(s.title)),
          h('dl', {}, ...s.levels.flatMap((/** @type {any} */ l) => [h('dt', { class: 'level-code' }, l.code), h('dd', {}, loc(l))])),
        ),
      ),
    ),
    blockCard({ id: 'andalucia', icon: 'badge', title: loc(c.andalucia.title), body: loc(c.andalucia.body) }),
  );
};

/* ---------------- Escuela inclusiva + digital ---------------- */

/** @param {HTMLElement} view */
const renderInclusiva = async (view) => {
  /** @type {any} */
  const c = await loadContent('inclusiva');
  const labels = await stageLabels();
  const baBox = h('div', { class: 'stack' });

  /** @param {string | null} stage */
  const drawBA = (stage) => {
    const items = c.beforeAfter.filter((/** @type {any} */ x) => !stage || x.stage === stage);
    baBox.replaceChildren(
      ...items.map((/** @type {any} */ x) =>
        h(
          'section',
          { class: 'card card-outlined before-after', 'data-tts': '' },
          h('h3', { class: 'title-medium' }, labels[x.stage] ?? x.stage, h('span', { class: 'icap-tag label-medium' }, `ICAP: ${loc(x.icap)}`)),
          h('div', { class: 'ba-grid' }, h('div', { class: 'ba before' }, h('p', { class: 'label-large' }, t('inclusiva.before')), h('p', {}, loc(x.before))), h('div', { class: 'ba after' }, h('p', { class: 'label-large' }, t('inclusiva.after')), h('p', {}, loc(x.after)))),
        ),
      ),
    );
  };
  drawBA(getStage());

  view.replaceChildren(
    h('p', { class: 'lead' }, loc(c.intro)),
    sectionTitle('inclusiva.bridge'),
    h(
      'div',
      { class: 'bridge' },
      ...c.bridge.map((/** @type {any} */ b) =>
        h(
          'section',
          { class: 'card card-filled bridge-row', id: b.id, 'data-tts': '', 'aria-labelledby': `${b.id}-t` },
          h('div', { class: 'card-header' }, h('span', { class: 'card-icon' }, icon(b.icon)), h('h3', { id: `${b.id}-t`, class: 'title-medium' }, loc(b.from), h('span', { class: 'arrow', 'aria-hidden': 'true' }, ' → '), h('span', { class: 'visually-hidden' }, ': '), loc(b.to))),
          h('div', { class: 'mx' }, h('p', { class: 'mx-label label-large good' }, icon('trending_up'), t('inclusiva.multiplies')), h('p', {}, inline(loc(b.multiplies)))),
          h('div', { class: 'mx' }, h('p', { class: 'mx-label label-large bad' }, icon('trending_down'), t('inclusiva.destroys')), h('p', {}, inline(loc(b.destroys)))),
          easyRead(b.lecturaFacil),
        ),
      ),
    ),
    sectionTitle('inclusiva.beforeAfter'),
    h('div', { class: 'filter-row' }, h('span', { class: 'label-large' }, t('profile.examplesFor')), await stageChips(getStage(), drawBA)),
    baBox,
  );
};

/* ---------------- Ideas para el lunes ---------------- */

/** @param {HTMLElement} view */
const renderLunes = async (view) => {
  /** @type {any} */
  const c = await loadContent('lunes');
  const labels = await stageLabels();
  const box = h('div', { class: 'grid-cards' });
  /** @param {string | null} stage */
  const draw = (stage) => {
    const items = byProfile(c.challenges, (/** @type {any} */ x) => x.stages).filter((/** @type {any} */ x) => !stage || x.stages.includes(stage));
    box.replaceChildren(
      ...items.map((/** @type {any} */ x) =>
        blockCard({
          id: x.id,
          icon: x.icon,
          title: loc(x.title),
          body: [loc(x.body)],
          easy: x.lecturaFacil,
          variant: 'card-elevated',
          extra: [h('p', { class: 'stage-list label-medium' }, x.stages.length === 4 ? t('profile.allStages') : x.stages.map((/** @type {string} */ s) => labels[s]).join(' · '))],
        }),
      ),
    );
  };
  draw(getStage());
  view.replaceChildren(h('p', { class: 'lead' }, loc(c.intro)), h('div', { class: 'filter-row' }, await stageChips(getStage(), draw)), box);
};

/* ---------------- Las 7 claves ---------------- */

/** @param {HTMLElement} view */
const renderClaves = async (view) => {
  /** @type {any} */
  const c = await loadContent('claves');
  /** @type {any} */
  const prompts = await loadContent('prompts');
  /** @type {Map<string, string>} */
  const promptTitles = new Map(prompts.cards.map((/** @type {any} */ p) => [p.id, loc(p.title)]));
  const labels = await stageLabels();
  const box = h('div', { class: 'stack' });
  const L = c.labels;

  /** @param {string | null} stage */
  const draw = (stage) => {
    box.replaceChildren(
      ...c.keys.map((/** @type {any} */ k) => {
        const entries = Object.entries(k.examples).filter(([st]) => !stage || st === stage);
        const links = (k.prompts ?? []).filter((/** @type {string} */ id) => promptTitles.has(id));
        return h(
          'section',
          { class: 'card card-filled content-block key-card', id: k.id, 'data-tts': '', 'aria-labelledby': `${k.id}-t` },
          h('div', { class: 'card-header' }, h('span', { class: 'key-n', 'aria-hidden': 'true' }, String(k.n)), h('h3', { id: `${k.id}-t`, class: 'title-large' }, h('span', { class: 'visually-hidden' }, `${k.n}. `), loc(k.title))),
          h(
            'dl',
            { class: 'key-facts' },
            h('div', {}, h('dt', {}, loc(L.anchor)), h('dd', {}, loc(k.anchor))),
            h('div', {}, h('dt', {}, loc(L.mechanism)), h('dd', {}, inline(loc(k.mechanism)))),
            h('div', {}, h('dt', {}, loc(L.antipattern)), h('dd', {}, loc(k.antipattern))),
          ),
          h('h4', { class: 'title-small' }, entries.length > 1 ? t('marco.examples') : t('marco.example')),
          h('ul', { class: 'examples' }, ...entries.map(([st, ex]) => h('li', { class: 'example' }, h('span', { class: 'stage-tag label-medium' }, labels[st] ?? st), h('p', {}, loc(/** @type {L} */ (ex)))))),
          h('p', { class: 'key-check' }, h('strong', {}, `${loc(L.check)}: `), loc(k.check)),
          links.length
            ? h('p', { class: 'link-row' }, h('span', { class: 'label-medium muted' }, icon('smart_toy'), loc(L.prompts)), ...links.map((/** @type {string} */ id) => h('a', { class: 'chip-link', href: `${fromRoot('ia/').href}#${id}` }, promptTitles.get(id) ?? id)))
            : null,
          easyRead(k.lecturaFacil),
        );
      }),
    );
  };
  draw(getStage());

  view.replaceChildren(
    h('p', { class: 'lead' }, loc(c.intro)),
    h('div', { class: 'btn-row' }, h('a', { class: 'btn btn-tonal interactive', href: fromRoot('recursos/').href }, icon('download'), h('span', {}, t('claves.download')))),
    h('h2', { class: 'section-title headline-small', id: 'evidencia' }, loc(c.evidence.title)),
    h(
      'div',
      { class: 'evidence-grid' },
      ...c.evidence.items.map((/** @type {any} */ e) => h('section', { class: 'card card-outlined', id: e.id, 'data-tts': '' }, h('p', { class: 'evidence-figure' }, loc(e.figure)), h('p', {}, inline(loc(e.text))))),
    ),
    h('p', { class: 'muted' }, loc(c.evidence.caveat)),
    h('h2', { class: 'section-title headline-small', id: 'umbral' }, loc(c.threshold.title)),
    ...c.threshold.lenses.map((/** @type {any} */ l) => blockCard({ id: l.id, icon: l.icon, title: loc(l.title), body: [loc(l.body)], level: 'h3', variant: 'card-outlined' })),
    h('h2', { class: 'section-title headline-small', id: 'claves' }, loc(c.keysTitle)),
    h('div', { class: 'filter-row' }, h('span', { class: 'label-large' }, t('profile.examplesFor')), await stageChips(getStage(), draw)),
    box,
    blockCard({ id: 'marcos', icon: 'library_books', title: loc(c.frameworks.title), body: loc(c.frameworks.body) }),
  );
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
};

/* ---------------- Descargas ---------------- */

/** @param {HTMLElement} view */
const renderRecursos = async (view) => {
  /** @type {any} */
  const c = await loadContent('recursos');
  const lang = getLang();
  const other = lang === 'es' ? 'en' : 'es';
  /** @param {string} path @param {string} l */
  const href = (path, l) => fromRoot(path.replace('{lang}', l)).href;
  view.replaceChildren(
    h('p', { class: 'lead' }, loc(c.intro)),
    h('h2', { class: 'section-title headline-small' }, loc(c.filesTitle)),
    h(
      'div',
      { class: 'grid-cards' },
      ...c.files.map((/** @type {any} */ f) =>
        h(
          'section',
          { class: 'card card-elevated download-card', id: f.id, 'data-tts': '', 'aria-labelledby': `${f.id}-t` },
          h('div', { class: 'card-header' }, h('span', { class: 'card-icon' }, icon(f.icon)), h('h3', { id: `${f.id}-t`, class: 'title-medium' }, loc(f.title))),
          h('p', {}, loc(f.body)),
          h(
            'div',
            { class: 'btn-row' },
            ...f.formats.map((/** @type {any} */ fm, /** @type {number} */ i) => h('a', { class: `btn ${i === 0 ? 'btn-filled' : 'btn-outlined'} interactive`, href: href(fm.path, lang), download: '' }, icon(fm.icon), h('span', {}, loc(fm.label)))),
          ),
          h(
            'p',
            { class: 'link-row' },
            h('span', { class: 'label-medium muted' }, icon('translate'), loc(c.otherLang)),
            ...f.formats.map((/** @type {any} */ fm) => h('a', { class: 'chip-link', href: href(fm.path, other), hreflang: other, lang: other, download: '' }, fm.label[other])),
          ),
        ),
      ),
    ),
    h('h2', { class: 'section-title headline-small' }, loc(c.stepsTitle)),
    h('div', { class: 'grid-cards' }, ...c.steps.map((/** @type {any} */ st) => blockCard({ icon: st.icon, title: loc(st.title), body: [loc(st.body)], level: 'h3' }))),
    h('p', { class: 'body-small muted' }, loc(c.note)),
  );
};

/* ---------------- Herramientas ---------------- */

/** @param {HTMLElement} view */
const renderHerramientas = async (view) => {
  /** @type {any} */
  const c = await loadContent('herramientas');
  /** @type {any} */
  const claves = await loadContent('claves');
  /** @type {Map<string, any>} */
  const keyMap = new Map(claves.keys.map((/** @type {any} */ k) => [k.id, k]));
  const L = c.labels;
  /** @type {{ cat: string | null, flag: string | null }} */
  const filter = { cat: null, flag: null };
  const grid = h('div', { class: 'grid-cards tool-grid' });
  const count = h('p', { class: 'muted', role: 'status' });
  /** @param {string} url */
  const href = (url) => (/^https?:/.test(url) ? url : fromRoot(url).href);

  const draw = () => {
    const tools = c.tools.filter((/** @type {any} */ x) => (!filter.cat || x.cat === filter.cat) && (!filter.flag || x.flags.includes(filter.flag)));
    count.textContent = loc(L.count).replace('{n}', String(tools.length));
    grid.replaceChildren(
      ...tools.map((/** @type {any} */ x) => {
        const cat = c.categories.find((/** @type {any} */ k) => k.id === x.cat);
        const external = /^https?:/.test(x.url);
        return h(
          'article',
          { class: 'card card-elevated tool-card', id: x.id, 'data-tts': '', 'aria-labelledby': `${x.id}-t` },
          h('div', { class: 'card-header' }, h('span', { class: 'card-icon' }, icon(cat?.icon ?? 'handyman')), h('div', {}, h('p', { class: 'label-medium muted' }, cat ? loc(cat.label) : ''), h('h2', { id: `${x.id}-t`, class: 'title-medium' }, x.name))),
          h('ul', { class: 'tool-flags' }, ...x.flags.map((/** @type {string} */ f) => h('li', { class: `tool-flag flag-${f}` }, icon(c.flags[f]?.icon ?? 'check'), loc(c.flags[f])))),
          h('p', {}, loc(x.desc)),
          h('p', { class: 'tool-use' }, h('strong', {}, `${loc(L.use)}: `), loc(x.use)),
          x.keys?.length
            ? h(
                'p',
                { class: 'link-row' },
                h('span', { class: 'label-medium muted' }, icon('key'), loc(L.keys)),
                ...x.keys.filter((/** @type {string} */ k) => keyMap.has(k)).map((/** @type {string} */ k) => h('a', { class: 'chip-link', href: `${fromRoot('claves/').href}#${k}` }, `${keyMap.get(k).n}. ${loc(keyMap.get(k).title)}`)),
              )
            : null,
          h(
            'div',
            { class: 'btn-row' },
            h('a', { class: 'btn btn-filled interactive', href: href(x.url), ...(external ? { target: '_blank', rel: 'noopener', 'aria-label': `${loc(L.open)} ${x.name} (${t('app.newTab')})` } : {}) }, icon(external ? 'open_in_new' : 'arrow_forward'), h('span', {}, loc(L.open))),
          ),
        );
      }),
    );
  };

  /**
   * Grupo de chips de un solo valor.
   * @param {string} label
   * @param {{ id: string, label: string }[]} items
   * @param {(id: string | null) => void} onPick
   */
  const chipGroup = (label, items, onPick) => {
    /** @type {HTMLButtonElement[]} */
    const btns = [];
    /** @param {string | null} id @param {string} text */
    const chip = (id, text) => {
      const b = /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'chip interactive', 'aria-pressed': String(id === null) }, icon('check'), h('span', {}, text)));
      b.addEventListener('click', () => {
        for (const o of btns) o.setAttribute('aria-pressed', String(o === b));
        onPick(id);
        draw();
      });
      btns.push(b);
      return b;
    };
    return h('div', { class: 'filter-row' }, h('span', { class: 'label-large' }, label), h('div', { class: 'chip-set', role: 'group', 'aria-label': label }, chip(null, t('profile.all')), ...items.map((it) => chip(it.id, it.label))));
  };

  draw();
  view.replaceChildren(
    h('p', { class: 'lead' }, loc(c.intro)),
    chipGroup(loc(L.filterCat), c.categories.map((/** @type {any} */ k) => ({ id: k.id, label: loc(k.label) })), (id) => (filter.cat = id)),
    chipGroup(loc(L.filterFlag), ['junta', 'libre', 'sinCuenta'].map((f) => ({ id: f, label: loc(c.flags[f]) })), (id) => (filter.flag = id)),
    count,
    grid,
    h('p', { class: 'body-small muted' }, loc(c.note).replace('{date}', new Date(c.checked).toLocaleDateString(document.documentElement.lang))),
  );
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
};

/* ---------------- Bibliografía ---------------- */

/** @param {HTMLElement} view */
const renderBibliografia = async (view) => {
  const s = await loadSources();
  const list = h('ol', { class: 'references' });
  /** @type {HTMLButtonElement[]} */
  const chips = [];
  /** @param {string | null} topic */
  const draw = (topic) => {
    list.replaceChildren(
      ...s.items
        .filter((it) => !topic || it.topics.includes(topic))
        .map((it) =>
          h(
            'li',
            { id: it.id, class: 'reference' },
            h('p', {}, inline(it.apa), ' ', h('a', { href: it.url, class: 'ref-link' }, it.url)),
            h('p', { class: 'ref-meta label-medium' }, citeLabel(it), ' · ', it.topics.map((tp) => loc(s.topics[tp])).join(', ')),
          ),
        ),
    );
  };
  /** @param {string | null} id @param {string} label */
  const chip = (id, label) => {
    const b = /** @type {HTMLButtonElement} */ (h('button', { type: 'button', class: 'chip interactive', 'aria-pressed': String(id === null) }, icon('check'), h('span', {}, label)));
    b.addEventListener('click', () => {
      for (const o of chips) o.setAttribute('aria-pressed', String(o === b));
      draw(id);
    });
    chips.push(b);
    return b;
  };
  draw(null);
  view.replaceChildren(
    h('p', { class: 'lead' }, t('biblio.intro', { date: new Date(s.verified).toLocaleDateString(document.documentElement.lang) })),
    h('div', { class: 'chip-set', role: 'group', 'aria-label': t('biblio.filter') }, chip(null, t('profile.all')), ...Object.entries(s.topics).map(([id, l]) => chip(id, loc(l)))),
    list,
  );
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
};

/** @type {Record<string, (view: HTMLElement) => Promise<void>>} */
const RENDERERS = {
  inicio: renderInicio,
  ponencia: renderPonencia,
  marco: renderMarco,
  claves: renderClaves,
  recursos: renderRecursos,
  herramientas: renderHerramientas,
  inclusiva: renderInclusiva,
  lunes: renderLunes,
  bibliografia: renderBibliografia,
};

/**
 * Pinta la sección actual si tiene renderizador. Devuelve true si lo hizo.
 * @param {string} routeId
 * @returns {Promise<boolean>}
 */
export const renderSection = async (routeId) => {
  const render = RENDERERS[routeId];
  const view = document.getElementById('view');
  if (!render || !view) return false;
  await loadSources();
  await render(view);
  view.removeAttribute('aria-busy');
  document.dispatchEvent(new CustomEvent('pd:rendered'));
  return true;
};
