import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function GET(request: NextRequest) {
  try {
    // Create response object first
    const response = NextResponse.json({ testing: true })
    
    // Create Supabase client with request and response
    const supabase = createRouteHandlerClient(request, response)
    
    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Test creating a user (this will fail if email already exists)
    const testEmail = 'test-' + Date.now() + '@example.com'
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
    })
    
    return NextResponse.json({
      auth: {
        hasSession: !!session,
        hasUser: !!user,
        sessionError: sessionError?.message,
        userError: userError?.message,
      },
      testSignUp: {
        success: !!signUpData?.user,
        error: signUpError?.message,
        userId: signUpData?.user?.id,
      },
      cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
      responseCookies: response.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}