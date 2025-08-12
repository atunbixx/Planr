import { useEffect, useState } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isOffline: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    isUpdateAvailable: false,
    canInstall: false,
  });
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaStatus(prev => ({ ...prev, isInstalled: true }));
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPwaStatus(prev => ({ ...prev, canInstall: true }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setPwaStatus(prev => ({ 
        ...prev, 
        isInstalled: true, 
        canInstall: false 
      }));
      setDeferredPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () => {
      setPwaStatus(prev => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setPwaStatus(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setPwaStatus(prev => ({ ...prev, isUpdateAvailable: true }));
              
              // Show update notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Wedding Planner Update', {
                  body: 'A new version is available. Refresh to update.',
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-72x72.png',
                });
              }
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const installPWA = async () => {
    if (!deferredPrompt) {
      console.error('No installation prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
        return true;
      } else {
        console.log('PWA installation dismissed');
        return false;
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  };

  const updatePWA = () => {
    // Skip waiting and activate new service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  const syncOfflineData = async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-offline-data');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  };

  return {
    ...pwaStatus,
    installPWA,
    updatePWA,
    requestNotificationPermission,
    syncOfflineData,
  };
}

// Hook for offline data persistence
export function useOfflineStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isSynced, setIsSynced] = useState(true);

  useEffect(() => {
    // Load from IndexedDB on mount
    loadFromIndexedDB();
  }, [key]);

  const loadFromIndexedDB = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction('offline-data', 'readonly');
      const store = tx.objectStore('offline-data');
      const data = await store.get(key);
      
      if (data) {
        setValue(data.value);
        setIsSynced(data.synced);
      }
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
    }
  };

  const saveToIndexedDB = async (newValue: T, synced: boolean = false) => {
    try {
      const db = await openDB();
      const tx = db.transaction('offline-data', 'readwrite');
      const store = tx.objectStore('offline-data');
      
      await store.put({
        key,
        value: newValue,
        synced,
        timestamp: Date.now(),
      });
      
      setValue(newValue);
      setIsSynced(synced);
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
  };

  const sync = async () => {
    if (!navigator.onLine || isSynced) return;

    try {
      // This would be replaced with actual API sync logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await saveToIndexedDB(value, true);
      console.log(`Synced ${key} to server`);
    } catch (error) {
      console.error(`Failed to sync ${key}:`, error);
    }
  };

  return {
    value,
    setValue: (newValue: T) => saveToIndexedDB(newValue, navigator.onLine),
    isSynced,
    sync,
  };
}

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wedding-planner-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data', { keyPath: 'key' });
      }
    };
  });
}