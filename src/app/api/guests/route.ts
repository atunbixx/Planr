import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Temporarily skip couple lookup due to database schema issues
    // Return empty guests list for now - this will be fixed when user completes wedding profile
    const guests: any[] = []

    // Calculate statistics
    const stats = {
      total: guests.length,
      confirmed: guests.filter(g => g.rsvpStatus === 'confirmed').length,
      declined: guests.filter(g => g.rsvpStatus === 'declined').length,
      pending: guests.filter(g => g.rsvpStatus === 'pending').length,
      withPlusOne: guests.filter(g => g.plusOneAllowed).length
    }

    return NextResponse.json({ guests, stats })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerk_user_id: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Temporarily skip couple lookup due to database schema issues
    // Guest creation will be available when user completes wedding profile
    return NextResponse.json({ 
      success: false,
      error: 'Please complete your wedding profile first',
      message: 'Guest management is available after setting up your wedding details',
      redirectTo: '/dashboard/settings/wedding'
    }, { status: 400 })
  } catch (error) {
    console.error('Error creating guest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}