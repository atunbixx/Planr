import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Get all cookies
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    // Get Supabase client and check auth
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Debug info
    const debugInfo = {
      cookies: allCookies.map(c => ({
        name: c.name,
        value: c.value.substring(0, 20) + '...',
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite
      })),
      supabaseCookies: allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-')),
      auth: {
        hasUser: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
        hasSession: !!session,
        sessionExpiry: session?.expires_at || null,
        userError: userError?.message || null,
        sessionError: sessionError?.message || null
      },
      middleware: {
        onboardingCookie: cookieStore.get('onboardingCompleted')?.value || null
      }
    }
    
    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({ 
      error: 'Debug auth failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}