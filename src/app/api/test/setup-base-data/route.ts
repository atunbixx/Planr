import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import bcrypt from 'bcryptjs'

/**
 * POST /api/test/setup-base-data
 * Set up base test data for E2E tests
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const { createTestUser, createTestVendor, createTestInvite } = await request.json()

    const results: any = {}

    if (createTestUser) {
      // Create base test user
      const hashedPassword = await bcrypt.hash('testpassword123', 12)
      
      const testUser = await prisma.user.upsert({
        where: { email: 'test-user@example.com' },
        update: {},
        create: {
          email: 'test-user@example.com',
          password: hashedPassword,
          role: 'couple',
          onboardingCompleted: true,
          isActive: true
        }
      })

      // Create credit balance
      await prisma.creditBalance.upsert({
        where: { userId: testUser.id },
        update: { credits: 1000 },
        create: {
          userId: testUser.id,
          credits: 1000
        }
      })

      results.testUser = {
        id: testUser.id,
        email: testUser.email
      }
    }

    if (createTestVendor) {
      // Create vendor owner user
      const hashedPassword = await bcrypt.hash('vendorpassword123', 12)
      
      const vendorUser = await prisma.user.upsert({
        where: { email: 'test-vendor-owner@example.com' },
        update: {},
        create: {
          email: 'test-vendor-owner@example.com',
          password: hashedPassword,
          role: 'vendor',
          onboardingCompleted: true,
          isActive: true
        }
      })

      // Create test vendor
      const testVendor = await prisma.vendor.upsert({
        where: { slug: 'test-photographer-studio' },
        update: {
          name: 'Test Photography Studio',
          category: 'Photography',
          city: 'New York',
          priceRange: '$2000-$5000',
          rating: 4.8,
          contact: '+1-555-123-4567',
          email: 'info@testphotography.com',
          website: 'https://testphotography.com',
          address: '123 Test Street, New York, NY 10001',
          notes: 'Professional wedding photography services for testing'
        },
        create: {
          userId: vendorUser.id,
          slug: 'test-photographer-studio',
          name: 'Test Photography Studio',
          category: 'Photography',
          city: 'New York',
          priceRange: '$2000-$5000',
          rating: 4.8,
          contact: '+1-555-123-4567',
          email: 'info@testphotography.com',
          website: 'https://testphotography.com',
          address: '123 Test Street, New York, NY 10001',
          notes: 'Professional wedding photography services for testing'
        }
      })

      results.testVendor = {
        id: testVendor.id,
        slug: testVendor.slug,
        name: testVendor.name
      }
    }

    if (createTestInvite && results.testUser) {
      // Create test invite
      const testInvite = await prisma.invite.upsert({
        where: { token: 'test-invite-token' },
        update: {},
        create: {
          userId: results.testUser.id,
          email: 'test-guest@example.com',
          token: 'test-invite-token',
          country: 'US'
        }
      })

      results.testInvite = {
        id: testInvite.id,
        token: testInvite.token,
        email: testInvite.email
      }
    }

    return createSuccessResponse(results, 'Base test data set up successfully')

  } catch (error) {
    console.error('Failed to setup base test data:', error)
    return createErrorResponse('Failed to setup base test data', 500, 'SETUP_ERROR')
  }
}