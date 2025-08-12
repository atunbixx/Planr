'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Activity, TrendingUp, RefreshCw } from 'lucide-react'

interface PerformanceData {
  stats: {
    totalQueries: number
    averageDuration: number
    slowestQuery: {
      operation: string
      duration: number
      timestamp: string
    } | null
    errorRate: number
    queriesByOperation: Array<[string, {
      count: number
      avgDuration: number
      totalDuration: number
    }]>
  }
  slowQueries: Array<{
    operation: string
    duration: number
    timestamp: string
    success: boolean
    error?: string
  }>
  suggestions: string[]
  timestamp: string
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/performance')
      if (!response.ok) {
        throw new Error('Failed to fetch performance data')
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetMetrics = async () => {
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset metrics')
      }
      
      // Refresh data after reset
      fetchPerformanceData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  useEffect(() => {
    fetchPerformanceData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return <div className="p-8 text-center">Loading performance data...</div>
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const getPerformanceColor = (duration: number) => {
    if (duration < 50) return 'text-green-600'
    if (duration < 200) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (duration: number) => {
    if (duration < 50) return <Badge variant="outline" className="bg-green-50">Fast</Badge>
    if (duration < 200) return <Badge variant="outline" className="bg-yellow-50">Moderate</Badge>
    return <Badge variant="outline" className="bg-red-50">Slow</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Database Performance</h2>
          <p className="text-muted-foreground">Monitor and optimize database query performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPerformanceData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={resetMetrics}>
            Reset Metrics
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalQueries}</div>
            <p className="text-xs text-muted-foreground">Since last reset</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(data.stats.averageDuration)}`}>
              {data.stats.averageDuration.toFixed(1)}ms
            </div>
            <p className="text-xs text-muted-foreground">Per query</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.stats.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
              {data.stats.errorRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Failed queries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Slowest Query</CardTitle>
          </CardHeader>
          <CardContent>
            {data.stats.slowestQuery ? (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {data.stats.slowestQuery.duration}ms
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {data.stats.slowestQuery.operation}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      {data.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Top Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Operations by Time</CardTitle>
          <CardDescription>Operations consuming the most total time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.stats.queriesByOperation.slice(0, 5).map(([operation, stats], index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium truncate pr-4">{operation}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.count} queries • {stats.avgDuration.toFixed(1)}ms avg
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">{stats.totalDuration.toFixed(0)}ms</div>
                  {getPerformanceBadge(stats.avgDuration)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Slow Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Slow Queries</CardTitle>
          <CardDescription>Queries taking longer than 100ms</CardDescription>
        </CardHeader>
        <CardContent>
          {data.slowQueries.length > 0 ? (
            <div className="space-y-3">
              {data.slowQueries.slice(0, 10).map((query, index) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate pr-4">{query.operation}</p>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getPerformanceColor(query.duration)}`}>
                        {query.duration}ms
                      </span>
                      {!query.success && (
                        <Badge variant="outline" className="bg-red-50">Error</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(query.timestamp).toLocaleString()}
                  </p>
                  {query.error && (
                    <p className="text-xs text-red-600 mt-1">{query.error}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No slow queries detected
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}