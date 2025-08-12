import { prisma } from './prisma'

interface QueryPerformance {
  operation: string
  duration: number
  timestamp: Date
  success: boolean
  error?: string
}

class DatabasePerformanceMonitor {
  private static instance: DatabasePerformanceMonitor
  private queryMetrics: QueryPerformance[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 queries

  private constructor() {
    // Set up Prisma query logging in development
    if (process.env.NODE_ENV === 'development') {
      this.setupQueryLogging()
    }
  }

  static getInstance(): DatabasePerformanceMonitor {
    if (!DatabasePerformanceMonitor.instance) {
      DatabasePerformanceMonitor.instance = new DatabasePerformanceMonitor()
    }
    return DatabasePerformanceMonitor.instance
  }

  private setupQueryLogging() {
    // Note: This requires Prisma to be configured with log: ['query']
    prisma.$on('query' as any, (e: any) => {
      this.recordQuery({
        operation: this.normalizeQuery(e.query),
        duration: e.duration,
        timestamp: new Date(),
        success: true
      })
    })
  }

  private normalizeQuery(query: string): string {
    // Remove specific values to group similar queries
    return query
      .replace(/\$\d+/g, '?') // Replace $1, $2, etc. with ?
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/'.+?'/g, "'?'") // Replace string literals with '?'
  }

  recordQuery(metric: QueryPerformance) {
    this.queryMetrics.push(metric)
    
    // Keep only the last N metrics
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics)
    }
  }

  async measureQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now()
    let success = true
    let error: string | undefined

    try {
      const result = await queryFn()
      return result
    } catch (e) {
      success = false
      error = e instanceof Error ? e.message : 'Unknown error'
      throw e
    } finally {
      const duration = Date.now() - start
      this.recordQuery({
        operation,
        duration,
        timestamp: new Date(),
        success,
        error
      })
    }
  }

  getSlowQueries(thresholdMs: number = 100): QueryPerformance[] {
    return this.queryMetrics
      .filter(m => m.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
  }

  getQueryStats() {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowestQuery: null,
        errorRate: 0
      }
    }

    const totalDuration = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0)
    const errorCount = this.queryMetrics.filter(m => !m.success).length

    return {
      totalQueries: this.queryMetrics.length,
      averageDuration: totalDuration / this.queryMetrics.length,
      slowestQuery: this.queryMetrics.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest
      ),
      errorRate: (errorCount / this.queryMetrics.length) * 100,
      queriesByOperation: this.groupQueriesByOperation()
    }
  }

  private groupQueriesByOperation() {
    const groups: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {}

    this.queryMetrics.forEach(metric => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = { count: 0, avgDuration: 0, totalDuration: 0 }
      }
      
      const group = groups[metric.operation]
      group.count++
      group.totalDuration += metric.duration
      group.avgDuration = group.totalDuration / group.count
    })

    return Object.entries(groups)
      .sort((a, b) => b[1].totalDuration - a[1].totalDuration)
      .slice(0, 10) // Top 10 most time-consuming operations
  }

  // Optimization suggestions based on metrics
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const stats = this.getQueryStats()

    // Check for slow queries
    const slowQueries = this.getSlowQueries(200)
    if (slowQueries.length > 0) {
      suggestions.push(
        `Found ${slowQueries.length} slow queries (>200ms). Consider adding indexes or optimizing the query structure.`
      )
    }

    // Check for high error rate
    if (stats.errorRate > 5) {
      suggestions.push(
        `High error rate detected (${stats.errorRate.toFixed(2)}%). Review error logs for common issues.`
      )
    }

    // Check for N+1 query patterns
    const suspectedN1Patterns = this.detectN1Patterns()
    if (suspectedN1Patterns.length > 0) {
      suggestions.push(
        `Possible N+1 query patterns detected: ${suspectedN1Patterns.join(', ')}. Consider using include or join.`
      )
    }

    // Check average query time
    if (stats.averageDuration > 50) {
      suggestions.push(
        `High average query duration (${stats.averageDuration.toFixed(2)}ms). Consider implementing caching.`
      )
    }

    return suggestions
  }

  private detectN1Patterns(): string[] {
    const patterns: string[] = []
    const operationCounts: Record<string, number> = {}

    // Count operations within a 1-second window
    const windows: Record<number, Record<string, number>> = {}
    
    this.queryMetrics.forEach(metric => {
      const windowKey = Math.floor(metric.timestamp.getTime() / 1000)
      if (!windows[windowKey]) {
        windows[windowKey] = {}
      }
      
      const operation = metric.operation.split(' ')[0] // Get operation type
      windows[windowKey][operation] = (windows[windowKey][operation] || 0) + 1
    })

    // Check for patterns
    Object.values(windows).forEach(window => {
      Object.entries(window).forEach(([operation, count]) => {
        if (count > 10) { // More than 10 of the same operation in 1 second
          patterns.push(`${operation} (${count} times)`)
        }
      })
    })

    return [...new Set(patterns)] // Remove duplicates
  }

  reset() {
    this.queryMetrics = []
  }
}

// Export singleton instance
export const dbPerformanceMonitor = DatabasePerformanceMonitor.getInstance()

// Helper function for API routes
export async function withPerformanceMonitoring<T>(
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return dbPerformanceMonitor.measureQuery(operation, queryFn)
}