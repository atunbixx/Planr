import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a couple profile (indicates onboarding completion)
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: userId },
      include: {
        couple: true
      }
    })

    const hasCompletedOnboarding = !!(user?.couple)

    return NextResponse.json({ 
      hasCompletedOnboarding,
      hasWeddingProfile: hasCompletedOnboarding 
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}