import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals'

// We need to test the actual cache implementation, so we import it directly
// and mock any external dependencies
jest.mock('../../lib/cache', () => {
  // Import the actual implementation
  const actualCache = jest.requireActual('../../lib/cache')
  
  // Create a fresh cache instance for each test
  class TestCache extends actualCache.EnhancedCache {
    constructor() {
      super()
    }
  }
  
  return {
    ...actualCache,
    cache: new TestCache(),
  }
})

import { 
  cache, 
  getCacheKey, 
  getCacheTags, 
  invalidateCache, 
  CACHE_TTL 
} from '../../lib/cache'

describe('Enhanced Cache System', () => {
  beforeEach(() => {
    cache.clear()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('EnhancedCache', () => {
    describe('basic operations', () => {
      it('should store and retrieve data', () => {
        // Arrange
        const key = 'test-key'
        const data = { id: '1', name: 'Test' }
        const ttl = 1000

        // Act
        cache.set(key, data, ttl)
        const result = cache.get(key)

        // Assert
        expect(result).toEqual(data)
      })

      it('should return null for non-existent key', () => {
        // Act
        const result = cache.get('non-existent')

        // Assert
        expect(result).toBeNull()
      })

      it('should respect TTL and expire entries', () => {
        // Arrange
        const key = 'expire-test'
        const data = { test: true }
        const ttl = 1000

        // Act
        cache.set(key, data, ttl)
        
        // Should be available immediately
        expect(cache.get(key)).toEqual(data)
        
        // Fast-forward past TTL
        jest.advanceTimersByTime(1001)
        
        // Should be expired
        expect(cache.get(key)).toBeNull()
      })

      it('should delete entries', () => {
        // Arrange
        const key = 'delete-test'
        const data = { test: true }
        cache.set(key, data)

        // Act
        const deleted = cache.delete(key)
        const result = cache.get(key)

        // Assert
        expect(deleted).toBe(true)
        expect(result).toBeNull()
      })

      it('should return false when deleting non-existent key', () => {
        // Act
        const deleted = cache.delete('non-existent')

        // Assert
        expect(deleted).toBe(false)
      })
    })

    describe('tag-based operations', () => {
      it('should associate entries with tags', () => {
        // Arrange
        const key = 'tagged-entry'
        const data = { test: true }
        const tags = ['couple:123', 'guests:123']

        // Act
        cache.set(key, data, 1000, tags)
        const result = cache.get(key)

        // Assert
        expect(result).toEqual(data)
      })

      it('should invalidate entries by tag', () => {
        // Arrange
        const data = { test: true }
        cache.set('entry1', data, 1000, ['tag1', 'tag2'])
        cache.set('entry2', data, 1000, ['tag1', 'tag3'])
        cache.set('entry3', data, 1000, ['tag3'])

        // Act
        const invalidated = cache.invalidateByTag('tag1')

        // Assert
        expect(invalidated).toBe(2) // entry1 and entry2
        expect(cache.get('entry1')).toBeNull()
        expect(cache.get('entry2')).toBeNull()
        expect(cache.get('entry3')).toEqual(data) // Should still exist
      })

      it('should handle tag invalidation when tag does not exist', () => {
        // Act
        const invalidated = cache.invalidateByTag('non-existent-tag')

        // Assert
        expect(invalidated).toBe(0)
      })

      it('should update tags when overwriting entry', () => {
        // Arrange
        const key = 'update-tags'
        const data = { test: true }
        
        cache.set(key, data, 1000, ['old-tag'])
        cache.set(key, data, 1000, ['new-tag'])

        // Act
        const oldTagInvalidated = cache.invalidateByTag('old-tag')
        const newTagInvalidated = cache.invalidateByTag('new-tag')

        // Assert
        expect(oldTagInvalidated).toBe(0) // Old tag should be removed
        expect(newTagInvalidated).toBe(1) // New tag should exist
      })
    })

    describe('pattern-based operations', () => {
      it('should invalidate entries by pattern', () => {
        // Arrange
        const data = { test: true }
        cache.set('user:123:profile', data)
        cache.set('user:123:settings', data)
        cache.set('user:456:profile', data)
        cache.set('guest:123:data', data)

        // Act
        const invalidated = cache.invalidateByPattern('user:123:.*')

        // Assert
        expect(invalidated).toBe(2) // user:123:profile and user:123:settings
        expect(cache.get('user:123:profile')).toBeNull()
        expect(cache.get('user:123:settings')).toBeNull()
        expect(cache.get('user:456:profile')).toEqual(data)
        expect(cache.get('guest:123:data')).toEqual(data)
      })

      it('should handle invalid regex patterns gracefully', () => {
        // Arrange
        cache.set('test-key', { test: true })

        // Act & Assert - Should not throw
        expect(() => cache.invalidateByPattern('[invalid')).not.toThrow()
      })
    })

    describe('cleanup operations', () => {
      it('should clean up expired entries', () => {
        // Arrange
        const data = { test: true }
        cache.set('expire1', data, 500)
        cache.set('expire2', data, 1500)
        cache.set('persist', data, 5000)

        // Act
        jest.advanceTimersByTime(1000) // Expire first entry
        const cleaned = cache.cleanup()

        // Assert
        expect(cleaned).toBe(1) // Only expire1 should be cleaned
        expect(cache.get('expire1')).toBeNull()
        expect(cache.get('expire2')).toEqual(data)
        expect(cache.get('persist')).toEqual(data)
      })

      it('should clear all entries', () => {
        // Arrange
        cache.set('key1', { test: 1 })
        cache.set('key2', { test: 2 }, 1000, ['tag1'])
        cache.set('key3', { test: 3 }, 2000, ['tag2'])

        // Act
        cache.clear()

        // Assert
        expect(cache.get('key1')).toBeNull()
        expect(cache.get('key2')).toBeNull()
        expect(cache.get('key3')).toBeNull()
        expect(cache.invalidateByTag('tag1')).toBe(0)
        expect(cache.invalidateByTag('tag2')).toBe(0)
      })
    })

    describe('statistics', () => {
      it('should provide cache statistics', () => {
        // Arrange
        const data = { test: true }
        cache.set('entry1', data, 1000, ['tag1'])
        cache.set('entry2', data, 2000, ['tag1', 'tag2'])

        // Act
        const stats = cache.getStats()

        // Assert
        expect(stats.size).toBe(2)
        expect(stats.tags).toBe(2) // tag1 and tag2
        expect(stats.entries).toHaveLength(2)
        expect(stats.entries[0]).toEqual(
          expect.objectContaining({
            key: expect.any(String),
            age: expect.any(Number),
            ttl: expect.any(Number),
            tags: expect.any(Array),
          })
        )
      })
    })
  })

  describe('Cache Key Generators', () => {
    it('should generate consistent keys', () => {
      expect(getCacheKey.guestList('couple-123')).toBe('guests-couple-123')
      expect(getCacheKey.guest('couple-123', 'guest-456')).toBe('guest-couple-123-guest-456')
      expect(getCacheKey.budgetData('couple-123')).toBe('budget-couple-123')
      expect(getCacheKey.vendorCategories()).toBe('vendor-categories')
    })

    it('should generate keys for all entities', () => {
      const coupleId = 'test-couple'
      const itemId = 'test-item'

      const keys = [
        getCacheKey.dashboardStats('user-id'),
        getCacheKey.guestList(coupleId),
        getCacheKey.guest(coupleId, itemId),
        getCacheKey.budgetData(coupleId),
        getCacheKey.vendorList(coupleId),
        getCacheKey.vendor(coupleId, itemId),
        getCacheKey.photoGallery(coupleId),
        getCacheKey.albums(coupleId),
        getCacheKey.checklistItems(coupleId),
      ]

      // All keys should be strings
      keys.forEach(key => expect(typeof key).toBe('string'))
      
      // All keys should be unique
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(keys.length)
    })
  })

  describe('Cache Tags', () => {
    it('should generate consistent tags', () => {
      const coupleId = 'couple-123'
      const userId = 'user-456'

      expect(getCacheTags.couple(coupleId)).toBe('couple:couple-123')
      expect(getCacheTags.user(userId)).toBe('user:user-456')
      expect(getCacheTags.guests(coupleId)).toBe('guests:couple-123')
      expect(getCacheTags.budget(coupleId)).toBe('budget:couple-123')
    })
  })

  describe('Cache Invalidation Helpers', () => {
    beforeEach(() => {
      // Mock the cache methods for testing invalidation
      cache.invalidateByTag = jest.fn()
    })

    it('should invalidate couple-related data', () => {
      // Act
      invalidateCache.couple('couple-123')

      // Assert
      expect(cache.invalidateByTag).toHaveBeenCalledWith('couple:couple-123')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('guests:couple-123')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('budget:couple-123')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('vendors:couple-123')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('photos:couple-123')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('checklist:couple-123')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('messages:couple-123')
    })

    it('should invalidate user-related data', () => {
      // Act
      invalidateCache.user('user-456')

      // Assert
      expect(cache.invalidateByTag).toHaveBeenCalledWith('user:user-456')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('settings:user-456')
    })

    it('should invalidate specific domain data', () => {
      // Act
      invalidateCache.guests('couple-123')
      invalidateCache.budget('couple-123')
      invalidateCache.vendors('couple-123')

      // Assert
      expect(cache.invalidateByTag).toHaveBeenCalledWith('guests:couple-123')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('budget:couple-123')
      expect(cache.invalidateByTag).toHaveBeenCalledWith('vendors:couple-123')
    })
  })

  describe('Cache TTL Constants', () => {
    it('should have appropriate TTL values', () => {
      expect(CACHE_TTL.SHORT).toBe(60000) // 1 minute
      expect(CACHE_TTL.MEDIUM).toBe(300000) // 5 minutes
      expect(CACHE_TTL.LONG).toBe(1800000) // 30 minutes
      expect(CACHE_TTL.DASHBOARD).toBe(120000) // 2 minutes

      // Ensure proper ordering
      expect(CACHE_TTL.SHORT).toBeLessThan(CACHE_TTL.DASHBOARD)
      expect(CACHE_TTL.DASHBOARD).toBeLessThan(CACHE_TTL.MEDIUM)
      expect(CACHE_TTL.MEDIUM).toBeLessThan(CACHE_TTL.LONG)
    })
  })

  describe('integration scenarios', () => {
    it('should handle complex cache invalidation scenario', () => {
      // Arrange - Set up a complex cache scenario
      const coupleId = 'couple-123'
      const guestData = { id: 'guest-1', name: 'John Doe' }
      const statsData = { total: 5, confirmed: 3 }
      const budgetData = { total: 50000, spent: 25000 }

      cache.set(getCacheKey.guestList(coupleId), [guestData], 1000, 
        [getCacheTags.guests(coupleId), getCacheTags.couple(coupleId)])
      cache.set(`guests-${coupleId}:stats`, statsData, 1000, 
        [getCacheTags.guests(coupleId)])
      cache.set(getCacheKey.budgetData(coupleId), budgetData, 1000, 
        [getCacheTags.budget(coupleId), getCacheTags.couple(coupleId)])

      // Verify data is cached
      expect(cache.get(getCacheKey.guestList(coupleId))).toEqual([guestData])
      expect(cache.get(`guests-${coupleId}:stats`)).toEqual(statsData)
      expect(cache.get(getCacheKey.budgetData(coupleId))).toEqual(budgetData)

      // Act - Invalidate guest-related data only
      const invalidated = cache.invalidateByTag(getCacheTags.guests(coupleId))

      // Assert
      expect(invalidated).toBe(2) // guestList and stats
      expect(cache.get(getCacheKey.guestList(coupleId))).toBeNull()
      expect(cache.get(`guests-${coupleId}:stats`)).toBeNull()
      expect(cache.get(getCacheKey.budgetData(coupleId))).toEqual(budgetData) // Should remain
    })

    it('should handle memory cleanup efficiently', () => {
      // Arrange - Create many cache entries
      const entryCount = 100
      for (let i = 0; i < entryCount; i++) {
        cache.set(
          `test-entry-${i}`, 
          { id: i }, 
          i % 2 === 0 ? 100 : 2000, // Half expire quickly
          [`tag-${i % 10}`] // 10 different tags
        )
      }

      expect(cache.getStats().size).toBe(entryCount)

      // Act - Advance time to expire half the entries
      jest.advanceTimersByTime(150)
      const cleaned = cache.cleanup()

      // Assert
      expect(cleaned).toBe(50) // Half should be expired
      expect(cache.getStats().size).toBe(50)
      
      // Verify remaining entries are still accessible
      for (let i = 1; i < entryCount; i += 2) {
        expect(cache.get(`test-entry-${i}`)).toEqual({ id: i })
      }
    })
  })
})