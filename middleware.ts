import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
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
  '/api/test-connection',
  '/api/debug-field-test',
  '/api/debug-onboarding',
  '/api/force-onboarding-complete',
  '/invitation',
  '/api/invitation',
  '/api/invitation/accept',
]

// Define routes that are allowed during onboarding (but require authentication)
const onboardingRoutes = [
  '/onboarding',
  '/api/couples',
  '/api/couples-simple',
  '/api/user/initialize',
  '/api/user/onboarding-status',
  '/api/user/set-onboarding-cookie',
  '/api/settings/preferences',
  '/api/test-db',
  '/api/test-couples',
  '/api/auth/status',
  '/api/debug-auth',
  '/api/debug/full-auth',
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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip authentication for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  
  // Update user's auth session
  const { response, user } = await updateSession(request)
  
  // === UNAUTHENTICATED USER HANDLING ===
  if (!user) {
    // Allow access to public routes only
    if (isRouteMatch(pathname, publicRoutes)) {
      return response
    }
    
    // All other routes require authentication
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // === AUTHENTICATED USER HANDLING ===
  // At this point, we know the user is signed in

  // Special handling for sign-in/sign-up pages - redirect to appropriate location
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    const cookies = request.cookies
    const hasCompletedOnboarding = cookies.get('onboardingCompleted')?.value === 'true'
    
    if (hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Handle root path for authenticated users
  if (pathname === '/') {
    const cookies = request.cookies
    const hasCompletedOnboarding = cookies.get('onboardingCompleted')?.value === 'true'
    
    if (hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Allow access to onboarding routes for authenticated users
  if (isRouteMatch(pathname, onboardingRoutes)) {
    // Let the onboarding page/API handle whether to redirect if already completed
    return response
  }

  // === PROTECTED ROUTES (Dashboard & APIs) ===
  // These require both authentication AND completed onboarding
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/superadmin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/guests') ||
    pathname.startsWith('/api/vendors') ||
    pathname.startsWith('/api/budget') ||
    pathname.startsWith('/api/photos') ||
    pathname.startsWith('/api/dashboard') ||
    pathname.startsWith('/api/settings') ||
    pathname.startsWith('/api/seating') ||
    pathname.startsWith('/api/checklist') ||
    pathname.startsWith('/api/messages') ||
    pathname.startsWith('/api/export') ||
    pathname.startsWith('/api/albums')

  if (isProtectedRoute) {
    // Check for onboarding completion cookie
    const cookies = request.cookies
    const hasCompletedOnboarding = cookies.get('onboardingCompleted')?.value === 'true'

    if (!hasCompletedOnboarding) {
      // For API routes, return 403 instead of redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Onboarding not completed' },
          { status: 403 }
        )
      }
      
      // For page routes, redirect to onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Allow all other authenticated requests
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (*.svg, *.png etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    '/(api|trpc)(.*)',
  ],
}