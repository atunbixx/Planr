import { NextRequest, NextResponse } from 'next/server'
import { VendorService } from '@/features/vendors/service/vendor.service'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { z } from 'zod'

// Initialize service
const vendorService = new VendorService()

// Validation schema for inquiry
const inquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required').max(1000),
  budget: z.number().positive().optional(),
  eventDate: z.string().datetime().optional()
})

/**
 * POST /api/public/vendors/[slug]/inquire
 * Submit inquiry for vendor by slug
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim()
    
    // Rate limiting
    const rl = checkRateLimit(`pub:inquire:${ip || 'unknown'}`, { windowMs: 60000, max: 30 })
    if (!rl.ok) {
      const res = NextResponse.json({ 
        success: false, 
        error: { message: 'Too many requests' } 
      }, { status: 429 })
      res.headers.set('X-RateLimit-Limit', String(rl.limit))
      res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
      res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
      res.headers.set('Retry-After', String(Math.ceil(rl.retryAfter / 1000)))
      return res
    }

    if (!slug) {
      return createErrorResponse(
        'Vendor slug is required',
        400,
        'SLUG_REQUIRED'
      )
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}))
    const validation = inquirySchema.safeParse(body)
    
    if (!validation.success) {
      return createErrorResponse(
        'Invalid input data',
        400,
        'VALIDATION_ERROR',
        validation.error.errors
      )
    }

    const inquiryData = validation.data

    // Submit inquiry through service
    const result = await vendorService.submitInquiry(slug, inquiryData)

    if (!result.success) {
      return createErrorResponse(
        result.error?.message || 'Failed to submit inquiry',
        result.error?.statusCode || 500,
        result.error?.code || 'INQUIRY_FAILED'
      )
    }

    const res = createSuccessResponse(
      { id: result.data?.id },
      'Inquiry submitted successfully',
      201
    )
    
    // Add rate limit headers
    res.headers.set('X-RateLimit-Limit', String(rl.limit))
    res.headers.set('X-RateLimit-Remaining', String(rl.remaining))
    res.headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetAt / 1000)))
    
    return res
  } catch (error) {
    console.error('Error in vendor inquiry API:', error)
    return createErrorResponse(
      'Internal server error',
      500,
      'INTERNAL_ERROR'
    )
  }
}