const CACHE_NAME = 'wedding-planner-v1.0.0'
const OFFLINE_URL = '/offline.html'

const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/onboarding',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png'
]

const API_CACHE_URLS = [
  '/api/couples',
  '/api/notifications/send',
  '/api/checklist',
  '/api/budget/categories',
  '/api/guests'
]

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Install event')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('[SW] Static resources cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static resources:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request))
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  const cacheKey = `${url.pathname}${url.search}`
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses for API endpoints we care about
    if (networkResponse.ok && API_CACHE_URLS.some(pattern => url.pathname.startsWith(pattern))) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(cacheKey, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache:', url.pathname)
    
    // Fallback to cache
    const cachedResponse = await caches.match(cacheKey)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({
        error: 'You are offline. This data may be outdated.',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fallback to network
    const networkResponse = await fetch(request)
    
    // Cache the response if successful
    if (networkResponse.ok && request.url.startsWith(self.location.origin)) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Both cache and network failed for:', request.url)
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL)
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    // Return minimal offline response
    return new Response('You are offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag)
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions())
  }
})

// Sync offline actions when back online
async function syncOfflineActions() {
  console.log('[SW] Syncing offline actions')
  
  try {
    // Get offline actions from IndexedDB or cache
    const offlineActions = await getOfflineActions()
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        // Remove successful action from offline queue
        await removeOfflineAction(action.id)
        console.log('[SW] Synced offline action:', action.id)
      } catch (error) {
        console.error('[SW] Failed to sync offline action:', action.id, error)
      }
    }
  } catch (error) {
    console.error('[SW] Error syncing offline actions:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received')
  
  if (!event.data) {
    console.log('[SW] Push event has no data')
    return
  }
  
  try {
    const data = event.data.json()
    console.log('[SW] Push data:', data)
    
    const options = {
      body: data.body || data.message,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      tag: data.tag || 'wedding-notification',
      data: {
        url: data.url || '/dashboard',
        timestamp: data.timestamp || Date.now()
      },
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Wedding Planner', options)
    )
  } catch (error) {
    console.error('[SW] Error handling push notification:', error)
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.notification.tag, event.action)
  
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  const urlToOpen = event.notification.data?.url || '/dashboard'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Helper functions for offline actions (would need IndexedDB implementation)
async function getOfflineActions() {
  // TODO: Implement IndexedDB storage for offline actions
  return []
}

async function removeOfflineAction(id) {
  // TODO: Implement IndexedDB removal
  console.log('[SW] Would remove offline action:', id)
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data?.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      cached: true,
      version: CACHE_NAME
    })
  }
})

console.log('[SW] Service Worker loaded')