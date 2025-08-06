import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

// Define routes that are allowed during onboarding
const isOnboardingRoute = createRouteMatcher([
  '/onboarding',
  '/api/couples',
  '/api/user/initialize',
  '/api/user/onboarding-status',
])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  
  // If the user is not signed in and the route is not public, redirect to sign-in
  if (!userId && !isPublicRoute(request)) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // If user is signed in and accessing protected routes
  if (userId) {
    const pathname = request.nextUrl.pathname
    
    // Allow access to onboarding routes
    if (isOnboardingRoute(request)) {
      return NextResponse.next()
    }
    
    // Check if user is trying to access dashboard or any protected route
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/api/guests') ||
        pathname.startsWith('/api/vendors') ||
        pathname.startsWith('/api/budget') ||
        pathname.startsWith('/api/photos') ||
        pathname.startsWith('/api/dashboard') ||
        pathname.startsWith('/api/settings')) {
      
      // Check for onboarding completion cookie
      const cookies = request.cookies
      const hasCompletedOnboarding = cookies.get('onboarding_completed')?.value === 'true'
      
      // If no cookie or false, they need to complete onboarding
      if (!hasCompletedOnboarding) {
        console.log('User has not completed onboarding, redirecting to /onboarding')
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}