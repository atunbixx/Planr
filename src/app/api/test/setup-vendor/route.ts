import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

/**
 * POST /api/test/setup-vendor
 * Create test vendor for E2E testing
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const vendorData = await request.json()

    if (!vendorData.slug || !vendorData.name) {
      return createErrorResponse('Slug and name are required', 400, 'VALIDATION_ERROR')
    }

    // Create test user if doesn't exist
    let user = await prisma.user.findUnique({
      where: { email: 'test-vendor-owner@example.com' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test-vendor-owner@example.com',
          password: 'hashed-test-password',
          role: 'vendor',
          onboardingCompleted: true
        }
      })
    }

    // Create test vendor
    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        name: vendorData.name,
        category: vendorData.category || 'Photography',
        slug: vendorData.slug,
        priceRange: vendorData.priceRange || '$1000-$3000',
        contact: vendorData.phone || '+1-555-123-4567',
        email: vendorData.email || 'info@testvendor.com',
        website: vendorData.website || 'https://testvendor.com',
        city: vendorData.city || 'New York',
        address: vendorData.address || '123 Test Street, New York, NY',
        rating: vendorData.rating || 4.5,
        notes: vendorData.description || 'Test vendor for E2E testing'
      }
    })

    return createSuccessResponse({
      vendorId: vendor.id,
      slug: vendor.slug,
      userId: user.id
    }, 'Test vendor created successfully')

  } catch (error) {
    console.error('Failed to create test vendor:', error)
    return createErrorResponse('Failed to create test vendor', 500, 'SETUP_ERROR')
  }
}