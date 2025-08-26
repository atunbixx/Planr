import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

/**
 * POST /api/test/cleanup-all
 * Clean up all test data
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const { confirm } = await request.json()

    if (!confirm) {
      return createErrorResponse('Confirmation required', 400, 'VALIDATION_ERROR')
    }

    console.log('🧹 Starting test data cleanup...')

    // Clean up in order to respect foreign key constraints
    
    // 1. Clean up RSVPs
    const rsvpCount = await prisma.inviteRSVP.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test'
          }
        }
      }
    })

    // 2. Clean up invites
    const inviteCount = await prisma.invite.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { token: { contains: 'test' } },
          { token: { contains: 'invite_' } }
        ]
      }
    })

    // 3. Clean up credit balances
    const creditCount = await prisma.creditBalance.deleteMany({
      where: {
        user: {
          email: {
            contains: 'test'
          }
        }
      }
    })

    // 4. Clean up vendors
    const vendorCount = await prisma.vendor.deleteMany({
      where: {
        OR: [
          { slug: { contains: 'test' } },
          { name: { contains: 'Test' } },
          { email: { contains: 'test' } }
        ]
      }
    })

    // 5. Clean up users (this will cascade to related data)
    const userCount = await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    })

    console.log('✅ Test data cleanup completed:', {
      users: userCount.count,
      vendors: vendorCount.count,
      invites: inviteCount.count,
      rsvps: rsvpCount.count,
      credits: creditCount.count
    })

    return createSuccessResponse({
      cleaned: {
        users: userCount.count,
        vendors: vendorCount.count,
        invites: inviteCount.count,
        rsvps: rsvpCount.count,
        credits: creditCount.count
      }
    }, 'All test data cleaned up successfully')

  } catch (error) {
    console.error('Failed to cleanup test data:', error)
    return createErrorResponse('Failed to cleanup test data', 500, 'CLEANUP_ERROR')
  }
}