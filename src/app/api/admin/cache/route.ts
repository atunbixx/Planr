import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { repositoryCache, userDataCache, statsCache } from '@/lib/cache/CacheManager'
import { performanceMonitor } from '@/lib/cache/PerformanceMonitor'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, allow all authenticated users to view cache stats
    // In production, you might want to restrict this to admin users
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'stats':
        const stats = {
          repository: repositoryCache.getStats(),
          userData: userDataCache.getStats(),
          stats: statsCache.getStats(),
          performance: performanceMonitor.getMetrics(),
          recommendations: performanceMonitor.getRecommendations()
        }
        
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'export':
        const exportData = performanceMonitor.exportMetrics()
        
        return NextResponse.json({
          success: true,
          data: exportData
        })

      default:
        // Default: return basic cache overview
        const overview = {
          repositoryCache: {
            size: repositoryCache.getStats().size,
            maxSize: repositoryCache.getStats().maxSize
          },
          userDataCache: {
            size: userDataCache.getStats().size,
            maxSize: userDataCache.getStats().maxSize
          },
          statsCache: {
            size: statsCache.getStats().size,
            maxSize: statsCache.getStats().maxSize
          },
          performance: {
            cacheHitRate: performanceMonitor.getMetrics().cacheHitRate,
            avgQueryTime: performanceMonitor.getMetrics().avgQueryTime,
            totalQueries: performanceMonitor.getMetrics().totalQueries
          }
        }

        return NextResponse.json({
          success: true,
          data: overview
        })
    }
  } catch (error) {
    console.error('Cache stats API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, tags, patterns } = await request.json()

    switch (action) {
      case 'clear':
        if (tags && Array.isArray(tags)) {
          // Clear specific tags
          repositoryCache.invalidateByTags(tags)
          userDataCache.invalidateByTags(tags)
          statsCache.invalidateByTags(tags)
          
          return NextResponse.json({
            success: true,
            message: `Cleared cache entries with tags: ${tags.join(', ')}`
          })
        } else {
          // Clear all cache
          repositoryCache.clear()
          userDataCache.clear()
          statsCache.clear()
          
          return NextResponse.json({
            success: true,
            message: 'All cache cleared successfully'
          })
        }

      case 'invalidate-pattern':
        if (patterns && Array.isArray(patterns)) {
          patterns.forEach(pattern => {
            const regex = new RegExp(pattern)
            repositoryCache.invalidateByPattern(regex)
            userDataCache.invalidateByPattern(regex)
            statsCache.invalidateByPattern(regex)
          })
          
          return NextResponse.json({
            success: true,
            message: `Invalidated cache entries matching patterns: ${patterns.join(', ')}`
          })
        } else {
          return NextResponse.json(
            { error: 'Patterns array is required for invalidate-pattern action' },
            { status: 400 }
          )
        }

      case 'reset-metrics':
        performanceMonitor.reset()
        
        return NextResponse.json({
          success: true,
          message: 'Performance metrics reset successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: clear, invalidate-pattern, reset-metrics' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cache management API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to perform cache operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const cacheType = searchParams.get('type') as 'repository' | 'user' | 'stats' | 'all'

    if (!key) {
      return NextResponse.json(
        { error: 'Cache key is required' },
        { status: 400 }
      )
    }

    let deletedFrom: string[] = []

    switch (cacheType) {
      case 'repository':
        if (repositoryCache.delete(key)) deletedFrom.push('repository')
        break
      case 'user':
        if (userDataCache.delete(key)) deletedFrom.push('userData')
        break
      case 'stats':
        if (statsCache.delete(key)) deletedFrom.push('stats')
        break
      case 'all':
      default:
        if (repositoryCache.delete(key)) deletedFrom.push('repository')
        if (userDataCache.delete(key)) deletedFrom.push('userData')
        if (statsCache.delete(key)) deletedFrom.push('stats')
        break
    }

    return NextResponse.json({
      success: true,
      message: `Cache key '${key}' deleted from: ${deletedFrom.join(', ') || 'none (key not found)'}`,
      deletedFrom
    })
  } catch (error) {
    console.error('Cache delete API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete cache entry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}