# Vendors Route Migration Guide

## Overview
This guide demonstrates the refactoring of the vendors API routes, showing the dramatic reduction in code duplication and improved maintainability.

## Key Improvements

### 1. Eliminated Authentication Boilerplate
**Before (repeated in EVERY route):**
```typescript
const { userId } = await auth()
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const dbUser = await prisma.user.findUnique({
  where: { clerkId: userId }
})

if (!dbUser) {
  return NextResponse.json({ error: 'User not found' }, { status: 404 })
}

const couple = await prisma.couple.findFirst({
  where: { userId: dbUser.id }
})

if (!couple) {
  return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
}
```

**After:**
```typescript
export const GET = withAuth(async (request, context) => {
  // context.couple is automatically available
  const result = await vendorService.getVendorsByCouple(context.couple.id)
  return successResponse({ data: result })
})
```

### 2. Service Layer for Business Logic
**Before:**
```typescript
// Business logic mixed in route
const vendors = await prisma.vendor.findMany({
  where: { coupleId: couple.id },
  orderBy: [{ category: 'asc' }, { businessName: 'asc' }]
})

const stats = {
  total: vendors.length,
  potential: vendors.filter(v => v.status === 'potential').length,
  // ... manual calculations
}

const costs = {
  estimated: vendors.reduce((sum, v) => sum + Number(v.estimatedCost || 0), 0),
  actual: vendors.reduce((sum, v) => sum + Number(v.actualCost || 0), 0)
}
```

**After:**
```typescript
// Clean service call that handles all logic
const result = await vendorService.getVendorsByCouple(context.couple.id)
// result includes vendors, stats, and costs
```

### 3. Consistent Error Handling
**Before:**
```typescript
try {
  // ... code
} catch (error) {
  console.error('Error fetching vendors:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

**After:**
```typescript
// Errors are automatically caught and formatted by middleware
const vendor = await vendorService.updateVendor(vendorId, context.couple.id, body)
// Service throws appropriate exceptions
```

### 4. Type Safety
**Before:**
```typescript
// No type safety for responses
return NextResponse.json({ vendors, stats, costs })
```

**After:**
```typescript
// Full type safety with ApiResponse<T>
export const GET = withAuth<any, VendorWithRelations[]>(async (request, context) => {
  // TypeScript knows the response shape
})
```

## Routes Comparison

### GET /api/vendors
- **Before:** 73 lines with auth checks, manual stats calculation
- **After:** 25 lines, clean and focused

### POST /api/vendors
- **Before:** 60 lines with repeated auth and manual data conversion
- **After:** 12 lines, validation in service

### PATCH /api/vendors/[id]
- **Before:** 99 lines with Supabase client, manual ownership checks
- **After:** 20 lines, clean update with automatic validation

### DELETE /api/vendors/[id]
- **Before:** 56 lines with manual cascade handling
- **After:** 15 lines, service handles cascading

## Code Reduction Summary
- **Total lines before:** ~288 lines across vendor routes
- **Total lines after:** ~72 lines (75% reduction)
- **Eliminated duplicated auth code:** 40+ lines per route

## Additional Features Added

1. **Search Functionality**: Query parameters for filtering
2. **Bulk Operations**: Service supports bulk updates
3. **Better Validation**: All inputs validated in service layer
4. **Relationship Loading**: Automatic expense inclusion
5. **Consistent Response Format**: All use ApiResponse type

## Migration Steps

1. ✅ Create VendorService with all business logic
2. ✅ Create refactored routes using withAuth
3. ⏳ Test new routes alongside old ones
4. ⏳ Update frontend to use new routes
5. ⏳ Remove old routes
6. ⏳ Update other related routes (categories, migrate)

## Testing Checklist

- [ ] GET /api/vendors returns all vendors with stats
- [ ] GET /api/vendors?search=term filters vendors
- [ ] GET /api/vendors?category=Venue filters by category
- [ ] GET /api/vendors?status=booked filters by status
- [ ] POST /api/vendors creates new vendor
- [ ] GET /api/vendors/[id] returns vendor details
- [ ] PATCH /api/vendors/[id] updates vendor
- [ ] DELETE /api/vendors/[id] deletes vendor
- [ ] All routes return consistent error format
- [ ] Authentication works correctly