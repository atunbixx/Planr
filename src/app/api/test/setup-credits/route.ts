import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

/**
 * POST /api/test/setup-credits
 * Set up test user credits
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const { userId, credits } = await request.json()

    if (!userId || credits === undefined) {
      return createErrorResponse('UserId and credits are required', 400, 'VALIDATION_ERROR')
    }

    // Upsert credit balance
    const creditBalance = await prisma.creditBalance.upsert({
      where: { userId },
      update: { credits },
      create: {
        userId,
        credits
      }
    })

    return createSuccessResponse({
      userId,
      credits: creditBalance.credits
    }, 'Test credits set up successfully')

  } catch (error) {
    console.error('Failed to setup test credits:', error)
    return createErrorResponse('Failed to setup test credits', 500, 'SETUP_ERROR')
  }
}