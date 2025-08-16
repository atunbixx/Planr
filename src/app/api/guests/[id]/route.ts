import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'
import { updateGuestSchema } from '@/lib/validation/guest'

interface RouteParams {
  params: { id: string }
}

// GET /api/guests/[id] - Get a specific guest
async function getHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const guest = await prisma.guest.findFirst({
      where: {
        id: params.id,
        userId: request.user!.id
      },
      include: {
        rsvp: true
      }
    })

    if (!guest) {
      return NextResponse.json(
        createErrorResponse('Guest not found'),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: guest
    })
  } catch (error) {
    console.error('Get guest error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// PUT /api/guests/[id] - Update a guest
async function putHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = updateGuestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        ),
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update guest and RSVP in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if guest exists and belongs to user
      const existingGuest = await tx.guest.findFirst({
        where: {
          id: params.id,
          userId: request.user!.id
        }
      })

      if (!existingGuest) {
        throw new Error('Guest not found')
      }

      // Update guest
      const guest = await tx.guest.update({
        where: { id: params.id },
        data: updateData
      })

      // Update RSVP if status changed
      if (updateData.rsvpStatus) {
        await tx.rSVP.update({
          where: { guestId: params.id },
          data: {
            status: updateData.rsvpStatus,
            dateResponded: updateData.rsvpStatus !== 'pending' ? new Date() : null
          }
        })
      }

      return guest
    })

    // Fetch updated guest with RSVP
    const updatedGuest = await prisma.guest.findUnique({
      where: { id: params.id },
      include: { rsvp: true }
    })

    return NextResponse.json({
      success: true,
      data: updatedGuest
    })

  } catch (error) {
    console.error('Update guest error:', error)
    if (error instanceof Error && error.message === 'Guest not found') {
      return NextResponse.json(
        createErrorResponse('Guest not found'),
        { status: 404 }
      )
    }
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// DELETE /api/guests/[id] - Delete a guest
async function deleteHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    // Delete guest (RSVP will be deleted automatically due to cascade)
    const guest = await prisma.guest.deleteMany({
      where: {
        id: params.id,
        userId: request.user!.id
      }
    })

    if (guest.count === 0) {
      return NextResponse.json(
        createErrorResponse('Guest not found'),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Guest deleted successfully'
    })

  } catch (error) {
    console.error('Delete guest error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export const GET = requireOnboarding(getHandler)
export const PUT = requireOnboarding(putHandler)
export const DELETE = requireOnboarding(deleteHandler)