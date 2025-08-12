import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    const response = NextResponse.json({
      success: true,
      message: 'Onboarding cookie has been set manually',
      userId: user.id
    })
    
    // Force set the cookie
    response.cookies.set('onboardingCompleted', 'true', {
      httpOnly: true,
      secure: false, // Allow in development
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })
    
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set cookie' }, { status: 500 })
  }
}