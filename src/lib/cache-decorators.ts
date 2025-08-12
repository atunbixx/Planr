import { cache, getCacheKey, getCacheTags, CACHE_TTL } from './cache'

// Cache decorator options
interface CacheOptions {
  ttl?: number
  tags?: string[]
  keyGenerator?: (...args: any[]) => string
  skipCache?: boolean
}

// Cached method decorator
export function cached(options: CacheOptions = {}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // Skip cache if specified
      if (options.skipCache) {
        return originalMethod.apply(this, args)
      }

      // Generate cache key
      const key = options.keyGenerator 
        ? options.keyGenerator(...args)
        : `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`

      // Try to get from cache
      const cachedResult = cache.get(key)
      if (cachedResult !== null) {
        return cachedResult
      }

      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Cache the result
      const ttl = options.ttl || CACHE_TTL.MEDIUM
      const tags = options.tags || []
      cache.set(key, result, ttl, tags)

      return result
    }

    return descriptor
  }
}

// Cache helpers for common patterns
export class CacheHelper {
  // Cache a database query result
  static async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM,
    tags: string[] = []
  ): Promise<T> {
    // Check cache first
    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    // Execute query
    const result = await queryFn()
    
    // Cache result
    cache.set(key, result, ttl, tags)
    
    return result
  }

  // Cache with automatic invalidation on update
  static async cacheWithInvalidation<T>(
    key: string,
    queryFn: () => Promise<T>,
    updateFn: (data: any) => Promise<T>,
    invalidationTags: string[],
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<{
    get: () => Promise<T>
    update: (data: any) => Promise<T>
    invalidate: () => void
  }> {
    return {
      get: async () => {
        return CacheHelper.cacheQuery(key, queryFn, ttl, invalidationTags)
      },
      update: async (data: any) => {
        // Invalidate cache
        cache.delete(key)
        for (const tag of invalidationTags) {
          cache.invalidateByTag(tag)
        }
        
        // Execute update
        const result = await updateFn(data)
        
        // Cache new result
        cache.set(key, result, ttl, invalidationTags)
        
        return result
      },
      invalidate: () => {
        cache.delete(key)
        for (const tag of invalidationTags) {
          cache.invalidateByTag(tag)
        }
      }
    }
  }

  // Batch cache operations
  static async batchCache<T>(
    operations: Array<{
      key: string
      queryFn: () => Promise<T>
      ttl?: number
      tags?: string[]
    }>
  ): Promise<T[]> {
    const results: T[] = []
    
    for (const op of operations) {
      const result = await CacheHelper.cacheQuery(
        op.key,
        op.queryFn,
        op.ttl || CACHE_TTL.MEDIUM,
        op.tags || []
      )
      results.push(result)
    }
    
    return results
  }

  // Cache warming - preload cache with data
  static async warmCache(
    key: string,
    data: any,
    ttl: number = CACHE_TTL.MEDIUM,
    tags: string[] = []
  ): Promise<void> {
    cache.set(key, data, ttl, tags)
  }
}

// Cache warming strategies
export class CacheWarmer {
  // Warm user-specific caches
  static async warmUserCache(userId: string, coupleId?: string) {
    if (coupleId) {
      // Pre-warm common queries
      const warmingTasks = [
        // Dashboard stats
        () => cache.set(
          getCacheKey.dashboardStats(userId),
          null, // Will be filled by actual query
          CACHE_TTL.DASHBOARD,
          [getCacheTags.user(userId), getCacheTags.couple(coupleId)]
        ),
        
        // Guest list
        () => cache.set(
          getCacheKey.guestList(coupleId),
          null,
          CACHE_TTL.MEDIUM,
          [getCacheTags.guests(coupleId), getCacheTags.couple(coupleId)]
        ),
        
        // Vendor list
        () => cache.set(
          getCacheKey.vendorList(coupleId),
          null,
          CACHE_TTL.MEDIUM,
          [getCacheTags.vendors(coupleId), getCacheTags.couple(coupleId)]
        )
      ]

      // Execute warming tasks
      await Promise.all(warmingTasks.map(task => task()))
    }
  }

  // Warm couple-specific caches
  static async warmCoupleCache(coupleId: string) {
    const warmingKeys = [
      getCacheKey.guestList(coupleId),
      getCacheKey.budgetData(coupleId),
      getCacheKey.vendorList(coupleId),
      getCacheKey.photoGallery(coupleId),
      getCacheKey.checklistItems(coupleId)
    ]

    // Mark these keys for warming (actual data will be loaded on first request)
    for (const key of warmingKeys) {
      cache.set(key, null, CACHE_TTL.MEDIUM, [getCacheTags.couple(coupleId)])
    }
  }
}