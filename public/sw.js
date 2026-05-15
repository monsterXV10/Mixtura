// Service Worker de transition — vide les anciens caches mixtura-v* et se désactive
// Remplace le SW vanilla JS v8.x pour éviter que l'ancienne app soit servie hors-ligne

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', async () => {
  const keys = await caches.keys()
  await Promise.all(keys.map(k => caches.delete(k)))
  await self.clients.claim()
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach(c => c.navigate(c.url))
})

// Aucune interception des requêtes — Next.js gère tout
self.addEventListener('fetch', () => {})
