# Authentication Flow Documentation

## Overview

This document outlines the complete authentication and user flow for the wedding planner application, including the separation of sign-in vs sign-up flows and the onboarding completion detection system.

## Authentication Architecture

### Components
- **Clerk Authentication**: Handles user sign-in/sign-up with secure session management
- **Middleware Protection**: Route-based access control with onboarding status verification
- **Database Integration**: Links authenticated users with wedding planning data
- **Cookie Management**: Tracks onboarding completion status for efficient routing

## User Flow States

### 1. Unauthenticated User
**Routing**: Homepage → Sign-in or Sign-up pages
- Access to public routes only
- Redirected to authentication when accessing protected routes
- No onboarding data available

### 2. Authenticated but Not Onboarded
**Routing**: Authentication → Onboarding flow
- Valid Clerk session established
- No couple profile in database
- Restricted to onboarding routes only
- Cannot access dashboard until completion

### 3. Authenticated and Onboarded
**Routing**: Authentication → Dashboard
- Valid Clerk session with completed couple profile
- Full access to all wedding planning features
- Onboarding completion cookie set for performance
- Personalized dashboard experience

## Middleware Implementation

### Route Protection Logic

```typescript
// Public routes (no authentication required)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/test-connection',
  '/invitation',
  '/api/invitation',
  '/api/invitation/accept'
])

// Onboarding routes (authenticated users only)
const isOnboardingRoute = createRouteMatcher([
  '/onboarding',
  '/api/couples',
  '/api/user/initialize',
  '/api/user/onboarding-status'
])
```

### Authentication Decision Tree

```typescript
export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const pathname = request.nextUrl.pathname
  
  // === UNAUTHENTICATED USER HANDLING ===
  if (!userId) {
    // Allow access to public routes only
    if (isPublicRoute(request)) {
      return NextResponse.next()
    }
    
    // All other routes require authentication
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // === AUTHENTICATED USER HANDLING ===
  // At this point, we know the user is signed in

  // Special handling for sign-in/sign-up pages - redirect to appropriate location
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    const cookies = request.cookies
    const hasCompletedOnboarding = cookies.get('onboarding_completed')?.value === 'true'
    
    if (hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Handle root path for authenticated users
  if (pathname === '/') {
    const cookies = request.cookies
    const hasCompletedOnboarding = cookies.get('onboarding_completed')?.value === 'true'
    
    if (hasCompletedOnboarding) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Allow access to onboarding routes for authenticated users
  if (isOnboardingRoute(request)) {
    // Let the onboarding page/API handle whether to redirect if already completed
    return NextResponse.next()
  }

  // === PROTECTED ROUTES (Dashboard & APIs) ===
  // These require both authentication AND completed onboarding
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') ||
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
    const hasCompletedOnboarding = cookies.get('onboarding_completed')?.value === 'true'

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
  return NextResponse.next()
})
```

## Onboarding Process

### Server-Side Protection
The onboarding page now includes server-side authentication checks:

```typescript
// app/onboarding/page.tsx (Server Component)
export default async function OnboardingPage() {
  const { userId } = await auth()
  
  // Ensure user is authenticated
  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user already completed onboarding
  try {
    const { couple } = await getCurrentUserCouple()
    
    if (couple.onboarding_completed) {
      // User has already completed onboarding
      redirect('/dashboard')
    }
  } catch (error) {
    // User doesn't have a couple record yet, continue to onboarding
  }

  // Render the client-side onboarding flow
  return <OnboardingClient />
}
```

### Data Collection
During onboarding, users provide:
1. **Personal Information**: Bride and groom names
2. **Wedding Details**: Date, venue, theme preferences
3. **Initial Setup**: Budget, guest count estimates
4. **Preferences**: Language, notification settings

### Database Schema Updates
```sql
-- User record creation/linking
INSERT INTO users (clerk_user_id, first_name, last_name, email)
VALUES (?, ?, ?, ?)

-- Couple profile creation  
INSERT INTO couples (
  user_id, partner1_name, partner2_name, 
  wedding_date, venue_name, total_budget,
  onboarding_completed
) VALUES (?, ?, ?, ?, ?, ?, true)
```

### Completion Verification
```typescript
// Check onboarding completion
const couple = await prisma.couple.findFirst({
  where: { 
    user_id: user.id,
    onboarding_completed: true 
  }
})

if (couple) {
  // Set completion cookie
  response.cookies.set('onboarding_completed', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
}
```

## Cookie Management System

### Onboarding Completion Cookie
**Purpose**: Optimize routing decisions without database queries
**Lifetime**: 30 days
**Security**: HTTP-only, secure in production, SameSite protection

### Cookie Validation API
**Endpoint**: `/api/fix-cookie`
**Purpose**: Detect and repair missing onboarding cookies

```typescript
export async function GET() {
  const { userId } = await auth()
  
  // Verify database onboarding status
  const couple = await prisma.couple.findFirst({
    where: { user_id: user.id },
    select: { onboarding_completed: true }
  })

  if (couple?.onboarding_completed) {
    // Set missing cookie
    response.cookies.set('onboarding_completed', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    })
  }
}
```

## Dashboard Access Control

### Protection Strategy
1. **Middleware Check**: Verify authentication and onboarding status
2. **Cookie Validation**: Fast routing decisions using completion cookie
3. **Database Fallback**: Verify onboarding if cookie missing
4. **Graceful Redirects**: Send incomplete users to onboarding

### Personalization Data Flow
```typescript
// Dashboard stats API
export async function GET() {
  const { userId } = await auth()
  
  // Get user and couple data
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId }
  })
  
  const couple = await prisma.couple.findFirst({
    where: { user_id: user.id },
    include: { guests: true, vendors: true }
  })

  // Extract personalization info
  const userInfo = {
    firstName: couple.partner1_name?.split(' ')[0] || 'Bride',
    lastName: couple.partner1_name?.split(' ').slice(1).join(' ') || '',
    partnerName: couple.partner2_name || ''
  }

  return { success: true, data: { userInfo, ...stats } }
}
```

## Security Considerations

### Session Protection
- Clerk handles secure session tokens
- Automatic session refresh and validation
- Protection against session hijacking

### Route Security
- Middleware enforces authentication on all protected routes
- Onboarding verification prevents premature dashboard access
- API endpoints validate user context

### Data Privacy
- Personal information encrypted at rest
- Wedding details accessible only to authenticated user
- No sensitive data in client-side logs

## Error Handling

### Common Scenarios

**Session Expired**:
- Automatic redirect to sign-in page
- Preserve intended destination for post-auth redirect
- Clear any stale onboarding cookies

**Incomplete Onboarding**:
- Redirect to onboarding flow
- Preserve partially completed data
- Allow resumption of onboarding process

**Database Connectivity Issues**:
- Graceful degradation with cached data
- User-friendly error messages
- Automatic retry mechanisms

### Debug Endpoints

**Development Only**:
- `/api/debug-onboarding` - Check user onboarding status
- `/api/test-connection` - Verify database connectivity
- `/api/user/permissions` - Validate user access levels

### Auth Status API

**Endpoint**: `/api/auth/status`
**Purpose**: Provides comprehensive authentication state information

```typescript
// Response format
{
  "authenticated": true/false,
  "userId": "user_xxx",
  "hasCouple": true/false,
  "onboardingCompleted": true/false,
  "coupleId": "couple_xxx"
}
```

This endpoint can be used by frontend components to determine:
- Whether the user is signed in
- Whether they have a couple profile
- Whether they've completed onboarding
- Their couple ID for data fetching

## Performance Optimization

### Caching Strategy
- Onboarding completion cookie eliminates database queries
- Dashboard stats cached with appropriate TTL
- User session data cached in memory

### Database Queries
- Efficient joins for user-couple relationships
- Selective field loading for API responses
- Indexed queries on frequently accessed fields

### Route Optimization
- Middleware performs minimal database queries
- Cookie-based decisions for common flows
- Lazy loading of non-essential data

## Testing Strategy

### Unit Tests
- Middleware routing logic
- Cookie validation functions
- API endpoint authentication

### Integration Tests
- Complete user flow from sign-up to dashboard
- Onboarding completion verification
- Cross-browser cookie handling

### E2E Tests
- New user registration and onboarding
- Returning user sign-in flow
- Dashboard personalization display

---

## Flow Summary

The authentication system successfully provides:

✅ **Clear separation** between sign-in and sign-up flows  
✅ **Comprehensive onboarding** protection and verification  
✅ **Efficient routing** with cookie-based optimization  
✅ **Secure session** management with Clerk integration  
✅ **Personalized experience** using onboarding data  
✅ **Graceful error handling** and recovery mechanisms  

This creates a smooth, secure user experience that guides users from authentication through onboarding to a fully personalized wedding planning dashboard.