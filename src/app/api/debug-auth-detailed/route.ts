import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthContext } from '@/core/auth/context'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    server: {},
    cookies: {},
    environment: {},
    database: {},
    authContext: null,
    recommendations: []
  }

  try {
    // Check server-side authentication with enhanced error handling
    const serverSupabase = await createClient()
    
    // Get session with detailed error tracking
    const sessionStart = Date.now()
    const { data: { session: serverSession }, error: serverError } = await serverSupabase.auth.getSession()
    const sessionDuration = Date.now() - sessionStart
    
    // Get user with detailed error tracking
    const userStart = Date.now()
    const { data: { user: serverUser }, error: serverUserError } = await serverSupabase.auth.getUser()
    const userDuration = Date.now() - userStart

    // Check auth context
    let authContext = null
    try {
      authContext = await getAuthContext(request)
    } catch (contextError) {
      debugInfo.authContext = { error: contextError instanceof Error ? contextError.message : String(contextError) }
    }

    // Get cookies for debugging
    const cookies = request.cookies.getAll()
    const supabaseCookies = cookies.filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('sb-') ||
      cookie.name.includes('auth')
    )

    // Check database user record if we have a user
    let dbUser = null
    if (serverUser?.id) {
      try {
        dbUser = await prisma.user.findUnique({
          where: { id: serverUser.id },
          select: {
            id: true,
            email: true,
            createdAt: true
          }
        })
      } catch (dbError) {
        debugInfo.database.error = dbError instanceof Error ? dbError.message : String(dbError)
      }
    }

    // Build debug response
    debugInfo.server = {
      session: {
        exists: !!serverSession,
        userId: serverSession?.user?.id || 'none',
        email: serverSession?.user?.email || 'none', 
        accessToken: serverSession?.access_token ? 'present' : 'missing',
        refreshToken: serverSession?.refresh_token ? 'present' : 'missing',
        expiresAt: serverSession?.expires_at || 'none',
        expiresIn: serverSession?.expires_at ? 
          Math.floor((new Date(serverSession.expires_at * 1000).getTime() - Date.now()) / 1000) + 's' : 
          'n/a',
        queryTime: sessionDuration + 'ms'
      },
      user: {
        exists: !!serverUser,
        userId: serverUser?.id || 'none',
        email: serverUser?.email || 'none',
        queryTime: userDuration + 'ms'
      },
      errors: {
        session: serverError?.message || null,
        user: serverUserError?.message || null
      }
    }

    debugInfo.cookies = {
      total: cookies.length,
      supabase: supabaseCookies.map(c => ({
        name: c.name,
        hasValue: !!c.value,
        valueLength: c.value?.length || 0
      }))
    }

    debugInfo.environment = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
      nodeEnv: process.env.NODE_ENV
    }

    debugInfo.database = {
      userExists: !!dbUser,
      userRecord: dbUser
    }

    debugInfo.authContext = authContext

    // Add recommendations based on findings
    if (!serverSession) {
      debugInfo.recommendations.push('No session found - user needs to sign in')
    }
    if (serverError?.message?.includes('JWT')) {
      debugInfo.recommendations.push('JWT error detected - session refresh may be needed')
    }
    if (!supabaseCookies.length) {
      debugInfo.recommendations.push('No Supabase cookies found - possible cookie configuration issue')
    }
    if (serverSession && !dbUser) {
      debugInfo.recommendations.push('Auth user exists but no database record - user initialization may be needed')
    }

    debugInfo.status = 'complete'

    return NextResponse.json(debugInfo, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error: any) {
    debugInfo.status = 'error'
    debugInfo.error = {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
    
    return NextResponse.json(debugInfo, { status: 500 })
  }
}