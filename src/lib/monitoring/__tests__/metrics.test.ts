import { monitoring, MetricType } from '../metrics'

describe('MonitoringService', () => {
  beforeEach(() => {
    // Clear all metrics before each test
    monitoring.clearMetrics()
  })

  describe('Counter Metrics', () => {
    it('should increment counters', () => {
      monitoring.incrementCounter('test_counter', 1)
      monitoring.incrementCounter('test_counter', 2)
      
      expect(monitoring.getCounter('test_counter')).toBe(3)
    })

    it('should increment counters with default value', () => {
      monitoring.incrementCounter('test_counter')
      
      expect(monitoring.getCounter('test_counter')).toBe(1)
    })

    it('should handle counters with tags', () => {
      monitoring.incrementCounter('test_counter', 1, { type: 'success' })
      monitoring.incrementCounter('test_counter', 1, { type: 'error' })
      
      expect(monitoring.getCounter('test_counter')).toBe(2)
    })

    it('should return 0 for non-existent counters', () => {
      expect(monitoring.getCounter('non_existent')).toBe(0)
    })
  })

  describe('Gauge Metrics', () => {
    it('should set gauge values', () => {
      monitoring.setGauge('test_gauge', 42)
      
      expect(monitoring.getGauge('test_gauge')).toBe(42)
    })

    it('should update gauge values', () => {
      monitoring.setGauge('test_gauge', 10)
      monitoring.setGauge('test_gauge', 20)
      
      expect(monitoring.getGauge('test_gauge')).toBe(20)
    })

    it('should handle gauges with tags', () => {
      monitoring.setGauge('test_gauge', 100, { region: 'us-east' })
      
      expect(monitoring.getGauge('test_gauge')).toBe(100)
    })

    it('should return undefined for non-existent gauges', () => {
      expect(monitoring.getGauge('non_existent')).toBeUndefined()
    })
  })

  describe('Histogram Metrics', () => {
    it('should record histogram values', () => {
      monitoring.recordHistogram('test_histogram', 100, { operation: 'test' }, 'ms')
      monitoring.recordHistogram('test_histogram', 200, { operation: 'test' }, 'ms')
      
      const history = monitoring.getMetricHistory('test_histogram')
      expect(history).toHaveLength(2)
      expect(history[0].value).toBe(100)
      expect(history[1].value).toBe(200)
      expect(history[0].unit).toBe('ms')
    })
  })

  describe('Timer Metrics', () => {
    it('should measure operation duration', async () => {
      monitoring.startTimer('test_operation')
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const duration = monitoring.endTimer('test_operation')
      
      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100) // Should be much less than 100ms
    })

    it('should record timer as histogram', async () => {
      monitoring.startTimer('test_operation')
      await new Promise(resolve => setTimeout(resolve, 10))
      monitoring.endTimer('test_operation')
      
      const history = monitoring.getMetricHistory('test_operation_duration')
      expect(history).toHaveLength(1)
      expect(history[0].type).toBe(MetricType.TIMER)
      expect(history[0].unit).toBe('ms')
    })

    it('should handle non-existent timers', () => {
      const duration = monitoring.endTimer('non_existent_timer')
      expect(duration).toBeNull()
    })

    it('should clean up timers after ending', async () => {
      monitoring.startTimer('test_operation')
      monitoring.endTimer('test_operation')
      
      // Timer should be cleaned up
      const duration = monitoring.endTimer('test_operation')
      expect(duration).toBeNull()
    })
  })

  describe('Metrics Summary', () => {
    it('should provide comprehensive metrics summary', () => {
      monitoring.incrementCounter('counter1', 5)
      monitoring.incrementCounter('counter2', 10)
      monitoring.setGauge('gauge1', 42)
      monitoring.setGauge('gauge2', 84)
      monitoring.startTimer('active_timer')
      monitoring.recordHistogram('histogram1', 100)
      
      const summary = monitoring.getMetricsSummary()
      
      expect(summary.counters).toEqual({
        counter1: 5,
        counter2: 10,
      })
      expect(summary.gauges).toEqual({
        gauge1: 42,
        gauge2: 84,
      })
      expect(summary.activeTimers).toEqual(['active_timer'])
      expect(summary.totalMetrics).toBe(1) // Only histogram recorded
    })
  })

  describe('Metric History', () => {
    it('should maintain metric history', () => {
      monitoring.recordHistogram('test_metric', 10)
      monitoring.recordHistogram('test_metric', 20)
      monitoring.recordHistogram('test_metric', 30)
      
      const history = monitoring.getMetricHistory('test_metric')
      expect(history).toHaveLength(3)
      expect(history.map(h => h.value)).toEqual([10, 20, 30])
    })

    it('should limit history to 100 entries', () => {
      // Record 150 metrics
      for (let i = 0; i < 150; i++) {
        monitoring.recordHistogram('test_metric', i)
      }
      
      const history = monitoring.getMetricHistory('test_metric')
      expect(history).toHaveLength(100)
      
      // Should keep the most recent 100
      expect(history[0].value).toBe(50) // First kept entry
      expect(history[99].value).toBe(149) // Last entry
    })

    it('should return empty array for non-existent metrics', () => {
      const history = monitoring.getMetricHistory('non_existent')
      expect(history).toEqual([])
    })
  })

  describe('Prometheus Export', () => {
    it('should export metrics in Prometheus format', () => {
      monitoring.incrementCounter('http_requests_total', 100)
      monitoring.setGauge('memory_usage_bytes', 1024)
      
      const prometheus = monitoring.exportPrometheusMetrics()
      
      expect(prometheus).toContain('# TYPE http_requests_total counter')
      expect(prometheus).toContain('http_requests_total 100')
      expect(prometheus).toContain('# TYPE memory_usage_bytes gauge')
      expect(prometheus).toContain('memory_usage_bytes 1024')
    })

    it('should handle empty metrics', () => {
      const prometheus = monitoring.exportPrometheusMetrics()
      expect(prometheus).toBe('')
    })
  })

  describe('Metric Clearing', () => {
    it('should clear all metrics', () => {
      monitoring.incrementCounter('test_counter', 5)
      monitoring.setGauge('test_gauge', 42)
      monitoring.startTimer('test_timer')
      monitoring.recordHistogram('test_histogram', 100)
      
      monitoring.clearMetrics()
      
      const summary = monitoring.getMetricsSummary()
      expect(summary.counters).toEqual({})
      expect(summary.gauges).toEqual({})
      expect(summary.activeTimers).toEqual([])
      expect(summary.totalMetrics).toBe(0)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent counter increments', async () => {
      const promises = []
      
      // Start 10 concurrent counter increments
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise<void>(resolve => {
            setTimeout(() => {
              monitoring.incrementCounter('concurrent_counter', 1)
              resolve()
            }, Math.random() * 10)
          })
        )
      }
      
      await Promise.all(promises)
      
      expect(monitoring.getCounter('concurrent_counter')).toBe(10)
    })

    it('should handle concurrent timer operations', async () => {
      const promises = []
      
      // Start 5 concurrent timers
      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise<number | null>(resolve => {
            const timerName = `timer_${i}`
            monitoring.startTimer(timerName)
            
            setTimeout(() => {
              const duration = monitoring.endTimer(timerName)
              resolve(duration)
            }, Math.random() * 20 + 10) // 10-30ms
          })
        )
      }
      
      const durations = await Promise.all(promises)
      
      // All timers should have completed successfully
      durations.forEach(duration => {
        expect(duration).toBeGreaterThan(0)
        expect(duration).toBeLessThan(100)
      })
    })
  })
})