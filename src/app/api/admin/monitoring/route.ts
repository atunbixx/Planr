import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { logger } from '@/lib/monitoring/Logger'
import { apiMonitor } from '@/lib/monitoring/ApiMonitor'
import { performanceMonitor } from '@/lib/cache/PerformanceMonitor'
import { repositoryCache, userDataCache, statsCache } from '@/lib/cache/CacheManager'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const report = searchParams.get('report') || 'overview'
    const timeRange = searchParams.get('timeRange') || '1h'

    // Calculate time range
    const endTime = new Date()
    let startTime: Date
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000)
    }

    switch (report) {
      case 'overview':
        return NextResponse.json({
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            timeRange: `${timeRange}`,
            system: {
              uptime: process.uptime(),
              memory: process.memoryUsage(),
              cpu: process.cpuUsage(),
              version: process.version,
              platform: process.platform
            },
            api: apiMonitor.getStats({ startTime, endTime }),
            cache: {
              repository: repositoryCache.getStats(),
              userData: userDataCache.getStats(),
              stats: statsCache.getStats()
            },
            performance: performanceMonitor.getMetrics(),
            logs: logger.getLogStats(),
            health: {
              api: apiMonitor.getStats({ startTime, endTime }).errorRate < 5,
              cache: performanceMonitor.getMetrics().cacheHitRate > 0.6,
              memory: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal < 0.8,
              errors: logger.getLogStats().recentErrors < 10
            }
          }
        })

      case 'api':
        const apiMetrics = apiMonitor.getMetrics({ startTime, endTime })
        return NextResponse.json({
          success: true,
          data: {
            stats: apiMonitor.getStats({ startTime, endTime }),
            recentRequests: apiMetrics.slice(0, 100),
            timeline: generateApiTimeline(apiMetrics),
            endpoints: getEndpointAnalysis(apiMetrics)
          }
        })

      case 'performance':
        return NextResponse.json({
          success: true,
          data: {
            cache: performanceMonitor.getMetrics(),
            cacheStats: {
              repository: repositoryCache.getStats(),
              userData: userDataCache.getStats(),
              stats: statsCache.getStats()
            },
            recommendations: performanceMonitor.getRecommendations(),
            trends: getPerformanceTrends()
          }
        })

      case 'logs':
        const logFilter = {
          startTime,
          endTime,
          limit: 500
        }
        
        return NextResponse.json({
          success: true,
          data: {
            logs: logger.getLogs(logFilter),
            stats: logger.getLogStats(),
            errorAnalysis: getErrorAnalysis(startTime, endTime),
            userActivity: getUserActivitySummary(startTime, endTime)
          }
        })

      case 'health':
        const health = await getHealthStatus()
        return NextResponse.json({
          success: true,
          data: health
        })

      case 'export':
        const exportData = {
          timestamp: new Date().toISOString(),
          timeRange: `${startTime.toISOString()} - ${endTime.toISOString()}`,
          api: {
            stats: apiMonitor.getStats({ startTime, endTime }),
            metrics: apiMonitor.getMetrics({ startTime, endTime })
          },
          performance: performanceMonitor.exportMetrics(),
          logs: {
            stats: logger.getLogStats(),
            entries: logger.getLogs({ startTime, endTime, limit: 1000 })
          },
          cache: {
            repository: repositoryCache.getStats(),
            userData: userDataCache.getStats(),
            stats: statsCache.getStats()
          }
        }

        return NextResponse.json({
          success: true,
          data: exportData
        })

      default:
        return NextResponse.json(
          { error: 'Invalid report type. Available: overview, api, performance, logs, health, export' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Monitoring API error:', error)
    logger.error('Monitoring API failed', error as Error, {
      route: '/api/admin/monitoring',
      method: 'GET'
    })

    return NextResponse.json(
      { 
        error: 'Failed to fetch monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions
function generateApiTimeline(metrics: any[]) {
    // Group metrics by hour
    const timeline = metrics.reduce((acc, metric) => {
      const hour = new Date(metric.timestamp).toISOString().split('T')[1].split(':')[0]
      if (!acc[hour]) {
        acc[hour] = { requests: 0, errors: 0, totalTime: 0 }
      }
      acc[hour].requests++
      if (metric.statusCode >= 400) acc[hour].errors++
      acc[hour].totalTime += metric.duration
      return acc
    }, {})

    return Object.entries(timeline).map(([hour, data]: [string, any]) => ({
      hour,
      requests: data.requests,
      errors: data.errors,
      avgResponseTime: data.totalTime / data.requests
    }))
  }

function getEndpointAnalysis(metrics: any[]) {
    const endpoints = metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.path}`
      if (!acc[key]) {
        acc[key] = {
          method: metric.method,
          path: metric.path,
          requests: 0,
          errors: 0,
          totalTime: 0,
          maxTime: 0
        }
      }
      acc[key].requests++
      if (metric.statusCode >= 400) acc[key].errors++
      acc[key].totalTime += metric.duration
      acc[key].maxTime = Math.max(acc[key].maxTime, metric.duration)
      return acc
    }, {})

    return Object.values(endpoints).map((endpoint: any) => ({
      ...endpoint,
      avgTime: endpoint.totalTime / endpoint.requests,
      errorRate: endpoint.errors / endpoint.requests
    })).sort((a: any, b: any) => b.requests - a.requests)
  }

function getPerformanceTrends() {
    // This would typically pull from a time-series database
    // For now, return the current metrics as a snapshot
    return {
      cacheHitRate: performanceMonitor.getMetrics().cacheHitRate,
      avgQueryTime: performanceMonitor.getMetrics().avgQueryTime,
      timestamp: new Date().toISOString()
    }
  }

function getErrorAnalysis(startTime: Date, endTime: Date) {
    const errorLogs = logger.getLogs({
      startTime,
      endTime,
      level: 2 // ERROR level and above
    })

    const errorsByType = errorLogs.reduce((acc, log) => {
      const errorType = log.context?.type || 'unknown'
      acc[errorType] = (acc[errorType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const errorsByPath = errorLogs.reduce((acc, log) => {
      const path = log.context?.path || 'unknown'
      acc[path] = (acc[path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalErrors: errorLogs.length,
      errorsByType,
      errorsByPath,
      recentErrors: errorLogs.slice(0, 20)
    }
  }

function getUserActivitySummary(startTime: Date, endTime: Date) {
    const userLogs = logger.getLogs({
      startTime,
      endTime,
      type: 'user_action'
    })

    const activityByUser = userLogs.reduce((acc, log) => {
      const userId = log.userId || 'anonymous'
      if (!acc[userId]) {
        acc[userId] = { actions: 0, lastActivity: log.timestamp }
      }
      acc[userId].actions++
      if (log.timestamp > acc[userId].lastActivity) {
        acc[userId].lastActivity = log.timestamp
      }
      return acc
    }, {} as Record<string, any>)

    const topActions = userLogs.reduce((acc, log) => {
      const action = log.context?.action || 'unknown'
      acc[action] = (acc[action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalActions: userLogs.length,
      uniqueUsers: Object.keys(activityByUser).length,
      topActions: Object.entries(topActions)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count })),
      activeUsers: Object.entries(activityByUser)
        .sort(([,a], [,b]) => b.actions - a.actions)
        .slice(0, 20)
        .map(([userId, data]) => ({ userId, ...data }))
    }
  }

async function getHealthStatus() {
    const apiStats = apiMonitor.getRealtimeStats(5)
    const performanceMetrics = performanceMonitor.getMetrics()
    const logStats = logger.getLogStats()
    const memoryUsage = process.memoryUsage()

    const checks = {
      api: {
        healthy: apiStats.errorRate < 5,
        details: {
          errorRate: apiStats.errorRate,
          avgResponseTime: apiStats.averageResponseTime,
          totalRequests: apiStats.totalRequests
        }
      },
      cache: {
        healthy: performanceMetrics.cacheHitRate > 0.6,
        details: {
          hitRate: performanceMetrics.cacheHitRate,
          avgQueryTime: performanceMetrics.avgQueryTime
        }
      },
      memory: {
        healthy: memoryUsage.heapUsed / memoryUsage.heapTotal < 0.8,
        details: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          usagePercentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        }
      },
      errors: {
        healthy: logStats.recentErrors < 10,
        details: {
          recentErrors: logStats.recentErrors,
          totalLogs: logStats.totalLogs
        }
      }
    }

    const overallHealth = Object.values(checks).every(check => check.healthy)

    return {
      healthy: overallHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      recommendations: overallHealth ? [] : getHealthRecommendations(checks)
    }
  }

function getHealthRecommendations(checks: any): string[] {
    const recommendations: string[] = []

    if (!checks.api.healthy) {
      recommendations.push(`API error rate is high (${checks.api.details.errorRate}%). Investigate error logs.`)
    }

    if (!checks.cache.healthy) {
      recommendations.push(`Cache hit rate is low (${(checks.cache.details.hitRate * 100).toFixed(1)}%). Consider optimizing cache strategy.`)
    }

    if (!checks.memory.healthy) {
      recommendations.push(`Memory usage is high (${checks.memory.details.usagePercentage.toFixed(1)}%). Consider memory optimization.`)
    }

    if (!checks.errors.healthy) {
      recommendations.push(`High number of recent errors (${checks.errors.details.recentErrors}). Review error logs for patterns.`)
    }

    return recommendations
}