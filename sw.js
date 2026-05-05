/* ═══════════════════════════════════════
   MIXTURA — Service Worker
   Gestion du cache hors-ligne
═══════════════════════════════════════ */

const CACHE_NAME = 'mixtura-v6.6';
const ASSETS = [
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png',
];

/* ── Installation : mise en cache des assets statiques (pas index.html) ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ── Activation : suppression des anciens caches + notif clients ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
     .then(() => self.clients.matchAll({type:'window'}))
     .then(clients => clients.forEach(c => c.postMessage({type:'SW_UPDATED'})))
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', event => {
  const req = event.request;

  // Laisser passer : non-GET, Supabase, CDN externes
  if (req.method !== 'GET') return;
  if (
    req.url.includes('supabase.co') ||
    req.url.includes('jsdelivr.net') ||
    req.url.includes('googleapis.com') ||
    req.url.includes('tesseract') ||
    req.url.includes('pdfjs-dist')
  ) return;

  // Network-first pour les navigations HTML (index.html)
  // → toujours la version fraîche quand on est en ligne
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first pour les assets statiques (icons, manifest, xlsx…)
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      });
    }).catch(() => {
      if (req.mode === 'navigate') return caches.match('./index.html');
    })
  );
});
