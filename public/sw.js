const CACHE_NAME = 'pepos-cake-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Gracefully handle cache failures
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          return caches.match('/index.html')
        })
    })
  )
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    event.waitUntil(syncLocations())
  }
})

async function syncLocations() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()
    const locationRequests = requests.filter((req) => req.url.includes('locations'))

    for (const request of locationRequests) {
      try {
        await fetch(request.clone())
      } catch (error) {
        console.error('Failed to sync location:', error)
      }
    }
  } catch (error) {
    console.error('Sync error:', error)
  }
}
