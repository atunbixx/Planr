'use client'

import { useEffect, useState } from 'react'
import { PerformanceMonitor } from '@/lib/performance'

interface PerformanceMetrics {
  fcp?: number
  lcp?: number
  fid?: number
  cls?: number
  loadTime?: number
  domContentLoaded?: number
}

export function PerformanceMonitorComponent() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    // Get initial performance metrics
    const getMetrics = async () => {
      const vitals = await PerformanceMonitor.getCoreWebVitals()
      
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      setMetrics({
        ...vitals,
        loadTime: navigation?.loadEventEnd - navigation?.navigationStart,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.navigationStart
      })
    }

    getMetrics()

    // Toggle visibility with keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null
  }

  const formatMetric = (value?: number) => {
    if (value === undefined) return 'N/A'
    return `${Math.round(value)}ms`
  }

  const getMetricColor = (value?: number, good?: number, poor?: number) => {
    if (!value || !good || !poor) return 'text-gray-500'
    if (value <= good) return 'text-green-600'
    if (value <= poor) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={getMetricColor(metrics.fcp, 1800, 3000)}>
            {formatMetric(metrics.fcp)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={getMetricColor(metrics.lcp, 2500, 4000)}>
            {formatMetric(metrics.lcp)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Load:</span>
          <span className={getMetricColor(metrics.loadTime, 2000, 4000)}>
            {formatMetric(metrics.loadTime)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>DCL:</span>
          <span className={getMetricColor(metrics.domContentLoaded, 1500, 3000)}>
            {formatMetric(metrics.domContentLoaded)}
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
        Press Shift+Alt+P to toggle
      </div>
    </div>
  )
}

export default PerformanceMonitorComponent