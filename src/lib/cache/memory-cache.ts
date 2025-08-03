interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  // Get an item from cache
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value as T
  }

  // Set an item in cache
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { value, expiresAt })
  }

  // Delete an item from cache
  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  // Delete items matching a pattern
  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  // Clear all cache
  async flush(): Promise<void> {
    this.cache.clear()
  }

  // Get cache size
  size(): number {
    return this.cache.size
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  // Destroy cache (clean up interval)
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}

// Singleton instance
let cacheInstance: MemoryCache | null = null

export function getCache(): MemoryCache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache()
  }
  return cacheInstance
}

// Cache key generators
export const cacheKeys = {
  vendorList: (params: Record<string, any>) => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key]
        }
        return acc
      }, {} as Record<string, any>)
    
    return `vendors:list:${JSON.stringify(sortedParams)}`
  },
  
  vendorDetail: (id: string) => `vendors:detail:${id}`,
  vendorPackages: (id: string) => `vendors:packages:${id}`,
  vendorReviews: (id: string) => `vendors:reviews:${id}`,
  vendorAvailability: (id: string) => `vendors:availability:${id}`,
  
  // Invalidation patterns
  vendorPattern: (id: string) => `vendors:*:${id}`,
  allVendorsPattern: () => 'vendors:*'
}

// Cache TTL configurations (in seconds)
export const cacheTTL = {
  vendorList: 300,        // 5 minutes
  vendorDetail: 600,      // 10 minutes
  vendorPackages: 1800,   // 30 minutes
  vendorReviews: 900,     // 15 minutes
  vendorAvailability: 60, // 1 minute (changes frequently)
}

// Helper to wrap async functions with caching
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 300
): T {
  return (async (...args: Parameters<T>) => {
    const cache = getCache()
    const key = keyGenerator(...args)
    
    // Try to get from cache
    const cached = await cache.get(key)
    if (cached !== null) {
      return cached
    }
    
    // Execute function
    const result = await fn(...args)
    
    // Store in cache
    await cache.set(key, result, ttl)
    
    return result
  }) as T
}