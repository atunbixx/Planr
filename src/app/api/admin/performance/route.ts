import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { dbPerformanceMonitor } from '@/lib/db-performance'

// GET /api/admin/performance - Get database performance metrics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In production, you might want to add admin role check here
    // For now, we'll just require authentication

    const stats = dbPerformanceMonitor.getQueryStats()
    const slowQueries = dbPerformanceMonitor.getSlowQueries(100)
    const suggestions = dbPerformanceMonitor.getOptimizationSuggestions()

    return NextResponse.json({
      success: true,
      data: {
        stats,
        slowQueries: slowQueries.slice(0, 20), // Top 20 slow queries
        suggestions,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/performance - Reset performance metrics
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    dbPerformanceMonitor.reset()

    return NextResponse.json({
      success: true,
      message: 'Performance metrics reset successfully'
    })
  } catch (error) {
    console.error('Error resetting performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to reset performance metrics' },
      { status: 500 }
    )
  }
}