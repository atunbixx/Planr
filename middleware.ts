import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
// import { rateLimiters } from '@/lib/middleware/rate-limit'
// import { withSecurityHeaders } from '@/lib/middleware/security-headers'
// import { withRequestTracking } from '@/lib/middleware/request-tracking'

// Cache for middleware auth checks to improve performance
const authCache = new Map<string, { user: any, timestamp: number, sessionId?: string }>()
const AUTH_CACHE_TTL = 30 * 1000 // 30 seconds for middleware cache

// Helper to clear cache for a specific session
function clearAuthCache(sessionId?: string) {
  if (sessionId) {
    // Clear specific session
    for (const [key, value] of authCache.entries()) {
      if (value.sessionId === sessionId) {
        authCache.delete(key)
      }
    }
  } else {
    // Clear all cache
    authCache.clear()
  }
}

// Update session helper with caching
async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check auth cache first - look for any Supabase auth cookies
  const allCookies = request.cookies.getAll()
  const supabaseAuthCookie = allCookies.find(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.includes('auth-token')
  )?.value || request.cookies.get('supabase-auth-token')?.value
  
  const cacheKey = supabaseAuthCookie ? `session-${supabaseAuthCookie.substring(0, 20)}` : 'no-session'
  
  const cached = authCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL) {
    // Validate cached entry is still relevant
    if (cached.user && supabaseAuthCookie) {
      return { response, user: cached.user }
    } else if (!cached.user && !supabaseAuthCookie) {
      return { response, user: cached.user }
    }
    // If cache doesn't match current cookie state, remove it
    authCache.delete(cacheKey)
  }

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
  let { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // If we get a JWT signature error, try to refresh the session
  if (userError && (userError.message.includes('signature is invalid') || 
                    userError.message.includes('invalid JWT') ||
                    userError.message.includes('JWT expired'))) {
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] JWT error detected, attempting refresh...')
    }
    
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (!refreshError && refreshData?.session) {
        // Try to get user again after refresh
        const { data: { user: refreshedUser }, error: retryError } = await supabase.auth.getUser()
        
        if (!retryError && refreshedUser) {
          user = refreshedUser
          userError = null
        }
      }
    } catch (refreshErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Middleware] Session refresh failed:', refreshErr)
      }
    }
  }
  
  // Cache the auth result with session validation
  if (user || !userError) {
    const sessionId = user?.id || null
    authCache.set(cacheKey, { 
      user, 
      timestamp: Date.now(),
      sessionId 
    })
  }
  
  // Clean up old cache entries periodically
  if (authCache.size > 100) {
    const now = Date.now()
    for (const [key, value] of authCache.entries()) {
      if (now - value.timestamp > AUTH_CACHE_TTL) {
        authCache.delete(key)
      }
    }
  }

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
  
  // Apply rate limiting to API routes (temporarily disabled)
  // if (pathname.startsWith('/api/')) {
  //   // Different rate limits for different endpoints
  //   let rateLimiter = rateLimiters.api;
    
  //   if (pathname.startsWith('/api/auth/')) {
  //     rateLimiter = rateLimiters.auth;
  //   } else if (pathname.startsWith('/api/photos/upload') || pathname.startsWith('/api/vendors/contracts/upload')) {
  //     rateLimiter = rateLimiters.upload;
  //   } else if (pathname.startsWith('/api/webhooks/')) {
  //     // Skip rate limiting for webhooks
  //     rateLimiter = null;
  //   }
    
  //   if (rateLimiter) {
  //     const rateLimitResponse = await rateLimiter(request);
  //     if (rateLimitResponse && rateLimitResponse.status === 429) {
  //       return rateLimitResponse;
  //     }
  //   }
  // }
  
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
  
  // Import the onboarding helper (dynamic import to avoid circular dependencies)
  const { checkOnboardingStatus } = await import('./src/lib/middleware-onboarding')
  const onboardingStatus = await checkOnboardingStatus(request, user.id)
  const onboardingComplete = onboardingStatus.isComplete
  
  // Handle sign-in/sign-up redirects for authenticated users
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    if (onboardingComplete) {
      // If there's a next parameter, use it; otherwise go to dashboard
      const destination = searchParams.get('next') || '/dashboard'
      return NextResponse.redirect(new URL(destination, request.url))
    } else {
      const redirectPath = onboardingStatus.redirectPath || '/onboarding/welcome'
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  // Handle root path
  if (pathname === '/') {
    if (onboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      const redirectPath = onboardingStatus.redirectPath || '/onboarding/welcome'
      return NextResponse.redirect(new URL(redirectPath, request.url))
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
    // For API routes, return 403 with helpful message
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          error: 'Please complete your wedding setup to access this feature',
          redirectTo: onboardingStatus.redirectPath || '/onboarding/welcome'
        },
        { status: 403 }
      )
    }
    
    // For page routes, redirect to the specific onboarding step
    const redirectPath = onboardingStatus.redirectPath || '/onboarding/welcome'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // User is authenticated and has completed onboarding
  // Apply security headers and request tracking to the response (temporarily disabled)
  // const secureResponse = withSecurityHeaders(request, response)
  // return withRequestTracking(request, secureResponse)
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