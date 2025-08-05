import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that do NOT require auth
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
]);

/**
 * Clerk v6: handler receives (getAuth, request) when used with async,
 * or (auth, request) for sync. Since our types indicate a Promise,
 * use the async form and await getAuth().
 */
export default clerkMiddleware(async (getAuth, request) => {
  const { userId, redirectToSignIn, sessionId } = await getAuth();

  console.log('[middleware]', request.nextUrl.pathname, { userId, sessionId });

  if (!isPublicRoute(request) && !userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
