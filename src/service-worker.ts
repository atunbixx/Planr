/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { registerRoute, NavigationRoute, Route } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { BackgroundSyncPlugin, Queue } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Version for cache busting
const CACHE_VERSION = 'v2';
const CACHE_PREFIX = 'wedding-planner';

// Cache names
const CACHE_NAMES = {
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  RUNTIME: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
};

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();
clientsClaim();

// Skip waiting when new service worker is available
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync queues for different data types
const vendorQueue = new Queue('vendor-sync', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('Synced vendor request:', entry.request.url);
      } catch (error) {
        console.error('Failed to sync vendor request:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

const budgetQueue = new Queue('budget-sync', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('Synced budget request:', entry.request.url);
      } catch (error) {
        console.error('Failed to sync budget request:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

const messageQueue = new Queue('message-sync', {
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        console.log('Synced message request:', entry.request.url);
      } catch (error) {
        console.error('Failed to sync message request:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Cache strategies for different route types

// HTML pages - Network First with offline fallback
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: CACHE_NAMES.STATIC,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        maxEntries: 50,
      }),
    ],
    networkTimeoutSeconds: 3,
  })
);

// Static assets (JS, CSS) - Cache First
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.url.includes('/_next/static/'),
  new CacheFirst({
    cacheName: CACHE_NAMES.STATIC,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 100,
      }),
    ],
  })
);

// Images - Cache First with expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_NAMES.IMAGES,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        maxEntries: 100,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// API Routes - Network First with offline support and background sync
// GET requests - Use cache when offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && url.searchParams.get('method') !== 'POST',
  new NetworkFirst({
    cacheName: CACHE_NAMES.API,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 5 * 60, // 5 minutes
        maxEntries: 50,
      }),
    ],
    networkTimeoutSeconds: 5,
  })
);

// POST/PUT/DELETE requests - Queue for background sync
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin API requests
  if (!url.pathname.startsWith('/api/') || url.origin !== location.origin) {
    return;
  }

  // Handle mutation requests
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    const clonedRequest = request.clone();

    event.respondWith(
      fetch(request).catch(async () => {
        // Queue the request based on the endpoint
        if (url.pathname.includes('/vendor')) {
          await vendorQueue.pushRequest({ request: clonedRequest });
        } else if (url.pathname.includes('/budget')) {
          await budgetQueue.pushRequest({ request: clonedRequest });
        } else if (url.pathname.includes('/message')) {
          await messageQueue.pushRequest({ request: clonedRequest });
        }

        // Return a response indicating the request was queued
        return new Response(
          JSON.stringify({
            offline: true,
            queued: true,
            message: 'Your changes will be synced when you\'re back online',
          }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
  }
});

// Handle offline fallback
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html') || 
          new Response('You are offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('Wedding Planner', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Periodic background sync for data updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-vendors') {
    event.waitUntil(updateVendorsCache());
  } else if (event.tag === 'update-budget') {
    event.waitUntil(updateBudgetCache());
  }
});

// Helper functions for periodic sync
async function updateVendorsCache() {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const response = await fetch('/api/vendors');
    if (response.ok) {
      await cache.put('/api/vendors', response);
    }
  } catch (error) {
    console.error('Failed to update vendors cache:', error);
  }
}

async function updateBudgetCache() {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    const response = await fetch('/api/budget');
    if (response.ok) {
      await cache.put('/api/budget', response);
    }
  } catch (error) {
    console.error('Failed to update budget cache:', error);
  }
}

// Export types for TypeScript
export {};