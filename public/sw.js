// public/sw.js
const CACHE = 'v2'; // bump pra invalidar cache antigo
const APP_SHELL = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Não intercepta assets do Next/HMR (inclui hot updates)
  if (url.pathname.startsWith('/_next/') || url.pathname.includes('hot-update')) {
    return; // deixa a rede cuidar
  }

  // Cache-first simples para demais recursos do mesmo domínio
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (req.method === 'GET' && fresh.ok) {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        return cached || new Response('Offline', { status: 503 });
      }
    })());
  }
});