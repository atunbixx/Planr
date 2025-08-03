import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { searchRateLimit } from '@/lib/api-middleware/rate-limit'
import { getCache, cacheKeys, cacheTTL } from '@/lib/cache/memory-cache'

// Validation schema for nearby search
const nearbySearchSchema = z.object({
  lat: z.string().transform(val => parseFloat(val)).pipe(z.number().min(-90).max(90)),
  lng: z.string().transform(val => parseFloat(val)).pipe(z.number().min(-180).max(180)),
  radius: z.string().optional().transform(val => val ? parseInt(val, 10) : 50).pipe(z.number().min(1).max(200)),
  category: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20).pipe(z.number().min(1).max(50)),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1).pipe(z.number().min(1))
})

// GET /api/marketplace/vendors/nearby - Find vendors near a location
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await searchRateLimit(request)
    if (rateLimitResult.limited) {
      return rateLimitResult.response!
    }

    const { searchParams } = new URL(request.url)
    const searchParamsObject = Object.fromEntries(searchParams.entries())
    
    // Validate input
    const validationResult = nearbySearchSchema.safeParse(searchParamsObject)
    if (!validationResult.success) {
      return createErrorResponse(
        `Invalid search parameters: ${validationResult.error.issues[0].message}`,
        400
      )
    }
    
    const { lat, lng, radius, category, limit, page } = validationResult.data
    const offset = (page - 1) * limit

    // Try to get from cache
    const cache = getCache()
    const cacheKey = `vendors:nearby:${lat},${lng}:${radius}:${category || 'all'}:${page}:${limit}`
    const cached = await cache.get(cacheKey)
    
    if (cached) {
      return createSuccessResponse(cached)
    }

    // Calculate bounding box for initial filtering (rough approximation)
    const latDelta = radius / 69.0  // 1 degree latitude ≈ 69 miles
    const lngDelta = radius / (69.0 * Math.cos(lat * Math.PI / 180))  // Adjust for latitude
    
    const minLat = lat - latDelta
    const maxLat = lat + latDelta
    const minLng = lng - lngDelta
    const maxLng = lng + lngDelta

    // Build where clause
    const whereClause: any = {
      verified: true,
      latitude: {
        gte: minLat,
        lte: maxLat
      },
      longitude: {
        gte: minLng,
        lte: maxLng
      }
    }

    if (category && category !== 'all') {
      whereClause.category = category
    }

    // Get vendors within bounding box
    const vendors = await prisma.marketplace_vendors.findMany({
      where: whereClause,
      select: {
        id: true,
        business_name: true,
        category: true,
        description: true,
        contact_email: true,
        contact_phone: true,
        website: true,
        address: true,
        city: true,
        state: true,
        zip_code: true,
        country: true,
        average_rating: true,
        total_reviews: true,
        verified: true,
        featured: true,
        price_range: true,
        specialties: true,
        portfolio_images: true,
        latitude: true,
        longitude: true,
        created_at: true,
        updated_at: true
      }
    })

    // Calculate exact distances and filter by radius
    const vendorsWithDistance = vendors
      .map(vendor => {
        if (!vendor.latitude || !vendor.longitude) {
          return null
        }
        
        // Haversine formula for calculating distance
        const R = 3959 // Earth's radius in miles
        const dLat = (vendor.latitude - lat) * Math.PI / 180
        const dLng = (vendor.longitude - lng) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat * Math.PI / 180) * Math.cos(vendor.latitude * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c
        
        if (distance > radius) {
          return null
        }
        
        return {
          ...vendor,
          distance_miles: Math.round(distance * 10) / 10,
          price_range: vendor.price_range || '$1,000 - $5,000',
          specialties: vendor.specialties || [],
          portfolio_images: vendor.portfolio_images || [],
          availability: {
            available: true,
            next_available: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          packages: [],
          badges: [
            ...(vendor.featured ? ['Featured'] : []),
            ...(vendor.verified ? ['Verified'] : []),
            ...(Number(vendor.average_rating) >= 4.5 ? ['Top Rated'] : [])
          ]
        }
      })
      .filter(vendor => vendor !== null)
      .sort((a, b) => a!.distance_miles - b!.distance_miles)

    // Apply pagination
    const paginatedVendors = vendorsWithDistance.slice(offset, offset + limit)
    const totalCount = vendorsWithDistance.length
    const hasMore = offset + limit < totalCount

    const response = {
      data: paginatedVendors,
      total: totalCount,
      page,
      limit,
      hasMore,
      center: { lat, lng },
      radius
    }

    // Store in cache
    await cache.set(cacheKey, response, cacheTTL.vendorList)

    return createSuccessResponse(response)
  } catch (error) {
    console.error('Nearby vendors error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}