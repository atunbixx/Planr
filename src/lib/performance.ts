// Performance optimization utilities
import { cache, getCacheKey, CACHE_TTL } from './cache'

/**
 * Database query optimization helper
 * Combines multiple queries into single operations where possible
 */
export class QueryOptimizer {
  /**
   * Batch multiple Prisma queries to reduce database roundtrips
   */
  static async batchQueries<T>(queries: Promise<T>[]): Promise<T[]> {
    return await Promise.all(queries)
  }

  /**
   * Cache-first query wrapper
   */
  static async cachedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Execute query and cache result
    const result = await queryFn()
    cache.set(cacheKey, result, ttl)
    return result
  }

  /**
   * Optimized pagination with cursor-based approach
   */
  static createCursorPagination(
    take: number = 20,
    cursor?: string
  ) {
    return {
      take,
      ...(cursor && { 
        cursor: { id: cursor },
        skip: 1 // Skip the cursor itself
      })
    }
  }
}

/**
 * Bundle size optimization utilities
 */
export class BundleOptimizer {
  /**
   * Check if we're in a browser environment
   */
  static get isBrowser(): boolean {
    return typeof window !== 'undefined'
  }

  /**
   * Lazy load module only when needed
   */
  static async importOnDemand<T>(
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    const module = await importFn()
    return module.default
  }

  /**
   * Preload critical resources
   */
  static preloadResource(href: string, as: string = 'script') {
    if (!this.isBrowser) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  /**
   * Generate responsive image sizes
   */
  static generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ')
  }

  /**
   * Create optimized Cloudinary URL
   */
  static optimizeCloudinaryUrl(
    url: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'avif' | 'auto'
    } = {}
  ): string {
    if (!url.includes('cloudinary')) return url

    const { width, height, quality = 80, format = 'auto' } = options
    const transformations = [
      format && `f_${format}`,
      quality && `q_${quality}`,
      width && `w_${width}`,
      height && `h_${height}`,
      'c_fill' // Crop and fill
    ].filter(Boolean).join(',')

    return url.replace('/upload/', `/upload/${transformations}/`)
  }

  /**
   * Create blur data URL for placeholder
   */
  static createBlurDataURL(width: number = 10, height: number = 10): string {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="url(#gradient)"/>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
    `
    const base64 = Buffer.from(svg).toString('base64')
    return `data:image/svg+xml;base64,${base64}`
  }
}

/**
 * React component performance utilities
 */
export class ComponentOptimizer {
  /**
   * Create a memoized callback with dependencies
   */
  static createStableCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ) {
    return React.useCallback(callback, deps)
  }

  /**
   * Debounce function calls to prevent excessive re-renders
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }) as T
  }

  /**
   * Throttle function calls for performance
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T {
    let lastCall = 0
    return ((...args: any[]) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return func(...args)
      }
    }) as T
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>()

  /**
   * Start timing an operation
   */
  static startTiming(label: string): void {
    this.marks.set(label, performance.now())
  }

  /**
   * End timing and return duration
   */
  static endTiming(label: string): number {
    const start = this.marks.get(label)
    if (!start) return 0

    const duration = performance.now() - start
    this.marks.delete(label)
    return duration
  }

  /**
   * Measure and log performance metrics
   */
  static measureOperation<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.startTiming(label)
      
      try {
        const result = await operation()
        const duration = this.endTiming(label)
        
        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ ${label}: ${duration.toFixed(2)}ms`)
        }
        
        resolve(result)
      } catch (error) {
        this.endTiming(label)
        reject(error)
      }
    })
  }

  /**
   * Get Core Web Vitals if available
   */
  static getCoreWebVitals(): Promise<{
    fcp?: number
    lcp?: number
    fid?: number
    cls?: number
  }> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve({})
        return
      }

      const vitals: any = {}

      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint')
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      if (fcp) vitals.fcp = fcp.startTime

      // Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        vitals.lcp = lastEntry.startTime
      })
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // LCP not supported
      }

      // Return current vitals after a short delay
      setTimeout(() => {
        observer.disconnect?.()
        resolve(vitals)
      }, 3000)
    })
  }
}

// React performance hooks
import React from 'react'

/**
 * Hook for debouncing values to prevent excessive re-renders
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(label: string) {
  const renderCount = React.useRef(0)
  const lastRenderTime = React.useRef(performance.now())

  React.useEffect(() => {
    renderCount.current += 1
    const now = performance.now()
    const timeSinceLastRender = now - lastRenderTime.current
    lastRenderTime.current = now

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔄 ${label} render #${renderCount.current} (${timeSinceLastRender.toFixed(2)}ms since last)`
      )
    }
  })
}

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

