import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    console.log('[Signin] Attempting sign in for:', email)
    
    // Create response object that we'll use throughout
    let response = NextResponse.json({ processing: true })
    
    // Create Supabase client with request and response
    const supabase = createRouteHandlerClient(request, response)
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('[Signin] Sign in error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    console.log('[Signin] Sign in successful:', {
      userId: data.user?.id,
      email: data.user?.email,
      hasSession: !!data.session
    })
    
    // Check if user has completed onboarding
    let redirectTo = '/onboarding'
    try {
      const { data: couple } = await supabase
        .from('couples')
        .select('onboardingCompleted')
        .eq('userId', data.user.id)
        .single()
        
      if (couple?.onboardingCompleted) {
        // Set onboarding cookie
        response.cookies.set('onboardingCompleted', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: '/'
        })
        redirectTo = '/dashboard'
      }
    } catch (error) {
      // User might not have a couple record yet
      console.log('No couple record found for user, redirecting to onboarding')
    }
    
    // Get the session to ensure cookies are properly set
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('[Signin] Session check after login:', {
      hasSession: !!sessionData?.session,
      sessionError: sessionError?.message
    })
    
    // Update the response body with success data
    const finalResponse = NextResponse.json({
      success: true,
      user: data.user,
      redirectTo: redirectTo,
      debug: {
        hasSession: !!sessionData?.session,
        sessionId: sessionData?.session?.user?.id,
        timestamp: new Date().toISOString()
      }
    })
    
    // Copy all response cookies to the final response, ensuring consistent settings
    const cookies = response.cookies.getAll()
    cookies.forEach(cookie => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly !== false, // Default to true for security
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: cookie.path || '/',
        maxAge: cookie.maxAge || 60 * 60 * 24 * 7, // 1 week default
        // Don't set domain in development
        ...(process.env.NODE_ENV === 'production' && cookie.domain ? { domain: cookie.domain } : {})
      })
    })
    
    // Set a marker cookie for debugging and middleware detection
    finalResponse.cookies.set('supabase-auth-token', 'authenticated', {
      httpOnly: false, // Allow JS access for client-side checks
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })
    
    console.log('[Signin] Response prepared with', cookies.length + 1, 'cookies')
    return finalResponse
    
  } catch (error) {
    console.error('Unexpected sign in error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}