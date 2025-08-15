import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // Check server-side authentication
    const serverSupabase = await createClient()
    const { data: serverSession, error: serverError } = await serverSupabase.auth.getSession()
    const { data: serverUser, error: serverUserError } = await serverSupabase.auth.getUser()

    // Get cookies for debugging
    const cookies = request.cookies.getAll()
    const supabaseCookies = cookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    )

    return NextResponse.json({
      server: {
        session: {
          exists: !!serverSession,
          userId: serverSession?.user?.id,
          email: serverSession?.user?.email,
          accessToken: serverSession?.access_token ? 'present' : 'missing',
          refreshToken: serverSession?.refresh_token ? 'present' : 'missing',
          expiresAt: serverSession?.expires_at
        },
        user: {
          exists: !!serverUser,
          userId: serverUser?.id,
          email: serverUser?.email
        },
        errors: {
          session: serverError?.message,
          user: serverUserError?.message
        }
      },
      cookies: {
        total: cookies.length,
        supabase: supabaseCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0
        }))
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
        nodeEnv: process.env.NODE_ENV
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}