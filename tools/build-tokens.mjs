// @ts-check
/**
 * Genera css/tokens.css (esquema de color M3 a partir de la semilla naranja) y
 * docs/contraste.md (informe WCAG 2.2 de los pares de roles que usa la interfaz).
 * Se ejecuta a mano: `npm run tokens`. El resultado se versiona.
 */
import { writeFileSync } from 'node:fs';
import {
  Hct,
  SchemeFidelity,
  MaterialDynamicColors,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';

/** Naranja semilla (Material Orange 800). */
const SEED = '#EF6C00';

/** @typedef {{ id: string, label: string, dark: boolean, contrast: number }} SchemeDef */

/** @type {SchemeDef[]} */
const SCHEMES = [
  { id: 'light', label: 'Claro', dark: false, contrast: 0 },
  { id: 'dark', label: 'Oscuro', dark: true, contrast: 0 },
  { id: 'light-hc', label: 'Claro · alto contraste', dark: false, contrast: 1 },
  { id: 'dark-hc', label: 'Oscuro · alto contraste', dark: true, contrast: 1 },
];

/** Roles que no exponemos como tokens (internos de la librería). */
const SKIP = /palette_key_color|^background$|^on_background$|^surface_tint$|fixed/;

/**
 * @param {string} name snake_case
 * @returns {string} kebab-case
 */
const kebab = (name) => name.replaceAll('_', '-');

/** Todos los roles dinámicos (en 0.3.0 son propiedades estáticas de MaterialDynamicColors). */
const ROLES = /** @type {import('@material/material-color-utilities').DynamicColor[]} */ (
  Object.values(MaterialDynamicColors).filter((v) => v && typeof v === 'object' && 'getArgb' in v)
);

/**
 * @param {SchemeDef} def
 * @returns {Map<string, string>} rol kebab → #hex
 */
const buildScheme = (def) => {
  const scheme = new SchemeFidelity(Hct.fromInt(argbFromHex(SEED)), def.dark, def.contrast);
  /** @type {Map<string, string>} */
  const out = new Map();
  for (const color of ROLES) {
    if (SKIP.test(color.name)) continue;
    out.set(kebab(color.name), hexFromArgb(color.getArgb(scheme)));
  }
  return out;
};

/**
 * @param {string} hex
 * @returns {number} luminancia relativa WCAG
 */
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Pares [primer plano, fondo, mínimo]. 4.5 = texto, 3 = elementos de interfaz. */
const SURFACES = ['surface', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest'];
/** @type {[string, string, number][]} */
const PAIRS = [
  ['on-primary', 'primary', 4.5],
  ['on-primary-container', 'primary-container', 4.5],
  ['on-secondary', 'secondary', 4.5],
  ['on-secondary-container', 'secondary-container', 4.5],
  ['on-tertiary', 'tertiary', 4.5],
  ['on-tertiary-container', 'tertiary-container', 4.5],
  ['on-error', 'error', 4.5],
  ['on-error-container', 'error-container', 4.5],
  ['inverse-on-surface', 'inverse-surface', 4.5],
  ['inverse-primary', 'inverse-surface', 3],
  ...SURFACES.flatMap((s) => /** @type {[string, string, number][]} */ ([
    ['on-surface', s, 4.5],
    ['on-surface-variant', s, 4.5],
    ['primary', s, 4.5],
    ['error', s, 4.5],
    ['outline', s, 3],
  ])),
];

const schemes = SCHEMES.map((def) => ({ def, map: buildScheme(def) }));

/**
 * @param {Map<string, string>} map
 * @param {string} indent
 * @returns {string}
 */
const declarations = (map, indent) =>
  [...map].map(([k, v]) => `${indent}--md-sys-color-${k}: ${v};`).join('\n');

/** @param {string} id */
const get = (id) => /** @type {Map<string, string>} */ (schemes.find((s) => s.def.id === id)?.map);

const css = `/* GENERADO por tools/build-tokens.mjs — no editar a mano. Semilla: ${SEED} (SchemeFidelity). */
/* El esquema efectivo lo fija js/boot.js en <html data-scheme>. Sin JS se usa prefers-color-scheme. */

:root,
:root[data-scheme="light"] {
  color-scheme: light;
${declarations(get('light'), '  ')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-scheme]) {
    color-scheme: dark;
${declarations(get('dark'), '    ')}
  }
}

:root[data-scheme="dark"] {
  color-scheme: dark;
${declarations(get('dark'), '  ')}
}

:root[data-scheme="light-hc"] {
  color-scheme: light;
${declarations(get('light-hc'), '  ')}
}

:root[data-scheme="dark-hc"] {
  color-scheme: dark;
${declarations(get('dark-hc'), '  ')}
}
`;
writeFileSync(new URL('../css/tokens-color.css', import.meta.url), css);

let failures = 0;
const sections = schemes.map(({ def, map }) => {
  const rows = PAIRS.map(([fg, bg, min]) => {
    const a = map.get(fg);
    const b = map.get(bg);
    if (!a || !b) throw new Error(`Rol desconocido: ${!a ? fg : bg}`);
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) failures++;
    return `| \`${fg}\` ${a} | \`${bg}\` ${b} | ${r.toFixed(2)}:1 | ${min}:1 | ${ok ? '✅' : '❌'} |`;
  });
  return `## ${def.label}\n\n| Primer plano | Fondo | Contraste | Mínimo | |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
});

writeFileSync(
  new URL('../docs/contraste.md', import.meta.url),
  `# Informe de contraste (WCAG 2.2 AA)\n\nGENERADO por \`tools/build-tokens.mjs\`. Semilla \`${SEED}\`.\n4.5:1 para texto, 3:1 para elementos de interfaz (bordes, iconos sin texto).\n\nFallos: **${failures}**\n\n${sections.join('\n')}`,
);

console.log(`tokens-color.css y contraste.md generados. Fallos de contraste: ${failures}`);
if (failures) process.exitCode = 1;
