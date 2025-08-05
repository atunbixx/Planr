import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already exists
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    // Create user if doesn't exist
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          imageUrl: clerkUser.imageUrl || null,
        }
      })
    }

    // Check if couple exists
    let couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    // Create couple if doesn't exist
    if (!couple) {
      couple = await prisma.couple.create({
        data: {
          userId: dbUser.id,
          partnerName: clerkUser.firstName || 'Partner',
          weddingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
          venue: '',
          totalBudget: 0,
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      user: dbUser, 
      couple: couple 
    })
  } catch (error) {
    console.error('Error initializing user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}