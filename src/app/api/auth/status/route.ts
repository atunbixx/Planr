import { NextResponse } from 'next/server'
import { getCurrentUserCouple } from '@/lib/server/db'
import { getUser } from '@/lib/auth/server'

export async function GET() {
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        userId: null,
        hasCouple: false,
        onboardingCompleted: false
      })
    }

    try {
      const { couple } = await getCurrentUserCouple()
      
      return NextResponse.json({
        authenticated: true,
        userId: user.id,
        hasCouple: true,
        onboardingCompleted: couple?.onboardingCompleted || false,
        coupleId: couple?.id || null
      })
    } catch (error) {
      // User is authenticated but doesn't have a couple record yet
      return NextResponse.json({
        authenticated: true,
        userId: user.id,
        hasCouple: false,
        onboardingCompleted: false
      })
    }
  } catch (error) {
    console.error('Error checking auth status:', error)
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    )
  }
}