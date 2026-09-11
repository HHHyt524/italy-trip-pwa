const CACHE_NAME = 'italy-trip-v20';
const SHELL_ASSETS = ['./icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // External APIs / CDN: let browser handle normally
  if (url.includes('supabase.co') || url.includes('cdn.jsdelivr.net') || url.includes('unpkg.com') || url.includes('open-meteo.com')) {
    return;
  }
  // Static assets (icons, manifest): cache-first
  if (url.endsWith('.png') || url.endsWith('.json') || url.endsWith('.jpg')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }
  // HTML / root: network-first, bypass HTTP cache to always get latest
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
