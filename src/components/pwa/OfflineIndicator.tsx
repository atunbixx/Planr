'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SyncStatus {
  isOnline: boolean
  pendingSync: number
  lastSyncTime?: Date
  syncInProgress: boolean
}

export default function OfflineIndicator() {
  // Allow disabling via environment variable for testing
  if (process.env.NEXT_PUBLIC_DISABLE_OFFLINE_INDICATOR === 'true') {
    return null
  }

  // Temporary disable to prevent infinite loops during development
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingSync: 0,
    syncInProgress: false
  })

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    let isMounted = true // Prevent state updates after unmount

    const updateOnlineStatus = () => {
      if (isMounted) {
        setSyncStatus(prev => ({
          ...prev,
          isOnline: navigator.onLine
        }))
      }
    }

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'sync-success' && isMounted) {
        setSyncStatus(prev => ({
          ...prev,
          pendingSync: Math.max(0, prev.pendingSync - 1),
          lastSyncTime: new Date(),
          syncInProgress: false
        }))
      }
    }

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    // Check for pending sync items periodically with debouncing
    let pendingSyncTimeout: NodeJS.Timeout | null = null
    
    const checkPendingSync = async () => {
      if (!isMounted || typeof window === 'undefined' || !('indexedDB' in window)) return
      
      try {
        // Debounce to prevent rapid state updates
        if (pendingSyncTimeout) {
          clearTimeout(pendingSyncTimeout)
        }
        
        pendingSyncTimeout = setTimeout(async () => {
          if (!isMounted) return
          
          try {
            const request = indexedDB.open('wedding-planner-sync', 1)
            request.onsuccess = () => {
              if (!isMounted) return
              
              const db = request.result
              if (db.objectStoreNames.contains('sync_queue')) {
                const tx = db.transaction('sync_queue', 'readonly')
                const store = tx.objectStore('sync_queue')
                const countRequest = store.count()
                countRequest.onsuccess = () => {
                  if (isMounted) {
                    setSyncStatus(prev => {
                      // Only update if the count actually changed
                      if (prev.pendingSync !== countRequest.result) {
                        return {
                          ...prev,
                          pendingSync: countRequest.result
                        }
                      }
                      return prev
                    })
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error checking pending sync:', error)
          }
        }, 100) // 100ms debounce
      } catch (error) {
        console.error('Error setting up pending sync check:', error)
      }
    }

    // Check immediately (with delay) and then every 30 seconds
    const initialTimeout = setTimeout(checkPendingSync, 1000) // Initial delay
    const syncInterval = setInterval(checkPendingSync, 30000)

    return () => {
      isMounted = false
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', updateOnlineStatus)
        window.removeEventListener('offline', updateOnlineStatus)
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
      
      clearTimeout(initialTimeout)
      clearInterval(syncInterval)
      if (pendingSyncTimeout) {
        clearTimeout(pendingSyncTimeout)
      }
    }
  }, [])

  const handleRetrySync = async () => {
    if (!syncStatus.isOnline || typeof window === 'undefined') return

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }))

    try {
      // Trigger background sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        // Check if sync is available and register
        if ('sync' in registration) {
          await (registration as any).sync.register('sync-queue')
        }
      }
    } catch (error) {
      console.error('Error triggering sync:', error)
    }

    // Reset sync in progress after a delay
    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }))
    }, 2000)
  }

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="w-3 h-3" />
    }
    if (syncStatus.syncInProgress) {
      return <RefreshCw className="w-3 h-3 animate-spin" />
    }
    if (syncStatus.pendingSync > 0) {
      return <AlertCircle className="w-3 h-3" />
    }
    return <CheckCircle2 className="w-3 h-3" />
  }

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return syncStatus.pendingSync > 0 
        ? `Offline • ${syncStatus.pendingSync} pending`
        : 'Offline'
    }
    if (syncStatus.syncInProgress) {
      return 'Syncing...'
    }
    if (syncStatus.pendingSync > 0) {
      return `${syncStatus.pendingSync} pending sync`
    }
    return 'Online'
  }

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!syncStatus.isOnline) return 'destructive'
    if (syncStatus.pendingSync > 0) return 'secondary'
    return 'default'
  }

  // Only show when offline or there are pending syncs
  if (syncStatus.isOnline && syncStatus.pendingSync === 0 && !syncStatus.syncInProgress) {
    return null
  }

  // Debug: Log current status (remove in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('OfflineIndicator status:', {
      isOnline: syncStatus.isOnline,
      pendingSync: syncStatus.pendingSync,
      syncInProgress: syncStatus.syncInProgress,
      navigatorOnline: typeof navigator !== 'undefined' ? navigator.onLine : 'N/A'
    })
  }

  return (
    <div className="fixed top-16 right-4 z-40 md:top-4 md:right-4">
      <div className="flex items-center gap-2">
        <Badge 
          variant={getStatusVariant()}
          className="flex items-center gap-1.5 px-2 py-1"
        >
          {getStatusIcon()}
          <span className="text-xs font-medium">{getStatusText()}</span>
        </Badge>
        
        {syncStatus.isOnline && syncStatus.pendingSync > 0 && !syncStatus.syncInProgress && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetrySync}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Sync
          </Button>
        )}
      </div>
      
      {syncStatus.lastSyncTime && (
        <div className="mt-1 text-right">
          <span className="text-xs text-muted-foreground">
            Last sync: {syncStatus.lastSyncTime.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  )
}