import { NextResponse } from 'next/server'
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'

async function handler(request: AuthenticatedRequest) {
  try {
    // User is already authenticated via middleware
    return NextResponse.json({
      success: true,
      data: {
        user: request.user
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export const GET = requireAuth(handler)