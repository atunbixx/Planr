import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Update session helper
async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name)
          response.cookies.delete(name)
        },
      },
    }
  )

  // This will refresh the session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  return { response, user }
}

// Define public routes that don't require authentication
const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/api/webhooks',
  '/invitation',
  '/api/invitation',
  '/api/invitation/accept',
  '/rsvp',
]

// Define routes that are allowed during onboarding (but require authentication)
const onboardingRoutes = [
  '/onboarding',
  '/api/onboarding',
  '/api/user/initialize',
  '/api/couples', // Needed for onboarding
]

// Define static assets and files to skip
const staticAssets = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/service-worker.js',
  '/sw.js',
  '/icons',
  '/screenshots',
]

// Helper function to check if a path matches any pattern
const isRouteMatch = (pathname: string, routes: string[]): boolean => {
  return routes.some(route => {
    if (route.endsWith('(.*)')) {
      const baseRoute = route.replace('(.*)', '')
      return pathname.startsWith(baseRoute)
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

// Helper to check if path is a static asset
const isStaticAsset = (pathname: string): boolean => {
  return staticAssets.some(asset => pathname.startsWith(asset)) || 
         pathname.includes('.') && !pathname.startsWith('/api/')
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }
  
  // Update user's auth session
  const { response, user } = await updateSession(request)
  
  // Store intended destination for post-auth redirect
  const searchParams = new URLSearchParams(request.nextUrl.searchParams)
  const next = searchParams.get('next') || pathname
  
  // === UNAUTHENTICATED USER HANDLING ===
  if (!user) {
    // Allow access to public routes only
    if (isRouteMatch(pathname, publicRoutes)) {
      return response
    }
    
    // Redirect to sign-in with next parameter
    const signInUrl = new URL('/sign-in', request.url)
    if (pathname !== '/' && pathname !== '/sign-in') {
      signInUrl.searchParams.set('next', pathname + request.nextUrl.search)
    }
    return NextResponse.redirect(signInUrl)
  }

  // === AUTHENTICATED USER HANDLING ===
  // At this point, we know the user is signed in
  
  // Get onboarding status from database via API
  // We'll use a lightweight check that doesn't block the middleware
  const onboardingComplete = request.cookies.get('onboardingCompleted')?.value === 'true'
  
  // Handle sign-in/sign-up redirects for authenticated users
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    if (onboardingComplete) {
      // If there's a next parameter, use it; otherwise go to dashboard
      const destination = searchParams.get('next') || '/dashboard'
      return NextResponse.redirect(new URL(destination, request.url))
    } else {
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
    }
  }

  // Handle root path
  if (pathname === '/') {
    if (onboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
    }
  }

  // === ONBOARDING ROUTE HANDLING ===
  if (pathname.startsWith('/onboarding')) {
    // If onboarding is complete, redirect to dashboard
    if (onboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Otherwise allow access to onboarding routes
    return response
  }
  
  // Allow access to onboarding API routes
  if (isRouteMatch(pathname, onboardingRoutes)) {
    return response
  }

  // === PROTECTED ROUTES ===
  // All other routes require completed onboarding
  if (!onboardingComplete) {
    // For API routes, return 403
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Onboarding must be completed to access this resource' },
        { status: 403 }
      )
    }
    
    // For page routes, redirect to onboarding
    // We'll redirect to the last step they were on (handled by onboarding page)
    return NextResponse.redirect(new URL('/onboarding/welcome', request.url))
  }

  // User is authenticated and has completed onboarding
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public folder files
     */
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}