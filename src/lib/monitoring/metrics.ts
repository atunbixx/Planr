import { logger } from '@/lib/logging/logger'

/**
 * Metric types for different kinds of measurements
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

/**
 * Metric entry interface
 */
export interface MetricEntry {
  name: string
  type: MetricType
  value: number
  timestamp: string
  tags?: Record<string, string>
  unit?: string
}

/**
 * Performance timing interface
 */
export interface PerformanceTimer {
  start: number
  end?: number
  duration?: number
}

/**
 * Monitoring service for tracking application metrics
 * Provides counters, gauges, histograms, and performance timing
 */
class MonitoringService {
  private static instance: MonitoringService
  private metrics: Map<string, MetricEntry[]> = new Map()
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()
  private timers: Map<string, PerformanceTimer> = new Map()

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  /**
   * Increment a counter metric
   */
  public incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const currentValue = this.counters.get(name) || 0
    const newValue = currentValue + value
    this.counters.set(name, newValue)

    this.recordMetric({
      name,
      type: MetricType.COUNTER,
      value: newValue,
      timestamp: new Date().toISOString(),
      tags,
    })

    logger.debug(`Counter incremented: ${name} = ${newValue}`, { value, tags }, 'MonitoringService', 'incrementCounter')
  }

  /**
   * Set a gauge metric
   */
  public setGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.gauges.set(name, value)

    this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value,
      timestamp: new Date().toISOString(),
      tags,
    })

    logger.debug(`Gauge set: ${name} = ${value}`, { value, tags }, 'MonitoringService', 'setGauge')
  }

  /**
   * Record a histogram value
   */
  public recordHistogram(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
    this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      timestamp: new Date().toISOString(),
      tags,
      unit,
    })

    logger.debug(`Histogram recorded: ${name} = ${value}${unit ? ` ${unit}` : ''}`, { value, tags, unit }, 'MonitoringService', 'recordHistogram')
  }

  /**
   * Start a performance timer
   */
  public startTimer(name: string): void {
    this.timers.set(name, {
      start: performance.now(),
    })

    logger.debug(`Timer started: ${name}`, undefined, 'MonitoringService', 'startTimer')
  }

  /**
   * End a performance timer and record the duration
   */
  public endTimer(name: string, tags?: Record<string, string>): number | null {
    const timer = this.timers.get(name)
    if (!timer) {
      logger.warn(`Timer not found: ${name}`, undefined, 'MonitoringService', 'endTimer')
      return null
    }

    const end = performance.now()
    const duration = end - timer.start
    
    // Update timer entry
    timer.end = end
    timer.duration = duration

    // Record as histogram
    this.recordMetric({
      name: `${name}_duration`,
      type: MetricType.TIMER,
      value: duration,
      timestamp: new Date().toISOString(),
      tags,
      unit: 'ms',
    })

    // Clean up timer
    this.timers.delete(name)

    logger.debug(`Timer ended: ${name} = ${duration.toFixed(2)}ms`, { duration, tags }, 'MonitoringService', 'endTimer')
    return duration
  }

  /**
   * Record a metric entry
   */
  private recordMetric(metric: MetricEntry): void {
    const entries = this.metrics.get(metric.name) || []
    entries.push(metric)
    
    // Keep only last 100 entries per metric to prevent memory leaks
    if (entries.length > 100) {
      entries.shift()
    }
    
    this.metrics.set(metric.name, entries)
  }

  /**
   * Get current counter value
   */
  public getCounter(name: string): number {
    return this.counters.get(name) || 0
  }

  /**
   * Get current gauge value
   */
  public getGauge(name: string): number | undefined {
    return this.gauges.get(name)
  }

  /**
   * Get metric history
   */
  public getMetricHistory(name: string): MetricEntry[] {
    return this.metrics.get(name) || []
  }

  /**
   * Get all current metrics summary
   */
  public getMetricsSummary(): {
    counters: Record<string, number>
    gauges: Record<string, number>
    activeTimers: string[]
    totalMetrics: number
  } {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      activeTimers: Array.from(this.timers.keys()),
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, entries) => sum + entries.length, 0),
    }
  }

  /**
   * Clear all metrics (useful for testing)
   */
  public clearMetrics(): void {
    this.metrics.clear()
    this.counters.clear()
    this.gauges.clear()
    this.timers.clear()
    
    logger.info('All metrics cleared', undefined, 'MonitoringService', 'clearMetrics')
  }

  /**
   * Export metrics in Prometheus format (basic implementation)
   */
  public exportPrometheusMetrics(): string {
    const lines: string[] = []
    
    // Export counters
    for (const [name, value] of this.counters) {
      lines.push(`# TYPE ${name} counter`)
      lines.push(`${name} ${value}`)
    }
    
    // Export gauges
    for (const [name, value] of this.gauges) {
      lines.push(`# TYPE ${name} gauge`)
      lines.push(`${name} ${value}`)
    }
    
    return lines.join('\n')
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance()

// Export types
// Types are declared above; avoid re-export conflicts in some TS setups
// @ts-nocheck
