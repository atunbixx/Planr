# Field Name Mismatch Solution

## The Problem

We've been experiencing persistent snake_case vs camelCase field name mismatches because:

1. **Database uses snake_case**: `partner1_user_id`, `total_budget`, `wedding_date`
2. **Prisma schema uses @map decorators**: Maps camelCase to snake_case
3. **Direct Supabase queries return snake_case**: Bypasses Prisma's mapping
4. **Mixed usage throughout codebase**: Some code expects camelCase, some expects snake_case

## The Solution

We've created a comprehensive field mapping system in `/src/lib/db/field-mappings.ts` that provides:

### 1. Automatic Field Transformation

```typescript
import { transformToCamelCase, transformToSnakeCase } from '@/lib/db/field-mappings'

// When receiving data from Supabase
const rawData = await supabase.from('wedding_couples').select('*')
const camelCaseData = transformToCamelCase(rawData.data)

// When sending data to Supabase
const dataToSave = { weddingDate: '2024-06-15', totalBudget: 50000 }
const snakeCaseData = transformToSnakeCase(dataToSave)
```

### 2. Transforming Supabase Client

```typescript
import { createTransformingSupabaseClient } from '@/lib/db/field-mappings'

// Wrap your Supabase client
const supabase = createTransformingSupabaseClient(originalSupabaseClient)

// Now it automatically handles field transformations
const { data } = await supabase
  .from('wedding_couples')
  .select('*')
  .eq('partner1UserId', userId) // Use camelCase!

// data will have camelCase fields: { weddingDate, totalBudget, partner1Name }
```

### 3. API Handler Middleware

```typescript
import { withFieldTransformation } from '@/lib/db/field-mappings'

// Wrap your API handlers
export const GET = withFieldTransformation(async (req) => {
  // Your handler logic here
  // Request body will be auto-converted to snake_case
  // Response will be auto-converted to camelCase
})
```

## Implementation Steps

### Step 1: Update All Supabase Clients

Replace direct Supabase usage with the transforming client:

```typescript
// Before
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)

// After
import { createClient } from '@supabase/supabase-js'
import { createTransformingSupabaseClient } from '@/lib/db/field-mappings'

const supabaseRaw = createClient(url, key)
const supabase = createTransformingSupabaseClient(supabaseRaw)
```

### Step 2: Use Prisma for Complex Queries

For complex queries with relations, prefer Prisma over Supabase:

```typescript
// Good - Prisma handles field mapping automatically
const couple = await prisma.wedding_couples.findFirst({
  where: {
    OR: [
      { partner1_user_id: userId },
      { partner2_user_id: userId }
    ]
  }
})

// Returns: { partner1UserId, weddingDate, totalBudget } ✅
```

### Step 3: Transform Legacy Data

For existing code that expects specific field names:

```typescript
import { transformToCamelCase } from '@/lib/db/field-mappings'

// Legacy code expecting snake_case
const legacyData = { wedding_date: '2024-06-15' }

// Transform it
const modernData = transformToCamelCase(legacyData)
// Result: { weddingDate: '2024-06-15' }
```

## Best Practices

1. **Always use camelCase in your TypeScript code**
2. **Let the transformation utilities handle snake_case conversion**
3. **Prefer Prisma for database operations when possible**
4. **Use the transforming Supabase client for direct queries**
5. **Document any exceptions clearly**

## Common Patterns

### Pattern 1: API Handler

```typescript
export async function POST(request: Request) {
  const body = await request.json() // { weddingDate, totalBudget }
  
  // Transform to snake_case for database
  const dbData = transformToSnakeCase(body)
  
  // Insert into database
  const result = await supabase
    .from('wedding_couples')
    .insert(dbData)
  
  // Transform result back to camelCase
  return Response.json(transformToCamelCase(result))
}
```

### Pattern 2: Service Class

```typescript
class CoupleService {
  async getCoupleByUserId(userId: string) {
    // Use Prisma - it handles field mapping
    return await prisma.wedding_couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: userId },
          { partner2_user_id: userId }
        ]
      }
    })
  }
}
```

### Pattern 3: Frontend Data Fetching

```typescript
// Frontend always uses camelCase
const response = await fetch('/api/couples')
const data = await response.json()

// data already has camelCase fields
console.log(data.weddingDate, data.totalBudget)
```

## Migration Checklist

- [ ] Update all Supabase client imports to use transforming client
- [ ] Review all API handlers and add transformation where needed
- [ ] Update service classes to use consistent field names
- [ ] Test all CRUD operations
- [ ] Update TypeScript interfaces to use camelCase
- [ ] Remove manual field mapping code

## Debugging

If you encounter field name errors:

1. Check if the code is using Prisma or Supabase directly
2. Verify the transformation is being applied
3. Console.log the data structure to see field names
4. Use the field mappings constants for reference

```typescript
import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'

// Reference the correct field names
const userIdField = FIELD_MAPPINGS.couple.userId // 'userId'
const dbField = FIELD_MAPPINGS.couple.partner1UserId // 'partner1_user_id'
```