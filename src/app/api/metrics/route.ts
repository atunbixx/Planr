import { NextRequest, NextResponse } from 'next/server'
import { monitoring } from '@/lib/monitoring/metrics'
import { logger } from '@/lib/logging/logger'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/middleware'

/**
 * GET /api/metrics
 * Get application metrics summary (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication for metrics access
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return createErrorResponse('Authentication required', 401, 'UNAUTHORIZED')
    }

    const { user } = authResult

    logger.info(
      'Metrics endpoint accessed',
      { userId: user.id },
      'MetricsAPI',
      'getMetrics'
    )

    // Get metrics summary
    const summary = monitoring.getMetricsSummary()
    
    // Get specific operational metrics
    const operationalMetrics = {
      rsvp: {
        attempted: monitoring.getCounter('rsvp_submissions_attempted'),
        successful: monitoring.getCounter('rsvp_submissions_successful'),
        failed: monitoring.getCounter('rsvp_submissions_failed'),
        successRate: calculateSuccessRate(
          monitoring.getCounter('rsvp_submissions_successful'),
          monitoring.getCounter('rsvp_submissions_attempted')
        ),
      },
      messaging: {
        attempted: monitoring.getCounter('messaging_operations_attempted'),
        successful: monitoring.getCounter('messaging_operations_successful'),
        failed: monitoring.getCounter('messaging_operations_failed'),
        creditsConsumed: monitoring.getCounter('messaging_credits_consumed'),
        successRate: calculateSuccessRate(
          monitoring.getCounter('messaging_operations_successful'),
          monitoring.getCounter('messaging_operations_attempted')
        ),
      },
      credits: {
        operationsAttempted: monitoring.getCounter('credit_operations_attempted'),
        operationsSuccessful: monitoring.getCounter('credit_operations_successful'),
        operationsFailed: monitoring.getCounter('credit_operations_failed'),
        successRate: calculateSuccessRate(
          monitoring.getCounter('credit_operations_successful'),
          monitoring.getCounter('credit_operations_attempted')
        ),
      },
      database: {
        operationsAttempted: monitoring.getCounter('database_operations_attempted'),
        operationsSuccessful: monitoring.getCounter('database_operations_successful'),
        operationsFailed: monitoring.getCounter('database_operations_failed'),
        successRate: calculateSuccessRate(
          monitoring.getCounter('database_operations_successful'),
          monitoring.getCounter('database_operations_attempted')
        ),
      },
      analytics: {
        rsvpSubmissions: monitoring.getCounter('analytics_rsvp_submissions'),
        messagingEvents: monitoring.getCounter('analytics_messaging_events'),
        vendorPageViews: monitoring.getCounter('analytics_vendor_page_views'),
      },
    }

    const metricsData = {
      timestamp: new Date().toISOString(),
      summary,
      operational: operationalMetrics,
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    }

    return createSuccessResponse(metricsData, 'Metrics retrieved successfully')
  } catch (error) {
    logger.error(
      'Failed to retrieve metrics',
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      'MetricsAPI',
      'getMetrics'
    )

    return createErrorResponse(
      'Failed to retrieve metrics',
      500,
      'METRICS_ERROR',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    )
  }
}

/**
 * GET /api/metrics/prometheus
 * Export metrics in Prometheus format (requires authentication)
 */
export async function prometheus(request: NextRequest) {
  try {
    // Require authentication for metrics access
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return new NextResponse('Authentication required', { status: 401 })
    }

    const { user } = authResult

    logger.info(
      'Prometheus metrics endpoint accessed',
      { userId: user.id },
      'MetricsAPI',
      'getPrometheusMetrics'
    )

    const prometheusMetrics = monitoring.exportPrometheusMetrics()
    
    return new NextResponse(prometheusMetrics, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    logger.error(
      'Failed to export Prometheus metrics',
      error instanceof Error ? error : new Error(String(error)),
      undefined,
      'MetricsAPI',
      'getPrometheusMetrics'
    )

    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

/**
 * Calculate success rate percentage
 */
function calculateSuccessRate(successful: number, attempted: number): number {
  if (attempted === 0) return 0
  return Math.round((successful / attempted) * 100 * 100) / 100 // Round to 2 decimal places
}