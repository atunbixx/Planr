import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

/**
 * POST /api/test/setup-invite
 * Create test invite for E2E testing
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const { email, token } = await request.json()

    if (!email || !token) {
      return createErrorResponse('Email and token are required', 400, 'VALIDATION_ERROR')
    }

    // Create test user if doesn't exist
    let user = await prisma.user.findUnique({
      where: { email: 'test-user@example.com' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test-user@example.com',
          password: 'hashed-test-password',
          role: 'couple',
          onboardingCompleted: true
        }
      })
    }

    // Create test invite
    const invite = await prisma.invite.create({
      data: {
        userId: user.id,
        email,
        token,
        country: 'US'
      }
    })

    return createSuccessResponse({
      inviteId: invite.id,
      token: invite.token,
      userId: user.id
    }, 'Test invite created successfully')

  } catch (error) {
    console.error('Failed to create test invite:', error)
    return createErrorResponse('Failed to create test invite', 500, 'SETUP_ERROR')
  }
}