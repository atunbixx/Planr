import { prisma } from '@/lib/prisma'
import { cache, getCacheKey, getCacheTags, CACHE_TTL } from '@/lib/cache'
import { CacheHelper } from '@/lib/cache-decorators'
import { QueryOptimizer } from '@/lib/performance'

export interface PaginationOptions {
  page?: number
  pageSize?: number
  orderBy?: any
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export abstract class BaseService<T> {
  protected prisma = prisma
  protected cache = cache
  protected optimizer = new QueryOptimizer()
  protected cacheHelper = CacheHelper
  
  protected abstract entityName: string
  protected abstract cachePrefix: string
  protected abstract getTags(coupleId: string): string[]

  // Cache operations with tag support
  protected async clearEntityCache(coupleId: string, id?: string): Promise<void> {
    if (id) {
      const key = `${this.cachePrefix}:${id}`
      cache.delete(key)
    } else {
      // Invalidate by tags
      const tags = this.getTags(coupleId)
      for (const tag of tags) {
        cache.invalidateByTag(tag)
      }
    }
  }

  protected async getCached<R>(key: string): Promise<R | null> {
    return cache.get(key)
  }

  protected async setCached<R>(
    key: string, 
    data: R, 
    ttl: number = CACHE_TTL.MEDIUM, 
    tags: string[] = []
  ): Promise<void> {
    cache.set(key, data, ttl, tags)
  }

  // Cached query with automatic tagging
  protected async cachedQuery<R>(
    key: string,
    queryFn: () => Promise<R>,
    coupleId: string,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<R> {
    return CacheHelper.cacheQuery(
      key,
      queryFn,
      ttl,
      this.getTags(coupleId)
    )
  }

  protected getPaginationParams(options?: PaginationOptions): {
    skip: number
    take: number
    page: number
    pageSize: number
  } {
    const page = Math.max(1, options?.page || 1)
    const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20))
    const skip = (page - 1) * pageSize

    return { skip, take: pageSize, page, pageSize }
  }

  protected createPaginatedResult<R>(
    data: R[],
    total: number,
    page: number,
    pageSize: number
  ): PaginatedResult<R> {
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}