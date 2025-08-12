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
    
    // Create response object first
    const response = NextResponse.json({ processing: true })
    
    // Create Supabase client with request and response
    const supabase = createRouteHandlerClient(request, response)
    
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      }
    })
    
    if (error) {
      console.error('Sign up error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    // Sign in immediately after signup
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (signInError) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Account created. Please sign in.',
          redirectTo: '/sign-in'
        },
        { status: 200 }
      )
    }
    
    return NextResponse.json(
      { 
        success: true, 
        user: signInData.user,
        message: 'Account created successfully',
        redirectTo: '/onboarding'
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Unexpected sign up error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}