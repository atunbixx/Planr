import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

/**
 * POST /api/test/cleanup-invite
 * Clean up test invite data
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const { token } = await request.json()

    if (!token) {
      return createErrorResponse('Token is required', 400, 'VALIDATION_ERROR')
    }

    // Find and delete invite and related RSVPs
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { rsvps: true }
    })

    if (invite) {
      // Delete RSVPs first
      await prisma.inviteRSVP.deleteMany({
        where: { inviteId: invite.id }
      })

      // Delete invite
      await prisma.invite.delete({
        where: { id: invite.id }
      })
    }

    return createSuccessResponse({
      cleaned: true,
      token
    }, 'Test invite cleaned up successfully')

  } catch (error) {
    console.error('Failed to cleanup test invite:', error)
    return createErrorResponse('Failed to cleanup test invite', 500, 'CLEANUP_ERROR')
  }
}