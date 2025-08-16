import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password are required',
        debug: {
          receivedEmail: !!email,
          receivedPassword: !!password
        }
      }, { status: 400 })
    }

    console.log('[Test Auth] Attempting sign in for:', email)
    
    const supabase = await createClient()
    
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.log('[Test Auth] Sign in failed:', error.message)
      return NextResponse.json({
        error: error.message,
        code: error.name,
        debug: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing'
        }
      }, { status: 401 })
    }
    
    if (data.user) {
      console.log('[Test Auth] Sign in successful:', {
        userId: data.user.id,
        email: data.user.email,
        hasSession: !!data.session
      })
      
      // Clear auth caches after successful login
      const { clearSessionCache } = await import('@/lib/supabase/server')
      const { clearAuthContextCache } = await import('@/core/auth/context')
      const { clearOnboardingCache } = await import('@/lib/middleware-onboarding')
      
      clearSessionCache()
      clearAuthContextCache()
      clearOnboardingCache(data.user.id)
      
      // Verify session was set
      const { data: verifyData, error: verifyError } = await supabase.auth.getSession()
      console.log('[Test Auth] Session verification:', {
        sessionExists: !!verifyData?.session,
        error: verifyError?.message
      })
      
      const response = NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.created_at
        },
        session: {
          exists: !!data.session,
          hasAccessToken: !!data.session?.access_token,
          expiresAt: data.session?.expires_at
        },
        verification: {
          sessionExists: !!verifyData?.session,
          error: verifyError?.message
        },
        debug: {
          cacheCleared: true,
          timestamp: new Date().toISOString()
        }
      })
      
      return response
    }
    
    return NextResponse.json({
      error: 'No user data returned',
      debug: {
        hasData: !!data,
        hasUser: !!data?.user
      }
    }, { status: 500 })
    
  } catch (error: any) {
    console.error('[Test Auth] Unexpected error:', error)
    return NextResponse.json({
      error: error.message,
      debug: {
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 })
  }
}