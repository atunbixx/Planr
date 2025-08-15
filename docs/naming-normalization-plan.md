# Database Naming Normalization Plan

## Overview
Zero-downtime migration to normalize inconsistent naming conventions across Prisma models, repositories, services, and API handlers.

## Critical Issues Discovered

### 1. Mixed Naming Conventions in Prisma Schema
**File**: `prisma/schema.prisma`

#### Couple Model Issues (Lines 33-107)
- ❌ `partner1_user_id` (snake_case field) → Should be `partner1UserId`
- ❌ `partner2_user_id` (snake_case field) → Should be `partner2UserId`  
- ❌ `budget_total` (snake_case field) → Should merge with `totalBudget`
- ❌ Mixed relations: `vendor_documents`, `budget_items` (snake_case) vs `vendors`, `budgetCategories` (camelCase)

#### Guest Model Issues (Lines 109-133)
- ❌ `invitationSentAt` (line 126) → Missing @map directive
- ❌ `rsvpDeadline` (line 127) → Missing @map directive

#### Invitation Model Issues (Lines 135-162)
- ❌ `couple_id` (line 138) → Should be `coupleId` to match Guest model
- ❌ `invited_at` (line 146) → Should be `invitedAt`

### 2. Repository Layer Inconsistencies
**Affected Files**:
- `src/lib/repositories/GuestRepository.ts` - Uses snake_case field references
- `src/lib/repositories/VendorRepository.ts` - Mixed casing in queries
- `src/features/*/repo/*.repository.ts` - Enterprise repos use camelCase correctly

### 3. Service Layer Field Mapping
**Affected Files**:
- `src/features/guests/service/guest.service.ts` - Lines 527-594 (mapping functions)
- `src/features/vendors/service/vendor.service.ts` - Lines 322-385 (mapping functions)
- `src/features/budget/service/budget.service.ts` - Lines 563-651 (mapping functions)

### 4. API Handler Inconsistencies
**Affected Files**:
- `src/lib/api/handlers/guests-handler.ts` - Lines 24-101 (uses snake_case transformations)
- `src/lib/api/handlers/vendors-handler-v2.ts` - Lines 37-125 (mixed field references)
- `src/lib/api/handlers/budget-handler-v2.ts` - Lines 36-181 (legacy field mappings)

### 5. DTO Schema Validation
**Affected Files**:
- `src/features/vendors/dto/create-vendor.dto.ts` - Field name mismatches
- `src/features/guests/dto/` - All DTOs need field alignment
- `src/features/budget/dto/` - Mixed casing in schemas

### 6. Legacy Notifications Duplication
**Schema Issues**:
- `legacy_notifications` relation in Couple model (line 104)
- Physical table needs merging into `notifications`

## Resolution Strategy

### Phase 1: Schema Normalization (No Breaking Changes)
1. Add @map directives to all fields
2. Standardize all model field names to camelCase
3. Keep physical DB columns as snake_case via @map
4. Create metadata-only migration

### Phase 2: Notifications Consolidation
1. Merge `legacy_notifications` data into `notifications`
2. Create VIEW for backward compatibility
3. Remove legacy relation from Couple model

### Phase 3: Code Layer Updates
1. Update repositories to use new field names
2. Fix service layer mappings
3. Update API handlers for camelCase consistency
4. Add backward compatibility layer

### Phase 4: Safety Measures
1. Add lint rules to prevent snake_case in TypeScript
2. Create compatibility tests
3. Add deprecation warnings

## Files Requiring Updates

### High Priority (Breaking Changes)
- `prisma/schema.prisma` - Core schema normalization
- `src/lib/repositories/*.ts` - Repository field references
- `src/features/*/service/*.service.ts` - Service mappings

### Medium Priority (API Compatibility)
- `src/lib/api/handlers/*.ts` - Handler transformations
- `src/features/*/api/*.handler.ts` - Enterprise handlers
- `src/features/*/dto/*.ts` - DTO validations

### Low Priority (Testing/Tooling)
- `src/__tests__/**/*.ts` - Test updates
- `package.json` - Add lint:naming script
- CI/CD pipelines - Integration checks

## Success Criteria

✅ All Prisma model fields use camelCase with @map to snake_case
✅ No snake_case property names in TypeScript source  
✅ API handlers accept both casing formats temporarily
✅ All responses return camelCase only
✅ Zero data loss during migration
✅ All tests pass after changes

## Timeline

- **Phase 1**: Schema normalization (2 hours) ✅ **COMPLETED**
- **Phase 2**: Data migration (1 hour) ✅ **COMPLETED**
- **Phase 3**: Code updates (3 hours) ✅ **COMPLETED**
- **Phase 4**: Testing & validation (2 hours) ✅ **COMPLETED**
- **Phase 5**: Lint guardrails (2 hours) ✅ **COMPLETED**
- **Phase 6**: Documentation (2 hours) ✅ **COMPLETED**

**Total actual time**: 12 hours ✅ **PROJECT COMPLETE**

## 🎯 FINAL STATUS: SUCCESSFULLY DEPLOYED

**Migration completed successfully with zero downtime and full backward compatibility.**

See [Rollout Guide](./naming-normalization-rollout.md) for detailed deployment results and usage instructions.