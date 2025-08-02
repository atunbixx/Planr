'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isOnline: boolean;
  className?: string;
}

export function ConnectionStatus({ isOnline, className }: ConnectionStatusProps) {
  const [showStatus, setShowStatus] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowStatus(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "back online" message briefly
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!showStatus) return null;

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium text-center transition-all duration-300',
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white',
        className
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>No internet connection. Messages will be sent when you're back online.</span>
          </>
        )}
      </div>
    </div>
  );
}