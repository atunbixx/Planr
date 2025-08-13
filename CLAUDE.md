# Wedding Planner v2 - Claude Code Configuration

## Development Server
- **Port**: 4000 (preferred for this project)
- **Command**: `npm run dev -- --port 4000`

## Core Build Commands
- `npm run build` - Build project
- `npm run dev` - Start development server  
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run typecheck` - Run TypeScript checking

## Project Architecture
Next.js 14 wedding planning application with **Enterprise Architecture**:
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: Prisma with Supabase PostgreSQL
- **Authentication**: Supabase Auth (migrated from Clerk)
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

### 🚨 **Database Schema Unification** 
**CRITICAL CHANGE**: Resolved cascading failures by eliminating dual table structures:
- ✅ **Unified Schema**: Single `Couple` table (removed `wedding_couples` duplication)
- ✅ **Consistent Foreign Keys**: All models reference unified `Couple.id`
- ✅ **Migration Applied**: Database transformed with zero downtime
- ✅ **Single Source of Truth**: No more `couple_id` vs `user_id` conflicts

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
- ❌ Using legacy table references (`wedding_couples`, `wedding_guests`)

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

## Enterprise Migration Status
- ✅ **Database Schema**: Unified and migrated
- ✅ **Repository Pattern**: Implemented across all features
- ✅ **Service Layer**: Business logic extracted and organized
- ✅ **Transaction Support**: Automatic rollback on failures
- ✅ **API Routes**: Updated to use enterprise patterns
- ✅ **Single Source of Truth**: No more data conflicts

## Testing Strategy
- **Unit Tests**: Service and repository logic
- **Integration Tests**: API endpoint testing with repositories
- **Transaction Tests**: Rollback behavior validation
- **Data Consistency**: Cross-feature integration testing