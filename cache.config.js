// PWA Runtime Caching Configuration
module.exports = [
  {
    // Supabase API - Network First with cache fallback
    urlPattern: /^https:\/\/.+\.supabase\.co\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-api',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60, // 1 hour
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    // Images - Stale While Revalidate
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'images',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  {
    // Google Fonts - Cache First
    urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts',
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      },
    },
  },
  {
    // Static assets - Cache First
    urlPattern: /\.(?:js|css|woff2?)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'static-assets',
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  {
    // HTML pages - Network First
    urlPattern: /^https:\/\/.*\.html$/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'html-pages',
      networkTimeoutSeconds: 5,
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      },
    },
  },
  {
    // Vendor images from external sources
    urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'vendor-images',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      },
    },
  },
  {
    // PDF documents - Cache First
    urlPattern: /\.pdf$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'documents',
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
];