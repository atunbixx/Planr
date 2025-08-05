import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params
    const { code } = resolvedParams

    if (!code) {
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 400 })
    }

    const guest = await prisma.guest.findUnique({
      where: { invitationCode: code },
      include: {
        couple: {
          select: {
            partnerName: true,
            weddingDate: true,
            venue: true,
            location: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    return NextResponse.json({
      guest: {
        name: guest.name,
        plusOne: guest.plusOne,
        rsvpStatus: guest.rsvpStatus,
        dietaryNotes: guest.dietaryNotes,
        specialRequests: guest.specialRequests
      },
      wedding: {
        coupleName: `${guest.couple.user.firstName} & ${guest.couple.partnerName}`,
        date: guest.couple.weddingDate,
        venue: guest.couple.venue,
        location: guest.couple.location
      }
    })
  } catch (error) {
    console.error('Error fetching RSVP details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params
    const { code } = resolvedParams
    const body = await request.json()
    const { rsvpStatus, dietaryNotes, specialRequests, plusOneAttending } = body

    if (!code) {
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 400 })
    }

    if (!['confirmed', 'declined'].includes(rsvpStatus)) {
      return NextResponse.json({ error: 'Invalid RSVP status' }, { status: 400 })
    }

    const guest = await prisma.guest.findUnique({
      where: { invitationCode: code }
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Update guest RSVP
    const updatedGuest = await prisma.guest.update({
      where: { invitationCode: code },
      data: {
        rsvpStatus,
        dietaryNotes: dietaryNotes || guest.dietaryNotes,
        specialRequests: specialRequests || guest.specialRequests,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'RSVP updated successfully',
      guest: {
        name: updatedGuest.name,
        rsvpStatus: updatedGuest.rsvpStatus
      }
    })
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}