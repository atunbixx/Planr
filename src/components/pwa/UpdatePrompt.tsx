'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function UpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      // Reload the page when the new service worker takes control
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for updates every hour
    const checkInterval = setInterval(() => {
      if (registration) {
        registration.update();
      }
    }, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      clearInterval(checkInterval);
    };
  }, [registration]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      // Check if there's a waiting service worker
      if (reg.waiting) {
        setShowUpdatePrompt(true);
      }

      // Listen for new service workers
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is ready
            setShowUpdatePrompt(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    if (!registration?.waiting) return;

    // Tell the waiting service worker to take control
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    // Show again after 24 hours
    setTimeout(() => {
      if (registration?.waiting) {
        setShowUpdatePrompt(true);
      }
    }, 24 * 60 * 60 * 1000);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <Card className="bg-white shadow-lg border-0 max-w-sm">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Update Available</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  A new version of Wedding Planner is ready
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="Dismiss update prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleUpdate}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Update Now
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              Later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}