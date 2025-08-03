import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { getCache, cacheKeys, cacheTTL } from '@/lib/cache/memory-cache'

// GET /api/marketplace/vendors/[id] - Get detailed vendor information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id

    // Try to get from cache
    const cache = getCache()
    const cacheKey = cacheKeys.vendorDetail(vendorId)
    const cached = await cache.get(cacheKey)
    
    if (cached) {
      return createSuccessResponse(cached)
    }

    const vendor = await prisma.marketplace_vendors.findUnique({
      where: { id: vendorId },
      include: {
        vendor_reviews: {
          select: {
            id: true,
            rating: true,
            title: true,
            review: true,
            reviewer_name: true,
            event_date: true,
            verified_booking: true,
            photos: true,
            vendor_response: true,
            vendor_response_date: true,
            helpful_count: true,
            created_at: true,
            couples: {
              select: {
                id: true,
                partner1_name: true,
                partner2_name: true
              }
            }
          },
          where: { is_published: true },
          orderBy: { created_at: 'desc' },
          take: 10
        },
        vendor_packages: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            price_unit: true,
            included_items: true,
            excluded_items: true,
            min_guests: true,
            max_guests: true,
            duration_hours: true,
            is_popular: true,
            display_order: true,
            created_at: true
          },
          orderBy: [{ is_popular: 'desc' }, { display_order: 'asc' }]
        },
        vendor_availability: {
          where: {
            date: {
              gte: new Date()
            }
          },
          select: {
            date: true,
            is_available: true,
            is_booked: true,
            price_adjustment_percentage: true
          },
          take: 90 // Next 3 months
        }
      }
    })

    if (!vendor) {
      return createErrorResponse('Vendor not found', 404)
    }

    // Check if vendor is verified for marketplace
    if (!vendor.verified) {
      return createErrorResponse('Vendor not available in marketplace', 404)
    }

    // Transform to marketplace format
    const marketplaceVendor = {
      id: vendor.id,
      business_name: vendor.business_name,
      category: vendor.category,
      description: vendor.description,
      long_description: vendor.description || 'No description provided',
      contact_email: vendor.contact_email,
      contact_phone: vendor.contact_phone,
      website: vendor.website,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      zip_code: vendor.zip_code,
      country: vendor.country,
      average_rating: vendor.average_rating || 0,
      total_reviews: vendor.total_reviews || 0,
      verified: vendor.verified,
      featured: vendor.featured,
      price_range: vendor.price_range || '$1,000 - $5,000',
      specialties: vendor.specialties || [],
      portfolio_images: vendor.portfolio_images || [],
      portfolio_videos: vendor.portfolio_videos || [],
      
      // Business details
      years_in_business: vendor.years_in_business,
      team_size: vendor.team_size,
      insurance_verified: vendor.insurance_verified,
      license_verified: vendor.license_verified,
      response_time_hours: vendor.response_time_hours,
      response_rate: vendor.response_rate,
      
      // Reviews
      reviews: vendor.vendor_reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.review,
        reviewer_name: review.reviewer_name,
        event_date: review.event_date,
        verified_booking: review.verified_booking,
        photos: review.photos || [],
        vendor_response: review.vendor_response,
        vendor_response_date: review.vendor_response_date,
        helpful_count: review.helpful_count,
        created_at: review.created_at,
        couple: review.couples ? {
          id: review.couples.id,
          name: `${review.couples.partner1_name} & ${review.couples.partner2_name}`
        } : null
      })),
      
      // Packages
      packages: vendor.vendor_packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: Number(pkg.price),
        price_unit: pkg.price_unit,
        includes: pkg.included_items || [],
        excludes: pkg.excluded_items || [],
        min_guests: pkg.min_guests,
        max_guests: pkg.max_guests,
        duration_hours: pkg.duration_hours,
        is_popular: pkg.is_popular,
        created_at: pkg.created_at
      })),
      
      // Availability
      availability: {
        calendar: vendor.vendor_availability.map(avail => ({
          date: avail.date,
          available: avail.is_available && !avail.is_booked,
          price_adjustment: avail.price_adjustment_percentage
        })),
        next_available: vendor.vendor_availability.find(a => a.is_available && !a.is_booked)?.date || 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      
      // Stats
      stats: {
        total_reviews: vendor.total_reviews || 0,
        total_packages: vendor.vendor_packages.length,
        average_rating: vendor.average_rating || 0,
        total_bookings: vendor.total_bookings || 0
      },
      
      // Badges
      badges: [
        ...(vendor.verified ? ['Verified'] : []),
        ...(vendor.featured ? ['Featured'] : []),
        ...(Number(vendor.average_rating) >= 4.5 ? ['Top Rated'] : []),
        ...(vendor.response_time_hours && vendor.response_time_hours <= 12 ? ['Quick Response'] : []),
        ...(vendor.insurance_verified ? ['Insured'] : []),
        ...(vendor.license_verified ? ['Licensed'] : [])
      ],
      
      created_at: vendor.created_at,
      updated_at: vendor.updated_at
    }

    // Store in cache
    await cache.set(cacheKey, marketplaceVendor, cacheTTL.vendorDetail)

    return createSuccessResponse(marketplaceVendor)
  } catch (error) {
    console.error('Vendor details error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}