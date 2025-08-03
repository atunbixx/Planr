'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(true);
      setShowStatus(true);
      
      // Hide status after 3 seconds
      setTimeout(() => {
        setShowStatus(false);
        setIsReconnecting(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={cn(
            'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
            'px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm',
            'flex items-center gap-2 text-sm font-medium',
            isOnline
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          )}
        >
          {isOnline ? (
            <>
              {isReconnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reconnecting...</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Back online</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You're offline</span>
              <AlertCircle className="w-4 h-4" />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}