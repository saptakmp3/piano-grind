/* Piano Grind PWA service worker — same-origin cache + block-finish push alerts. */
'use strict';
const CACHE_NAME = 'piano-grind-static-v3';
const CORE_ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icons/favicon-16.png', './icons/favicon-32.png', './icons/badge-96.png',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async path => {
      try { await cache.add(new Request(path, { cache: 'reload' })); }
      catch (error) { /* One missing optional alias should not prevent installation. */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('piano-grind-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never cache APIs or push backend calls

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
      } catch (error) {
        return (await cache.match(request)) || (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const update = fetch(request).then(response => {
      if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    }).catch(() => null);
    return cached || (await update) || Response.error();
  })());
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; }
    catch (error) { try { payload = { body: event.data ? event.data.text() : '' }; } catch (_) {} }
    const titleText = String(payload.title || 'Practice block complete');
    const title = titleText.startsWith('Piano Grind') ? titleText : `Piano Grind — ${titleText}`;
    const body = String(payload.body || 'Nice work. Take a breath, then continue.');
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: 'pg-push', title, body });
    await self.registration.showNotification(title, {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/badge-96.png',
      tag: payload.tag || 'piano-grind-block',
      renotify: true,
      data: { url: payload.url || './' }
    });
  })());
});

self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: 'pg-resub' });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const scopeUrl = new URL(self.registration.scope);
    let target = new URL('./', scopeUrl);
    try {
      const requested = new URL(event.notification.data && event.notification.data.url || './', scopeUrl);
      if (requested.origin === scopeUrl.origin && requested.pathname.startsWith(scopeUrl.pathname)) target = requested;
    } catch (_) {}
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if ('focus' in client) {
        if ('navigate' in client && new URL(client.url).origin === target.origin) {
          try { await client.navigate(target.href); } catch (_) {}
        }
        await client.focus();
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target.href);
  })());
});
