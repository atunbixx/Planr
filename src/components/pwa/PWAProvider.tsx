'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import TopologyManager from './TopologyManager'

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register enhanced service worker with topology support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-enhanced-topology.js')
        .then((registration) => {
          console.log('Enhanced SW with topology support registered:', registration)
          
          // Initialize topology coordination
          initializeTopologyCoordination(registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  toast('App Update Available', {
                    description: 'A new version is ready. Refresh to update.',
                    action: {
                      label: 'Refresh',
                      onClick: () => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' })
                        window.location.reload()
                      }
                    },
                    duration: 10000
                  })
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('SW registration failed:', error)
        })

      // Listen for service worker messages including topology events
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'sync-success') {
          toast.success('Data synced successfully', {
            description: 'Your offline changes have been saved.',
            duration: 3000
          })
        } else if (event.data && event.data.type === 'topology-event') {
          handleTopologyEvent(event.data)
        }
      })

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }

    // Handle online/offline events
    const handleOnline = () => {
      toast.success('Back online!', {
        description: 'Your connection has been restored.',
        duration: 3000
      })
    }

    const handleOffline = () => {
      toast.warning('You\'re offline', {
        description: 'Some features may be limited until you reconnect.',
        duration: 5000
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Pre-cache critical routes based on user activity
    const preCacheRoutes = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
          const criticalRoutes = [
            '/dashboard',
            '/dashboard/photos',
            '/dashboard/vendors',
            '/dashboard/guests',
            '/dashboard/budget'
          ]
          
          navigator.serviceWorker.controller?.postMessage({
            type: 'CACHE_URLS',
            urls: criticalRoutes
          })
        })
      }
    }

    // Pre-cache after a delay to not interfere with initial load
    setTimeout(preCacheRoutes, 5000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Initialize topology coordination with service worker
  const initializeTopologyCoordination = async (registration: ServiceWorkerRegistration) => {
    try {
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      
      // Register main thread as coordinator agent
      const mainAgent = {
        id: 'main-thread',
        type: 'coordinator',
        capabilities: ['ui', 'user-interaction', 'data-presentation'],
        load: 0.2,
        performance: {
          responseTime: 16, // 60fps = ~16ms per frame
          successRate: 0.98,
          throughput: 5.0
        }
      }
      
      if (registration.active) {
        registration.active.postMessage({
          type: 'topology-register-agent',
          data: { agent: mainAgent }
        })
      }
      
      console.log('Topology coordination initialized')
      
    } catch (error) {
      console.error('Failed to initialize topology coordination:', error)
    }
  }

  // Handle topology events from service worker
  const handleTopologyEvent = (eventData: any) => {
    const { eventType, data } = eventData
    
    switch (eventType) {
      case 'topology-optimized':
        toast.success('Network Optimized', {
          description: `Hive-mind efficiency: ${(data.metrics.efficiency * 100).toFixed(1)}%`,
          duration: 3000
        })
        break
        
      case 'agent-failed':
        toast.warning('Network Node Failed', {
          description: `Agent ${data.agentId} disconnected - network healing initiated`,
          duration: 5000
        })
        break
        
      case 'agent-registered':
        toast.info('New Network Node', {
          description: `Agent ${data.agentId} joined the hive-mind`,
          duration: 3000
        })
        break
        
      default:
        console.log('Topology event:', eventType, data)
    }
  }

  return (
    <TopologyManager 
      config={{
        type: 'hybrid',
        maxNodes: 20,
        healingEnabled: true,
        targetEfficiency: 0.8
      }}
      enableVisualization={false}
    >
      {children}
    </TopologyManager>
  )
}