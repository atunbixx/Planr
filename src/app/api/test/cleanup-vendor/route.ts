import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

/**
 * POST /api/test/cleanup-vendor
 * Clean up test vendor data
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const { slug } = await request.json()

    if (!slug) {
      return createErrorResponse('Slug is required', 400, 'VALIDATION_ERROR')
    }

    // Find and delete vendor
    const vendor = await prisma.vendor.findUnique({
      where: { slug }
    })

    if (vendor) {
      await prisma.vendor.delete({
        where: { id: vendor.id }
      })
    }

    return createSuccessResponse({
      cleaned: true,
      slug
    }, 'Test vendor cleaned up successfully')

  } catch (error) {
    console.error('Failed to cleanup test vendor:', error)
    return createErrorResponse('Failed to cleanup test vendor', 500, 'CLEANUP_ERROR')
  }
}