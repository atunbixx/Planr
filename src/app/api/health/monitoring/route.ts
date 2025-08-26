import { NextResponse } from 'next/server'
import { monitoring } from '@/lib/monitoring/metrics'
import { logger } from '@/lib/logging/logger'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

/**
 * GET /api/health/monitoring
 * Check monitoring system health and recent metrics
 */
export async function GET() {
  try {
    logger.debug('Monitoring health check requested', undefined, 'MonitoringHealthAPI', 'checkHealth')

    const summary = monitoring.getMetricsSummary()
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    // Check for recent activity (metrics recorded in last 5 minutes)
    const recentActivity = {
      rsvp: {
        recent: monitoring.getCounter('rsvp_submissions_attempted') > 0,
        total: monitoring.getCounter('rsvp_submissions_attempted'),
      },
      messaging: {
        recent: monitoring.getCounter('messaging_operations_attempted') > 0,
        total: monitoring.getCounter('messaging_operations_attempted'),
      },
      database: {
        recent: monitoring.getCounter('database_operations_attempted') > 0,
        total: monitoring.getCounter('database_operations_attempted'),
      },
    }

    // Calculate error rates
    const errorRates = {
      rsvp: calculateErrorRate(
        monitoring.getCounter('rsvp_submissions_failed'),
        monitoring.getCounter('rsvp_submissions_attempted')
      ),
      messaging: calculateErrorRate(
        monitoring.getCounter('messaging_operations_failed'),
        monitoring.getCounter('messaging_operations_attempted')
      ),
      credits: calculateErrorRate(
        monitoring.getCounter('credit_operations_failed'),
        monitoring.getCounter('credit_operations_attempted')
      ),
      database: calculateErrorRate(
        monitoring.getCounter('database_operations_failed'),
        monitoring.getCounter('database_operations_attempted')
      ),
    }

    // Determine overall health status
    const maxErrorRate = Math.max(...Object.values(errorRates))
    const hasActiveTimers = summary.activeTimers.length > 0
    const hasMetrics = summary.totalMetrics > 0

    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    const issues: string[] = []

    if (maxErrorRate > 50) {
      healthStatus = 'unhealthy'
      issues.push(`High error rate detected: ${maxErrorRate.toFixed(1)}%`)
    } else if (maxErrorRate > 20) {
      healthStatus = 'degraded'
      issues.push(`Elevated error rate: ${maxErrorRate.toFixed(1)}%`)
    }

    if (hasActiveTimers && summary.activeTimers.length > 10) {
      healthStatus = healthStatus === 'healthy' ? 'degraded' : healthStatus
      issues.push(`Many active timers: ${summary.activeTimers.length}`)
    }

    const healthData = {
      status: healthStatus,
      timestamp: new Date().toISOString(),
      monitoring: {
        metricsCollected: hasMetrics,
        totalMetrics: summary.totalMetrics,
        activeTimers: summary.activeTimers.length,
        counters: Object.keys(summary.counters).length,
        gauges: Object.keys(summary.gauges).length,
      },
      recentActivity,
      errorRates,
      issues,
      systemInfo: {
        uptime: process.uptime(),
        memoryUsage: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
    }

    const statusCode = healthStatus === 'healthy' ? 200 : healthStatus === 'degraded' ? 200 : 503

    logger.info(
      `Monitoring health check completed: ${healthStatus}`,
      {
        status: healthStatus,
        totalMetrics: summary.totalMetrics,
        maxErrorRate: maxErrorRate.toFixed(1),
        issues: issues.length,
      },
      'MonitoringHealthAPI',
      'checkHealth'
    )

    return NextResponse.json(healthData, { status: statusCode })
  } catch (error) {
    logger.error(
      'Monitoring health check failed',
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      'MonitoringHealthAPI',
      'checkHealth'
    )

    return createErrorResponse(
      'Monitoring health check failed',
      500,
      'MONITORING_HEALTH_ERROR',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    )
  }
}

/**
 * Calculate error rate percentage
 */
function calculateErrorRate(failed: number, attempted: number): number {
  if (attempted === 0) return 0
  return Math.round((failed / attempted) * 100 * 100) / 100 // Round to 2 decimal places
}