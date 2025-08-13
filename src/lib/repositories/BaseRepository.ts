import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { repositoryCache, userDataCache, statsCache } from '@/lib/cache/CacheManager'
import { logger } from '@/lib/monitoring/Logger'

type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>

export interface CacheOptions {
  key?: string
  tags?: string[]
  ttl?: number
  useCache?: boolean
  cacheType?: 'repository' | 'user' | 'stats'
}

export abstract class BaseRepository<T> {
  protected prisma = prisma
  protected entityName: string

  constructor(entityName: string) {
    this.entityName = entityName
  }

  /**
   * Execute a query with error handling and optional caching
   */
  protected async executeQuery<R>(
    operation: () => Promise<R>,
    cacheOptions?: CacheOptions
  ): Promise<R> {
    const startTime = performance.now()
    const operationName = `${this.entityName}.query`
    let fromCache = false

    try {
      // If caching is disabled, execute directly
      if (!cacheOptions?.useCache) {
        const result = await operation()
        const duration = performance.now() - startTime
        
        logger.logQuery(operationName, duration, true, {
          entityName: this.entityName,
          fromCache: false,
          cacheDisabled: true
        })
        
        return result
      }

      // Generate cache key
      const cacheKey = cacheOptions.key || this.generateCacheKey(this.entityName, operation.toString())
      const tags = cacheOptions.tags || [this.entityName]
      
      // Select appropriate cache based on type
      const cache = this.getCacheInstance(cacheOptions.cacheType)
      
      // Try to get from cache
      const cached = cache.get<R>(cacheKey)
      if (cached !== null) {
        fromCache = true
        const duration = performance.now() - startTime
        
        logger.logCacheOperation('READ', cacheKey, true, {
          entityName: this.entityName,
          cacheType: cacheOptions.cacheType
        })
        
        logger.logQuery(operationName, duration, true, {
          entityName: this.entityName,
          fromCache: true,
          cacheKey
        })
        
        return cached
      }

      // Cache miss - execute operation
      logger.logCacheOperation('READ', cacheKey, false, {
        entityName: this.entityName,
        cacheType: cacheOptions.cacheType
      })

      const result = await operation()
      const duration = performance.now() - startTime
      
      // Store in cache
      cache.set(cacheKey, result, tags)
      
      logger.logQuery(operationName, duration, true, {
        entityName: this.entityName,
        fromCache: false,
        cacheKey,
        cached: true
      })
      
      return result

    } catch (error) {
      const duration = performance.now() - startTime
      
      logger.error(`Repository operation failed: ${operationName}`, error as Error, {
        entityName: this.entityName,
        duration,
        fromCache,
        cacheOptions
      })
      
      logger.logQuery(operationName, duration, false, {
        entityName: this.entityName,
        error: (error as Error).message
      })
      
      throw error
    }
  }

  /**
   * Execute cached query with loader function
   */
  protected async executeQueryWithCache<R>(
    cacheKey: string,
    operation: () => Promise<R>,
    options: {
      tags?: string[]
      cacheType?: 'repository' | 'user' | 'stats'
    } = {}
  ): Promise<R> {
    const cache = this.getCacheInstance(options.cacheType)
    const tags = options.tags || [this.entityName]
    
    return cache.getOrSet(cacheKey, operation, tags)
  }

  /**
   * Execute operations within a transaction
   */
  protected async withTransaction<R>(
    operation: (tx: PrismaTransaction) => Promise<R>
  ): Promise<R> {
    return this.prisma.$transaction(async (tx) => {
      return operation(tx)
    })
  }

  /**
   * Batch operations for better performance
   */
  protected async batchOperation<R>(
    operations: (() => Promise<R>)[]
  ): Promise<R[]> {
    return Promise.all(operations.map(op => this.executeQuery(op)))
  }

  /**
   * Cache key generator for caching implementation
   */
  protected generateCacheKey(entity: string, params: any): string {
    const paramsStr = typeof params === 'string' ? params : JSON.stringify(params)
    return `${entity}:${Buffer.from(paramsStr).toString('base64').slice(0, 32)}`
  }

  /**
   * Invalidate cache entries for this entity
   */
  protected invalidateCache(tags?: string[]): void {
    const tagsToInvalidate = tags || [this.entityName]
    
    repositoryCache.invalidateByTags(tagsToInvalidate)
    userDataCache.invalidateByTags(tagsToInvalidate)
    statsCache.invalidateByTags(tagsToInvalidate)
  }

  /**
   * Invalidate specific cache entry
   */
  protected invalidateCacheKey(key: string, cacheType?: 'repository' | 'user' | 'stats'): void {
    if (cacheType) {
      this.getCacheInstance(cacheType).delete(key)
    } else {
      repositoryCache.delete(key)
      userDataCache.delete(key)
      statsCache.delete(key)
    }
  }

  /**
   * Get appropriate cache instance
   */
  private getCacheInstance(cacheType: 'repository' | 'user' | 'stats' = 'repository') {
    switch (cacheType) {
      case 'user':
        return userDataCache
      case 'stats':
        return statsCache
      default:
        return repositoryCache
    }
  }

  /**
   * Create operation with cache invalidation
   */
  protected async createWithCache<R>(
    operation: () => Promise<R>,
    invalidationTags?: string[]
  ): Promise<R> {
    const result = await this.executeQuery(operation)
    this.invalidateCache(invalidationTags)
    return result
  }

  /**
   * Update operation with cache invalidation
   */
  protected async updateWithCache<R>(
    operation: () => Promise<R>,
    invalidationTags?: string[]
  ): Promise<R> {
    const result = await this.executeQuery(operation)
    this.invalidateCache(invalidationTags)
    return result
  }

  /**
   * Delete operation with cache invalidation
   */
  protected async deleteWithCache<R>(
    operation: () => Promise<R>,
    invalidationTags?: string[]
  ): Promise<R> {
    const result = await this.executeQuery(operation)
    this.invalidateCache(invalidationTags)
    return result
  }
}