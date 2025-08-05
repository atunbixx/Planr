import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update or create couple record
    const couple = await prisma.couple.upsert({
      where: { userId: dbUser.id },
      update: {
        partnerName: partnerName || '',
        weddingDate: weddingDate ? new Date(weddingDate) : new Date(),
        venue: venue || '',
        location: location || '',
        expectedGuests: expectedGuests || 0,
        totalBudget: totalBudget || 0,
        weddingStyle: weddingStyle || ''
      },
      create: {
        userId: dbUser.id,
        partnerName: partnerName || '',
        weddingDate: weddingDate ? new Date(weddingDate) : new Date(),
        venue: venue || '',
        location: location || '',
        expectedGuests: expectedGuests || 0,
        totalBudget: totalBudget || 0,
        weddingStyle: weddingStyle || ''
      }
    })

    return NextResponse.json({ 
      success: true, 
      couple: couple 
    })
  } catch (error) {
    console.error('Error saving wedding details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user and their couple data
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
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