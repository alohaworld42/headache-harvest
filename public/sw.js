/* Minimal offline shell for the headache diary. No third party libraries involved. */
const CACHE = 'kopfweh-v2';
/* Works both at the domain root (Vercel) and under a sub-path (GitHub Pages). */
const BASE = new URL('./', self.registration.scope).pathname;
const SHELL = [BASE, `${BASE}manifest.webmanifest`, `${BASE}icon-192.png`, `${BASE}icon-512.png`];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Payment and licence calls must never be served from a cache.
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: network first so a new deployment is picked up immediately.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(BASE, copy));
          return response;
        })
        .catch(() => caches.match(BASE).then((cached) => cached ?? Response.error())),
    );
    return;
  }

  // Hashed build assets: cache first, they are immutable.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok && (url.pathname.startsWith(`${BASE}assets/`) || SHELL.includes(url.pathname))) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
