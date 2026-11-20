// @ts-check
/**
 * Renderizado de las secciones de contenido a partir de content/*.json.
 * Cada sección pinta en #view; se vuelve a pintar al cambiar el idioma o el perfil.
 */
import { loadContent, loadSources, loc, paragraphs, easyRead, inline, citeLabel } from './content.js';
import { h, icon } from './ui.js';
import { t } from './i18n.js';
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
  if (!window.pdPrefs.get().profileAsked) setTimeout(() => openProfilePicker(), 600);
};

/* ---------------- La ponencia ---------------- */

/** @param {HTMLElement} view */
const renderPonencia = async (view) => {
  /** @type {any} */
  const c = await loadContent('ponencia');
  view.replaceChildren(
    h('p', { class: 'lead' }, loc(c.intro)),
    h('div', { class: 'btn-row' }, h('a', { class: 'btn btn-tonal interactive', href: fromRoot('presentacion/').href }, icon('slideshow'), h('span', {}, t('ponencia.open')))),
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
