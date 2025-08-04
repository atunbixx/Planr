import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/couples(.*)', // Allow API testing
  '/api/debug(.*)', // Debug endpoint
  '/api/test-db(.*)', // Database testing
  '/api/migrate(.*)', // Database migration endpoints
  '/api/check-schema(.*)', // Schema checking
  '/api/describe-table(.*)', // Table structure
  '/api/debug-vendor-auth(.*)', // Vendor authentication testing
  '/api/run-vendor-migration(.*)', // Vendor migration endpoint
  '/api/run-full-schema(.*)', // Full schema setup endpoint
  '/api/debug-user-couple(.*)', // User-couple relationship debugging
  '/rsvp(.*)',
  '/onboarding',
  // Add other public routes as needed
])

export default clerkMiddleware(async (auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth().protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}