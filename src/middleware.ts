import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Define the roles that are allowed to access the admin section
const ADMIN_ROLES = ['OWNER', 'ADMIN', 'SUPPORT', 'MODERATOR'];

export default withAuth(
  // `withAuth` augments your `Request` with the `token` object.
  async function middleware(req) {
    // This function will only be executed if the user is authorized (see below).
    // You can add extra logic here if needed, like logging.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: async ({ token }) => {
        if (!token || !token.sub) {
          // Not signed in or token is missing user ID
          return false;
        }

        try {
          // Fetch user profile from the database using the user ID from the token
          const userProfile = await prisma.userProfile.findUnique({
            where: {
              userId: token.sub, // 'sub' is the standard JWT claim for user ID
            },
            select: {
              role: true,
            },
          });

          if (!userProfile) {
            // No profile found for this user
            return false;
          }

          // Check if the user's role is one of the admin roles
          return ADMIN_ROLES.includes(userProfile.role);
        } catch (error) {
          console.error('Error in admin middleware:', error);
          // In case of a database error, deny access
          return false;
        }
      },
    },
    // Customize the redirect behavior
    pages: {
      signIn: '/signin', // Redirect to this page if authentication fails
      error: '/auth/error', // Optional: Redirect to this page on error
    },
  }
);

// This matcher ensures the middleware only runs on /admin routes
export const config = {
  matcher: ['/admin/:path*'],
};