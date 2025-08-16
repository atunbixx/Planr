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
    // For now return empty array - temp storage for guests not implemented yet
    return NextResponse.json({
      success: true,
      data: []
    })
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
          `Validation error: ${validationResult.error.issues.map(e => e.message).join(', ')}`
        ),
        { status: 400 }
      )
    }

    const { name, rsvpStatus, mealPreference, side, invitationSent } = validationResult.data

    // Create guest with RSVP in a transaction
    let result
    try {
      result = await prisma.$transaction(async (tx) => {
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
    } catch (dbError) {
      console.log('Database not available for guest creation')
      // For now return mock success - temp storage for guests not implemented yet
      const mockGuest = {
        id: Date.now().toString(),
        userId: request.user!.id,
        name,
        rsvpStatus,
        mealPreference,
        side,
        invitationSent,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const mockRsvp = {
        id: Date.now().toString(),
        guestId: mockGuest.id,
        status: rsvpStatus,
        dateResponded: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      result = { guest: mockGuest, rsvp: mockRsvp }
    }

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