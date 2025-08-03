const CACHE_NAME = 'wedding-planner-v1';
const RUNTIME_CACHE = 'wedding-planner-runtime';

// Files to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/app/globals.css',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS).catch(err => {
        console.error('[Service Worker] Failed to cache:', err);
        // Don't fail installation if some resources can't be cached
        return Promise.resolve();
      });
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Claim all clients
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip API routes
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Network-first strategy for HTML pages
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Try cache
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // Return offline page
            return caches.match('/offline.html').then((offlineResponse) => {
              if (offlineResponse) {
                return offlineResponse;
              }
              // Last resort - return a basic offline response
              return new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain',
                }),
              });
            });
          });
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-rsvp') {
    event.waitUntil(syncRSVPData());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/badge-72x72.svg',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Wedding Planner', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/dashboard';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Sync RSVP data when online
async function syncRSVPData() {
  try {
    // Get any pending RSVP submissions from IndexedDB
    const pendingRSVPs = await getPendingRSVPs();
    
    for (const rsvp of pendingRSVPs) {
      try {
        const response = await fetch('/api/rsvp/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rsvp),
        });
        
        if (response.ok) {
          // Remove from pending queue
          await removePendingRSVP(rsvp.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync RSVP:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Sync messages when online
async function syncMessages() {
  try {
    // Get any pending messages from IndexedDB
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });
        
        if (response.ok) {
          // Remove from pending queue
          await removePendingMessage(message.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Message sync failed:', error);
  }
}

// Helper functions for IndexedDB (simplified placeholders)
async function getPendingRSVPs() {
  // This would interact with IndexedDB to get pending RSVPs
  return [];
}

async function removePendingRSVP(id) {
  // This would remove the RSVP from IndexedDB
}

async function getPendingMessages() {
  // This would interact with IndexedDB to get pending messages
  return [];
}

async function removePendingMessage(id) {
  // This would remove the message from IndexedDB
}

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});