import { prisma } from '@/lib/prisma'

/**
 * Query optimization utilities for vendor marketplace
 */

// Query performance monitoring
interface QueryMetrics {
  query: string
  duration: number
  rowCount: number
  cached: boolean
}

class QueryMonitor {
  private metrics: QueryMetrics[] = []
  private slowQueryThreshold = 1000 // 1 second

  logQuery(query: string, duration: number, rowCount: number, cached: boolean = false) {
    const metric: QueryMetrics = { query, duration, rowCount, cached }
    this.metrics.push(metric)
    
    if (duration > this.slowQueryThreshold && !cached) {
      console.warn(`Slow query detected (${duration}ms):`, query)
    }
  }

  getSlowQueries(): QueryMetrics[] {
    return this.metrics.filter(m => m.duration > this.slowQueryThreshold && !m.cached)
  }

  getAverageQueryTime(): number {
    if (this.metrics.length === 0) return 0
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / this.metrics.length
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0
    const cached = this.metrics.filter(m => m.cached).length
    return (cached / this.metrics.length) * 100
  }

  reset() {
    this.metrics = []
  }
}

export const queryMonitor = new QueryMonitor()

/**
 * Optimized vendor search with query hints
 */
export async function optimizedVendorSearch(params: {
  category?: string
  location?: { lat: number; lng: number; radius: number }
  minRating?: number
  featured?: boolean
  verified?: boolean
  limit: number
  offset: number
}) {
  const start = Date.now()
  
  // Build optimized query
  const query = prisma.$queryRaw`
    SELECT 
      v.id,
      v.business_name,
      v.category,
      v.description,
      v.city,
      v.state,
      v.average_rating,
      v.total_reviews,
      v.price_range,
      v.featured,
      v.portfolio_images[1:3] as preview_images,
      ${params.location ? prisma.$queryRaw`
        ST_Distance(
          ST_MakePoint(${params.location.lng}::float, ${params.location.lat}::float)::geography,
          ST_MakePoint(v.longitude::float, v.latitude::float)::geography
        ) / 1609.34 as distance_miles
      ` : prisma.$queryRaw`NULL as distance_miles`}
    FROM marketplace_vendors v
    WHERE v.verified = true
    ${params.category ? prisma.$queryRaw`AND v.category = ${params.category}` : prisma.$queryRaw``}
    ${params.minRating ? prisma.$queryRaw`AND v.average_rating >= ${params.minRating}` : prisma.$queryRaw``}
    ${params.featured !== undefined ? prisma.$queryRaw`AND v.featured = ${params.featured}` : prisma.$queryRaw``}
    ${params.location ? prisma.$queryRaw`
      AND v.latitude IS NOT NULL 
      AND v.longitude IS NOT NULL
      AND ST_DWithin(
        ST_MakePoint(v.longitude::float, v.latitude::float)::geography,
        ST_MakePoint(${params.location.lng}::float, ${params.location.lat}::float)::geography,
        ${params.location.radius * 1609.34}
      )
    ` : prisma.$queryRaw``}
    ORDER BY 
      ${params.location ? prisma.$queryRaw`distance_miles ASC,` : prisma.$queryRaw``}
      v.featured DESC,
      v.average_rating DESC NULLS LAST
    LIMIT ${params.limit}
    OFFSET ${params.offset}
  `
  
  const results = await query
  const duration = Date.now() - start
  
  queryMonitor.logQuery('optimizedVendorSearch', duration, results.length)
  
  return results
}

/**
 * Get vendor with optimized includes
 */
export async function getVendorWithDetails(vendorId: string) {
  const start = Date.now()
  
  // Use select to only get needed fields
  const vendor = await prisma.marketplace_vendors.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      business_name: true,
      category: true,
      description: true,
      contact_email: true,
      contact_phone: true,
      website: true,
      city: true,
      state: true,
      average_rating: true,
      total_reviews: true,
      verified: true,
      featured: true,
      price_range: true,
      specialties: true,
      portfolio_images: true,
      latitude: true,
      longitude: true,
      // Only include recent reviews
      vendor_reviews: {
        where: { is_published: true },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          rating: true,
          title: true,
          review: true,
          reviewer_name: true,
          created_at: true
        }
      },
      // Only include active packages
      vendor_packages: {
        orderBy: [{ is_popular: 'desc' }, { display_order: 'asc' }],
        select: {
          id: true,
          name: true,
          price: true,
          price_unit: true,
          is_popular: true
        }
      }
    }
  })
  
  const duration = Date.now() - start
  queryMonitor.logQuery('getVendorWithDetails', duration, vendor ? 1 : 0)
  
  return vendor
}

/**
 * Batch load vendors for better performance
 */
export async function batchLoadVendors(vendorIds: string[]) {
  if (vendorIds.length === 0) return []
  
  const start = Date.now()
  
  const vendors = await prisma.marketplace_vendors.findMany({
    where: { 
      id: { in: vendorIds },
      verified: true
    },
    select: {
      id: true,
      business_name: true,
      category: true,
      average_rating: true,
      city: true,
      state: true,
      price_range: true,
      portfolio_images: true
    }
  })
  
  const duration = Date.now() - start
  queryMonitor.logQuery('batchLoadVendors', duration, vendors.length)
  
  return vendors
}

/**
 * Get query performance stats
 */
export function getQueryStats() {
  return {
    averageQueryTime: queryMonitor.getAverageQueryTime(),
    cacheHitRate: queryMonitor.getCacheHitRate(),
    slowQueries: queryMonitor.getSlowQueries()
  }
}

/**
 * Database connection pooling configuration
 */
export const optimizedPrismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  pool: {
    maxConnections: 10,
    minConnections: 2,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  }
}