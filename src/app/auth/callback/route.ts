import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth Callback] Request received:', {
      hasCode: !!code,
      error,
      errorDescription,
      next,
      timestamp: new Date().toISOString()
    })
  }

  // Handle OAuth errors from provider
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Callback] OAuth provider error:', {
        error,
        description: errorDescription,
        url: request.url
      })
    }
    
    // Redirect to error page with specific error info
    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('description', errorDescription)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

  if (code) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Callback] Exchanging code for session...')
      }
      
      const supabase = await createClient()
      const startTime = Date.now()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      const exchangeDuration = Date.now() - startTime
      
      if (exchangeError) {
        console.error('[Auth Callback] Code exchange failed:', {
          message: exchangeError.message,
          status: exchangeError.status,
          duration: exchangeDuration + 'ms'
        })
        
        // Redirect to error page with exchange error info
        const errorUrl = new URL('/auth/auth-code-error', origin)
        errorUrl.searchParams.set('error', 'exchange_failed')
        errorUrl.searchParams.set('description', exchangeError.message)
        return NextResponse.redirect(errorUrl.toString())
      }
      
      if (data?.user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth Callback] Authentication successful:', {
            userId: data.user.id,
            email: data.user.email,
            provider: data.user.app_metadata?.provider,
            session: data.session ? 'present' : 'missing',
            duration: exchangeDuration + 'ms'
          })
        }
        
        // Clear auth caches after successful login to prevent stale data
        const { clearSessionCache } = await import('@/lib/supabase/server')
        const { clearAuthContextCache } = await import('@/core/auth/context')
        const { clearOnboardingCache } = await import('@/lib/middleware-onboarding')
        
        // Clear all caches to ensure fresh state
        clearSessionCache()
        clearAuthContextCache()
        clearOnboardingCache(data.user.id)
        
        // Also clear middleware cache by setting a header
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth Callback] Cleared all auth caches for user:', data.user.id)
        }
        
        // Verify the session was properly set
        const { data: verifyData, error: verifyError } = await supabase.auth.getSession()
        
        if (process.env.NODE_ENV === 'development' && verifyError) {
          console.error('[Auth Callback] Session verification failed:', verifyError)
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      let redirectUrl: string
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Callback] Redirecting to:', redirectUrl)
      }
      
      return NextResponse.redirect(redirectUrl)
      
    } catch (error: any) {
      console.error('[Auth Callback] Unexpected error:', {
        message: error.message,
        code,
        timestamp: new Date().toISOString()
      })
      
      // Redirect to error page with unexpected error info
      const errorUrl = new URL('/auth/auth-code-error', origin)
      errorUrl.searchParams.set('error', 'unexpected_error')
      errorUrl.searchParams.set('description', 'An unexpected error occurred during authentication')
      return NextResponse.redirect(errorUrl.toString())
    }
  }

  // No code received
  console.error('[Auth Callback] No authorization code received')
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('error', 'no_code')
  errorUrl.searchParams.set('description', 'No authorization code received from OAuth provider')
  return NextResponse.redirect(errorUrl.toString())
}