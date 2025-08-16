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

## 📝 **Canonical Naming Scheme**

**CRITICAL RULE**: Use Prisma field names (camelCase) in ALL TypeScript code. Database field names (snake_case) are ONLY used in migrations and Prisma schema.

### ✅ **Correct Field Names** (Use These in Code)
```typescript
// User model fields
user.supabaseUserId  // ✅ Correct: camelCase from Prisma client
user.firstName       // ✅ Correct: camelCase from Prisma client
user.lastName        // ✅ Correct: camelCase from Prisma client
user.createdAt       // ✅ Correct: camelCase from Prisma client
user.updatedAt       // ✅ Correct: camelCase from Prisma client

// Couple model fields  
couple.userId        // ✅ Correct: camelCase from Prisma client
couple.partnerName   // ✅ Correct: camelCase from Prisma client
couple.weddingDate   // ✅ Correct: camelCase from Prisma client
couple.createdAt     // ✅ Correct: camelCase from Prisma client
couple.updatedAt     // ✅ Correct: camelCase from Prisma client

// All other models follow same pattern
guest.coupleId       // ✅ Correct: camelCase
vendor.contactEmail  // ✅ Correct: camelCase
photo.uploadedAt     // ✅ Correct: camelCase
```

### ❌ **Deprecated Field Names** (DO NOT USE)
```typescript
// These cause "Unknown argument" Prisma errors
user.supabase_user_id  // ❌ Wrong: snake_case database field
user.first_name        // ❌ Wrong: snake_case database field
user.last_name         // ❌ Wrong: snake_case database field
user.created_at        // ❌ Wrong: snake_case database field
couple.user_id         // ❌ Wrong: snake_case database field
couple.wedding_date    // ❌ Wrong: snake_case database field
```

### 🔧 **Field Mapping in Prisma Schema**
```prisma
model User {
  id           String @id @default(cuid())
  supabaseUserId String @unique @map("supabase_user_id")  // ← @map handles DB mapping
  firstName    String? @map("first_name")                 // ← @map handles DB mapping
  lastName     String? @map("last_name")                  // ← @map handles DB mapping
  createdAt    DateTime @default(now()) @map("created_at") // ← @map handles DB mapping
  
  @@map("users")  // ← Table name mapping
}
```

### 🚨 **Critical Protection Rules**
1. **NEVER** use snake_case field names in TypeScript code
2. **ALWAYS** use Prisma client field names (camelCase)
3. **ONLY** use snake_case in database migrations and schema definitions
4. **@map** decorators in Prisma schema handle database field mapping automatically

## 🗺️ **Complete Field Mapping Reference**

### **User Model**
| TypeScript (USE) | Database (DON'T USE) | Type |
|------------------|----------------------|------|
| `user.id` | `id` | string |
| `user.supabaseUserId` | `supabase_user_id` | string |
| `user.email` | `email` | string |
| `user.firstName` | `first_name` | string? |
| `user.lastName` | `last_name` | string? |
| `user.phone` | `phone` | string? |
| `user.createdAt` | `created_at` | DateTime? |
| `user.updatedAt` | `updated_at` | DateTime? |
| `user.preferences` | `preferences` | Json? |
| `user.hasOnboarded` | `has_onboarded` | boolean? |

### **Couple Model**
| TypeScript (USE) | Database (DON'T USE) | Type |
|------------------|----------------------|------|
| `couple.id` | `id` | string |
| `couple.partner1UserId` | `partner1_user_id` | string? |
| `couple.partner2UserId` | `partner2_user_id` | string? |
| `couple.partner1Name` | `partner1_name` | string |
| `couple.partner2Name` | `partner2_name` | string? |
| `couple.weddingDate` | `wedding_date` | DateTime? |
| `couple.venueName` | `venue_name` | string? |
| `couple.venueLocation` | `venue_location` | string? |
| `couple.guestCountEstimate` | `guest_count_estimate` | number? |
| `couple.totalBudget` | `total_budget` | Decimal? |
| `couple.currency` | `currency` | string? |
| `couple.weddingStyle` | `wedding_style` | string? |
| `couple.createdAt` | `created_at` | DateTime? |
| `couple.updatedAt` | `updated_at` | DateTime? |
| `couple.onboardingCompleted` | `onboarding_completed` | boolean? |
| `couple.userId` | `user_id` | string? |

### **Guest Model**
| TypeScript (USE) | Database (DON'T USE) | Type |
|------------------|----------------------|------|
| `guest.id` | `id` | string |
| `guest.coupleId` | `couple_id` | string |
| `guest.firstName` | `first_name` | string |
| `guest.lastName` | `last_name` | string |
| `guest.email` | `email` | string? |
| `guest.phone` | `phone` | string? |
| `guest.address` | `address` | string? |
| `guest.relationship` | `relationship` | string? |
| `guest.side` | `side` | string? |
| `guest.plusOneAllowed` | `plus_one_allowed` | boolean? |
| `guest.plusOneName` | `plus_one_name` | string? |
| `guest.dietaryRestrictions` | `dietary_restrictions` | string? |
| `guest.notes` | `notes` | string? |
| `guest.createdAt` | `created_at` | DateTime? |
| `guest.updatedAt` | `updated_at` | DateTime? |
| `guest.attendingCount` | `attending_count` | number |
| `guest.invitationSentAt` | `invitation_sent_at` | DateTime? |
| `guest.rsvpDeadline` | `rsvp_deadline` | DateTime? |

### **Vendor Model**
| TypeScript (USE) | Database (DON'T USE) | Type |
|------------------|----------------------|------|
| `vendor.id` | `id` | string |
| `vendor.coupleId` | `couple_id` | string |
| `vendor.name` | `name` | string |
| `vendor.contactName` | `contact_name` | string? |
| `vendor.phone` | `phone` | string? |
| `vendor.email` | `email` | string? |
| `vendor.website` | `website` | string? |
| `vendor.address` | `address` | string? |
| `vendor.categoryId` | `category_id` | string? |
| `vendor.status` | `status` | string? |
| `vendor.priority` | `priority` | string? |
| `vendor.rating` | `rating` | number? |
| `vendor.estimatedCost` | `estimated_cost` | Decimal? |
| `vendor.actualCost` | `actual_cost` | Decimal? |
| `vendor.notes` | `notes` | string? |
| `vendor.meetingDate` | `meeting_date` | DateTime? |
| `vendor.contractSigned` | `contract_signed` | boolean? |
| `vendor.createdAt` | `created_at` | DateTime? |
| `vendor.updatedAt` | `updated_at` | DateTime? |

### **VendorCategory Model**
| TypeScript (USE) | Database (DON'T USE) | Type |
|------------------|----------------------|------|
| `vendorCategory.id` | `id` | string |
| `vendorCategory.name` | `name` | string |
| `vendorCategory.icon` | `icon` | string? |
| `vendorCategory.color` | `color` | string? |
| `vendorCategory.description` | `description` | string? |
| `vendorCategory.industryTypical` | `industry_typical` | boolean? |
| `vendorCategory.displayOrder` | `display_order` | number? |
| `vendorCategory.createdAt` | `created_at` | DateTime? |
| `vendorCategory.updatedAt` | `updated_at` | DateTime? |

## Testing Strategy
- **Unit Tests**: Service and repository logic
- **Integration Tests**: API endpoint testing with repositories
- **Transaction Tests**: Rollback behavior validation
- **Data Consistency**: Cross-feature integration testing