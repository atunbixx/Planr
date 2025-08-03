'use client';

import { useEffect, useState } from 'react';
import { Download, CheckCircle2, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  className?: string;
}

export function OfflineIndicator({ 
  showWhenOnline = false, 
  className 
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isPageCached, setIsPageCached] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    // Check if current page is cached
    if ('caches' in window) {
      caches.match(window.location.href).then((response) => {
        setIsPageCached(!!response);
      });
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showWhenOnline) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
        isOnline
          ? isPageCached
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
        className
      )}
    >
      {isOnline ? (
        isPageCached ? (
          <>
            <CheckCircle2 className="w-3 h-3" />
            <span>Available offline</span>
          </>
        ) : (
          <>
            <Download className="w-3 h-3" />
            <span>Caching for offline</span>
          </>
        )
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Offline mode</span>
        </>
      )}
    </div>
  );
}