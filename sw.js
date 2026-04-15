/* âââââââââââââââââââââââââââââââââââââââ
   MIXTURA â Service Worker
   Gestion du cache hors-ligne
âââââââââââââââââââââââââââââââââââââââ */

const CACHE_NAME = 'mixtura-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* ââ Installation : mise en cache des assets ââ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ââ Activation : suppression des anciens caches ââ */
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
  self.clients.claim();
});

/* ââ Fetch : cache-first pour les assets, network-first pour Firebase ââ */
self.addEventListener('fetch', event => {
  // Laisser passer les requÃªtes Firebase / API (rÃ©seau uniquement)
  if (
    event.request.url.includes('firebaseapp.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firestore.googleapis.com')
  ) {
    return; // pas d'interception
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
