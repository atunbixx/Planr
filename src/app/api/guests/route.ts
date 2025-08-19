import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'
import { createGuestSchema } from '@/lib/validation/guest'

// GET /api/guests - List all guests for the authenticated user
async function getHandler(request: AuthenticatedRequest) {
  try {
    const guests = await prisma.guest.findMany({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: guests
    })
  } catch (error) {
    console.error('Database not available, using temp storage for guests')
    // Use temp storage as fallback
    try {
      const guests = await tempStorage.findGuestsByUserId(request.user!.id)
      return NextResponse.json({
        success: true,
        data: guests
      })
    } catch (tempError) {
      console.error('Temp storage error:', tempError)
      return NextResponse.json({
        success: true,
        data: []
      })
    }
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

    // Create guest
    let result
    try {
      const guest = await prisma.guest.create({
        data: {
          userId: request.user!.id,
          name,
          rsvpStatus,
          mealPreference,
          side,
          invitationSent
        }
      })

      result = { guest }
    } catch (dbError) {
      console.log('Database not available, using temp storage for guest creation')
      // Use temp storage as fallback
      const tempGuest = await tempStorage.createGuest({
        userId: request.user!.id,
        name,
        rsvpStatus,
        mealPreference,
        side,
        invitationSent
      })

      result = { guest: tempGuest }
    }

    return NextResponse.json({
      success: true,
      data: result.guest
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