# PWA Implementation Guide

## Quick Start Implementation

### Step 1: Install Dependencies

```bash
npm install next-pwa workbox-window
npm install --save-dev @types/serviceworker
```

### Step 2: Create Service Worker Configuration

Create `public/sw.js`:

```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses - Network First
registerRoute(
  ({ url }) => url.origin === 'https://api.supabase.co',
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60, // 1 hour
        maxEntries: 50,
      }),
    ],
  })
);

// Cache images - Stale While Revalidate
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// Offline fallback page
const FALLBACK_URL = '/offline.html';
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(FALLBACK_URL);
      })
    );
  }
});

// Background sync for messages
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### Step 3: Create Web App Manifest

Create `public/manifest.json`:

```json
{
  "name": "Wedding Planner - Plan Your Perfect Day",
  "short_name": "WedPlan",
  "description": "Comprehensive wedding planning with vendor management, guest lists, and timeline planning",
  "start_url": "/dashboard",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f8f9fc",
  "theme_color": "#ff6b9d",
  "dir": "ltr",
  "lang": "en-US",
  "categories": ["lifestyle", "productivity", "events"],
  "iarc_rating_id": "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",
  "prefer_related_applications": false,
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard-mobile.png",
      "sizes": "412x915",
      "type": "image/png",
      "label": "Dashboard view"
    },
    {
      "src": "/screenshots/guest-list-mobile.png",
      "sizes": "412x915",
      "type": "image/png",
      "label": "Guest management"
    },
    {
      "src": "/screenshots/vendors-mobile.png",
      "sizes": "412x915",
      "type": "image/png",
      "label": "Vendor coordination"
    },
    {
      "src": "/screenshots/timeline-mobile.png",
      "sizes": "412x915",
      "type": "image/png",
      "label": "Wedding timeline"
    }
  ],
  "shortcuts": [
    {
      "name": "Guest List",
      "short_name": "Guests",
      "description": "View and manage guest list",
      "url": "/dashboard/guests",
      "icons": [{ "src": "/icons/guests-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Vendors",
      "short_name": "Vendors",
      "description": "Contact your vendors",
      "url": "/dashboard/vendors",
      "icons": [{ "src": "/icons/vendors-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Timeline",
      "short_name": "Timeline",
      "description": "Wedding day schedule",
      "url": "/dashboard/timeline",
      "icons": [{ "src": "/icons/timeline-96x96.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/dashboard/photos",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "photo",
          "accept": ["image/*"]
        }
      ]
    }
  }
}
```

### Step 4: Update Next.js Configuration

Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: require('./cache.config.js'),
  buildExcludes: [/middleware-manifest\.json$/],
  scope: '/',
  sw: 'sw.js',
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline'
  }
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
```

### Step 5: Create Offline Page

Create `src/app/offline/page.tsx`:

```tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">You're Offline</h1>
        <p className="text-gray-600 mb-8">
          It looks like you've lost your internet connection. Some features may be limited.
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">You can still access:</p>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✓ Guest List</li>
            <li>✓ Vendor Contacts</li>
            <li>✓ Wedding Timeline</li>
            <li>✓ Saved Photos</li>
          </ul>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-8 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

### Step 6: Create Install Prompt Component

Create `src/components/InstallPrompt.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Handle install prompt for non-iOS
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after a delay
      setTimeout(() => {
        if (!localStorage.getItem('installPromptDismissed')) {
          setShowPrompt(true);
        }
      }, 30000); // 30 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt
    if (isIOSDevice && !localStorage.getItem('iosInstallPromptDismissed')) {
      setTimeout(() => setShowPrompt(true), 30000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(isIOS ? 'iosInstallPromptDismissed' : 'installPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>
      
      <div className="flex items-center space-x-4">
        <img src="/icons/icon-96x96.png" alt="App Icon" className="w-16 h-16 rounded-xl" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Install Wedding Planner</h3>
          <p className="text-sm text-gray-600">
            {isIOS 
              ? 'Tap the share button and "Add to Home Screen"'
              : 'Install our app for quick access and offline features'
            }
          </p>
        </div>
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
```

### Step 7: Create Service Worker Registration Hook

Create `src/hooks/useServiceWorker.ts`:

```typescript
import { useEffect } from 'react';
import { Workbox } from 'workbox-window';

export function useServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;

      wb.addEventListener('activated', (event) => {
        console.log('Service worker activated', event);
      });

      wb.addEventListener('waiting', () => {
        // Show update prompt
        if (confirm('A new version is available! Click OK to update.')) {
          wb.messageSkipWaiting();
          wb.addEventListener('controlling', () => {
            window.location.reload();
          });
        }
      });

      wb.register();
    }
  }, []);
}
```

### Step 8: Update Layout with PWA Features

Update `src/app/layout.tsx` to include PWA meta tags and install prompt:

```tsx
import InstallPrompt from '@/components/InstallPrompt';
import { useServiceWorker } from '@/hooks/useServiceWorker';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WedPlan" />
        <meta name="theme-color" content="#ff6b9d" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/splash/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
      </head>
      <body>
        {/* Your existing providers and content */}
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
```

## Testing Your PWA

### 1. Lighthouse Audit
```bash
# Run in Chrome DevTools > Lighthouse tab
# Check PWA section for compliance
```

### 2. Manual Testing Checklist
- [ ] Service worker registers successfully
- [ ] App works offline
- [ ] Install prompt appears
- [ ] App installs correctly
- [ ] Push notifications work
- [ ] Background sync functions
- [ ] Icons display properly
- [ ] Splash screen shows (iOS)
- [ ] Status bar styled correctly

### 3. Cross-Platform Testing
- **Android**: Chrome, Firefox, Samsung Internet
- **iOS**: Safari (PWA limitations apply)
- **Desktop**: Chrome, Edge, Firefox

## Common Issues & Solutions

### Issue: Service Worker Not Registering
**Solution**: Ensure HTTPS in production, check console for errors

### Issue: Install Prompt Not Showing
**Solution**: Check manifest validity, ensure start_url is accessible

### Issue: iOS Installation Issues
**Solution**: Verify apple-specific meta tags, check icon formats

### Issue: Offline Page Not Working
**Solution**: Verify offline route exists, check service worker cache

## Performance Tips

1. **Optimize Images**
   - Use WebP format
   - Implement lazy loading
   - Multiple resolutions

2. **Minimize Bundle Size**
   - Code splitting
   - Tree shaking
   - Dynamic imports

3. **Cache Strategy**
   - Cache API responses intelligently
   - Implement cache expiration
   - Monitor storage quota

4. **Network Optimization**
   - Use HTTP/2
   - Enable compression
   - Implement prefetching