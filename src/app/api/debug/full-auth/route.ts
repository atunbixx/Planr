import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  console.log('🔍 Full Auth Debug Started')
  
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    cookies: {},
    supabase: {},
    headers: {},
    environment: {}
  }
  
  // 1. Check all cookies
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  debugInfo.cookies = {
    all: allCookies.map(c => ({
      name: c.name,
      value: c.value ? `${c.value.substring(0, 20)}...` : 'empty',
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite
    })),
    supabaseAuth: allCookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase')),
    onboarding: cookieStore.get('onboardingCompleted')?.value
  }
  
  // 2. Create Supabase client with different methods
  try {
    // Method 1: Standard server client
    const supabase1 = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value
            console.log(`Cookie get: ${name} = ${value ? 'exists' : 'missing'}`)
            return value
          },
          set(name: string, value: string, options: any) {
            console.log(`Cookie set attempt: ${name}`)
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            console.log(`Cookie remove: ${name}`)
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    const { data: { user: user1 }, error: error1 } = await supabase1.auth.getUser()
    const { data: { session: session1 }, error: sessionError1 } = await supabase1.auth.getSession()
    
    debugInfo.supabase.method1 = {
      hasUser: !!user1,
      userId: user1?.id,
      userEmail: user1?.email,
      hasSession: !!session1,
      sessionExpiry: session1?.expires_at,
      userError: error1?.message,
      sessionError: sessionError1?.message
    }
  } catch (e) {
    debugInfo.supabase.method1 = { error: e.message }
  }
  
  // 3. Check request headers
  debugInfo.headers = {
    cookie: request.headers.get('cookie'),
    authorization: request.headers.get('authorization'),
    userAgent: request.headers.get('user-agent')
  }
  
  // 4. Environment check
  debugInfo.environment = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
    nodeEnv: process.env.NODE_ENV
  }
  
  // 5. Try to decode any auth token
  const authCookie = allCookies.find(c => c.name.includes('auth-token'))
  if (authCookie) {
    try {
      // Parse JWT without verification (for debugging only)
      const parts = authCookie.value.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        debugInfo.cookies.authTokenPayload = {
          sub: payload.sub,
          email: payload.email,
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
          iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null
        }
      }
    } catch (e) {
      debugInfo.cookies.authTokenError = e.message
    }
  }
  
  console.log('🔍 Debug Info:', JSON.stringify(debugInfo, null, 2))
  
  return NextResponse.json(debugInfo, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store'
    }
  })
}