const CACHE_NAME = 'italy-trip-v14';
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
  // Supabase / external CDN: let browser handle normally
  if (e.request.url.includes('supabase.co') || e.request.url.includes('cdn.jsdelivr.net') || e.request.url.includes('unpkg.com')) {
    return;
  }
  // Static assets (icons, manifest): cache-first
  if (e.request.url.endsWith('.png') || e.request.url.endsWith('.json')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }
  // HTML / root: network-first (always get latest)
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
