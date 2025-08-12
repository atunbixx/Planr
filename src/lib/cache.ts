// Enhanced in-memory cache for API responses with pattern-based invalidation
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
  tags: string[]
}

class EnhancedCache {
  private cache = new Map<string, CacheEntry>()
  private tagIndex = new Map<string, Set<string>>() // tag -> keys

  set(key: string, data: any, ttlMs: number = 300000, tags: string[] = []) {
    // Remove old entry if it exists
    this.delete(key)
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      tags
    }
    
    this.cache.set(key, entry)
    
    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    }
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    // Remove from tag index
    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag)
      if (keys) {
        keys.delete(key)
        if (keys.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    }
    
    return this.cache.delete(key)
  }

  // Invalidate all keys with matching tags
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag)
    if (!keys) return 0
    
    let count = 0
    for (const key of Array.from(keys)) {
      if (this.delete(key)) count++
    }
    
    return count
  }

  // Invalidate all keys matching a pattern
  invalidateByPattern(pattern: string): number {
    const regex = new RegExp(pattern)
    let count = 0
    
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        if (this.delete(key)) count++
      }
    }
    
    return count
  }

  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
  }

  // Clean expired entries
  cleanup(): number {
    const now = Date.now()
    let count = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        if (this.delete(key)) count++
      }
    }
    
    return count
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      tags: this.tagIndex.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        tags: entry.tags
      }))
    }
  }
}

export const cache = new EnhancedCache()

// Cache key generators
export const getCacheKey = {
  dashboardStats: (userId: string) => `dashboard-stats-${userId}`,
  userPreferences: (userId: string) => `user-prefs-${userId}`,
  guestList: (coupleId: string) => `guests-${coupleId}`,
  guest: (coupleId: string, guestId: string) => `guest-${coupleId}-${guestId}`,
  budgetData: (coupleId: string) => `budget-${coupleId}`,
  budgetCategories: (coupleId: string) => `budget-categories-${coupleId}`,
  budgetExpenses: (coupleId: string) => `budget-expenses-${coupleId}`,
  vendorList: (coupleId: string) => `vendors-${coupleId}`,
  vendor: (coupleId: string, vendorId: string) => `vendor-${coupleId}-${vendorId}`,
  vendorCategories: () => `vendor-categories`,
  photoGallery: (coupleId: string) => `photos-${coupleId}`,
  photo: (coupleId: string, photoId: string) => `photo-${coupleId}-${photoId}`,
  albums: (coupleId: string) => `albums-${coupleId}`,
  album: (coupleId: string, albumId: string) => `album-${coupleId}-${albumId}`,
  checklistItems: (coupleId: string) => `checklist-${coupleId}`,
  checklistItem: (coupleId: string, itemId: string) => `checklist-item-${coupleId}-${itemId}`,
  weddingSettings: (userId: string) => `wedding-settings-${userId}`,
  messageTemplates: (coupleId: string) => `message-templates-${coupleId}`,
  notifications: (userId: string) => `notifications-${userId}`,
  notificationPreferences: (userId: string) => `notification-prefs-${userId}`,
}

// Cache tags for invalidation
export const getCacheTags = {
  couple: (coupleId: string) => `couple:${coupleId}`,
  user: (userId: string) => `user:${userId}`,
  guests: (coupleId: string) => `guests:${coupleId}`,
  budget: (coupleId: string) => `budget:${coupleId}`,
  vendors: (coupleId: string) => `vendors:${coupleId}`,
  photos: (coupleId: string) => `photos:${coupleId}`,
  checklist: (coupleId: string) => `checklist:${coupleId}`,
  settings: (userId: string) => `settings:${userId}`,
  messages: (coupleId: string) => `messages:${coupleId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  notificationPreferences: (userId: string) => `notification-prefs:${userId}`,
}

// Cache invalidation helpers
export const invalidateCache = {
  // Invalidate all data for a couple
  couple: (coupleId: string) => {
    cache.invalidateByTag(getCacheTags.couple(coupleId))
    cache.invalidateByTag(getCacheTags.guests(coupleId))
    cache.invalidateByTag(getCacheTags.budget(coupleId))
    cache.invalidateByTag(getCacheTags.vendors(coupleId))
    cache.invalidateByTag(getCacheTags.photos(coupleId))
    cache.invalidateByTag(getCacheTags.checklist(coupleId))
    cache.invalidateByTag(getCacheTags.messages(coupleId))
  },
  
  // Invalidate user-specific data
  user: (userId: string) => {
    cache.invalidateByTag(getCacheTags.user(userId))
    cache.invalidateByTag(getCacheTags.settings(userId))
  },
  
  // Invalidate specific domains
  guests: (coupleId: string) => cache.invalidateByTag(getCacheTags.guests(coupleId)),
  budget: (coupleId: string) => cache.invalidateByTag(getCacheTags.budget(coupleId)),
  vendors: (coupleId: string) => cache.invalidateByTag(getCacheTags.vendors(coupleId)),
  photos: (coupleId: string) => cache.invalidateByTag(getCacheTags.photos(coupleId)),
  checklist: (coupleId: string) => cache.invalidateByTag(getCacheTags.checklist(coupleId)),
  messages: (coupleId: string) => cache.invalidateByTag(getCacheTags.messages(coupleId)),
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 60000,      // 1 minute
  MEDIUM: 300000,    // 5 minutes
  LONG: 1800000,     // 30 minutes
  DASHBOARD: 120000, // 2 minutes for dashboard data
} as const

// Cleanup interval (runs every 10 minutes)
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => cache.cleanup(), 600000)
}