import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET /api/marketplace/vendors/[id]/reviews - Get vendor reviews
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const reviews = await prisma.vendor_reviews.findMany({
      where: { vendor_id: vendorId },
      include: {
        couples: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
            wedding_date: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit
    })

    const totalCount = await prisma.vendor_reviews.count({
      where: { vendor_id: vendorId }
    })

    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      couple: review.couples ? {
        id: review.couples.id,
        name: review.couples.display_name || 'Anonymous',
        avatar: review.couples.avatar_url,
        wedding_date: review.couples.wedding_date
      } : null
    }))

    const hasMore = offset + limit < totalCount

    return createSuccessResponse({
      data: transformedReviews,
      total: totalCount,
      page,
      limit,
      hasMore,
      average_rating: await getAverageRating(vendorId)
    })
  } catch (error) {
    console.error('Reviews error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST /api/marketplace/vendors/[id]/reviews - Create vendor review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    const body = await request.json()
    const { rating, comment } = body

    if (!rating || rating < 1 || rating > 5) {
      return createErrorResponse('Rating must be between 1 and 5', 400)
    }

    // In a real app, we'd get the couple ID from the authenticated user
    // For now, we'll use a placeholder
    const coupleId = 'placeholder-couple-id'

    const review = await prisma.vendor_reviews.create({
      data: {
        vendor_id: vendorId,
        couple_id: coupleId,
        rating,
        comment: comment || '',
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        couples: {
          select: {
            id: true,
            display_name: true,
            avatar_url: true,
            wedding_date: true
          }
        }
      }
    })

    // Update vendor's average rating
    await updateVendorAverageRating(vendorId)

    const transformedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      couple: review.couples ? {
        id: review.couples.id,
        name: review.couples.display_name || 'Anonymous',
        avatar: review.couples.avatar_url,
        wedding_date: review.couples.wedding_date
      } : null
    }

    return createSuccessResponse(transformedReview, 201)
  } catch (error) {
    console.error('Create review error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

async function getAverageRating(vendorId: string) {
  const result = await prisma.vendor_reviews.aggregate({
    where: { vendor_id: vendorId },
    _avg: {
      rating: true
    }
  })
  return result._avg.rating || 0
}

async function updateVendorAverageRating(vendorId: string) {
  const result = await prisma.vendor_reviews.aggregate({
    where: { vendor_id: vendorId },
    _avg: {
      rating: true
    },
    _count: {
      rating: true
    }
  })

  await prisma.vendors.update({
    where: { id: vendorId },
    data: {
      average_rating: result._avg.rating || 0,
      total_reviews: result._count.rating
    }
  })
}