'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New update available
                    toast.info('New version available!', {
                      duration: Infinity,
                      action: {
                        label: 'Update',
                        onClick: () => {
                          newWorker.postMessage({ type: 'SKIP_WAITING' });
                          window.location.reload();
                        },
                      },
                    });
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle controller change
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Request persistent storage
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((granted) => {
          if (granted) {
            console.log('Persistent storage granted');
          }
        });
      }

      // Request notification permission for push notifications only in production
      if (process.env.NODE_ENV === 'production' && 'Notification' in window && Notification.permission === 'default') {
        // Don't request immediately, wait for user interaction
        const requestNotificationPermission = () => {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              console.log('Notification permission granted');
            }
          });
        };

        // Add to a user interaction event
        document.addEventListener('click', requestNotificationPermission, { once: true });
      }

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'sync-success') {
          toast.success('Changes synced successfully');
        }
      });

      // Pre-cache important routes only in production
      if (process.env.NODE_ENV === 'production' && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_URLS',
          urls: [
            '/dashboard',
            '/vendors',
            '/budget',
            '/photos',
            '/messages',
          ],
        });
      }
    }
  }, []);

  return <>{children}</>;
}