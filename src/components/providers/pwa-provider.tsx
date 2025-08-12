'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker, isStandalone, requestPersistentStorage } from '@/lib/service-worker/register';
import { toast } from 'sonner';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    // Set initial online status
    if (typeof window !== 'undefined' && window.navigator) {
      setIsOffline(!navigator.onLine);
    }
    
    // Check if running as installed PWA
    setIsPWAInstalled(isStandalone());

    // Register service worker
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker()
        .then(() => {
          console.log('PWA initialized successfully');
          // Request persistent storage for offline data
          requestPersistentStorage();
        })
        .catch((error) => {
          console.error('PWA initialization failed:', error);
        });
    }

    // Handle online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('You are back online!');
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning('You are offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle app install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      (window as any).deferredPrompt = e;
      
      // Show custom install button/banner
      showInstallPrompt();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful app install
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      toast.success('Wedding Planner app installed successfully!');
      setIsPWAInstalled(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const showInstallPrompt = () => {
    // In a real app, this would show a custom UI element
    setTimeout(() => {
      if (!isPWAInstalled && (window as any).deferredPrompt) {
        toast('Install Wedding Planner app?', {
          duration: 10000,
          action: {
            label: 'Install',
            onClick: async () => {
              const deferredPrompt = (window as any).deferredPrompt;
              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User ${outcome} the install prompt`);
                (window as any).deferredPrompt = null;
              }
            }
          }
        });
      }
    }, 30000); // Show after 30 seconds
  };

  // Provide offline status to children via CSS class
  return (
    <div className={isOffline ? 'app-offline' : 'app-online'}>
      {children}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium">You're offline - Some features may be unavailable</p>
        </div>
      )}
    </div>
  );
}