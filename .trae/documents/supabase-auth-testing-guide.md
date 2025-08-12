# Supabase Auth Testing & Validation Guide

## Overview

This guide provides comprehensive testing procedures to validate the Clerk to Supabase Auth migration. Follow these tests to ensure all requirements are met and the system works correctly in both development and production environments.

## Pre-Migration Testing Checklist

### Environment Setup Validation

- [ ] Supabase project created and accessible
- [ ] Google OAuth configured in Supabase dashboard
- [ ] Environment variables properly set
- [ ] Database schema updated
- [ ] Dependencies installed correctly

### Supabase Dashboard Configuration

```bash
# Verify Supabase connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/"
```

## Core Authentication Testing

### 1. Email/Password Authentication

#### 1.1 Sign Up Flow

**Test Case**: New user registration with email/password

```typescript
// Test script: test-email-signup.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testEmailSignUp() {
  const testEmail = `test+${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  console.log('Testing email sign up...')
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        first_name: 'Test',
        last_name: 'User'
      }
    }
  })
  
  if (error) {
    console.error('Sign up failed:', error.message)
    return false
  }
  
  console.log('Sign up successful:', data.user?.email)
  return true
}

testEmailSignUp()
```

**Expected Results**:
- [ ] User created in Supabase Auth
- [ ] User record created in database
- [ ] No hydration errors
- [ ] Proper redirect to onboarding
- [ ] Session established

#### 1.2 Sign In Flow

**Test Case**: Existing user login with email/password

```typescript
// Test script: test-email-signin.ts
async function testEmailSignIn() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'existing@example.com',
    password: 'ExistingPassword123!'
  })
  
  if (error) {
    console.error('Sign in failed:', error.message)
    return false
  }
  
  console.log('Sign in successful:', data.user?.email)
  return true
}
```

**Expected Results**:
- [ ] Successful authentication
- [ ] Session established
- [ ] Proper redirect to dashboard
- [ ] User context loaded
- [ ] No session flicker

### 2. Google OAuth Authentication

#### 2.1 OAuth Flow Testing

**Manual Test Steps**:
1. Navigate to `/sign-in`
2. Click "Sign In with Google"
3. Complete Google OAuth flow
4. Verify redirect to `/auth/callback`
5. Verify final redirect to dashboard

**Expected Results**:
- [ ] Google OAuth popup opens
- [ ] User can complete OAuth flow
- [ ] Callback handler processes code exchange
- [ ] User created/updated in database
- [ ] Session established
- [ ] Proper redirect to dashboard

#### 2.2 OAuth Error Handling

**Test Cases**:
- User cancels OAuth flow
- Network error during OAuth
- Invalid OAuth configuration

**Expected Results**:
- [ ] Graceful error handling
- [ ] User redirected to sign-in with error message
- [ ] No application crashes

### 3. Session Management

#### 3.1 Session Persistence

**Test Script**:
```typescript
// Test session persistence across page reloads
async function testSessionPersistence() {
  // Sign in user
  await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  })
  
  // Check session immediately
  const { data: session1 } = await supabase.auth.getSession()
  console.log('Initial session:', !!session1.session)
  
  // Simulate page reload by creating new client
  const newSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Check session after "reload"
  const { data: session2 } = await newSupabase.auth.getSession()
  console.log('Session after reload:', !!session2.session)
  
  return !!session1.session && !!session2.session
}
```

**Expected Results**:
- [ ] Session persists across page reloads
- [ ] Session persists across browser tabs
- [ ] Session expires appropriately
- [ ] Automatic session refresh works

#### 3.2 Session Refresh

**Test Script**:
```typescript
// Test automatic session refresh
async function testSessionRefresh() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.error('No active session')
    return false
  }
  
  const originalExpiry = session.expires_at
  console.log('Original expiry:', new Date(originalExpiry! * 1000))
  
  // Force refresh
  const { data: refreshed, error } = await supabase.auth.refreshSession()
  
  if (error) {
    console.error('Refresh failed:', error.message)
    return false
  }
  
  const newExpiry = refreshed.session?.expires_at
  console.log('New expiry:', new Date(newExpiry! * 1000))
  
  return newExpiry! > originalExpiry!
}
```

**Expected Results**:
- [ ] Session refreshes automatically
- [ ] New expiry time is later than original
- [ ] User remains authenticated
- [ ] No interruption to user experience

## Route Protection Testing

### 4. Middleware Protection

#### 4.1 Protected Route Access

**Test Cases**:

```bash
# Test unauthenticated access to protected routes
curl -I http://localhost:3000/dashboard
# Expected: 302 redirect to /sign-in

curl -I http://localhost:3000/budget
# Expected: 302 redirect to /sign-in

curl -I http://localhost:3000/guests
# Expected: 302 redirect to /sign-in
```

**Expected Results**:
- [ ] Unauthenticated users redirected to sign-in
- [ ] Redirect includes `redirectTo` parameter
- [ ] No flash of protected content
- [ ] Server-side redirect (not client-side)

#### 4.2 Public Route Access

**Test Cases**:

```bash
# Test public route access
curl -I http://localhost:3000/
# Expected: 200 OK

curl -I http://localhost:3000/sign-in
# Expected: 200 OK

curl -I http://localhost:3000/sign-up
# Expected: 200 OK
```

**Expected Results**:
- [ ] Public routes accessible without authentication
- [ ] No unnecessary redirects
- [ ] Proper content served

#### 4.3 Authenticated User Redirects

**Test Case**: Authenticated user accessing auth pages

**Manual Steps**:
1. Sign in to application
2. Navigate to `/sign-in`
3. Navigate to `/sign-up`

**Expected Results**:
- [ ] Authenticated users redirected away from auth pages
- [ ] Redirect to dashboard or intended destination
- [ ] No access to sign-in/sign-up forms

### 5. API Route Protection

#### 5.1 Protected API Endpoints

**Test Script**:
```typescript
// Test API authentication
async function testAPIAuth() {
  // Test without authentication
  const unauthResponse = await fetch('/api/user/me')
  console.log('Unauth API status:', unauthResponse.status)
  // Expected: 401
  
  // Sign in and test with authentication
  await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  })
  
  const authResponse = await fetch('/api/user/me')
  console.log('Auth API status:', authResponse.status)
  // Expected: 200
  
  const userData = await authResponse.json()
  console.log('User data:', userData)
}
```

**Expected Results**:
- [ ] Unauthenticated requests return 401
- [ ] Authenticated requests return 200
- [ ] Proper user data returned
- [ ] No sensitive data exposed

## Server-Side Rendering Testing

### 6. SSR Authentication

#### 6.1 Server-Side Session Fetching

**Test Case**: Verify no hydration errors

**Manual Steps**:
1. Sign in to application
2. Navigate to dashboard
3. Refresh page
4. Check browser console for hydration errors
5. Check network tab for unnecessary client-side auth requests

**Expected Results**:
- [ ] No hydration errors in console
- [ ] User data available on first render
- [ ] No loading states for authenticated content
- [ ] No flash of unauthenticated content

#### 6.2 Server-Side Redirects

**Test Script**:
```bash
# Test server-side redirects with curl
# Should not require JavaScript execution

# Test protected page redirect
curl -v http://localhost:3000/dashboard 2>&1 | grep -E "(Location|HTTP)"

# Test authenticated user redirect from auth pages
# (requires setting session cookie)
curl -v -H "Cookie: sb-access-token=<token>" http://localhost:3000/sign-in 2>&1 | grep -E "(Location|HTTP)"
```

**Expected Results**:
- [ ] Redirects happen server-side (302 status)
- [ ] No client-side JavaScript required
- [ ] Proper Location headers set
- [ ] Fast redirect response times

## Database Integration Testing

### 7. User Synchronization

#### 7.1 User Creation

**Test Script**:
```sql
-- Check user creation in database
SELECT 
  id,
  email,
  first_name,
  last_name,
  created_at,
  last_login_at
FROM users 
WHERE email = 'test@example.com';
```

**Expected Results**:
- [ ] User record created on first sign-in
- [ ] Proper data mapping from Supabase Auth
- [ ] Timestamps correctly set
- [ ] No duplicate users

#### 7.2 User Updates

**Test Case**: User metadata updates

**Test Script**:
```typescript
// Test user profile updates
async function testUserUpdate() {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      first_name: 'Updated',
      last_name: 'Name'
    }
  })
  
  if (error) {
    console.error('Update failed:', error.message)
    return false
  }
  
  // Check if database was updated
  // This would require a custom API endpoint
  const response = await fetch('/api/user/me')
  const userData = await response.json()
  
  return userData.firstName === 'Updated' && userData.lastName === 'Name'
}
```

**Expected Results**:
- [ ] User metadata updates in Supabase Auth
- [ ] Database user record updates
- [ ] Changes reflected in application
- [ ] Cache invalidation works

### 8. Permissions and Roles

#### 8.1 Role Assignment

**Test Script**:
```sql
-- Check role assignment
SELECT 
  u.email,
  r.name as role_name,
  ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';
```

**Expected Results**:
- [ ] Default roles assigned to new users
- [ ] Role assignments persist
- [ ] Proper role hierarchy

#### 8.2 Permission Checking

**Test Script**:
```typescript
// Test permission checking
async function testPermissions() {
  const response = await fetch('/api/budget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Budget Item', amount: 100 })
  })
  
  console.log('Budget creation status:', response.status)
  // Should be 200 if user has write:budget permission
  // Should be 403 if user lacks permission
}
```

**Expected Results**:
- [ ] Permissions enforced correctly
- [ ] Proper error messages for insufficient permissions
- [ ] Admin permissions override specific permissions

## Performance Testing

### 9. Load Testing

#### 9.1 Authentication Performance

**Test Script**:
```typescript
// Test authentication performance
async function testAuthPerformance() {
  const startTime = Date.now()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  })
  
  const authTime = Date.now() - startTime
  console.log('Authentication time:', authTime, 'ms')
  
  if (error) {
    console.error('Auth failed:', error.message)
    return false
  }
  
  // Test session retrieval performance
  const sessionStart = Date.now()
  const { data: session } = await supabase.auth.getSession()
  const sessionTime = Date.now() - sessionStart
  console.log('Session retrieval time:', sessionTime, 'ms')
  
  return authTime < 2000 && sessionTime < 100 // Reasonable thresholds
}
```

**Expected Results**:
- [ ] Authentication completes within 2 seconds
- [ ] Session retrieval completes within 100ms
- [ ] No memory leaks
- [ ] Consistent performance across requests

#### 9.2 Concurrent User Testing

**Test Script**:
```typescript
// Test concurrent authentication
async function testConcurrentAuth() {
  const promises = []
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      supabase.auth.signInWithPassword({
        email: `test${i}@example.com`,
        password: 'password123'
      })
    )
  }
  
  const results = await Promise.all(promises)
  const successful = results.filter(r => !r.error).length
  
  console.log(`${successful}/10 concurrent authentications successful`)
  return successful === 10
}
```

**Expected Results**:
- [ ] Multiple concurrent authentications succeed
- [ ] No race conditions
- [ ] Stable performance under load

## Production Environment Testing

### 10. Vercel Deployment Testing

#### 10.1 Environment Variables

**Test Script**:
```bash
# Test environment variables in production
curl https://your-app.vercel.app/api/health
# Should return 200 with proper environment info
```

**Expected Results**:
- [ ] All environment variables properly set
- [ ] Supabase connection works in production
- [ ] No sensitive data exposed

#### 10.2 OAuth Redirects

**Manual Test Steps**:
1. Navigate to production sign-in page
2. Initiate Google OAuth
3. Complete OAuth flow
4. Verify redirect to production callback URL
5. Verify final redirect to dashboard

**Expected Results**:
- [ ] OAuth works with production URLs
- [ ] Callback URLs properly configured
- [ ] HTTPS redirects work correctly
- [ ] No CORS issues

#### 10.3 Preview Deployments

**Test Case**: Verify auth works on Vercel preview URLs

**Manual Steps**:
1. Create PR with auth changes
2. Test authentication on preview URL
3. Verify OAuth redirects work with preview domain

**Expected Results**:
- [ ] Authentication works on preview URLs
- [ ] OAuth configured for wildcard domains
- [ ] No hardcoded production URLs

## Error Handling Testing

### 11. Error Scenarios

#### 11.1 Network Errors

**Test Cases**:
- Offline authentication attempts
- Slow network conditions
- Supabase service unavailable

**Expected Results**:
- [ ] Graceful error handling
- [ ] User-friendly error messages
- [ ] Retry mechanisms where appropriate
- [ ] No application crashes

#### 11.2 Invalid Credentials

**Test Script**:
```typescript
// Test invalid credentials
async function testInvalidCredentials() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'invalid@example.com',
    password: 'wrongpassword'
  })
  
  console.log('Error message:', error?.message)
  // Should be user-friendly, not expose system details
  
  return error && !error.message.includes('database') && !error.message.includes('internal')
}
```

**Expected Results**:
- [ ] Clear error messages for invalid credentials
- [ ] No sensitive system information exposed
- [ ] Proper error handling in UI
- [ ] No console errors

## Migration Validation

### 12. Clerk Removal Verification

#### 12.1 Code Cleanup

**Test Script**:
```bash
# Search for remaining Clerk references
grep -r "@clerk" src/ --include="*.ts" --include="*.tsx" || echo "No Clerk references found"
grep -r "clerk" src/ --include="*.ts" --include="*.tsx" -i | grep -v "clerk-to-supabase" || echo "No clerk references found"
grep -r "useAuth" src/ --include="*.ts" --include="*.tsx" | grep -v "supabase" || echo "No Clerk useAuth found"
```

**Expected Results**:
- [ ] No Clerk imports remain
- [ ] No Clerk components used
- [ ] No Clerk hooks used
- [ ] No Clerk middleware

#### 12.2 Dependency Cleanup

**Test Script**:
```bash
# Check package.json for Clerk dependencies
grep -E "@clerk|clerk" package.json || echo "No Clerk dependencies found"

# Check for unused dependencies
npm ls --depth=0 | grep clerk || echo "No Clerk packages installed"
```

**Expected Results**:
- [ ] No Clerk dependencies in package.json
- [ ] No Clerk packages in node_modules
- [ ] Clean dependency tree

### 13. Feature Parity Verification

#### 13.1 Authentication Features

**Checklist**:
- [ ] Email/password sign-in ✓
- [ ] Email/password sign-up ✓
- [ ] Google OAuth ✓
- [ ] Session management ✓
- [ ] Route protection ✓
- [ ] API authentication ✓
- [ ] User profile management ✓
- [ ] Sign out ✓

#### 13.2 User Experience

**Checklist**:
- [ ] No hydration errors ✓
- [ ] No session flicker ✓
- [ ] Fast authentication ✓
- [ ] Proper error handling ✓
- [ ] Responsive design ✓
- [ ] Accessibility compliance ✓

## Automated Testing Setup

### 14. Test Automation

#### 14.1 Jest/Vitest Tests

**Example Test File**: `__tests__/auth.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

describe('Authentication', () => {
  beforeEach(async () => {
    // Clean up any existing sessions
    await supabase.auth.signOut()
  })
  
  afterEach(async () => {
    // Clean up after tests
    await supabase.auth.signOut()
  })
  
  it('should sign up new user', async () => {
    const testEmail = `test+${Date.now()}@example.com`
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    })
    
    expect(error).toBeNull()
    expect(data.user?.email).toBe(testEmail)
  })
  
  it('should sign in existing user', async () => {
    // First create a user
    const testEmail = `test+${Date.now()}@example.com`
    await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    })
    
    // Then sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'TestPassword123!'
    })
    
    expect(error).toBeNull()
    expect(data.user?.email).toBe(testEmail)
  })
  
  it('should handle invalid credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    })
    
    expect(error).toBeTruthy()
    expect(data.user).toBeNull()
  })
})
```

#### 14.2 E2E Tests with Playwright

**Example E2E Test**: `e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should complete sign-up flow', async ({ page }) => {
    await page.goto('/sign-up')
    
    // Fill out sign-up form
    await page.fill('[data-testid="firstName"]', 'Test')
    await page.fill('[data-testid="lastName"]', 'User')
    await page.fill('[data-testid="email"]', `test+${Date.now()}@example.com`)
    await page.fill('[data-testid="password"]', 'TestPassword123!')
    
    // Submit form
    await page.click('[data-testid="submit"]')
    
    // Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding')
  })
  
  test('should protect dashboard route', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/sign-in/)
  })
  
  test('should complete full auth flow', async ({ page }) => {
    // Sign up
    await page.goto('/sign-up')
    const testEmail = `test+${Date.now()}@example.com`
    
    await page.fill('[data-testid="firstName"]', 'Test')
    await page.fill('[data-testid="lastName"]', 'User')
    await page.fill('[data-testid="email"]', testEmail)
    await page.fill('[data-testid="password"]', 'TestPassword123!')
    await page.click('[data-testid="submit"]')
    
    // Should be authenticated and redirected
    await expect(page).toHaveURL('/onboarding')
    
    // Sign out
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="sign-out"]')
    
    // Should redirect to home
    await expect(page).toHaveURL('/')
    
    // Sign back in
    await page.goto('/sign-in')
    await page.fill('[data-testid="email"]', testEmail)
    await page.fill('[data-testid="password"]', 'TestPassword123!')
    await page.click('[data-testid="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
  })
})
```

## Final Validation Checklist

### ✅ Migration Complete Verification

- [ ] **Authentication Works**
  - [ ] Email/password sign-in ✓
  - [ ] Email/password sign-up ✓
  - [ ] Google OAuth ✓
  - [ ] Session persistence ✓
  - [ ] Sign out ✓

- [ ] **No Hydration Issues**
  - [ ] No hydration errors in console ✓
  - [ ] No session flicker ✓
  - [ ] Server-side first rendering ✓
  - [ ] Proper loading states ✓

- [ ] **Route Protection**
  - [ ] Middleware protects routes ✓
  - [ ] Server-side redirects ✓
  - [ ] No flash of unauthenticated content ✓
  - [ ] API routes protected ✓

- [ ] **Production Ready**
  - [ ] Works in local development ✓
  - [ ] Works on Vercel production ✓
  - [ ] Works on preview deployments ✓
  - [ ] Environment variables configured ✓

- [ ] **Code Quality**
  - [ ] All Clerk code removed ✓
  - [ ] Modular architecture ✓
  - [ ] Proper error handling ✓
  - [ ] TypeScript types ✓

- [ ] **Database Integration**
  - [ ] User synchronization ✓
  - [ ] Permissions system ✓
  - [ ] Data consistency ✓

### 🚀 Ready for Production

Once all tests pass and the checklist is complete, the migration from Clerk to Supabase Auth is successful and ready for production deployment.

## Troubleshooting Common Issues

### Issue: Hydration Errors
**Solution**: Ensure all auth checks happen server-side first
```typescript
// ❌ Wrong - client-side first
const { user } = useUser()

// ✅ Correct - server-side first
const user = await getServerUser()
```

### Issue: Session Flicker
**Solution**: Use proper loading states and server-side data
```typescript
// ❌ Wrong - shows loading state
if (loading) return <Spinner />

// ✅ Correct - server-side data
const user = await getServerUser()
if (!user) redirect('/sign-in')
```

### Issue: OAuth Redirects
**Solution**: Configure all possible redirect URLs in Supabase
```
# Add to Supabase Auth settings
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
https://*.vercel.app/auth/callback
```

### Issue: API Authentication
**Solution**: Use proper Supabase client in API routes
```typescript
// ❌ Wrong - client component client
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ✅ Correct - route handler client
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
```

This comprehensive testing guide ensures a successful migration with all requirements met and proper validation of the new Supabase Auth implementation.