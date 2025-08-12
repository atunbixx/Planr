interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default

  // Generate cache key from URL and params
  private getCacheKey(url: string, params?: any): string {
    const sortedParams = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
    return `${url}:${sortedParams}`
  }

  // Get data from cache if valid
  get<T>(url: string, params?: any): T | null {
    const key = this.getCacheKey(url, params)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if cache is still valid
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // Set data in cache
  set<T>(url: string, data: T, params?: any, ttl?: number): void {
    const key = this.getCacheKey(url, params)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  // Clear specific cache entry
  invalidate(url: string, params?: any): void {
    const key = this.getCacheKey(url, params)
    this.cache.delete(key)
  }

  // Clear all cache entries matching a pattern
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Global cache instance
export const apiCache = new ApiCache()

// Cache configuration for different endpoints
export const cacheConfig: Record<string, { ttl: number; invalidateOn?: string[] }> = {
  // Dashboard data changes less frequently
  '/dashboard/stats': { 
    ttl: 10 * 60 * 1000, // 10 minutes
    invalidateOn: ['/guests', '/vendors', '/budget', '/checklist', '/photos']
  },
  
  // Guest list
  '/guests': { 
    ttl: 5 * 60 * 1000, // 5 minutes
    invalidateOn: []
  },
  
  // Vendor list
  '/vendors': { 
    ttl: 5 * 60 * 1000,
    invalidateOn: []
  },
  
  // Budget data
  '/budget/summary': { 
    ttl: 5 * 60 * 1000,
    invalidateOn: ['/budget/categories', '/budget/expenses']
  },
  '/budget/categories': { 
    ttl: 10 * 60 * 1000,
    invalidateOn: []
  },
  
  // Settings (rarely change)
  '/settings/preferences': { 
    ttl: 30 * 60 * 1000, // 30 minutes
    invalidateOn: []
  },
  '/settings/wedding': { 
    ttl: 30 * 60 * 1000,
    invalidateOn: []
  },
  
  // Message templates (rarely change)
  '/messages/templates': { 
    ttl: 60 * 60 * 1000, // 1 hour
    invalidateOn: []
  },
  
  // Photos and albums
  '/photos': { 
    ttl: 5 * 60 * 1000,
    invalidateOn: []
  },
  '/albums': { 
    ttl: 10 * 60 * 1000,
    invalidateOn: []
  }
}

// Hook for cache invalidation on mutations
export function invalidateRelatedCache(endpoint: string): void {
  const config = cacheConfig[endpoint]
  if (config?.invalidateOn) {
    config.invalidateOn.forEach(pattern => {
      apiCache.invalidatePattern(pattern)
    })
  }
  
  // Always invalidate the endpoint itself
  apiCache.invalidatePattern(endpoint)
  
  // Invalidate dashboard stats on any mutation
  if (endpoint.includes('POST') || endpoint.includes('PUT') || endpoint.includes('DELETE')) {
    apiCache.invalidate('/dashboard/stats')
  }
}