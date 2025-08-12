// Service Worker for Wedding Planner PWA
const CACHE_NAME = 'wedding-planner-v2';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// API routes to cache for offline access
const API_CACHE_ROUTES = [
  '/api/dashboard/stats',
  '/api/guests',
  '/api/vendors',
  '/api/budget',
  '/api/dashboard/day-of',
  '/api/dashboard/day-of/timeline',
  '/api/seating/layouts',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP(S) requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle other requests (static assets, etc.)
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      const shouldCache = API_CACHE_ROUTES.some(route => 
        request.url.includes(route)
      );
      
      if (shouldCache) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[ServiceWorker] Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: 'Offline - data may be outdated',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // If offline, return cached page or offline page
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return cache.match(OFFLINE_URL);
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return from cache, but also fetch and update cache in background
    fetchAndUpdateCache(request, cache);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// Fetch and update cache in background
async function fetchAndUpdateCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail - we already returned from cache
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  
  if (event.tag === 'sync-timeline-updates') {
    event.waitUntil(syncTimelineUpdates());
  } else if (event.tag === 'sync-vendor-checkins') {
    event.waitUntil(syncVendorCheckIns());
  } else if (event.tag === 'sync-guest-checkins') {
    event.waitUntil(syncGuestCheckIns());
  }
});

// Sync offline timeline updates
async function syncTimelineUpdates() {
  const db = await openIndexedDB();
  const tx = db.transaction('timeline-updates', 'readonly');
  const store = tx.objectStore('timeline-updates');
  const updates = await store.getAll();
  
  for (const update of updates) {
    try {
      await fetch(`/api/dashboard/day-of/timeline/${update.eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update.data),
      });
      
      // Remove synced update
      const deleteTx = db.transaction('timeline-updates', 'readwrite');
      await deleteTx.objectStore('timeline-updates').delete(update.id);
    } catch (error) {
      console.error('[ServiceWorker] Failed to sync timeline update:', error);
    }
  }
}

// Sync offline vendor check-ins
async function syncVendorCheckIns() {
  const db = await openIndexedDB();
  const tx = db.transaction('vendor-checkins', 'readonly');
  const store = tx.objectStore('vendor-checkins');
  const checkins = await store.getAll();
  
  for (const checkin of checkins) {
    try {
      await fetch(`/api/dashboard/day-of/vendors/${checkin.vendorId}/checkin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkin.data),
      });
      
      // Remove synced check-in
      const deleteTx = db.transaction('vendor-checkins', 'readwrite');
      await deleteTx.objectStore('vendor-checkins').delete(checkin.id);
    } catch (error) {
      console.error('[ServiceWorker] Failed to sync vendor check-in:', error);
    }
  }
}

// Sync offline guest check-ins
async function syncGuestCheckIns() {
  const db = await openIndexedDB();
  const tx = db.transaction('guest-checkins', 'readonly');
  const store = tx.objectStore('guest-checkins');
  const checkins = await store.getAll();
  
  for (const checkin of checkins) {
    try {
      await fetch(`/api/dashboard/day-of/guests/${checkin.guestId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkin.data),
      });
      
      // Remove synced check-in
      const deleteTx = db.transaction('guest-checkins', 'readwrite');
      await deleteTx.objectStore('guest-checkins').delete(checkin.id);
    } catch (error) {
      console.error('[ServiceWorker] Failed to sync guest check-in:', error);
    }
  }
}

// Open IndexedDB for offline storage
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wedding-planner-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for offline data
      if (!db.objectStoreNames.contains('timeline-updates')) {
        db.createObjectStore('timeline-updates', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('vendor-checkins')) {
        db.createObjectStore('vendor-checkins', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('guest-checkins')) {
        db.createObjectStore('guest-checkins', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    title: 'Wedding Planner Update',
    body: event.data ? event.data.text() : 'You have a new update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Update',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard/day-of')
    );
  }
});