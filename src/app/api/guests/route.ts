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
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    const guests = await prisma.guest.findMany({
      where: { coupleId: couple.id },
      orderBy: [
        { side: 'asc' },
        { name: 'asc' }
      ]
    })

    // Calculate statistics
    const stats = {
      total: guests.length,
      confirmed: guests.filter(g => g.rsvpStatus === 'confirmed').length,
      declined: guests.filter(g => g.rsvpStatus === 'declined').length,
      pending: guests.filter(g => g.rsvpStatus === 'pending').length,
      withPlusOne: guests.filter(g => g.plusOne).length
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
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      first_name,
      last_name,
      email, 
      phone, 
      address,
      relationship, 
      side, 
      plus_one_allowed,
      plus_one_name,
      dietary_restrictions,
      notes,
      rsvp_deadline
    } = body

    // Combine first and last name
    const name = `${first_name} ${last_name}`.trim()

    // Generate unique invitation code
    let invitationCode = null
    let code
    let isUnique = false
    let attempts = 0
    
    while (!isUnique && attempts < 10) {
      code = randomBytes(8).toString('hex').toUpperCase()
      const existing = await prisma.guest.findUnique({
        where: { invitationCode: code }
      })
      if (!existing) {
        isUnique = true
        invitationCode = code
      }
      attempts++
    }

    const guest = await prisma.guest.create({
      data: {
        coupleId: couple.id,
        name,
        email: email || null,
        phone: phone || null,
        relationship: relationship || null,
        side: side || 'both',
        plusOne: plus_one_allowed || false,
        invitationCode,
        dietaryNotes: dietary_restrictions || null,
        specialRequests: plus_one_name || null,
        notes: notes || null
      }
    })

    return NextResponse.json(guest)
  } catch (error) {
    console.error('Error creating guest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}