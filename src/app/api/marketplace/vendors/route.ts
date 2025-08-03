import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { vendorSearchSchema } from '@/lib/validations/marketplace'
import { searchRateLimit } from '@/lib/api-middleware/rate-limit'
import { getCache, cacheKeys, cacheTTL } from '@/lib/cache/memory-cache'
import { z } from 'zod'

// GET /api/marketplace/vendors - Search and filter marketplace vendors
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await searchRateLimit(request)
    if (rateLimitResult.limited) {
      return rateLimitResult.response!
    }
    const { searchParams } = new URL(request.url)
    
    // Convert URLSearchParams to object for validation
    const searchParamsObject = Object.fromEntries(searchParams.entries())
    
    // Validate input
    const validationResult = vendorSearchSchema.safeParse(searchParamsObject)
    if (!validationResult.success) {
      return createErrorResponse(
        `Invalid search parameters: ${validationResult.error.issues[0].message}`,
        400
      )
    }
    
    const filters = validationResult.data
    const offset = (filters.page - 1) * filters.limit

    // Try to get from cache
    const cache = getCache()
    const cacheKey = cacheKeys.vendorList(filters)
    const cached = await cache.get(cacheKey)
    
    if (cached) {
      return createSuccessResponse(cached)
    }

    // Build where clause
    const whereClause: any = {
      verified: true, // Only show verified vendors in marketplace
    }

    if (filters.category && filters.category !== 'all') {
      whereClause.category = filters.category
    }

    if (filters.location) {
      whereClause.OR = [
        { city: { contains: filters.location, mode: 'insensitive' } },
        { state: { contains: filters.location, mode: 'insensitive' } }
      ]
    }

    if (filters.minRating) {
      whereClause.average_rating = { gte: filters.minRating }
    }

    if (filters.maxPrice) {
      whereClause.price_range = { lte: filters.maxPrice }
    }

    if (filters.verified !== undefined) {
      whereClause.verified = filters.verified
    }

    if (filters.featured !== undefined) {
      whereClause.featured = filters.featured
    }

    if (filters.search) {
      // Use full-text search if available in production
      // For now, use case-insensitive search
      whereClause.OR = [
        { business_name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { specialties: { has: filters.search } },
        { search_keywords: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Build order by clause
    const orderBy: any = {}
    switch (filters.sortBy) {
      case 'rating':
        orderBy.average_rating = filters.sortOrder
        break
      case 'price':
        orderBy.price_range = filters.sortOrder
        break
      case 'newest':
        orderBy.created_at = 'desc'
        break
      default:
        orderBy.average_rating = 'desc'
    }

    // Get total count
    const totalCount = await prisma.marketplace_vendors.count({ where: whereClause })

    // Get vendors
    const vendors = await prisma.marketplace_vendors.findMany({
      where: whereClause,
      orderBy,
      skip: offset,
      take: filters.limit,
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

    // Transform vendors to marketplace format
    const marketplaceVendors = vendors.map(vendor => ({
      ...vendor,
      price_range: vendor.price_range || '$1,000 - $5,000',
      specialties: vendor.specialties || [],
      portfolio_images: vendor.portfolio_images || [],
      availability: {
        available: true,
        next_available: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      packages: [],
      badges: vendor.featured ? ['Featured'] : []
    }))

    const hasMore = offset + filters.limit < totalCount

    const response = {
      data: marketplaceVendors,
      total: totalCount,
      page: filters.page,
      limit: filters.limit,
      hasMore,
      filters
    }

    // Store in cache
    await cache.set(cacheKey, response, cacheTTL.vendorList)

    return createSuccessResponse(response)
  } catch (error) {
    console.error('Marketplace vendors error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}