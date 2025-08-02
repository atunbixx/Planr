import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { csrfProtection } from '@/middleware/csrf'

export async function middleware(req: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(req.headers)
  
  // Create response
  let res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add security headers to all responses
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Additional security for RSVP routes
  if (req.nextUrl.pathname.startsWith('/rsvp') || 
      req.nextUrl.pathname.startsWith('/api/rsvp')) {
    // CSRF Protection for RSVP API routes
    if (req.nextUrl.pathname.startsWith('/api/rsvp')) {
      const csrfResponse = csrfProtection(req)
      if (csrfResponse) return csrfResponse
    }

    // Strict CSP for RSVP pages
    res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://api.supabase.co https://*.supabase.co; " +
      "frame-ancestors 'none';"
    )

    // Prevent caching of sensitive RSVP data
    res.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')
  }

  // BYPASS AUTH FOR DEVELOPMENT - Remove this in production!
  const BYPASS_AUTH = process.env.NODE_ENV === 'development' && req.nextUrl.searchParams.has('dev')
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/signin', 
    '/auth/signup', 
    '/rsvp', 
    '/api',
    '/signin-debug',
    '/simple-signin',
    '/sw.js',           // Service Worker
    '/manifest.json',   // PWA Manifest
    '/offline.html',    // Offline page
    '/icons/',          // PWA icons
    '/favicon.ico'      // Favicon
  ]
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!session && !isPublicRoute && !BYPASS_AUTH) {
    // Redirect to sign in page instead of dev-login
    const redirectUrl = new URL('/auth/signin', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages
  if (session && req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}