import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  console.log('🔄 Auth callback received:', {
    hasCode: !!code,
    error,
    errorDescription,
    next,
    origin,
    fullUrl: request.url
  })

  // Handle OAuth errors from provider
  if (error) {
    console.error('❌ OAuth provider error:', {
      error,
      description: errorDescription,
      url: request.url
    })
    
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
      console.log('🔄 Exchanging code for session...')
      const supabase = await createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('❌ Code exchange failed:', {
          message: exchangeError.message,
          status: exchangeError.status,
          details: exchangeError
        })
        
        // Redirect to error page with exchange error info
        const errorUrl = new URL('/auth/auth-code-error', origin)
        errorUrl.searchParams.set('error', 'exchange_failed')
        errorUrl.searchParams.set('description', exchangeError.message)
        return NextResponse.redirect(errorUrl.toString())
      }
      
      if (data?.user) {
        console.log('✅ Authentication successful:', {
          userId: data.user.id,
          email: data.user.email,
          provider: data.user.app_metadata?.provider,
          session: data.session ? 'present' : 'missing',
          hasAccessToken: data.session?.access_token ? 'yes' : 'no'
        })
        
        // Verify the session was properly set by checking it again
        const { data: verifyData, error: verifyError } = await supabase.auth.getSession()
        console.log('🔍 Session verification after exchange:', {
          sessionExists: !!verifyData?.session,
          hasAccessToken: verifyData?.session?.access_token ? 'yes' : 'no',
          userId: verifyData?.session?.user?.id,
          error: verifyError?.message
        })
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
      
      console.log('🔄 Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
      
    } catch (error) {
      console.error('❌ Unexpected error in auth callback:', {
        message: error.message,
        stack: error.stack,
        code
      })
      
      // Redirect to error page with unexpected error info
      const errorUrl = new URL('/auth/auth-code-error', origin)
      errorUrl.searchParams.set('error', 'unexpected_error')
      errorUrl.searchParams.set('description', 'An unexpected error occurred during authentication')
      return NextResponse.redirect(errorUrl.toString())
    }
  }

  console.error('❌ No authorization code received in callback')
  // return the user to an error page with instructions
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('error', 'no_code')
  errorUrl.searchParams.set('description', 'No authorization code received from OAuth provider')
  return NextResponse.redirect(errorUrl.toString())
}