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
    
    // Create the response that we'll modify
    const responseData = {
      success: false,
      user: null as any,
      redirectTo: '/dashboard'
    }
    
    // Create response object first
    const response = NextResponse.json(responseData)
    
    // Create Supabase client with request and response
    const supabase = createRouteHandlerClient(request, response)
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Sign in error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    // Update response data
    responseData.success = true
    responseData.user = data.user
    
    // Check if user has completed onboarding
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
        responseData.redirectTo = '/dashboard'
      } else {
        responseData.redirectTo = '/onboarding'
      }
    } catch (error) {
      // User might not have a couple record yet
      console.log('No couple record found for user')
      responseData.redirectTo = '/onboarding'
    }
    
    // Return the modified response with all cookies set by Supabase
    return response
    
  } catch (error) {
    console.error('Unexpected sign in error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}