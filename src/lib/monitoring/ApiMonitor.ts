import { NextRequest, NextResponse } from 'next/server'
import { logger } from './Logger'
import { performanceMonitor } from '../cache/PerformanceMonitor'

export interface ApiMetrics {
  requestId: string
  method: string
  path: string
  statusCode: number
  duration: number
  memoryUsage: number
  timestamp: Date
  userId?: string
  userAgent?: string
  ip?: string
  errorMessage?: string
  cacheHit?: boolean
}

export class ApiMonitor {
  private static instance: ApiMonitor
  private metrics: ApiMetrics[] = []
  private readonly maxMetrics = 10000

  private constructor() {}

  static getInstance(): ApiMonitor {
    if (!ApiMonitor.instance) {
      ApiMonitor.instance = new ApiMonitor()
    }
    return ApiMonitor.instance
  }

  /**
   * Wrap API handler with monitoring
   */
  wrapHandler<T = any>(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
    routeName?: string
  ) {
    return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
      const requestId = this.generateRequestId()
      const startTime = performance.now()
      const startMemory = process.memoryUsage().heapUsed
      
      // Extract request info
      const method = request.method
      const path = routeName || new URL(request.url).pathname
      const userAgent = request.headers.get('user-agent') || undefined
      const ip = this.getClientIP(request)
      
      let response: NextResponse<T>
      let error: Error | undefined
      let userId: string | undefined

      try {
        // Add request ID to headers for tracing
        const modifiedRequest = new Request(request.url, {
          method: request.method,
          headers: {
            ...Object.fromEntries(request.headers.entries()),
            'x-request-id': requestId
          },
          body: request.body
        }) as NextRequest

        response = await handler(modifiedRequest, context)
        
        // Try to extract user ID from response or request
        userId = await this.extractUserId(request, response)
        
      } catch (err) {
        error = err as Error
        
        // Create error response
        response = NextResponse.json(
          { 
            error: 'Internal server error',
            requestId,
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 500 }
        ) as NextResponse<T>
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      const endMemory = process.memoryUsage().heapUsed
      const memoryDiff = endMemory - startMemory

      // Record metrics
      const metrics: ApiMetrics = {
        requestId,
        method,
        path,
        statusCode: response.status,
        duration,
        memoryUsage: memoryDiff,
        timestamp: new Date(),
        userId,
        userAgent,
        ip,
        errorMessage: error?.message
      }

      this.recordMetrics(metrics)

      // Log the API call
      logger.logApiCall(method, path, response.status, duration, {
        requestId,
        userId,
        memoryDiff,
        userAgent,
        ip,
        error: error?.message
      })

      // Record performance metrics
      performanceMonitor.recordQueryTime(`API:${method}:${path}`, duration, false)

      // Add monitoring headers to response
      response.headers.set('x-request-id', requestId)
      response.headers.set('x-response-time', `${duration.toFixed(2)}ms`)

      if (error) {
        logger.error(`API Error: ${method} ${path}`, error, {
          requestId,
          userId,
          statusCode: response.status,
          duration
        })
      }

      return response
    }
  }

  /**
   * Manual metrics recording
   */
  recordMetrics(metrics: ApiMetrics): void {
    this.metrics.push(metrics)
    
    // Maintain max metrics limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Get API metrics with filtering
   */
  getMetrics(filter?: {
    startTime?: Date
    endTime?: Date
    method?: string
    path?: string
    statusCode?: number
    userId?: string
    limit?: number
  }): ApiMetrics[] {
    let filtered = this.metrics

    if (filter) {
      if (filter.startTime) {
        filtered = filtered.filter(m => m.timestamp >= filter.startTime!)
      }
      
      if (filter.endTime) {
        filtered = filtered.filter(m => m.timestamp <= filter.endTime!)
      }
      
      if (filter.method) {
        filtered = filtered.filter(m => m.method === filter.method)
      }
      
      if (filter.path) {
        filtered = filtered.filter(m => m.path.includes(filter.path!))
      }
      
      if (filter.statusCode) {
        filtered = filtered.filter(m => m.statusCode === filter.statusCode)
      }
      
      if (filter.userId) {
        filtered = filtered.filter(m => m.userId === filter.userId)
      }
      
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit)
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Get API statistics
   */
  getStats(timeRange?: { startTime: Date; endTime: Date }) {
    const metrics = timeRange 
      ? this.getMetrics({ startTime: timeRange.startTime, endTime: timeRange.endTime })
      : this.metrics

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        requestsByMethod: {},
        requestsByPath: {},
        statusCodeDistribution: {},
        slowestEndpoints: [],
        errorsByPath: {},
        memoryUsage: { average: 0, peak: 0 }
      }
    }

    const totalRequests = metrics.length
    const averageResponseTime = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
    const errorCount = metrics.filter(m => m.statusCode >= 400).length
    const errorRate = errorCount / totalRequests

    // Group by method
    const requestsByMethod = metrics.reduce((acc, m) => {
      acc[m.method] = (acc[m.method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by path
    const requestsByPath = metrics.reduce((acc, m) => {
      acc[m.path] = (acc[m.path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Status code distribution
    const statusCodeDistribution = metrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // Slowest endpoints
    const endpointTimes = metrics.reduce((acc, m) => {
      const key = `${m.method} ${m.path}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(m.duration)
      return acc
    }, {} as Record<string, number[]>)

    const slowestEndpoints = Object.entries(endpointTimes)
      .map(([endpoint, times]) => ({
        endpoint,
        averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        maxTime: Math.max(...times),
        requestCount: times.length
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10)

    // Errors by path
    const errorsByPath = metrics
      .filter(m => m.statusCode >= 400)
      .reduce((acc, m) => {
        acc[m.path] = (acc[m.path] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    // Memory usage
    const memoryUsages = metrics.map(m => m.memoryUsage)
    const memoryUsage = {
      average: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
      peak: Math.max(...memoryUsages)
    }

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
      requestsByMethod,
      requestsByPath,
      statusCodeDistribution,
      slowestEndpoints,
      errorsByPath,
      memoryUsage: {
        average: Math.round(memoryUsage.average),
        peak: Math.round(memoryUsage.peak)
      }
    }
  }

  /**
   * Get real-time metrics for the last N minutes
   */
  getRealtimeStats(minutes: number = 5) {
    const endTime = new Date()
    const startTime = new Date(endTime.getTime() - minutes * 60 * 1000)
    
    return this.getStats({ startTime, endTime })
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      realtimeStats: this.getRealtimeStats(),
      metrics: this.metrics
    }, null, 2)
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return 'unknown'
  }

  private async extractUserId(request: NextRequest, response: NextResponse): Promise<string | undefined> {
    try {
      // Try to extract from Authorization header
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        // This would need to be customized based on your auth implementation
        return this.extractUserIdFromToken(authHeader)
      }

      // Try to extract from cookies
      const cookies = request.headers.get('cookie')
      if (cookies) {
        return this.extractUserIdFromCookies(cookies)
      }

      return undefined
    } catch (error) {
      return undefined
    }
  }

  private extractUserIdFromToken(authHeader: string): string | undefined {
    // Implementation depends on your authentication system
    // This is a placeholder - customize for your JWT/session handling
    return undefined
  }

  private extractUserIdFromCookies(cookies: string): string | undefined {
    // Implementation depends on your authentication system
    // This is a placeholder - customize for your cookie handling
    return undefined
  }
}

// Export singleton instance
export const apiMonitor = ApiMonitor.getInstance()

// Export decorator for easy use
export function MonitoredRoute(routeName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (request: NextRequest, ...args: any[]) {
      const monitor = ApiMonitor.getInstance()
      const wrappedHandler = monitor.wrapHandler(originalMethod.bind(this), routeName)
      return wrappedHandler(request, ...args)
    }
    
    return descriptor
  }
}