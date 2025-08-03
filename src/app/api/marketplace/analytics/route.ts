import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET /api/marketplace/analytics - Get marketplace analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y

    // Calculate date range based on period
    const daysMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    const days = daysMap[period as keyof typeof daysMap] || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get vendor statistics
    const vendorStats = await prisma.couple_vendors.aggregate({
      where: {
        is_verified: true,
        created_at: { gte: startDate }
      },
      _count: { id: true },
      _avg: { average_rating: 1 }
    })

    // Get category breakdown
    const categoryBreakdown = await prisma.couple_vendors.groupBy({
      by: ['category'],
      where: { is_verified: true },
      _count: { id: true },
      _avg: { average_rating: 1 }
    })

    // Get recent activity
    const recentReviews = await prisma.vendor_reviews.findMany({
      where: { created_at: { gte: startDate } },
      include: {
        couple_vendors: {
          select: { business_name: true, category: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })

    // Get top vendors
    const topVendors = await prisma.couple_vendors.findMany({
      where: { is_verified: true },
      select: {
        id: true,
        business_name: true,
        category: true,
        average_rating: true,
        total_reviews: true,
        city: true,
        state: true,
        min_price: true,
        max_price: true,
        is_featured: true
      },
      orderBy: [
        { is_featured: 'desc' },
        { average_rating: 'desc' },
        { total_reviews: 'desc' }
      ],
      take: 10
    })

    // Get price range distribution - using min_price ranges
    const priceRanges = await prisma.couple_vendors.groupBy({
      by: ['min_price'],
      where: { is_verified: true },
      _count: { id: true }
    })

    // Get trending searches (placeholder - would need search tracking)
    const trendingSearches = [
      'photography', 'catering', 'venue', 'flowers', 'music'
    ]

    const analytics = {
      summary: {
        total_vendors: vendorStats._count.id || 0,
        average_rating: vendorStats._avg.average_rating || 0,
        new_vendors_last_30_days: vendorStats._count.id || 0,
        total_reviews: await prisma.vendor_reviews.count({
          where: { created_at: { gte: startDate } }
        })
      },
      
      categories: categoryBreakdown.map(cat => ({
        category: cat.category,
        count: cat._count.id || 0,
        average_rating: cat._avg.average_rating || 0
      })),
      
      top_vendors: topVendors.map(vendor => ({
        id: vendor.id,
        business_name: vendor.business_name,
        category: vendor.category,
        rating: vendor.average_rating || 0,
        review_count: vendor.total_reviews || 0,
        location: `${vendor.city}, ${vendor.state}`,
        price_range: `$${vendor.min_price} - $${vendor.max_price}`,
        featured: vendor.is_featured || false
      })),
      
      price_ranges: priceRanges.map(range => ({
        range: range.min_price ? `$${range.min_price}+` : 'Not specified',
        count: range._count.id || 0
      })),
      
      recent_activity: recentReviews.map(review => ({
        vendor_name: review.couple_vendors?.business_name,
        category: review.couple_vendors?.category,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at
      })),
      
      trending_searches: trendingSearches,
      
      location_insights: {
        top_cities: await getTopCities(),
        top_states: await getTopStates()
      }
    }

    return createSuccessResponse(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

async function getTopCities() {
  const cities = await prisma.couple_vendors.groupBy({
    by: ['city'],
    where: { is_verified: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  })

  return cities.map(city => ({
    city: city.city,
    count: city._count.id || 0
  }))
}

async function getTopStates() {
  const states = await prisma.couple_vendors.groupBy({
    by: ['state'],
    where: { is_verified: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  })

  return states.map(state => ({
    state: state.state,
    count: state._count.id || 0
  }))
}