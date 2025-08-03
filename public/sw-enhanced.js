// Enhanced Service Worker for Wedding Planner
const CACHE_VERSION = 'v2';
const CACHE_PREFIX = 'wedding-planner';

// Cache names
const CACHE_NAMES = {
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  RUNTIME: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
};

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// API endpoints to cache
const API_CACHE_ROUTES = [
  '/api/user/profile',
  '/api/vendors',
  '/api/budget',
  '/api/photos',
  '/api/messages',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Enhanced SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      console.log('[Enhanced SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.error('[Enhanced SW] Failed to cache:', err);
        return Promise.resolve();
      });
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Enhanced SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith(CACHE_PREFIX) && 
                   !Object.values(CACHE_NAMES).includes(cacheName);
          })
          .map((cacheName) => {
            console.log('[Enhanced SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle POST/PUT/DELETE with offline queue
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleMutationRequest(request));
    }
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle different types of requests
  if (request.mode === 'navigate') {
    // HTML pages - Network first with offline fallback
    event.respondWith(handleNavigationRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - Network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'image') {
    // Images - Cache first
    event.respondWith(handleImageRequest(request));
  } else {
    // Other static assets - Cache first
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.RUNTIME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Try network first with timeout
    const networkResponse = await fetchWithTimeout(request, 5000);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.API);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache for GET requests
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cache-Time', new Date().toISOString());
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }
    
    // Return offline error
    return new Response(JSON.stringify({
      error: 'offline',
      message: 'No internet connection. Cached data unavailable.',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle mutation requests (POST, PUT, DELETE)
async function handleMutationRequest(request) {
  try {
    // Try to send the request
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Queue the request for later
    await queueRequest(request);
    
    // Return queued response
    return new Response(JSON.stringify({
      queued: true,
      message: 'Your changes will be synced when you\'re back online',
      id: generateQueueId(),
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle image requests
async function handleImageRequest(request) {
  // Try cache first for images
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful image responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.IMAGES);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return placeholder image if available
    return new Response('', {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

// Handle static assets
async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAMES.STATIC);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Helper function for fetch with timeout
function fetchWithTimeout(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
}

// Queue failed requests for background sync
async function queueRequest(request) {
  const db = await openSyncDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const store = tx.objectStore('sync_queue');
  
  const queueData = {
    id: generateQueueId(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  await store.add(queueData);
}

// Open IndexedDB for sync queue
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wedding-planner-sync', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    };
  });
}

// Generate unique queue ID
function generateQueueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Background sync event
self.addEventListener('sync', async (event) => {
  console.log('[Enhanced SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

// Process queued requests
async function processSyncQueue() {
  const db = await openSyncDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const store = tx.objectStore('sync_queue');
  const requests = await store.getAll();
  
  for (const queuedRequest of requests) {
    try {
      const response = await fetch(queuedRequest.url, {
        method: queuedRequest.method,
        headers: queuedRequest.headers,
        body: queuedRequest.body,
      });
      
      if (response.ok) {
        // Remove from queue if successful
        await store.delete(queuedRequest.id);
        
        // Notify clients of successful sync
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'sync-success',
              id: queuedRequest.id,
              url: queuedRequest.url,
            });
          });
        });
      } else if (response.status >= 400 && response.status < 500) {
        // Client error - remove from queue
        await store.delete(queuedRequest.id);
      } else {
        // Server error - increment retry count
        queuedRequest.retryCount++;
        if (queuedRequest.retryCount > 3) {
          await store.delete(queuedRequest.id);
        } else {
          await store.put(queuedRequest);
        }
      }
    } catch (error) {
      console.error('[Enhanced SW] Sync failed:', error);
      // Keep in queue for later retry
    }
  }
}

// Periodic sync for data updates
self.addEventListener('periodicsync', (event) => {
  console.log('[Enhanced SW] Periodic sync:', event.tag);
  
  if (event.tag === 'update-data') {
    event.waitUntil(updateCachedData());
  }
});

// Update cached data periodically
async function updateCachedData() {
  const cache = await caches.open(CACHE_NAMES.API);
  
  // Update critical API endpoints
  for (const route of API_CACHE_ROUTES) {
    try {
      const response = await fetch(route);
      if (response.ok) {
        await cache.put(route, response);
      }
    } catch (error) {
      console.error(`[Enhanced SW] Failed to update ${route}:`, error);
    }
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Close' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Wedding Planner', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/dashboard';
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Message handling for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Pre-cache dynamic content based on user activity
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAMES.RUNTIME).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});