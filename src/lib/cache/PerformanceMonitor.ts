import { repositoryCache, userDataCache, statsCache } from './CacheManager'

export interface PerformanceMetrics {
  cacheHitRate: number
  avgQueryTime: number
  totalQueries: number
  cacheHits: number
  cacheMisses: number
  slowQueries: Array<{
    query: string
    duration: number
    timestamp: Date
  }>
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics
  private queryTimes: number[] = []
  private slowQueryThreshold = 1000 // 1 second

  private constructor() {
    this.metrics = {
      cacheHitRate: 0,
      avgQueryTime: 0,
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      slowQueries: []
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Record query execution time
   */
  recordQueryTime(queryName: string, duration: number, fromCache: boolean = false): void {
    this.metrics.totalQueries++
    this.queryTimes.push(duration)

    if (fromCache) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
    }

    // Update cache hit rate
    this.metrics.cacheHitRate = this.metrics.cacheHits / this.metrics.totalQueries

    // Update average query time
    this.metrics.avgQueryTime = this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length

    // Record slow queries
    if (duration > this.slowQueryThreshold && !fromCache) {
      this.metrics.slowQueries.push({
        query: queryName,
        duration,
        timestamp: new Date()
      })

      // Keep only last 100 slow queries
      if (this.metrics.slowQueries.length > 100) {
        this.metrics.slowQueries = this.metrics.slowQueries.slice(-100)
      }
    }

    // Keep only last 1000 query times for rolling average
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000)
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats() {
    return {
      repository: repositoryCache.getStats(),
      userData: userDataCache.getStats(),
      stats: statsCache.getStats(),
      performance: this.getMetrics()
    }
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.metrics = {
      cacheHitRate: 0,
      avgQueryTime: 0,
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      slowQueries: []
    }
    this.queryTimes = []
  }

  /**
   * Get performance recommendations based on metrics
   */
  getRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.metrics.cacheHitRate < 0.6) {
      recommendations.push('Cache hit rate is low. Consider increasing cache TTL or improving cache keys.')
    }

    if (this.metrics.avgQueryTime > 500) {
      recommendations.push('Average query time is high. Consider optimizing slow queries or adding indexes.')
    }

    if (this.metrics.slowQueries.length > 10) {
      recommendations.push('Multiple slow queries detected. Review query performance and database indexes.')
    }

    if (this.metrics.totalQueries > 10000) {
      recommendations.push('High query volume detected. Consider implementing more aggressive caching.')
    }

    return recommendations
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      cache: this.getCacheStats(),
      recommendations: this.getRecommendations()
    }
  }
}

/**
 * Decorator function to automatically track performance
 */
export function trackPerformance(queryName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const monitor = PerformanceMonitor.getInstance()

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now()
      
      try {
        const result = await method.apply(this, args)
        const duration = performance.now() - startTime
        
        // Check if result came from cache (simple heuristic)
        const fromCache = duration < 10 // Less than 10ms likely from cache
        
        monitor.recordQueryTime(`${target.constructor.name}.${propertyName}`, duration, fromCache)
        
        return result
      } catch (error) {
        const duration = performance.now() - startTime
        monitor.recordQueryTime(`${target.constructor.name}.${propertyName}:ERROR`, duration, false)
        throw error
      }
    }

    return descriptor
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()