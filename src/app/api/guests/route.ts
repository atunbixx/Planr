import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'
import { createGuestSchema } from '@/lib/validation/guest'

// GET /api/guests - List all guests for the authenticated user
async function getHandler(request: AuthenticatedRequest) {
  try {
    const guests = await prisma.guest.findMany({
      where: { userId: request.user!.id },
      include: {
        rsvp: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: guests
    })
  } catch (error) {
    console.error('Get guests error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// POST /api/guests - Create a new guest
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = createGuestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        ),
        { status: 400 }
      )
    }

    const { name, rsvpStatus, mealPreference, side, invitationSent } = validationResult.data

    // Create guest with RSVP in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const guest = await tx.guest.create({
        data: {
          userId: request.user!.id,
          name,
          rsvpStatus,
          mealPreference,
          side,
          invitationSent
        }
      })

      // Create corresponding RSVP record
      const rsvp = await tx.rSVP.create({
        data: {
          guestId: guest.id,
          status: rsvpStatus
        }
      })

      return { guest, rsvp }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result.guest,
        rsvp: result.rsvp
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create guest error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)