import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a completed couple profile
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ 
        error: 'User not found in database',
        hasCompletedOnboarding: false 
      }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: {
        OR: [
          { partner1UserId: dbUser.id },
          { partner2UserId: dbUser.id },
          { userId: dbUser.id }
        ]
      }
    })

    if (!couple || !couple.onboardingCompleted) {
      return NextResponse.json({ 
        error: 'Onboarding not completed',
        hasCompletedOnboarding: false 
      }, { status: 400 })
    }

    // Set the onboarding completion cookie
    const response = NextResponse.json({
      success: true,
      message: 'Onboarding cookie set successfully',
      hasCompletedOnboarding: true
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
    console.error('Error setting onboarding cookie:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}