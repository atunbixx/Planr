'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PerformanceMetrics {
  pageLoadTime: number
  timeToInteractive: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  memoryUsage?: number
}

export function PerformanceMonitor({ show = false }: { show?: boolean }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0] as any

      const newMetrics: PerformanceMetrics = {
        pageLoadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
        timeToInteractive: navigation?.domInteractive - navigation?.fetchStart || 0,
        firstContentfulPaint: fcp?.startTime || 0,
        largestContentfulPaint: lcp?.startTime || 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
      }

      // Get memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory
        newMetrics.memoryUsage = memory.usedJSHeapSize / 1048576 // Convert to MB
      }

      // Observe CLS
      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          let cls = 0
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value
            }
          }
          setMetrics(prev => prev ? { ...prev, cumulativeLayoutShift: cls } : null)
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })
      } catch (e) {
        console.debug('CLS observation not supported')
      }

      // Observe FID
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const firstInput = entryList.getEntries()[0] as any
          if (firstInput) {
            setMetrics(prev => prev ? { 
              ...prev, 
              firstInputDelay: firstInput.processingStart - firstInput.startTime 
            } : null)
          }
        })
        fidObserver.observe({ type: 'first-input', buffered: true })
      } catch (e) {
        console.debug('FID observation not supported')
      }

      setMetrics(newMetrics)
    }

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      collectMetrics()
    } else {
      window.addEventListener('load', collectMetrics)
      return () => window.removeEventListener('load', collectMetrics)
    }
  }, [])

  // Keyboard shortcut to toggle visibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible || !metrics) return null

  const getScoreColor = (value: number, thresholds: { good: number; needs: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.needs) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (value: number, thresholds: { good: number; needs: number }) => {
    if (value <= thresholds.good) return <Badge className="bg-green-100">Good</Badge>
    if (value <= thresholds.needs) return <Badge className="bg-yellow-100">Needs Improvement</Badge>
    return <Badge className="bg-red-100">Poor</Badge>
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            Performance Metrics
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span>Page Load</span>
            <div className="flex items-center gap-2">
              <span className={getScoreColor(metrics.pageLoadTime, { good: 1000, needs: 3000 })}>
                {metrics.pageLoadTime.toFixed(0)}ms
              </span>
              {getScoreBadge(metrics.pageLoadTime, { good: 1000, needs: 3000 })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span>Time to Interactive</span>
            <div className="flex items-center gap-2">
              <span className={getScoreColor(metrics.timeToInteractive, { good: 3800, needs: 7300 })}>
                {metrics.timeToInteractive.toFixed(0)}ms
              </span>
              {getScoreBadge(metrics.timeToInteractive, { good: 3800, needs: 7300 })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span>First Contentful Paint</span>
            <div className="flex items-center gap-2">
              <span className={getScoreColor(metrics.firstContentfulPaint, { good: 1800, needs: 3000 })}>
                {metrics.firstContentfulPaint.toFixed(0)}ms
              </span>
              {getScoreBadge(metrics.firstContentfulPaint, { good: 1800, needs: 3000 })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span>Largest Contentful Paint</span>
            <div className="flex items-center gap-2">
              <span className={getScoreColor(metrics.largestContentfulPaint, { good: 2500, needs: 4000 })}>
                {metrics.largestContentfulPaint.toFixed(0)}ms
              </span>
              {getScoreBadge(metrics.largestContentfulPaint, { good: 2500, needs: 4000 })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span>Cumulative Layout Shift</span>
            <div className="flex items-center gap-2">
              <span className={getScoreColor(metrics.cumulativeLayoutShift, { good: 0.1, needs: 0.25 })}>
                {metrics.cumulativeLayoutShift.toFixed(3)}
              </span>
              {getScoreBadge(metrics.cumulativeLayoutShift, { good: 0.1, needs: 0.25 })}
            </div>
          </div>

          {metrics.firstInputDelay > 0 && (
            <div className="flex justify-between items-center">
              <span>First Input Delay</span>
              <div className="flex items-center gap-2">
                <span className={getScoreColor(metrics.firstInputDelay, { good: 100, needs: 300 })}>
                  {metrics.firstInputDelay.toFixed(0)}ms
                </span>
                {getScoreBadge(metrics.firstInputDelay, { good: 100, needs: 300 })}
              </div>
            </div>
          )}

          {metrics.memoryUsage && (
            <div className="flex justify-between items-center pt-2 border-t">
              <span>Memory Usage</span>
              <span>{metrics.memoryUsage.toFixed(1)} MB</span>
            </div>
          )}

          <div className="pt-2 text-xs text-gray-500 text-center">
            Press Ctrl+Shift+P to toggle
          </div>
        </CardContent>
      </Card>
    </div>
  )
}