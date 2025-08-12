export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      // Wait for window load
      await new Promise<void>((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve());
        }
      });

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered successfully:', registration);

      // Check for updates immediately
      registration.update();

      // Check for updates periodically (every hour)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              // New service worker activated, show update prompt
              showUpdatePrompt();
            }
          });
        }
      });

      // Handle controller change (new SW taking over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload the page when a new service worker takes control
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        handleServiceWorkerMessage(event.data);
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

function showUpdatePrompt() {
  // In a real app, this would show a nice UI prompt
  const shouldReload = confirm(
    'A new version of the Wedding Planner app is available. Would you like to update?'
  );

  if (shouldReload) {
    // Tell the service worker to skip waiting
    navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
  }
}

function handleServiceWorkerMessage(data: any) {
  switch (data.type) {
    case 'CACHE_UPDATED':
      console.log('Cache updated:', data.payload);
      break;

    case 'OFFLINE_READY':
      console.log('App is ready for offline use');
      // Could show a notification to the user
      break;

    case 'BACKGROUND_SYNC_COMPLETE':
      console.log('Background sync completed:', data.payload);
      // Could update UI to reflect synced data
      break;

    default:
      console.log('Service Worker message:', data);
  }
}

// Check if app is running in standalone mode (installed PWA)
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
}

// Get service worker registration
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready;
  }
  return undefined;
}

// Request persistent storage
export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
    return isPersisted;
  }
  return false;
}

// Check storage estimate
export async function getStorageEstimate() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    console.log(`Storage usage: ${estimate.usage} of ${estimate.quota} bytes`);
    return estimate;
  }
  return null;
}