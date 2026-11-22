/* Service worker · Pensar en Digital
 * - Precache del shell y del contenido (lista en sw-precache.js, generada).
 * - Navegación y archivos propios: caché primero (offline completo tras la primera visita).
 * - ARASAAC (API e imágenes): stale-while-revalidate en caché aparte.
 * - Resto (votaciones, IA): solo red.
 * - Nueva versión: espera hasta que la página pide SKIP_WAITING (aviso "Nueva versión disponible").
 */
/* global self, caches */
importScripts('./sw-precache.js');

const VERSION = self.PD_VERSION;
const STATIC = `pd-static-${VERSION}`;
const ARASAAC = 'pd-arasaac-v1';
const SCOPE = self.registration.scope;
const DOWNLOADS = /\/assets\/descargas\/[^/]+\.pdf$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC).then((cache) => cache.addAll(self.PD_PRECACHE.map((p) => new URL(p, SCOPE).href))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('pd-static-') && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const isArasaac = (url) => url.hostname === 'api.arasaac.org' || url.hostname === 'static.arasaac.org';

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(ARASAAC);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached ?? network;
};

const cacheFirst = async (request) => {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
  if (cached) return cached;
  try {
    const res = await fetch(request);
    // Los PDF descargables no se precargan (pesan): se guardan la primera vez que se piden.
    if (res.ok && DOWNLOADS.test(new URL(request.url).pathname)) cache.put(request, res.clone());
    return res;
  } catch (err) {
    if (request.mode === 'navigate') {
      const home = await cache.match(new URL('./', SCOPE).href);
      if (home) return home;
    }
    throw err;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isArasaac(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if (url.href.startsWith(SCOPE)) event.respondWith(cacheFirst(request));
});
