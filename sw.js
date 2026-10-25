/* Piano Grind PWA service worker — offline shell + block-finish push alerts. */
'use strict';

const CACHE_NAME = 'piano-grind-static-v4';
const REQUIRED_ASSETS = [
  './index.html',
  './manifest.webmanifest'
];
const OPTIONAL_ASSETS = [
  './',
  './icons/favicon-16.png',
  './icons/favicon-32.png',
  './icons/badge-96.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // These files are essential. Fail installation if either is unavailable.
    for (const path of REQUIRED_ASSETS) {
      const response = await fetch(new Request(path, { cache: 'reload' }));
      if (!response.ok) {
        throw new Error(`Required Piano Grind asset failed: ${path} (${response.status})`);
      }
      await cache.put(path, response);
    }

    // Optional aliases/icons should not block installation.
    await Promise.all(OPTIONAL_ASSETS.map(async path => {
      try {
        const response = await fetch(new Request(path, { cache: 'reload' }));
        if (response.ok) await cache.put(path, response);
      } catch (_) {
        // This optional asset is unavailable; continue installing.
      }
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('piano-grind-static-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first navigation: users get updates online and the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
        }
        return response;
      } catch (_) {
        return (await cache.match(request)) ||
          (await cache.match('./index.html')) ||
          (await cache.match('./')) ||
          Response.error();
      }
    })());
    return;
  }

  // Cache-first static assets, with a network update when not cached.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      event.waitUntil(fetch(request).then(response => {
        if (response && response.ok) return cache.put(request, response.clone());
      }).catch(() => {}));
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response && response.ok) {
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
    } catch (_) {
      try {
        payload = { body: event.data ? event.data.text() : '' };
      } catch (_) {}
    }

    const titleText = String(payload.title || 'Practice block complete');
    const title = titleText.startsWith('Piano Grind')
      ? titleText
      : `Piano Grind — ${titleText}`;
    const body = String(payload.body || 'Nice work. Take a breath, then continue.');

    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    for (const client of clients) {
      client.postMessage({ type: 'pg-push', title, body });
    }

    await self.registration.showNotification(title, {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/badge-96.png',
      tag: String(payload.tag || 'piano-grind-block'),
      renotify: true,
      data: { url: String(payload.url || './') }
    });
  })());
});

self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    for (const client of clients) {
      client.postMessage({ type: 'pg-resub' });
    }
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const scopeUrl = new URL(self.registration.scope);
    let target = new URL('./', scopeUrl);

    try {
      const requested = new URL(
        event.notification.data && event.notification.data.url || './',
        scopeUrl
      );
      if (
        requested.origin === scopeUrl.origin &&
        requested.pathname.startsWith(scopeUrl.pathname)
      ) {
        target = requested;
      }
    } catch (_) {}

    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    for (const client of clients) {
      if (new URL(client.url).origin !== target.origin) continue;
      if ('navigate' in client) {
        try {
          await client.navigate(target.href);
        } catch (_) {}
      }
      if ('focus' in client) await client.focus();
      return;
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(target.href);
    }
  })());
});
