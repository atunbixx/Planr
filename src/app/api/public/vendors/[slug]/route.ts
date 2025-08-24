import { NextRequest, NextResponse } from 'next/server'
import { VendorService } from '@/features/vendors/service/vendor.service'
import { createErrorResponse, createSuccessResponse, createNotFoundResponse } from '@/lib/api/response'

// Initialize service
const vendorService = new VendorService()

/**
 * GET /api/public/vendors/[slug]
 * Get vendor by slug (public endpoint for SSR)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug) {
      return createErrorResponse(
        'Vendor slug is required',
        400,
        'SLUG_REQUIRED'
      )
    }

    // Validate slug format (basic validation)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return createErrorResponse(
        'Invalid slug format',
        400,
        'INVALID_SLUG'
      )
    }

    // Get vendor by slug
    const result = await vendorService.getVendorBySlug(slug)

    if (!result.success) {
      return createErrorResponse(
        result.error?.message || 'Failed to get vendor',
        result.error?.statusCode || 500,
        result.error?.code || 'VENDOR_GET_FAILED'
      )
    }

    if (!result.data) {
      return createNotFoundResponse('Vendor')
    }

    // Increment view count (fire and forget)
    vendorService.incrementViewCount(slug).catch(error => {
      console.warn('Failed to increment view count:', error)
    })

    // Set cache headers for ISR
    const response = createSuccessResponse(result.data)
    
    // Cache for 15 minutes (can be configured via environment variable)
    const revalidateSeconds = parseInt(process.env.DEFAULT_REVALIDATE_SECONDS || '900')
    response.headers.set('Cache-Control', `s-maxage=${revalidateSeconds}, stale-while-revalidate`)

    return response
  } catch (error) {
    console.error('Error in vendor API:', error)
    return createErrorResponse(
      'Internal server error',
      500,
      'INTERNAL_ERROR'
    )
  }
}