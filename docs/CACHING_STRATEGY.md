# Caching Strategy Documentation

This document outlines the comprehensive caching strategy implemented for the Wedding Planner v2 application to improve performance and reduce database load.

## Overview

The caching system is built on top of the repository pattern, providing:
- **Intelligent caching** with automatic invalidation
- **Multiple cache types** for different data patterns  
- **Performance monitoring** and optimization recommendations
- **Tag-based invalidation** for precise cache management
- **LRU (Least Recently Used)** eviction policy

## Architecture

### Cache Layers

1. **Repository Cache** - General entity caching (10min TTL, 2000 entries)
2. **User Data Cache** - User-specific data (30min TTL, 500 entries)  
3. **Stats Cache** - Statistics and aggregations (5min TTL, 100 entries)

### Core Components

- **CacheManager** - LRU cache with tag-based invalidation
- **BaseRepository** - Enhanced with caching capabilities
- **PerformanceMonitor** - Query performance tracking and analysis
- **Admin API** - Cache management and monitoring endpoints

## Cache Configuration

### Default Settings
```typescript
repositoryCache: {
  maxSize: 2000,
  ttl: 10 * 60 * 1000, // 10 minutes
  updateAgeOnGet: true
}

userDataCache: {
  maxSize: 500,
  ttl: 30 * 60 * 1000, // 30 minutes  
  updateAgeOnGet: true
}

statsCache: {
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
  updateAgeOnGet: false
}
```

### Cache Key Patterns
```
user:id:{userId}
user:supabase:{supabaseUserId}
user:email:{email}
couple:userId:{userId}
budgetExpense:id:{expenseId}
budgetExpense:couple:{coupleId}
```

## Repository Integration

### Enhanced BaseRepository

All repositories now extend the enhanced `BaseRepository` with caching support:

```typescript
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user') // Entity name for cache tagging
  }

  async findById(id: string): Promise<User | null> {
    return this.executeQueryWithCache(
      `user:id:${id}`,
      () => prisma.user.findUnique({ where: { id } }),
      { cacheType: 'user', tags: ['user', `user:${id}`] }
    )
  }
}
```

### Cache Methods

#### Read Operations with Caching
- `executeQueryWithCache()` - Cache-enabled query execution
- Automatic cache key generation
- Tag-based organization for invalidation

#### Write Operations with Invalidation  
- `createWithCache()` - Create with automatic cache invalidation
- `updateWithCache()` - Update with automatic cache invalidation
- `deleteWithCache()` - Delete with automatic cache invalidation

## Tag-Based Invalidation

### Tagging Strategy
Each cache entry is tagged for precise invalidation:

```typescript
// User cache entry tags
tags: ['user', 'user:123', 'user:email:john@example.com']

// Couple cache entry tags  
tags: ['couple', 'couple:user:123', 'couple:456']

// Budget expense cache entry tags
tags: ['budgetExpense', 'budgetExpense:789', 'budget', 'couple:456']
```

### Invalidation Patterns

When data changes, related cache entries are automatically invalidated:

```typescript
// User update invalidates:
- user:id:{userId}
- user:supabase:{supabaseUserId} 
- user:email:{email}
- couple:userId:{userId} (related data)

// Couple update invalidates:
- couple:* (all couple entries)
- user:withCouple:* (user data with couple info)
```

## Performance Monitoring

### Metrics Tracked
- **Cache Hit Rate** - Percentage of queries served from cache
- **Average Query Time** - Mean execution time across all queries
- **Slow Queries** - Queries exceeding 1000ms threshold
- **Cache Statistics** - Size, hit/miss ratios per cache type

### Performance Monitor Usage
```typescript
import { performanceMonitor } from '@/lib/cache/PerformanceMonitor'

// Get current metrics
const metrics = performanceMonitor.getMetrics()

// Get recommendations
const recommendations = performanceMonitor.getRecommendations()

// Export for external monitoring
const exportData = performanceMonitor.exportMetrics()
```

## API Endpoints

### Cache Management API (`/api/admin/cache`)

#### GET - Retrieve Cache Statistics
```bash
# Basic overview
GET /api/admin/cache

# Detailed statistics  
GET /api/admin/cache?action=stats

# Export metrics
GET /api/admin/cache?action=export
```

#### POST - Cache Management Operations
```bash
# Clear all cache
POST /api/admin/cache
{ "action": "clear" }

# Clear specific tags
POST /api/admin/cache
{ "action": "clear", "tags": ["user", "couple"] }

# Invalidate by pattern
POST /api/admin/cache
{ "action": "invalidate-pattern", "patterns": ["user:.*"] }

# Reset performance metrics
POST /api/admin/cache
{ "action": "reset-metrics" }
```

#### DELETE - Remove Specific Cache Entry
```bash
# Delete from all caches
DELETE /api/admin/cache?key=user:id:123

# Delete from specific cache
DELETE /api/admin/cache?key=user:id:123&type=user
```

## Implementation Examples

### Repository with Caching
```typescript
export class CoupleRepository extends BaseRepository<CoupleData> {
  constructor() {
    super('couple')
  }

  async findByUserId(userId: string): Promise<CoupleData | null> {
    return this.executeQueryWithCache(
      `couple:userId:${userId}`,
      async () => {
        // Complex database query logic
        return await this.performComplexQuery(userId)
      },
      { 
        cacheType: 'user', 
        tags: ['couple', `couple:user:${userId}`] 
      }
    )
  }

  async update(id: string, data: UpdateCoupleData): Promise<CoupleData> {
    return this.updateWithCache(
      () => prisma.couple.update({ where: { id }, data }),
      ['couple', `couple:${id}`, 'couple:all', 'stats'] // Invalidate related caches
    )
  }
}
```

### Manual Cache Management
```typescript
import { repositoryCache, userDataCache } from '@/lib/cache/CacheManager'

// Set cache manually
userDataCache.set('custom:key', data, ['user', 'custom'])

// Get cached data
const cached = userDataCache.get('custom:key')

// Invalidate by tags
userDataCache.invalidateByTags(['user'])

// Invalidate by pattern
userDataCache.invalidateByPattern(/^user:.*/)
```

## Performance Optimization Guidelines

### When to Use Each Cache Type

1. **Repository Cache** - General entity data, relationships
2. **User Data Cache** - User profiles, authentication data, settings  
3. **Stats Cache** - Dashboard statistics, aggregated data, reports

### Cache Key Best Practices

1. **Consistent Format** - Use predictable patterns like `entity:field:value`
2. **Unique Identifiers** - Include all parameters that affect the result
3. **Hierarchical Tags** - Use general and specific tags for flexible invalidation
4. **Avoid Long Keys** - Keep cache keys under 250 characters

### Invalidation Strategy

1. **Immediate Invalidation** - For write operations (create, update, delete)
2. **Related Data Invalidation** - Clear dependent cache entries
3. **Batch Invalidation** - Use tags to clear multiple related entries
4. **Pattern Invalidation** - For complex invalidation scenarios

## Monitoring and Troubleshooting

### Performance Metrics to Watch

1. **Cache Hit Rate < 60%** - Consider increasing TTL or improving cache keys
2. **Average Query Time > 500ms** - Review slow queries and database indexes
3. **Memory Usage** - Monitor cache size and adjust limits as needed
4. **Slow Queries** - Optimize database queries with high execution times

### Debugging Cache Issues

```typescript
// Check cache statistics
const stats = repositoryCache.getStats()
console.log('Cache size:', stats.size)
console.log('Hit ratio:', stats.hitRatio)

// Monitor specific cache entries
const hasKey = repositoryCache.has('user:id:123')
console.log('Key exists:', hasKey)

// Track performance
const metrics = performanceMonitor.getMetrics()
console.log('Cache hit rate:', metrics.cacheHitRate)
console.log('Slow queries:', metrics.slowQueries)
```

### Common Cache Patterns

#### Read-Through Caching
```typescript
async getUserData(userId: string) {
  return this.executeQueryWithCache(
    `user:full:${userId}`,
    () => this.fetchUserWithRelations(userId),
    { cacheType: 'user', tags: ['user', `user:${userId}`] }
  )
}
```

#### Write-Around Caching  
```typescript
async updateUser(userId: string, data: UpdateData) {
  const result = await this.updateWithCache(
    () => prisma.user.update({ where: { id: userId }, data }),
    ['user', `user:${userId}`, 'user:all']
  )
  
  // Cache is invalidated, next read will fetch fresh data
  return result
}
```

#### Cache-Aside Pattern
```typescript
async getExpensiveData(key: string) {
  // Try cache first
  let data = repositoryCache.get(key)
  
  if (!data) {
    // Not in cache, fetch from database
    data = await this.fetchFromDatabase(key)
    
    // Store in cache for next time
    repositoryCache.set(key, data, ['expensive-data'])
  }
  
  return data
}
```

## Migration from Direct Prisma Usage

### Before (Direct Prisma)
```typescript
async findUser(id: string) {
  return await prisma.user.findUnique({ where: { id } })
}
```

### After (Cached Repository)
```typescript  
async findUser(id: string) {
  return this.executeQueryWithCache(
    `user:id:${id}`,
    () => prisma.user.findUnique({ where: { id } }),
    { cacheType: 'user', tags: ['user', `user:${id}`] }
  )
}
```

## Environment Configuration

### Production Settings
```env
CACHE_REPOSITORY_MAX_SIZE=5000
CACHE_REPOSITORY_TTL=600000  # 10 minutes
CACHE_USER_MAX_SIZE=1000
CACHE_USER_TTL=1800000       # 30 minutes  
CACHE_STATS_MAX_SIZE=200
CACHE_STATS_TTL=300000       # 5 minutes
```

### Development Settings
```env
CACHE_REPOSITORY_MAX_SIZE=1000
CACHE_REPOSITORY_TTL=300000  # 5 minutes
CACHE_USER_MAX_SIZE=200
CACHE_USER_TTL=600000        # 10 minutes
CACHE_STATS_MAX_SIZE=50
CACHE_STATS_TTL=60000        # 1 minute
```

## Future Enhancements

1. **Redis Integration** - Scale caching to multiple server instances
2. **Cache Warming** - Preload frequently accessed data
3. **Smart Prefetching** - Predictive data loading based on user patterns
4. **Distributed Invalidation** - Coordinate cache invalidation across services
5. **Compression** - Reduce memory usage for large cached objects
6. **Metrics Dashboard** - Real-time cache performance visualization

## Troubleshooting Guide

### Common Issues

1. **Low Cache Hit Rate**
   - Check cache key consistency
   - Verify TTL is appropriate for data change frequency
   - Review invalidation logic

2. **Memory Issues**
   - Monitor cache sizes
   - Adjust max entries limits
   - Consider more aggressive eviction policies

3. **Stale Data**
   - Verify invalidation tags are comprehensive
   - Check that write operations trigger invalidation
   - Consider shorter TTL for frequently changing data

4. **Performance Degradation**
   - Monitor slow queries
   - Check cache overhead vs. database query time
   - Optimize cache key generation

### Health Checks

```typescript
// Add to your health check endpoint
const cacheHealth = {
  repository: repositoryCache.getStats(),
  userData: userDataCache.getStats(),
  stats: statsCache.getStats(),
  performance: performanceMonitor.getMetrics(),
  healthy: performanceMonitor.getMetrics().cacheHitRate > 0.5
}
```

This caching strategy provides a robust foundation for high-performance data access while maintaining data consistency and providing comprehensive monitoring capabilities.