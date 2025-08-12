import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated', 
        message: 'Please sign in first' 
      }, { status: 401 })
    }
    
    const userId = user.id

    // Check if user has a completed couple profile
    const dbUser = await prisma.user.findUnique({
      where: { supabase_user_id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    })

    if (!dbUser) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Find the couple record for this user
    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id },
      select: {
        id: true,
        partner1Name: true,
        partner2Name: true,
        weddingDate: true,
        onboardingCompleted: true
      }
    })

    if (!couple || !couple.onboardingCompleted) {
      return NextResponse.json({ 
        error: 'Onboarding not completed',
        hasCompletedOnboarding: false,
        user: dbUser,
        couple: couple
      })
    }

    // Set the onboarding completion cookie
    const response = NextResponse.json({
      success: true,
      message: 'Onboarding cookie set successfully! You can now access the dashboard.',
      user: {
        name: `${dbUser.firstName} ${dbUser.lastName}`,
        email: dbUser.email
      },
      wedding: {
        couple: `${couple.partner1Name} & ${couple.partner2Name}`,
        date: couple.weddingDate
      },
      hasCompletedOnboarding: true,
      redirectTo: '/dashboard'
    })

    // Set cookie for 30 days
    response.cookies.set('onboardingCompleted', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response

  } catch (error) {
    console.error('Error fixing onboarding cookie:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}