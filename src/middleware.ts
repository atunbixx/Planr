import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { csrfProtection } from '@/middleware/csrf'

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/vendors(.*)',
  '/guests(.*)',
  '/budget(.*)',
  '/timeline(.*)',
  '/photos(.*)',
  '/messages(.*)',
  '/settings(.*)',
  '/clerk-dashboard(.*)',
  '/api/protected(.*)'
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
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
      "connect-src 'self' https://api.supabase.co https://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com; " +
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

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  return res
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}