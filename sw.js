const CACHE = 'piano-grind-v19';
const BASE = '/piano-grind/';
const APP_SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'manifest.webmanifest',
  BASE + 'icons/icon-180.png',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + 'icons/icon-512-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(APP_SHELL); } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        await cache.put(BASE + 'index.html', fresh.clone());
        return fresh;
      } catch (_) {
        return (await caches.match(BASE + 'index.html')) || caches.match(BASE);
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(req, response.clone());
      }
      return response;
    } catch (_) {
      return cached || Response.error();
    }
  })());
});

self.addEventListener('push', event => {
  let d = { title: 'Block complete', body: 'Ready for the next one.' };
  try { if (event.data) d = event.data.json(); } catch (_) {}
  event.waitUntil(
    self.registration.showNotification('Piano Grind — ' + d.title, {
      body: d.body,
      tag: 'piano-grind-timer'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return self.clients.openWindow(BASE);
    })
  );
});
