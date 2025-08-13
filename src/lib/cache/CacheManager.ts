import { LRUCache } from 'lru-cache'

export interface CacheConfig {
  maxSize: number
  ttl: number // Time to live in milliseconds
  updateAgeOnGet?: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  tags: string[]
}

export class CacheManager {
  private cache: LRUCache<string, CacheEntry<any>>
  private tagIndex: Map<string, Set<string>> = new Map()

  constructor(config: CacheConfig = {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes default
    updateAgeOnGet: true
  }) {
    this.cache = new LRUCache({
      max: config.maxSize,
      ttl: config.ttl,
      updateAgeOnGet: config.updateAgeOnGet,
      dispose: (value, key) => {
        // Clean up tag index when entry is disposed
        this.cleanupTagIndex(key, value.tags)
      }
    })
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if data is stale
    if (Date.now() - entry.timestamp > this.cache.ttl!) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cached data with tags for invalidation
   */
  set<T>(key: string, data: T, tags: string[] = []): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      tags
    }

    this.cache.set(key, entry)
    this.updateTagIndex(key, tags)
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry) {
      this.cleanupTagIndex(key, entry.tags)
    }
    return this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries with specific tags
   */
  invalidateByTags(tags: string[]): void {
    const keysToDelete = new Set<string>()

    tags.forEach(tag => {
      const keys = this.tagIndex.get(tag)
      if (keys) {
        keys.forEach(key => keysToDelete.add(key))
      }
    })

    keysToDelete.forEach(key => {
      this.cache.delete(key)
    })

    // Clean up tag index
    tags.forEach(tag => {
      this.tagIndex.delete(tag)
    })
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidateByPattern(pattern: RegExp): void {
    const keysToDelete: string[] = []
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      hitRatio: this.cache.calculatedSize / (this.cache.calculatedSize + this.cache.fetchMethod?.length || 1),
      tags: Array.from(this.tagIndex.keys()),
      entries: Array.from(this.cache.keys())
    }
  }

  /**
   * Check if cache has a key
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Get or set cached data with a loader function
   */
  async getOrSet<T>(
    key: string, 
    loader: () => Promise<T>, 
    tags: string[] = []
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await loader()
    this.set(key, data, tags)
    return data
  }

  private updateTagIndex(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    })
  }

  private cleanupTagIndex(key: string, tags: string[]): void {
    tags.forEach(tag => {
      const keys = this.tagIndex.get(tag)
      if (keys) {
        keys.delete(key)
        if (keys.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    })
  }
}

// Global cache instances for different data types
export const repositoryCache = new CacheManager({
  maxSize: 2000,
  ttl: 10 * 60 * 1000, // 10 minutes for repository data
  updateAgeOnGet: true
})

export const userDataCache = new CacheManager({
  maxSize: 500,
  ttl: 30 * 60 * 1000, // 30 minutes for user data (less frequently changed)
  updateAgeOnGet: true
})

export const statsCache = new CacheManager({
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes for statistics (frequently changing)
  updateAgeOnGet: false
})