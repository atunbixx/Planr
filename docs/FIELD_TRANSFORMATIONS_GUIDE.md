# Field Transformations Guide

## Quick Start

### For Database Operations
```typescript
// ✅ Use the transformed Supabase client
import { getAdminClient } from '@/lib/supabase-admin-transformed'

const supabase = getAdminClient()

// Now use camelCase field names!
const { data } = await supabase
  .from('wedding_couples')
  .select('*')
  .eq('partner1UserId', userId)  // camelCase ✅
  .eq('weddingDate', date)       // camelCase ✅
```

### For Services (Prisma)
```typescript
// ✅ Prisma handles field mapping automatically
import { prisma } from '@/lib/prisma'

const couple = await prisma.wedding_couples.findFirst({
  where: { partner1_user_id: userId }  // snake_case with Prisma ✅
})

// Result object uses camelCase in TypeScript
console.log(couple.weddingDate)  // camelCase ✅
```

## Common Patterns

### API Handler Pattern
```typescript
import { getAdminClient } from '@/lib/supabase-admin-transformed'

export async function GET() {
  const supabase = getAdminClient()
  
  const { data } = await supabase
    .from('table_name')
    .select('*')
    .eq('someField', value)  // Use camelCase
  
  // Data is automatically transformed to camelCase
  return NextResponse.json({ data })
}
```

### Authentication Pattern
```typescript
// ✅ Always use getCoupleBySupabaseId for auth context
const coupleData = await coupleService.getCoupleBySupabaseId(authContext.userId)
if (!coupleData) {
  return errorResponse('COUPLE_NOT_FOUND', 'No couple found', 404)
}
const couple = coupleData
```

## Field Name Reference

| Database (snake_case) | Application (camelCase) |
|----------------------|------------------------|
| `partner1_user_id` | `partner1UserId` |
| `partner2_user_id` | `partner2UserId` |
| `supabase_user_id` | `supabaseUserId` |
| `wedding_date` | `weddingDate` |
| `total_budget` | `totalBudget` |
| `venue_name` | `venueName` |
| `guest_count_estimate` | `guestCountEstimate` |
| `created_at` | `createdAt` |
| `updated_at` | `updatedAt` |

## Health Check

Test transformations are working:
```bash
curl http://localhost:4000/api/health/transformations
```

## Troubleshooting

### "Unknown field" error
❌ Problem: Using snake_case with transformed client
```typescript
// Wrong
await supabase.from('table').eq('field_name', value)
```

✅ Solution: Use camelCase
```typescript
// Correct  
await supabase.from('table').eq('fieldName', value)
```

### Type errors
❌ Problem: Accessing snake_case fields on results
```typescript
// Wrong
console.log(result.wedding_date)
```

✅ Solution: Use camelCase
```typescript
// Correct
console.log(result.weddingDate)
```

### 404 Errors in API
❌ Problem: Using `getCoupleByUserId()` with Supabase user ID
```typescript
// Wrong
const couple = await service.getCoupleByUserId(authContext.userId)
```

✅ Solution: Use `getCoupleBySupabaseId()`
```typescript
// Correct
const couple = await service.getCoupleBySupabaseId(authContext.userId)
```

## Best Practices

1. **Always use camelCase** in TypeScript/JavaScript code
2. **Import the transformed client** instead of creating Supabase clients directly
3. **Use Prisma for complex queries** - it handles field mapping automatically
4. **Use getCoupleBySupabaseId()** for authentication contexts
5. **Reference FIELD_MAPPINGS** when in doubt about field names

## Migration Checklist

When updating existing code:
- [ ] Replace `getSupabaseAdmin()` with `getAdminClient()`
- [ ] Update all field references to camelCase
- [ ] Change `getCoupleByUserId()` to `getCoupleBySupabaseId()`
- [ ] Remove any manual field mapping code
- [ ] Test the endpoint thoroughly

## Performance

The transformation system adds minimal overhead:
- ~1-2ms per query for field transformation
- Singleton client for connection reuse
- Proxy-based implementation for efficiency
- No impact on Prisma operations