# Couples Route Migration Guide

## Overview
This guide shows how the couples API route was refactored to use the new patterns, eliminating code duplication and improving maintainability.

## Key Changes

### 1. Authentication Middleware
**Before:**
```typescript
// No authentication - manually checking clerk_user_id
const clerk_user_id = searchParams.get('clerk_user_id')
if (!clerk_user_id) {
  return NextResponse.json({ error: 'clerk_user_id is required' }, { status: 400 })
}
```

**After:**
```typescript
// Using withAuth HOF for protected routes
export const GET = withAuth(async (request, context) => {
  // context.user and context.couple are automatically available
  return successResponse({ data: context.couple })
})
```

### 2. Database Operations
**Before:**
```typescript
// Direct Supabase client usage with manual error handling
const { data: userData, error: userError } = await supabase
  .from('users')
  .select(`
    id,
    clerk_user_id,
    email,
    first_name,
    last_name,
    couples (*)
  `)
  .eq('clerk_user_id', clerk_user_id)
  .single()

if (userError) {
  console.error('Error fetching user data:', userError)
  return NextResponse.json({ error: 'User not found' }, { status: 404 })
}
```

**After:**
```typescript
// Using service layer with built-in error handling
const couple = await coupleService.getCoupleByClerkId(clerkUserId)
// Errors are automatically handled by the service and middleware
```

### 3. Error Handling
**Before:**
```typescript
// Manual error responses scattered throughout
if (!user) {
  return NextResponse.json({ error: 'User not found' }, { status: 404 })
}
// Inconsistent error format
return NextResponse.json(
  { error: 'Failed to create user', details: createError?.message },
  { status: 500 }
)
```

**After:**
```typescript
// Centralized error handling
try {
  const couple = await coupleService.upsertCoupleFromOnboarding(body)
  return successResponse({ data: couple })
} catch (error) {
  // Service throws appropriate exceptions (BadRequestException, etc.)
  // Global error handler formats them consistently
  throw error
}
```

### 4. Business Logic
**Before:**
```typescript
// Business logic mixed with route handler
const coupleData = {
  user_id: userId,
  partner1_name,
  partner2_name: partner2_name || null,
  wedding_style: wedding_style || null,
  // ... manual field mapping
}

let coupleResult
if (existingCouple) {
  // Update logic
} else {
  // Create logic
}
```

**After:**
```typescript
// Clean separation - all logic in service layer
const couple = await coupleService.upsertCoupleFromOnboarding(body)
// Service handles all validation, upsert logic, and field mapping
```

## Benefits

1. **Code Reduction**: ~200 lines → ~60 lines (70% reduction)
2. **Consistency**: All routes follow the same pattern
3. **Type Safety**: Full TypeScript support with proper types
4. **Error Handling**: Centralized and consistent
5. **Testing**: Easier to test service layer separately
6. **Reusability**: Service methods can be used elsewhere

## Migration Steps

1. Create the CoupleService with all business logic
2. Add authentication middleware using withAuth
3. Replace direct database calls with service calls
4. Remove manual error handling
5. Test the new route alongside the old one
6. Switch over once verified
7. Remove the old route

## Additional Features Added

1. **Statistics Endpoint**: New endpoint for couple dashboard stats
2. **Better Validation**: Service layer validates all inputs
3. **Consistent Response Format**: All responses use ApiResponse type
4. **Automatic User Context**: No need to manually fetch user/couple