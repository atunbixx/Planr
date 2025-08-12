# Supabase Auth Implementation Steps

## Overview

This document provides step-by-step implementation instructions for migrating from Clerk to Supabase Auth. Follow these steps in order to ensure a smooth migration without hydration errors or session issues.

## Prerequisites

- [ ] Supabase project created and configured
- [ ] Google OAuth configured in Supabase dashboard
- [ ] Database schema updated for auth requirements
- [ ] Backup of current Clerk implementation created

## Step 1: Supabase Dashboard Configuration

### 1.1 Enable Authentication Providers

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider:
   - Enable email confirmations: `false` (for development)
   - Enable email change confirmations: `true`
   - Enable secure email change: `true`

3. Enable Google OAuth:
   - Client ID: `your-google-client-id`
   - Client Secret: `your-google-client-secret`
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 1.2 Configure URL Settings

1. Go to Authentication → URL Configuration
2. Set Site URL: `http://localhost:3000` (development)
3. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
   - `https://*.vercel.app/auth/callback`

### 1.3 Configure Email Templates (Optional)

1. Go to Authentication → Email Templates
2. Customize sign-up confirmation email
3. Customize password reset email

## Step 2: Update Dependencies

### 2.1 Remove Clerk Dependencies

```bash
npm uninstall @clerk/nextjs @clerk/backend
```

### 2.2 Install Supabase Auth Dependencies

```bash
npm install @supabase/auth-helpers-nextjs@^0.8.7 @supabase/supabase-js@^2.39.3
```

### 2.3 Verify package.json

```json
{
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/supabase-js": "^2.39.3"
  }
}
```

## Step 3: Environment Variables

### 3.1 Update .env File

```env
# Remove these Clerk variables
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

# Site configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3.2 Update .env.local

```env
# Local development overrides
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Remove Clerk redirect URLs
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

## Step 4: Create Supabase Client Utilities

### 4.1 Create Server Client

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from '@/types/database'

// Server component client (for RSC)
export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
})

// Route handler client (for API routes)
export const createRouteHandlerSupabaseClient = () => {
  const cookieStore = cookies()
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore })
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

// Check if user is authenticated
export const isAuthenticated = cache(async () => {
  const session = await getServerSession()
  return !!session?.user
})
```

### 4.2 Create Client Component Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

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

### 4.3 Update Legacy Supabase Client

Update `src/lib/supabase.ts`:

```typescript
// Legacy client - use new auth helpers instead
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Only use for non-auth operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export new auth clients
export { createServerSupabaseClient, getServerSession, getServerUser } from './supabase/server'
export { createClientSupabaseClient, getSupabaseClient } from './supabase/client'
```

## Step 5: Replace Authentication Service

### 5.1 Update Auth Service

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
  READ_TIMELINE = 'read:timeline',
  WRITE_TIMELINE = 'write:timeline',
  ADMIN = 'admin'
}

export enum Role {
  BRIDE = 'bride',
  GROOM = 'groom',
  PLANNER = 'planner',
  GUEST = 'guest',
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
      // Auto-create user if doesn't exist
      const newUser = await this.createUserFromSupabase(user)
      return this.mapUserToContext(newUser, user.id)
    }
    
    return this.mapUserToContext(dbUser, user.id)
  }
  
  private mapUserToContext(dbUser: any, supabaseUserId: string): UserContext {
    // Extract permissions and roles
    const permissions = dbUser.userRoles?.flatMap((ur: any) => 
      ur.role.rolePermissions.map((rp: any) => rp.permission.name)
    ) || []
    const roles = dbUser.userRoles?.map((ur: any) => ur.role.name) || []
    
    return {
      userId: dbUser.id,
      supabaseUserId,
      email: dbUser.email,
      firstName: dbUser.firstName || '',
      lastName: dbUser.lastName || '',
      coupleId: dbUser.coupleId || '',
      permissions,
      roles
    }
  }
  
  private async createUserFromSupabase(supabaseUser: any) {
    return await prisma.user.create({
      data: {
        email: supabaseUser.email,
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        lastLoginAt: new Date()
      },
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

### 5.2 Update Auth Helpers

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

// Helper to update user profile
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string
    lastName?: string
    phone?: string
  }
) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
  
  // Invalidate auth cache
  await authService['invalidateUserCache']()
  
  return updated
}
```

## Step 6: Update Middleware

### 6.1 Replace Middleware

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

// API routes that require auth
const protectedApiRoutes = [
  '/api/user',
  '/api/budget',
  '/api/guests',
  '/api/vendors',
  '/api/timeline'
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

// Check if API route requires auth
function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(route => pathname.startsWith(route))
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
  
  // Handle API routes
  if (pathname.startsWith('/api/')) {
    if (isProtectedApiRoute(pathname) && !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
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

## Step 7: Create Authentication Pages

### 7.1 Create Auth Callback Handler

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

### 7.2 Replace Sign-in Page

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

### 7.3 Create Sign-in Form Component

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

### 7.4 Replace Sign-up Page

Replace `src/app/sign-up/page.tsx`:

```typescript
import { getServerSession } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignUpForm from './components/SignUpForm'

export default async function SignUpPage({
  searchParams
}: {
  searchParams: { redirectTo?: string; error?: string }
}) {
  // Redirect if already authenticated
  const session = await getServerSession()
  if (session) {
    redirect(searchParams.redirectTo || '/onboarding')
  }
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us to start planning your perfect wedding</p>
        </div>
        <SignUpForm 
          redirectTo={searchParams.redirectTo}
          error={searchParams.error}
        />
      </div>
    </main>
  )
}
```

### 7.5 Create Sign-up Form Component

Create `src/app/sign-up/components/SignUpForm.tsx`:

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

interface SignUpFormProps {
  redirectTo?: string
  error?: string
}

export default function SignUpForm({ redirectTo, error }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  
  const supabase = createClientSupabaseClient()
  
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError('')
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      })
      
      if (error) {
        setFormError(error.message)
      } else {
        // Redirect will be handled by middleware
        window.location.href = redirectTo || '/onboarding'
      }
    } catch (error) {
      setFormError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const handleGoogleSignUp = async () => {
    setLoading(true)
    setFormError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo || '/onboarding')}`
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
  
  return (
    <Card className="bg-white rounded-lg shadow-xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-center">Create Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || formError) && (
          <Alert variant="destructive">
            <AlertDescription>
              {error || formError}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          
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
              minLength={6}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
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
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign Up with Google
        </Button>
        
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link href={`/sign-in${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Step 8: Update Layout

### 8.1 Remove ClerkProvider

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

## Step 9: Update Existing Pages

### 9.1 Update Homepage

Update `src/app/page.tsx`:

```typescript
import { getServerSession } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Calendar, Users, DollarSign, CheckCircle2, Star } from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-pink-500" />
            <span className="text-2xl font-bold text-gray-900">Wedding Planner</span>
          </div>
          <div className="space-x-4">
            {session ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Plan Your Perfect
            <span className="text-pink-500"> Wedding</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            From budget tracking to guest management, we help you organize every detail 
            of your special day with ease and joy.
          </p>
          {!session && (
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Planning Today
              </Button>
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>Budget Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Keep track of expenses and stay within your budget with our intuitive tools.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <CardTitle>Guest Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage invitations, RSVPs, and seating arrangements all in one place.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <CardTitle>Timeline Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and manage your wedding timeline to ensure everything runs smoothly.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckCircle2 className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <CardTitle>Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Never miss a detail with our comprehensive task and checklist system.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        {!session && (
          <div className="text-center bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Planning?
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of couples who have planned their perfect wedding with us.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="mr-4">
                Create Free Account
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
```

### 9.2 Update Dashboard Page

Update `src/app/(dashboard)/dashboard/page.tsx`:

```typescript
import { getServerUser } from '@/lib/supabase/server'
import { authService } from '@/infrastructure/auth/auth-service'
import { redirect } from 'next/navigation'
import DashboardContent from './components/DashboardContent'

export default async function DashboardPage() {
  // Server-side authentication check
  const user = await getServerUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  // Get user context with permissions
  const userContext = await authService.getCurrentUser()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent user={userContext} />
    </div>
  )
}
```

## Step 10: Clean Up Clerk References

### 10.1 Remove Clerk Imports

Search and replace all Clerk imports:

```bash
# Find all Clerk imports
grep -r "@clerk" src/ --include="*.ts" --include="*.tsx"

# Remove these imports and replace with Supabase equivalents
```

### 10.2 Update API Routes

Update all API routes to use new auth service:

```typescript
// Before (Clerk)
import { auth, currentUser } from '@clerk/nextjs/server'

// After (Supabase)
import { authService } from '@/infrastructure/auth/auth-service'
import { createRouteHandlerSupabaseClient } from '@/lib/supabase/server'
```

### 10.3 Remove Test Pages

Delete Clerk test pages:

```bash
rm -rf src/app/test-clerk
```

## Step 11: Testing

### 11.1 Local Testing

```bash
# Start development server
npm run dev

# Test authentication flows:
# 1. Sign up with email
# 2. Sign in with email
# 3. Google OAuth
# 4. Route protection
# 5. Session persistence
# 6. Sign out
```

### 11.2 Production Testing

```bash
# Build and test
npm run build
npm start

# Deploy to Vercel preview
vercel --prod=false
```

## Step 12: Deployment

### 12.1 Update Environment Variables

In Vercel dashboard, update environment variables:

- Remove all `CLERK_*` variables
- Add `SUPABASE_SERVICE_ROLE_KEY`
- Update `NEXT_PUBLIC_SITE_URL` for production

### 12.2 Deploy to Production

```bash
# Deploy to production
vercel --prod
```

## Verification Checklist

- [ ] Email/password sign-in works
- [ ] Email/password sign-up works
- [ ] Google OAuth works
- [ ] Route protection works (middleware)
- [ ] Session persistence works
- [ ] Sign-out works
- [ ] No hydration errors
- [ ] No session flicker
- [ ] Server-side rendering works
- [ ] API authentication works
- [ ] Database user sync works
- [ ] Permissions system works
- [ ] Production deployment works
- [ ] All Clerk references removed

## Troubleshooting

### Common Issues

1. **Hydration Errors**: Ensure all auth checks are server-side first
2. **Session Flicker**: Use proper loading states and server-side redirects
3. **OAuth Redirects**: Verify redirect URLs in Supabase dashboard
4. **Database Sync**: Check user creation in auth callback
5. **Permissions**: Verify role and permission assignments

### Debug Commands

```bash
# Check Supabase connection
npx supabase status

# View logs
npm run dev 2>&1 | grep -i auth

# Test API endpoints
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/user/me
```

This implementation guide provides a complete, step-by-step migration from Clerk to Supabase Auth with proper error handling and production-ready code.