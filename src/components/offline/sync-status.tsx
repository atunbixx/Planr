'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { syncManager } from '@/lib/offline/sync-manager';
import { offlineDb } from '@/lib/offline/db';

interface SyncStatusData {
  pending: number;
  errors: number;
  lastSync?: string;
}

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatusData>({
    pending: 0,
    errors: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const updateStatus = async () => {
      const status = await offlineDb.getSyncStatus();
      setSyncStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const result = await syncManager.forceSync();
      
      // Simulate progress
      const steps = 100;
      const stepDuration = 2000 / steps;
      
      for (let i = 0; i <= steps; i++) {
        setTimeout(() => {
          setSyncProgress(i);
          if (i === steps) {
            setIsSyncing(false);
            updateStatus();
          }
        }, i * stepDuration);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setIsSyncing(false);
    }
  };

  const updateStatus = async () => {
    const status = await offlineDb.getSyncStatus();
    setSyncStatus(status);
  };

  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff className="w-5 h-5 text-gray-400" />;
    if (isSyncing) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (syncStatus.errors > 0) return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    if (syncStatus.pending > 0) return <Cloud className="w-5 h-5 text-blue-500" />;
    return <Cloud className="w-5 h-5 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (syncStatus.errors > 0) return `${syncStatus.errors} sync errors`;
    if (syncStatus.pending > 0) return `${syncStatus.pending} pending`;
    return 'All synced';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-gray-500';
    if (syncStatus.errors > 0) return 'text-amber-600';
    if (syncStatus.pending > 0) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', getStatusColor())}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline text-sm">
            {getStatusText()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Sync Status</h4>
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Syncing
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync Now
                  </>
                )}
              </Button>
            )}
          </div>

          {isSyncing && (
            <div className="space-y-2">
              <Progress value={syncProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Syncing data... {syncProgress}%
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection</span>
              <span className={cn('font-medium', isOnline ? 'text-green-600' : 'text-red-600')}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {syncStatus.pending > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending changes</span>
                <span className="font-medium text-blue-600">
                  {syncStatus.pending}
                </span>
              </div>
            )}

            {syncStatus.errors > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sync errors</span>
                <span className="font-medium text-amber-600">
                  {syncStatus.errors}
                </span>
              </div>
            )}

            {syncStatus.lastSync && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last synced</span>
                <span className="font-medium">
                  {format(new Date(syncStatus.lastSync), 'MMM d, h:mm a')}
                </span>
              </div>
            )}
          </div>

          {!isOnline && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                You're working offline. Changes will sync when you're back online.
              </p>
            </div>
          )}

          {syncStatus.errors > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Some changes couldn't sync. They'll retry automatically.
              </p>
            </div>
          )}

          {isOnline && syncStatus.pending === 0 && syncStatus.errors === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" />
              All data is synced
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}