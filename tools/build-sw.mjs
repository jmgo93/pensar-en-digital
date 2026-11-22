// @ts-check
/**
 * Genera sw-precache.js: la lista de archivos que el service worker precarga y una versión
 * (hash del contenido). Cualquier cambio en un archivo publicado cambia la versión y activa el aviso
 * "Nueva versión disponible". Ejecutar SIEMPRE antes de publicar: `npm run sw` (lo hace `npm run build:all`).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
/** @type {{ path: string }[]} */
const routes = JSON.parse(readFileSync(join(root, 'content/routes.json'), 'utf8'));
// Carpetas de las secciones (content/routes.json) + recursos comunes.
const INCLUDE_DIRS = ['css', 'js', 'content', 'assets', 'presentacion', ...routes.map((r) => r.path.replace(/\/$/, '')).filter(Boolean)];
const ROOT_FILES = ['index.html', 'manifest.webmanifest'];
// Los .md se excluyen salvo los descargables de assets/ (assets/descargas/*.md).
// Los PDF de assets/descargas/ no se precargan (≈ 2 MB): sw.js los guarda la primera vez que se descargan.
const EXCLUDE = [/\.d\.ts$/, /^(?!assets\/).*\.md$/, /^assets\/descargas\/.*\.pdf$/, /(^|\/)\./];

/** @param {string} dir @returns {string[]} */
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const files = [
  ...ROOT_FILES,
  ...INCLUDE_DIRS.flatMap((d) => {
    try {
      return walk(join(root, d)).map((f) => relative(root, f).split(sep).join('/'));
    } catch {
      return [];
    }
  }),
]
  .filter((f) => !EXCLUDE.some((re) => re.test(f)))
  .sort();

const hash = createHash('sha256');
// Se normalizan los finales de línea para que la versión sea la misma en Windows y en CI.
const TEXT = /\.(html|css|js|mjs|json|webmanifest|svg|md|txt)$/;
for (const f of files) {
  const buf = readFileSync(join(root, f));
  hash.update(f).update(TEXT.test(f) ? buf.toString('utf8').replace(/\r\n/g, '\n') : buf);
}
const version = hash.digest('hex').slice(0, 12);

// Las páginas se precachean por su URL de carpeta ("ia/") además de "ia/index.html".
const urls = files.flatMap((f) => (f.endsWith('index.html') ? [f.replace(/index\.html$/, '') || './', f] : [f]));

writeFileSync(
  join(root, 'sw-precache.js'),
  `// GENERADO por tools/build-sw.mjs — no editar a mano.\nself.PD_VERSION = '${version}';\nself.PD_PRECACHE = ${JSON.stringify(urls, null, 0)};\n`,
);
console.log(`sw-precache.js: ${urls.length} URL, versión ${version}.`);
