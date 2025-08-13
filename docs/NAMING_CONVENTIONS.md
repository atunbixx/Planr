# Naming Convention Standards

This document establishes the naming convention standards for the Wedding Planner v2 application to ensure consistency across database, TypeScript code, and API endpoints.

## Overview

The application uses **camelCase** for all TypeScript/JavaScript code while the database maintains **snake_case** field names. Prisma automatically handles the mapping between these conventions.

## Core Principles

1. **TypeScript/JavaScript Code**: Always use **camelCase**
2. **Database Schema**: Uses **snake_case** (managed by Prisma)
3. **API Requests/Responses**: Use **camelCase** for consistency with frontend
4. **No Manual Transformations**: Let Prisma handle database ↔ code mapping automatically

## Field Naming Standards

### Database (Prisma Schema)
```prisma
// Database fields use snake_case
model User {
  id              String   @id @default(cuid())
  supabase_user_id String  @unique @map("supabase_user_id")  
  first_name      String?  @map("first_name")
  last_name       String?  @map("last_name")
  email           String   @unique
  created_at      DateTime @default(now()) @map("created_at")
  updated_at      DateTime @updatedAt @map("updated_at")
  
  @@map("users")
}
```

### TypeScript Code (Repositories, Services, Components)
```typescript
// Always use camelCase in code
interface User {
  id: string
  supabaseUserId: string
  firstName?: string
  lastName?: string  
  email: string
  createdAt: Date
  updatedAt: Date
}

// Repository methods use camelCase
class UserRepository {
  async findBySupabaseUserId(supabaseUserId: string): Promise<User | null> {
    return prisma.user.findUnique({ 
      where: { supabaseUserId }  // Prisma handles camelCase → snake_case
    })
  }
}
```

### API Endpoints
```typescript
// API requests and responses use camelCase
export async function POST(request: NextRequest) {
  const { firstName, lastName, supabaseUserId } = await request.json()
  
  const user = await userRepository.create({
    firstName,        // camelCase in code
    lastName,         // camelCase in code  
    supabaseUserId    // camelCase in code
  })
  
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      firstName: user.firstName,    // camelCase in response
      lastName: user.lastName,      // camelCase in response
      supabaseUserId: user.supabaseUserId
    }
  })
}
```

## Repository Pattern Standards

### Consistent Field Access
```typescript
// ✅ CORRECT: Use camelCase consistently
const userData = {
  coupleId: coupleId,
  albumId: albumId || null,
  firstName: user.firstName,
  lastName: user.lastName,
  supabaseUserId: user.supabaseUserId
}

// ❌ WRONG: Mixed naming conventions
const userData = {
  couple_id: coupleId,        // snake_case mixed with camelCase
  albumId: albumId || null,
  first_name: user.firstName  // Inconsistent naming
}
```

### Direct Repository Usage
```typescript
// ✅ CORRECT: Use repositories directly without transformation
export async function getCurrentUserCouple() {
  const userData = await prisma.user.findUnique({
    where: { supabaseUserId: user.id }  // camelCase field name
  })
  
  const coupleData = await coupleRepository.findByUserId(userData.id)
  
  return {
    user: userData,
    couple: coupleData ? {
      id: coupleData.id,
      partner1Name: coupleData.partner1Name,  // Direct camelCase usage
      partner2Name: coupleData.partner2Name,
      weddingDate: coupleData.weddingDate
    } : null
  }
}

// ❌ WRONG: Manual field transformations
export async function getCurrentUserCouple() {
  const userData = await prisma.user.findUnique({
    where: { supabase_user_id: user.id }  // snake_case in code
  })
  
  const coupleData = await coupleRepository.findByUserId(userData.id)
  
  // Unnecessary transformation layer
  const transformedCouple = coupleData ? {
    partner1_name: coupleData.partner1Name,  // Converting camelCase to snake_case
    partner2_name: coupleData.partner2Name,
    wedding_date: coupleData.weddingDate
  } : null
  
  return { user: userData, couple: transformedCouple }
}
```

## Common Patterns

### Model Relationships
```typescript
// ✅ CORRECT: Consistent camelCase in relationships
const photoData = {
  coupleId: coupleId,
  albumId: albumId || null,
  cloudinaryPublicId: cloudResult.public_id,
  cloudinaryUrl: cloudResult.url,
  originalFilename: file.name,
  photoDate: photoDate ? new Date(photoDate) : null
}

await photoRepository.create(photoData)
```

### Query Parameters
```typescript
// ✅ CORRECT: camelCase for internal processing
const queryParams = {
  coupleId: coupleId,
  page: offset / limit + 1,
  pageSize: limit
}

if (albumId && albumId !== 'all') {
  queryParams.albumId = albumId  // camelCase consistently
}
```

### Error Prevention
```typescript
// ✅ CORRECT: Avoid variable name conflicts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const albumId = searchParams.get('albumId')
  
  // Use different variable name to avoid conflict
  const queryParams = {  // Not 'searchParams'
    coupleId: coupleId,
    albumId: albumId
  }
}

// ❌ WRONG: Variable name conflicts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const albumId = searchParams.get('albumId')
  
  // ERROR: 'searchParams' already declared
  const searchParams = {
    coupleId: coupleId,
    albumId: albumId
  }
}
```

## Migration Guide

When adding new features or modifying existing code:

1. **Check existing patterns** in similar files
2. **Use camelCase** for all TypeScript/JavaScript variables and fields
3. **Let Prisma handle mapping** - don't add manual transformations
4. **Test field access** to ensure no snake_case leaks into code
5. **Validate API responses** use camelCase for frontend consistency

## Validation Checklist

Before committing changes:

- [ ] All TypeScript variables use camelCase
- [ ] No snake_case field names in TypeScript code
- [ ] Repository methods use camelCase parameters
- [ ] API responses return camelCase field names
- [ ] No manual field transformations (let Prisma handle it)
- [ ] Variable names don't conflict (use descriptive names)
- [ ] Build passes without TypeScript errors

## Examples of Fixed Issues

### Issue: Mixed Field Naming in db.ts
```typescript
// Before (WRONG): Mixed naming conventions
const coupleData = fullCoupleData ? {
  partner1_name: fullCoupleData.partner1Name,  // snake_case ← camelCase
  partner2_name: fullCoupleData.partner2Name,
  wedding_date: fullCoupleData.weddingDate
} : null

// After (CORRECT): Consistent camelCase
const coupleData = fullCoupleData ? {
  partner1Name: fullCoupleData.partner1Name,   // camelCase consistently
  partner2Name: fullCoupleData.partner2Name,
  weddingDate: fullCoupleData.weddingDate
} : null
```

### Issue: Variable Name Conflicts
```typescript
// Before (WRONG): Variable conflict
const searchParams = new URL(request.url).searchParams
const searchParams = { coupleId: coupleId }  // ERROR: Already declared

// After (CORRECT): Different variable names  
const searchParams = new URL(request.url).searchParams
const queryParams = { coupleId: coupleId }   // No conflict
```

### Issue: Snake_case in Repository Queries
```typescript
// Before (WRONG): snake_case in code
const userData = await prisma.user.findUnique({
  where: { supabase_user_id: user.id }  // snake_case
})

// After (CORRECT): camelCase in code
const userData = await prisma.user.findUnique({
  where: { supabaseUserId: user.id }    // camelCase (Prisma maps to snake_case)
})
```

## Contact

For questions about naming conventions or to report inconsistencies, please refer to this document and ensure all new code follows these standards.