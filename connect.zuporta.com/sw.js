/* ============================================================
   Zuporta service worker

   Precaches the shell so the app opens instantly and works with no
   connection — which matters for a wellness tool people reach for at
   3am on bad reception.

   Caching strategy, and why:

   App code (HTML, CSS, JS) is NETWORK-FIRST. An earlier version cached
   these first, which broke every returning visitor on the first load
   after a deploy: the page came fresh from the network while the
   scripts came from the old cache, so new markup ran against old code
   and the app rendered blank. Code and markup must ship together.

   Images and icons are CACHE-FIRST — they change rarely and are not
   coupled to the markup.
   ============================================================ */

const VERSION = 'zuporta-v9';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/app.js',
  './assets/js/data.js',
  './assets/js/assistant.js',
  './assets/js/modules.js',
  './assets/js/zuporta-api.js',
  './assets/js/flow.js',
  './assets/js/caregiver.js',
  './assets/js/career.js',
  './assets/js/nightshift.js',
  './assets/js/parentbridge.js',
  './assets/js/care.js',
  './assets/js/nurseguide.js',
  './assets/js/baseline.js',
  './assets/js/navigator.js',
  './assets/img/mark.svg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/apple-touch-icon.png',
];

/** Anything that must match the current HTML build. */
const isAppCode = (url, request) =>
  request.mode === 'navigate'
  || /\.(?:js|mjs|css|webmanifest)$/.test(url.pathname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      // reload bypasses the HTTP cache, so a new worker never precaches stale files
      .then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isAppCode(url, request)) {
    // Network first: keeps markup and code in step, falls back when offline.
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => {
              c.put(request.mode === 'navigate' ? './index.html' : request, copy);
            });
          }
          return res;
        })
        .catch(() => caches.match(request)
          .then((hit) => hit
            || (request.mode === 'navigate'
              ? caches.match('./index.html').then((r) => r || caches.match('./'))
              : undefined))),
    );
    return;
  }

  // Everything else (images, icons): cache first, refreshed in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
