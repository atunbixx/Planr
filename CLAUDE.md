# Wedding Planner MVP - Claude Code Configuration

## Development Server
- **Port**: 3000 (default)
- **Command**: `npm run dev`

## Core Build Commands
- `npm run build` - Build project
- `npm run dev` - Start development server  
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run typecheck` - Run TypeScript checking

## Project Architecture
Next.js 14 wedding planning application with **Enterprise Architecture**:
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: Prisma with Supabase PostgreSQL (custom schema: `my_new_schema`)
- **Authentication**: NextAuth.js with JWT tokens
- **UI Components**: shadcn/ui
- **Testing**: Jest, Playwright
- **Architecture Pattern**: Feature-Modular Monolith with Repository Pattern

## Enterprise Architecture Overview
The application follows enterprise-level patterns with proper separation of concerns:

### 🏗️ **Feature-Modular Structure**
```
src/features/
├── guests/
│   ├── repo/           # Data access layer
│   ├── service/        # Business logic layer
│   ├── api/           # API handlers
│   └── dto/           # Data transfer objects
├── vendors/
├── budget/
├── photos/
└── ...
```

### 🗄️ **Repository Pattern Implementation**
- **Base Repository**: `src/lib/repositories/BaseRepository.ts`
- **Feature Repositories**: `src/features/*/repo/*.repository.ts`
- **Transaction Support**: Automatic rollback on errors
- **Single Source of Truth**: Eliminates direct Prisma queries in business logic

### 🔄 **Service Layer Architecture**
- **Business Logic Isolation**: All domain logic in service classes
- **Transaction Management**: Automatic transaction boundaries
- **Validation**: Zod schemas for input/output validation
- **Error Handling**: Structured error responses with proper HTTP codes

## Critical Schema Conventions

### 🚨 **Database Schema Rules** 
**CRITICAL**: Always use the correct field names from the actual Prisma schema:
- ✅ **Guest Model**: Use `userId` field (NOT `coupleId`)
- ✅ **All Models**: Reference User via `userId` field
- ✅ **Single Schema**: All models use consistent field naming

### 📋 **Current Schema Fields**
```typescript
// Guest Model - ACTUAL fields only
model Guest {
  id                  String    @id @default(uuid()) @db.Uuid
  userId              String    @db.Uuid           // ← Use THIS field
  name                String                       // ← Single name field
  rsvpStatus          RsvpStatus @default(pending)
  mealPreference      String?
  side                Side?
  invitationSent      Boolean   @default(false)
  plusOne             Boolean   @default(false)    // ← New: plus-one support
  householdId         String?   @db.Uuid          // ← New: household grouping
  tags                String[]  @default([])     // ← New: guest categorization
  relationshipCategory String?                    // ← New: relationship type
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

## Development Guidelines

### 🎯 **Mandatory Patterns**
- **Repository Pattern**: Use repositories for ALL data access
- **Feature Modules**: Organize code by business domain
- **Service Layer**: Business logic in service classes only
- **Transaction Boundaries**: Use `withTransaction` for multi-step operations
- **Input Validation**: Zod schemas for all API inputs

### 🚫 **Deprecated Patterns** 
- ❌ Direct Prisma queries in API routes
- ❌ Business logic in API handlers  
- ❌ Mixing data access with business logic
- ❌ Using non-existent fields (`coupleId`, `firstName`, `lastName`)

### ✅ **Modern Implementation**
```typescript
// ✅ Correct: Use services and repositories
const guestService = new GuestService()
const result = await guestService.createGuest(validatedData)

// ❌ Incorrect: Direct Prisma in API routes
const guest = await prisma.guest.create({ data: ... })
```

## Important Files & Directories

### 🏗️ **Core Architecture**
- `src/features/` - Feature-modular organization
- `src/lib/repositories/BaseRepository.ts` - Base repository with transactions
- `prisma/schema.prisma` - **UNIFIED** database schema
- `prisma/migrations/` - Database transformation history

### 📊 **Data Layer**
- `src/features/*/repo/` - Repository implementations
- `src/features/*/service/` - Business logic services
- `src/features/*/dto/` - Input/output validation schemas

### 🌐 **API Layer**
- `src/features/*/api/` - Feature-specific API handlers
- `src/app/api/` - Next.js API routes (delegates to handlers)

### 🎨 **UI Layer**
- `src/app/` - Next.js app router pages
- `src/components/` - Reusable React components

## Supabase Configuration
The project is now fully configured with Supabase PostgreSQL using a custom schema:

### 🗄️ **Database Setup**
- **Schema**: `my_new_schema` (custom schema, not default `postgres`)
- **Connection**: Configured via `.env` with Prisma
- **Migration**: All migrations applied to custom schema

### 🔑 **Environment Variables**
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=my_new_schema"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=my_new_schema"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
```

## Enterprise Migration Status
- ✅ **Database Schema**: Unified and migrated with guest enhancements
- ✅ **Repository Pattern**: Implemented across all features
- ✅ **Service Layer**: Business logic extracted and organized
- ✅ **Transaction Support**: Automatic rollback on failures
- ✅ **API Routes**: Updated to use enterprise patterns
- ✅ **Schema Compliance**: Repository fixed to use correct field names
- ✅ **Supabase Integration**: Custom schema configured and working
- ✅ **Guest Enhancements**: Plus-one, household, tags, and relationship categories added

## Testing Strategy
- **Unit Tests**: Service and repository logic
- **Integration Tests**: API endpoint testing with repositories
- **Transaction Tests**: Rollback behavior validation
- **Data Consistency**: Cross-feature integration testing