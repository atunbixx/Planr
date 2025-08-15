import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Attempting to refresh session...')
    
    const supabase = await createClient()
    
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('📊 Current session state:', {
      sessionExists: !!sessionData?.session,
      hasAccessToken: sessionData?.session?.access_token ? 'yes' : 'no',
      userId: sessionData?.session?.user?.id,
      sessionError: sessionError?.message
    })
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('👤 Current user state:', {
      userExists: !!userData?.user,
      userId: userData?.user?.id,
      email: userData?.user?.email,
      userError: userError?.message
    })
    
    // If we have a session but it seems incomplete, try to refresh it
    if (sessionData?.session && !sessionData.session.access_token) {
      console.log('🔄 Session exists but missing access token, attempting refresh...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError)
        return NextResponse.json({
          success: false,
          error: 'Session refresh failed',
          details: refreshError.message
        }, { status: 401 })
      }
      
      console.log('✅ Session refreshed successfully:', {
        hasAccessToken: refreshData?.session?.access_token ? 'yes' : 'no',
        userId: refreshData?.session?.user?.id
      })
    }
    
    // Return current authentication state
    return NextResponse.json({
      success: true,
      authenticated: !!userData?.user && !!sessionData?.session,
      session: {
        exists: !!sessionData?.session,
        hasAccessToken: !!sessionData?.session?.access_token,
        userId: sessionData?.session?.user?.id
      },
      user: {
        exists: !!userData?.user,
        id: userData?.user?.id,
        email: userData?.user?.email
      }
    })
    
  } catch (error) {
    console.error('❌ Session refresh endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}