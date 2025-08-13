import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { UserRepository } from '@/lib/repositories/UserRepository'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'

const userRepository = new UserRepository()
const coupleRepository = new CoupleRepository()

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

    // Check if user has a completed couple profile using repository
    const dbUser = await userRepository.findBySupabaseUserId(userId)

    if (!dbUser) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Find the couple record for this user using repository
    const couple = await coupleRepository.findByUserId(dbUser.id)

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