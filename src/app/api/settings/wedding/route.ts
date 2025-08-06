import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'

export const POST = withAuth(async (request: NextRequest, { user }) => {
  const body = await request.json()
  const {
    partnerName,
    weddingDate,
    venue,
    location,
    expectedGuests,
    totalBudget,
    weddingStyle
  } = body

  // For now, just store the wedding settings in the user preferences
  // This avoids the database schema issues with the couples table
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      preferences: {
        weddingSettings: {
          partnerName: partnerName || '',
          weddingDate: weddingDate ? new Date(weddingDate) : new Date(),
          venue: venue || '',
          location: location || '',
          expectedGuests: expectedGuests || 0,
          totalBudget: totalBudget || 0,
          weddingStyle: weddingStyle || '',
          updatedAt: new Date()
        }
      }
    }
  })

  return NextResponse.json({ 
    success: true, 
    message: 'Wedding settings saved successfully',
    data: updatedUser.preferences 
  })
})
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user and their couple data
    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: {
        couples: true
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = dbUser.couples[0] || null

    return NextResponse.json({ 
      success: true, 
      couple: couple 
    })
  } catch (error) {
    console.error('Error fetching wedding details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}