/* ═══════════════════════════════════════
   MIXTURA — Service Worker
   Gestion du cache hors-ligne
═══════════════════════════════════════ */

const CACHE_NAME = 'mixtura-v8.3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './supabase.min.js',
  './xlsx.mini.min.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon-32.png',
];

/* ── Installation : mise en cache des assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ── Activation : suppression des anciens caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim().then(()=>{
    self.clients.matchAll({type:'window'}).then(clients=>{
      clients.forEach(c=>c.postMessage({type:'SW_UPDATED'}));
    });
  });
});

/* ── Fetch : cache-first pour les assets, réseau direct pour les APIs ── */
self.addEventListener('fetch', event => {
  // Ne jamais intercepter les requêtes vers des APIs externes
  const url = event.request.url;
  if (
    url.includes('supabase.co') ||
    url.includes('firebaseapp.com') ||
    url.includes('googleapis.com') ||
    url.includes('firestore.googleapis.com') ||
    url.includes('vercel-insights') ||
    url.includes('/_vercel/')
  ) {
    return; // réseau direct, pas de cache
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Mettre en cache les nouvelles ressources statiques
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Hors-ligne : retourner index.html pour les navigations
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});