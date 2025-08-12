# Clerk to Supabase Auth Migration Guide

## Overview

This guide provides a comprehensive migration strategy for replacing Clerk authentication with Supabase Auth in a Next.js 14/15 App Router wedding planning application. The migration is designed to completely avoid hydration errors, session flicker, and redirect issues by implementing server-side first authentication.

## Migration Goals

* ✅ Complete removal of Clerk dependencies and configuration

* ✅ Server-side first authentication (no hydration errors)

* ✅ Google OAuth + Email/Password authentication

* ✅ Environment compatibility (localhost:3000 + Vercel production)

* ✅ Server-side route protection (no flash of unauthenticated content)

* ✅ Modular architecture with separate server/client utilities

* ✅ Automatic session refresh via middleware

* ✅ Stable dependency versions for Next.js 14/15 App Router

## Current State Analysis

### Existing Clerk Implementation

* `@clerk/nextjs ^6.28.1` with ClerkProvider, useAuth, useUser hooks

* `middleware.ts` with clerkMiddleware for route protection

* Sign-in/sign-up pages using Clerk components

* Auth service layer in `infrastructure/auth/` wrapping Clerk

* Supabase already configured for database (not auth)

### Files to Migrate

* `middleware.ts` - Route protection

* `src/app/layout.tsx` - ClerkProvider removal

* `src/app/sign-in/[[...sign-in]]/page.tsx` - Custom auth forms

* `src/app/sign-up/[[...sign-up]]/page.tsx` - Custom auth forms

* `src/infrastructure/auth/` - Complete auth service rewrite

* `package.json` - Dependency updates

* Environment variables - Clerk to Supabase migration

## Phase 1: Dependency Management

### 1.1 Update package.json

```json
{
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/supabase-js": "^2.39.3"
  }
}
```

### 1.2 Remove Clerk Dependencies

```bash
npm uninstall @clerk/nextjs @clerk/backend
npm install @supabase/auth-helpers-nextjs@^0.8.7 @supabase/supabase-js@^2.39.3
```

## Phase 2: Environment Configuration

### 2.1 Update .env Variables

```env
# Remove Clerk variables
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# CLERK_SECRET_KEY=
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=
# NEXT_PUBLIC_CLERK_SIGN_UP_URL=
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=

# Add Supabase Auth variables
NEXT_PUBLIC_SUPABASE_URL=https://gpfxxbhowailwllpgphe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Auth redirect URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_REDIRECT_URL=http://localhost:3000/auth/callback
```

### 2.2 Production Environment Variables

```env
# For Vercel production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_REDIRECT_URL=https://your-domain.com/auth/callback
```

## Phase 3: Supabase Client Architecture

### 3.1 Server-side Supabase Client

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Server component client (for RSC)
export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
})

// Route handler client (for API routes)
export const createRouteHandlerSupabaseClient = () => {
  const cookieStore = cookies()
  return createRouteHandlerClient({ cookies: () => cookieStore })
}

// Get server-side session
export const getServerSession = cache(async () => {
  const supabase = createServerSupabaseClient()
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Session fetch error:', error)
    return null
  }
})

// Get server-side user
export const getServerUser = cache(async () => {
  const session = await getServerSession()
  return session?.user ?? null
})
```

### 3.2 Client-side Supabase Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

// Client component client (for CSR)
export const createClientSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Singleton client for client components
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientSupabaseClient()
  }
  return supabaseClient
}
```

## Phase 4: Authentication Service Layer

### 4.1 New Auth Service

Replace `src/infrastructure/auth/auth-service.ts`:

```typescript
import { createServerSupabaseClient, getServerSession, getServerUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/core/logging/logger'
import { AuthenticationError, AuthorizationError } from '@/core/errors'
import { Cache, InvalidateCache } from '@/core/cache'
import { Trace } from '@/core/monitoring'

// User context interface
export interface UserContext {
  userId: string
  supabaseUserId: string
  email: string
  firstName: string
  lastName: string
  coupleId: string
  permissions: string[]
  roles: string[]
}

export enum Permission {
  READ_BUDGET = 'read:budget',
  WRITE_BUDGET = 'write:budget',
  READ_GUESTS = 'read:guests',
  WRITE_GUESTS = 'write:guests',
  READ_VENDORS = 'read:vendors',
  WRITE_VENDORS = 'write:vendors',
  ADMIN = 'admin'
}

export enum Role {
  BRIDE = 'bride',
  GROOM = 'groom',
  PLANNER = 'planner',
  ADMIN = 'admin'
}

// Authentication service
export class AuthService {
  // Get current authenticated user context
  @Trace()
  @Cache({ ttl: 300, namespace: 'auth' }) // Cache for 5 minutes
  async getCurrentUser(): Promise<UserContext> {
    const user = await getServerUser()
    
    if (!user?.email) {
      throw new AuthenticationError('User not authenticated')
    }
    
    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        couple: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    })
    
    if (!dbUser) {
      throw new AuthenticationError('User not found in database')
    }
    
    // Extract permissions and roles
    const permissions = dbUser.userRoles.flatMap(ur => 
      ur.role.rolePermissions.map(rp => rp.permission.name)
    )
    const roles = dbUser.userRoles.map(ur => ur.role.name)
    
    return {
      userId: dbUser.id,
      supabaseUserId: user.id,
      email: dbUser.email,
      firstName: dbUser.firstName || '',
      lastName: dbUser.lastName || '',
      coupleId: dbUser.coupleId || '',
      permissions,
      roles
    }
  }
  
  // Check if user has permission
  async hasPermission(permission: Permission): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return user.permissions.includes(permission) || user.permissions.includes(Permission.ADMIN)
    } catch {
      return false
    }
  }
  
  // Require permission or throw
  async requirePermission(permission: Permission): Promise<void> {
    const hasPermission = await this.hasPermission(permission)
    if (!hasPermission) {
      throw new AuthorizationError(`Permission required: ${permission}`)
    }
  }
  
  // Sign out user
  async signOut(): Promise<void> {
    const supabase = createServerSupabaseClient()
    await supabase.auth.signOut()
    
    // Invalidate cache
    await this.invalidateUserCache()
  }
  
  @InvalidateCache({ namespace: 'auth' })
  private async invalidateUserCache(): Promise<void> {
    // Cache invalidation handled by decorator
  }
}

export const authService = new AuthService()
```

### 4.2 Auth Helpers

Update `src/infrastructure/auth/auth-helpers.ts`:

```typescript
import { NextRequest } from 'next/server'
import { authService, UserContext } from './auth-service'
import { AuthenticationError } from '@/core/errors'
import { prisma } from '@/lib/prisma'
import { logger } from '@/core/logging/logger'
import { getServerSession } from '@/lib/supabase/server'

// Helper to get authenticated user and couple data
export async function requireAuthenticatedCouple() {
  const user = await authService.getCurrentUser()
  
  if (!user.coupleId) {
    throw new AuthenticationError('User not associated with a couple')
  }
  
  const couple = await prisma.couple.findUnique({
    where: { id: user.coupleId },
    include: {
      users: true,
      weddingDetails: true
    }
  })
  
  if (!couple) {
    throw new AuthenticationError('Couple not found')
  }
  
  return { user, couple }
}

// Helper to get user from request (for API routes)
export async function getUserFromRequest(request: NextRequest): Promise<UserContext | null> {
  try {
    return await authService.getCurrentUser()
  } catch (error) {
    logger.warn('Failed to get user from request', { error })
    return null
  }
}

// Helper to require authentication in API routes
export async function requireAuthentication(): Promise<UserContext> {
  const user = await authService.getCurrentUser()
  if (!user) {
    throw new AuthenticationError('Authentication required')
  }
  return user
}

// Helper to create or update user from Supabase auth
export async function syncUserFromSupabase(supabaseUser: any) {
  const existingUser = await prisma.user.findUnique({
    where: { email: supabaseUser.email }
  })
  
  if (existingUser) {
    // Update existing user
    return await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        firstName: supabaseUser.user_metadata?.first_name || existingUser.firstName,
        lastName: supabaseUser.user_metadata?.last_name || existingUser.lastName,
        lastLoginAt: new Date()
      }
    })
  } else {
    // Create new user
    return await prisma.user.create({
      data: {
        email: supabaseUser.email,
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        lastLoginAt: new Date()
      }
    })
  }
}
```

## Phase 5: Middleware Implementation

### 5.1 New Middleware

Replace `middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that do NOT require auth
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/api/health',
  '/api/auth/callback'
]

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname
  
  // Create Supabase client
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Refresh session if expired
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Middleware auth error:', error)
  }
  
  // Handle public routes
  if (isPublicRoute(pathname)) {
    // Redirect authenticated users away from auth pages
    if (session && (pathname === '/sign-in' || pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return res
  }
  
  // Require authentication for protected routes
  if (!session) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

## Phase 6: Authentication Pages

### 6.1 Auth Callback Handler

Create `src/app/auth/callback/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { syncUserFromSupabase } from '@/infrastructure/auth/auth-helpers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/sign-in?error=auth_error', request.url))
      }
      
      if (session?.user) {
        // Sync user with database
        await syncUserFromSupabase(session.user)
      }
      
      return NextResponse.redirect(new URL(redirectTo, request.url))
    } catch (error) {
      console.error('Auth callback exception:', error)
      return NextResponse.redirect(new URL('/sign-in?error=server_error', request.url))
    }
  }
  
  return NextResponse.redirect(new URL('/sign-in', request.url))
}
```

### 6.2 Sign-in Page

Replace `src/app/sign-in/page.tsx`:

```typescript
import { getServerSession } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignInForm from './components/SignInForm'

export default async function SignInPage({
  searchParams
}: {
  searchParams: { redirectTo?: string; error?: string }
}) {
  // Redirect if already authenticated
  const session = await getServerSession()
  if (session) {
    redirect(searchParams.redirectTo || '/dashboard')
  }
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue to your wedding planner</p>
        </div>
        <SignInForm 
          redirectTo={searchParams.redirectTo}
          error={searchParams.error}
        />
      </div>
    </main>
  )
}
```

### 6.3 Sign-in Form Component

Create `src/app/sign-in/components/SignInForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SignInFormProps {
  redirectTo?: string
  error?: string
}

export default function SignInForm({ redirectTo, error }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  
  const supabase = createClientSupabaseClient()
  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError('')
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setFormError(error.message)
      } else {
        // Redirect will be handled by middleware
        window.location.href = redirectTo || '/dashboard'
      }
    } catch (error) {
      setFormError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const handleGoogleSignIn = async () => {
    setLoading(true)
    setFormError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo || '/dashboard')}`
        }
      })
      
      if (error) {
        setFormError(error.message)
        setLoading(false)
      }
    } catch (error) {
      setFormError('An unexpected error occurred')
      setLoading(false)
    }
  }
  
  const getErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case 'auth_error':
        return 'Authentication failed. Please try again.'
      case 'server_error':
        return 'Server error occurred. Please try again later.'
      default:
        return null
    }
  }
  
  return (
    <Card className="bg-white rounded-lg shadow-xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-center">Sign In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || formError) && (
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(error) || formError}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In with Email
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In with Google
        </Button>
        
        <div className="text-center text-sm">
          Don't have an account?{' '}
          <Link href={`/sign-up${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Phase 7: Layout Updates

### 7.1 Remove ClerkProvider

Update `src/app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { IntlProvider } from '@/providers/IntlProvider'
import { PWAProvider } from '@/components/providers/pwa-provider'
import ThemeToggle from '@/components/ui/ThemeToggle'
import messages from '@/messages/en.json'

export const metadata: Metadata = {
  title: 'Wedding Planner',
  description: 'Plan your event with ease',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Wedding Planner',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6366f1',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wedding Planner" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ThemeProvider>
          <IntlProvider locale="en" messages={messages}>
            <PWAProvider>
              {/* Global theme toggle positioned in the top-right for quick access */}
              <div className="fixed top-3 right-3 z-50">
                <ThemeToggle />
              </div>
              {children}
            </PWAProvider>
          </IntlProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## Phase 8: Database Schema Considerations

### 8.1 User Table Updates

Ensure your user table supports Supabase auth:

```sql
-- Add Supabase user ID column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id UUID;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);

-- Update existing users to link with Supabase (run after migration)
-- This will need to be done manually based on email matching
```

## Phase 9: Testing Strategy

### 9.1 Pre-Migration Testing

1. **Backup Current State**

   ```bash
   git checkout -b backup-clerk-implementation
   git add -A && git commit -m "Backup: Clerk implementation before migration"
   ```

2. **Test Current Functionality**

   * Sign-in/sign-up flows

   * Route protection

   * Session persistence

   * API authentication

### 9.2 Migration Testing

1. **Local Development Testing**

   ```bash
   npm run dev
   # Test all auth flows
   # Test route protection
   # Test session refresh
   ```

2. **Production Testing**

   * Deploy to Vercel preview

   * Test with production URLs

   * Test OAuth redirects

   * Test session persistence

### 9.3 Post-Migration Validation

1. **Functional Tests**

   * [ ] Email/password sign-in works

   * [ ] Google OAuth works

   * [ ] Route protection works

   * [ ] Session refresh works

   * [ ] Sign-out works

   * [ ] No hydration errors

   * [ ] No session flicker

2. **Performance Tests**

   * [ ] Server-side rendering works

   * [ ] No client-side auth checks

   * [ ] Fast page loads

   * [ ] Proper caching

## Phase 10: Rollback Plan

### 10.1 Immediate Rollback

If issues occur during migration:

```bash
# Revert to Clerk implementation
git checkout backup-clerk-implementation
npm install
npm run dev
```

### 10.2 Partial Rollback

If only specific features fail:

1. Keep Supabase for new features
2. Temporarily restore Clerk for critical paths
3. Gradual migration of remaining features

## Migration Execution Checklist

### Pre-Migration

* [ ] Create backup branch

* [ ] Test current Clerk implementation

* [ ] Set up Supabase Auth in dashboard

* [ ] Configure OAuth providers

* [ ] Prepare environment variables

### Migration Steps

* [ ] Update dependencies

* [ ] Update environment variables

* [ ] Create Supabase client utilities

* [ ] Replace auth service layer

* [ ] Update middleware

* [ ] Replace auth pages

* [ ] Update layout

* [ ] Remove Clerk references

* [ ] Test locally

* [ ] Deploy to preview

* [ ] Test in production

### Post-Migration

* [ ] Monitor for errors

* [ ] Validate all auth flows

* [ ] Update documentation

* [ ] Clean up unused code

* [ ] Update team on changes

## Troubleshooting Common Issues

### Hydration Errors

* Ensure all auth checks are server-side first

* Use `getServerSession()` in server components

* Avoid client-side auth state in initial render

### Session Flicker

* Implement proper loading states

* Use server-side redirects

* Cache session data appropriately

### OAuth Redirect Issues

* Verify redirect URLs in Supabase dashboard

* Check environment variables

* Test with different domains

### Performance Issues

* Implement proper caching

* Use React cache for server functions

* Minimize

