# Clerk Authentication Rollback Plan

## Overview

This document provides a comprehensive rollback plan to revert from Supabase Auth back to Clerk authentication if issues arise during or after the migration. This plan ensures minimal downtime and data integrity.

## When to Execute Rollback

### Critical Issues Requiring Immediate Rollback

- [ ] Authentication completely broken in production
- [ ] Data loss or corruption detected
- [ ] Security vulnerabilities discovered
- [ ] Performance degradation > 50%
- [ ] Hydration errors causing app crashes
- [ ] OAuth providers not working
- [ ] Session management failures
- [ ] Database synchronization issues

### Non-Critical Issues (Fix Forward)

- Minor UI/UX issues
- Performance optimization needs
- Feature enhancement requests
- Non-breaking configuration issues

## Pre-Rollback Checklist

### 1. Assess the Situation

- [ ] Document the specific issue(s)
- [ ] Determine impact scope (users affected, features broken)
- [ ] Estimate fix time vs rollback time
- [ ] Check if issue can be hotfixed
- [ ] Verify rollback is necessary

### 2. Backup Current State

```bash
# Create backup branch
git checkout -b backup/supabase-auth-$(date +%Y%m%d-%H%M%S)
git add .
git commit -m "Backup: Supabase auth implementation before rollback"
git push origin backup/supabase-auth-$(date +%Y%m%d-%H%M%S)

# Tag current state
git tag -a rollback-point-$(date +%Y%m%d-%H%M%S) -m "Rollback point for Supabase auth"
git push origin rollback-point-$(date +%Y%m%d-%H%M%S)
```

### 3. Database Backup

```sql
-- Backup user data before rollback
CREATE TABLE users_backup_$(date +%Y%m%d) AS 
SELECT * FROM users;

CREATE TABLE user_roles_backup_$(date +%Y%m%d) AS 
SELECT * FROM user_roles;

-- Export to file
pg_dump -h your-supabase-host -U postgres -d your-db -t users -t user_roles > users_backup_$(date +%Y%m%d).sql
```

## Rollback Execution Steps

### Phase 1: Immediate Mitigation (5-10 minutes)

#### 1.1 Revert to Previous Deployment

```bash
# If using Vercel
vercel rollback

# Or revert to specific deployment
vercel rollback https://your-app-git-main-yourteam.vercel.app

# If using other platforms, revert to last known good deployment
```

#### 1.2 Emergency Environment Variables

```bash
# Quickly restore Clerk environment variables in production
# (Keep these values ready in secure storage)

vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production
vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL production
vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL production

# Remove Supabase auth variables temporarily
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
```

### Phase 2: Code Rollback (15-30 minutes)

#### 2.1 Restore Clerk Dependencies

```bash
# Reinstall Clerk packages
npm install @clerk/nextjs@^6.28.1 @clerk/backend@^2.6.2

# Remove Supabase auth helpers
npm uninstall @supabase/auth-helpers-nextjs

# Keep @supabase/supabase-js for database operations
```

#### 2.2 Restore Clerk Middleware

Restore `middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health'
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

#### 2.3 Restore Clerk Layout

Restore `app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wedding Planner',
  description: 'Plan your event with ease',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

#### 2.4 Restore Clerk Authentication Pages

Restore `app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue to your wedding planner</p>
        </div>
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6">
          <SignIn 
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </main>
  )
}
```

Restore `app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us to start planning your perfect wedding</p>
        </div>
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6">
          <SignUp 
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/onboarding"
          />
        </div>
      </div>
    </main>
  )
}
```

#### 2.5 Restore Clerk Auth Service

Restore `infrastructure/auth/auth-service.ts`:

```typescript
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/core/logging/logger'
import { AuthenticationError, AuthorizationError } from '@/core/errors'
import { Cache, InvalidateCache } from '@/core/cache'
import { Trace } from '@/core/monitoring'

export interface UserContext {
  userId: string
  clerkUserId: string
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

export class AuthService {
  @Trace()
  @Cache({ ttl: 300, namespace: 'auth' })
  async getCurrentUser(): Promise<UserContext> {
    const { userId } = auth()
    const user = await currentUser()
    
    if (!userId || !user?.emailAddresses?.[0]?.emailAddress) {
      throw new AuthenticationError('User not authenticated')
    }
    
    const email = user.emailAddresses[0].emailAddress
    
    const dbUser = await prisma.user.findUnique({
      where: { email },
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
      const newUser = await this.createUserFromClerk(user)
      return this.mapUserToContext(newUser, userId)
    }
    
    return this.mapUserToContext(dbUser, userId)
  }
  
  private mapUserToContext(dbUser: any, clerkUserId: string): UserContext {
    const permissions = dbUser.userRoles?.flatMap((ur: any) => 
      ur.role.rolePermissions.map((rp: any) => rp.permission.name)
    ) || []
    const roles = dbUser.userRoles?.map((ur: any) => ur.role.name) || []
    
    return {
      userId: dbUser.id,
      clerkUserId,
      email: dbUser.email,
      firstName: dbUser.firstName || '',
      lastName: dbUser.lastName || '',
      coupleId: dbUser.coupleId || '',
      permissions,
      roles
    }
  }
  
  private async createUserFromClerk(clerkUser: any) {
    return await prisma.user.create({
      data: {
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
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
  
  async hasPermission(permission: Permission): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return user.permissions.includes(permission) || user.permissions.includes(Permission.ADMIN)
    } catch {
      return false
    }
  }
  
  async requirePermission(permission: Permission): Promise<void> {
    const hasPermission = await this.hasPermission(permission)
    if (!hasPermission) {
      throw new AuthorizationError(`Permission required: ${permission}`)
    }
  }
  
  @InvalidateCache({ namespace: 'auth' })
  private async invalidateUserCache(): Promise<void> {
    // Cache invalidation handled by decorator
  }
}

export const authService = new AuthService()
```

#### 2.6 Restore API Routes

Update all API routes to use Clerk:

```typescript
// Example: app/api/user/me/route.ts
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { authService } from '@/infrastructure/auth/auth-service'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await authService.getCurrentUser()
    return NextResponse.json(user)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### Phase 3: Environment Configuration (5-10 minutes)

#### 3.1 Update Environment Variables

```bash
# Local development (.env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Remove Supabase auth variables
# SUPABASE_SERVICE_ROLE_KEY=
```

#### 3.2 Production Environment Variables

```bash
# Vercel production
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY "pk_live_..." production
vercel env add CLERK_SECRET_KEY "sk_live_..." production
vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL "/sign-in" production
vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL "/sign-up" production
vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL "/dashboard" production
vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL "/onboarding" production

# Remove Supabase auth variables
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
```

### Phase 4: File Cleanup (5 minutes)

#### 4.1 Remove Supabase Auth Files

```bash
# Remove Supabase auth implementation files
rm -rf src/lib/supabase/server.ts
rm -rf src/lib/supabase/client.ts
rm -rf src/app/auth/
rm -rf src/app/sign-in/components/
rm -rf src/app/sign-up/components/

# Remove test files
rm -rf src/app/test-clerk/
```

#### 4.2 Restore Original Files

```bash
# Restore from git history if needed
git checkout HEAD~n -- src/app/sign-in/[[...sign-in]]/page.tsx
git checkout HEAD~n -- src/app/sign-up/[[...sign-up]]/page.tsx
git checkout HEAD~n -- middleware.ts
git checkout HEAD~n -- src/app/layout.tsx
```

### Phase 5: Database Migration (10-15 minutes)

#### 5.1 User Data Reconciliation

```sql
-- Update user records to use Clerk IDs if needed
-- This depends on how user data was migrated

-- If users were created with Supabase UUIDs, map them back to Clerk IDs
UPDATE users 
SET clerk_user_id = (
  SELECT clerk_id FROM user_clerk_mapping 
  WHERE user_clerk_mapping.email = users.email
)
WHERE clerk_user_id IS NULL;

-- Clean up any Supabase-specific fields
ALTER TABLE users DROP COLUMN IF EXISTS supabase_user_id;
```

#### 5.2 Session Cleanup

```sql
-- Clear any Supabase session data
DELETE FROM auth.sessions WHERE provider = 'supabase';

-- Reset user login timestamps
UPDATE users SET last_login_at = NOW() WHERE last_login_at IS NULL;
```

### Phase 6: Testing and Verification (10-15 minutes)

#### 6.1 Smoke Tests

```bash
# Test authentication flows
curl -I http://localhost:3000/sign-in
curl -I http://localhost:3000/sign-up
curl -I http://localhost:3000/dashboard

# Test API endpoints
curl -H "Authorization: Bearer <clerk-token>" http://localhost:3000/api/user/me
```

#### 6.2 Manual Testing

- [ ] Sign in with existing account
- [ ] Sign up new account
- [ ] Access protected routes
- [ ] API authentication works
- [ ] Session persistence
- [ ] Sign out functionality

### Phase 7: Deployment (5-10 minutes)

#### 7.1 Deploy Rollback

```bash
# Commit rollback changes
git add .
git commit -m "Rollback: Restore Clerk authentication"
git push origin main

# Deploy to production
vercel --prod
```

#### 7.2 Monitor Deployment

```bash
# Monitor deployment
vercel logs --follow

# Check application health
curl -I https://your-app.vercel.app/api/health
```

## Post-Rollback Actions

### 1. User Communication

```markdown
# Example user notification

**Service Update Notice**

We've temporarily reverted to our previous authentication system to ensure the best user experience. All your data is safe and accessible. We apologize for any inconvenience.

What this means:
- You can continue using the app normally
- All your wedding planning data is intact
- Sign-in process remains the same

We're working on improvements and will update you soon.
```

### 2. Incident Documentation

```markdown
# Incident Report Template

**Date**: [Date]
**Duration**: [Start time] - [End time]
**Impact**: [Description of impact]
**Root Cause**: [What caused the issue]
**Resolution**: [How it was resolved]
**Action Items**: [What will be done to prevent recurrence]
```

### 3. Data Integrity Verification

```sql
-- Verify user data integrity
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
  COUNT(CASE WHEN clerk_user_id IS NOT NULL THEN 1 END) as users_with_clerk_id
FROM users;

-- Check for any orphaned records
SELECT * FROM users WHERE email IS NULL OR clerk_user_id IS NULL;

-- Verify couple associations
SELECT 
  c.id,
  c.name,
  COUNT(u.id) as user_count
FROM couples c
LEFT JOIN users u ON c.id = u.couple_id
GROUP BY c.id, c.name
HAVING COUNT(u.id) = 0;
```

### 4. Performance Monitoring

```bash
# Monitor key metrics after rollback
# - Authentication success rate
# - Page load times
# - Error rates
# - User session duration

# Set up alerts for:
# - Authentication failures > 5%
# - Response times > 2 seconds
# - Error rates > 1%
```

## Prevention Strategies

### 1. Better Testing

- [ ] Implement comprehensive E2E tests
- [ ] Set up staging environment that mirrors production
- [ ] Perform load testing before migration
- [ ] Test all authentication flows thoroughly
- [ ] Validate database migrations

### 2. Gradual Migration

```typescript
// Feature flag approach for gradual rollout
const useSupabaseAuth = process.env.FEATURE_SUPABASE_AUTH === 'true'

if (useSupabaseAuth) {
  // Use Supabase auth
} else {
  // Use Clerk auth
}
```

### 3. Monitoring and Alerting

```typescript
// Add monitoring to auth flows
import { logger } from '@/lib/logger'
import { metrics } from '@/lib/metrics'

export async function signIn(credentials: any) {
  const startTime = Date.now()
  
  try {
    const result = await authProvider.signIn(credentials)
    
    metrics.increment('auth.signin.success')
    logger.info('Sign in successful', { email: credentials.email })
    
    return result
  } catch (error) {
    metrics.increment('auth.signin.failure')
    logger.error('Sign in failed', { error, email: credentials.email })
    
    throw error
  } finally {
    metrics.timing('auth.signin.duration', Date.now() - startTime)
  }
}
```

### 4. Rollback Automation

```bash
#!/bin/bash
# rollback.sh - Automated rollback script

set -e

echo "Starting rollback process..."

# 1. Revert deployment
vercel rollback

# 2. Restore environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY "$CLERK_PUBLISHABLE_KEY" production
vercel env add CLERK_SECRET_KEY "$CLERK_SECRET_KEY" production

# 3. Remove Supabase auth variables
vercel env rm SUPABASE_SERVICE_ROLE_KEY production

# 4. Verify rollback
curl -f https://your-app.vercel.app/api/health || exit 1

echo "Rollback completed successfully"
```

## Recovery Planning

### 1. Data Recovery

```sql
-- Restore user data from backup if needed
INSERT INTO users 
SELECT * FROM users_backup_20241201 
WHERE email NOT IN (SELECT email FROM users);

-- Restore role assignments
INSERT INTO user_roles
SELECT * FROM user_roles_backup_20241201
WHERE user_id IN (SELECT id FROM users);
```

### 2. Session Recovery

```typescript
// Help users recover their sessions
export async function recoverUserSession(email: string) {
  // Send password reset email
  await clerk.users.sendPasswordResetEmail({ email })
  
  // Log recovery attempt
  logger.info('Session recovery initiated', { email })
}
```

### 3. Communication Plan

```markdown
# Communication Timeline

**Immediate (0-15 minutes)**
- Internal team notification
- Status page update
- Customer support briefing

**Short-term (15-60 minutes)**
- User notification email
- Social media update
- Detailed status page update

**Follow-up (1-24 hours)**
- Incident report
- Lessons learned
- Prevention measures
```

## Success Criteria for Rollback

### ✅ Rollback Complete When:

- [ ] Authentication works with Clerk
- [ ] All users can sign in
- [ ] Protected routes work correctly
- [ ] API authentication functions
- [ ] No data loss detected
- [ ] Performance metrics normal
- [ ] Error rates < 1%
- [ ] User complaints resolved

### 📊 Monitoring Metrics

- **Authentication Success Rate**: > 99%
- **Page Load Time**: < 2 seconds
- **Error Rate**: < 1%
- **User Session Duration**: Normal baseline
- **API Response Time**: < 500ms

## Conclusion

This rollback plan provides a comprehensive safety net for the Clerk to Supabase Auth migration. By following these steps, you can quickly and safely revert to the previous authentication system if issues arise, ensuring minimal disruption to users and maintaining data integrity.

Remember:
- **Speed is crucial** - Execute rollback quickly to minimize user impact
- **Communication is key** - Keep users informed throughout the process
- **Learn from issues** - Document problems and improve future migrations
- **Test thoroughly** - Verify rollback works before you need it

Keep this plan updated and test the rollback process in a staging environment to ensure it works when needed.