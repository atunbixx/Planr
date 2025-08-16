import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  try {
    console.log('[Refresh Session] Starting session refresh request')
    
    // Create response object for cookie handling
    const response = NextResponse.json({ processing: true })
    
    // Create Supabase client with proper cookie management
    const supabase = createRouteHandlerClient(request, response)
    
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('[Refresh Session] Current session state:', {
      sessionExists: !!sessionData?.session,
      hasAccessToken: sessionData?.session?.access_token ? 'yes' : 'no',
      userId: sessionData?.session?.user?.id,
      sessionError: sessionError?.message
    })
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('[Refresh Session] Current user state:', {
      userExists: !!userData?.user,
      userId: userData?.user?.id,
      email: userData?.user?.email,
      userError: userError?.message
    })
    
    // If we have issues with session or user, try to refresh
    if (sessionError || userError || !sessionData?.session || !userData?.user) {
      console.log('[Refresh Session] Issues detected, attempting session refresh...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('[Refresh Session] Session refresh failed:', refreshError)
        return NextResponse.json({
          success: false,
          authenticated: false,
          error: 'Session refresh failed',
          details: refreshError.message
        }, { status: 401 })
      }
      
      if (refreshData?.session) {
        console.log('[Refresh Session] Session refreshed successfully:', {
          hasAccessToken: refreshData.session.access_token ? 'yes' : 'no',
          userId: refreshData.session.user?.id
        })
        
        // Update our data with refreshed session
        const { data: { user: refreshedUser } } = await supabase.auth.getUser()
        
        // Create final response with updated session info
        const finalResponse = NextResponse.json({
          success: true,
          authenticated: !!refreshedUser,
          session: {
            exists: true,
            hasAccessToken: !!refreshData.session.access_token,
            userId: refreshData.session.user?.id
          },
          user: {
            exists: !!refreshedUser,
            id: refreshedUser?.id,
            email: refreshedUser?.email
          }
        })
        
        // Copy cookies to final response
        const cookies = response.cookies.getAll()
        cookies.forEach(cookie => {
          finalResponse.cookies.set(cookie.name, cookie.value, {
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
            path: cookie.path,
            maxAge: cookie.maxAge
          })
        })
        
        console.log('[Refresh Session] Response prepared with', cookies.length, 'cookies')
        return finalResponse
      }
    }
    
    // If no refresh was needed or session is good, return current state
    const finalResponse = NextResponse.json({
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
    
    // Copy any cookies that may have been set
    const cookies = response.cookies.getAll()
    cookies.forEach(cookie => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
        path: cookie.path,
        maxAge: cookie.maxAge
      })
    })
    
    return finalResponse
    
  } catch (error) {
    console.error('❌ Session refresh endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}