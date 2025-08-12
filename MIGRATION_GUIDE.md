# Migration Guide: Current to Enterprise Architecture

## Overview

This guide provides step-by-step instructions for migrating the existing Wedding Planner codebase to the new enterprise architecture. The migration can be done incrementally without breaking existing functionality.

## Migration Strategy

The migration follows a phased approach:
1. **Phase 1**: Core infrastructure (logging, monitoring, errors)
2. **Phase 2**: Authentication and dependency injection
3. **Phase 3**: Domain layer and repositories
4. **Phase 4**: API routes migration
5. **Phase 5**: Frontend integration

## Phase 1: Core Infrastructure

### Step 1.1: Install Required Dependencies

```bash
npm install --save \
  winston pino \
  prom-client @opentelemetry/api @opentelemetry/sdk-node \
  ioredis \
  tsyringe reflect-metadata \
  zod \
  nanoid

npm install --save-dev \
  @types/node \
  jest-mock-extended
```

### Step 1.2: Environment Variables

Add to `.env.local`:
```env
# Application
APP_VERSION=1.0.0
SERVICE_NAME=wedding-planner

# Logging
LOG_LEVEL=info

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# Security
SESSION_SECRET=your-32-character-secret-here
ENCRYPTION_KEY=your-32-character-encryption-key

# Rate Limiting
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring (optional)
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

### Step 1.3: Initialize Core Modules

Create `src/lib/bootstrap.ts`:
```typescript
import 'reflect-metadata'
import { initializeEnvironment } from '@/core/config'
import { initializeContainer } from '@/core/di'
import { APM } from '@/core/monitoring'
import { logger } from '@/core/logging/logger'

export async function bootstrap() {
  try {
    // Initialize environment
    initializeEnvironment()
    
    // Initialize APM
    await APM.initialize()
    
    // Initialize DI container
    initializeContainer()
    
    logger.info('Application bootstrapped successfully')
  } catch (error) {
    logger.error('Failed to bootstrap application', { error })
    process.exit(1)
  }
}
```

Update `src/app/layout.tsx`:
```typescript
import { bootstrap } from '@/lib/bootstrap'

// Initialize on server startup
if (typeof window === 'undefined') {
  bootstrap()
}
```

## Phase 2: Authentication Migration

### Step 2.1: Update Auth Endpoints

Replace current auth logic with new auth service:

**Before** (`src/app/api/couples/route.ts`):
```typescript
const { userId } = await auth()
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**After**:
```typescript
import { authService } from '@/infrastructure/auth'
import { routeHandler } from '@/core/errors'

export const POST = routeHandler(async (request) => {
  const user = await authService.getCurrentUser()
  // user is guaranteed to exist here
})
```

### Step 2.2: Add Middleware

Use new middleware pattern:
```typescript
import { requireAuthAndPermission, Permission } from '@/infrastructure/auth'
import { metricsMiddleware } from '@/core/monitoring'
import { rateLimiters } from '@/core/security'

export const GET = routeHandler(
  requireAuthAndPermission(Permission.VENDOR_READ)(
    metricsMiddleware(
      rateLimiters.read.middleware()(
        async (request, { user }) => {
          // Your handler code
        }
      )
    )
  )
)
```

## Phase 3: Domain Layer Migration

### Step 3.1: Migrate Data Models

**Before** (Direct Prisma usage):
```typescript
const vendor = await prisma.vendor.create({
  data: {
    name: businessName,
    coupleId,
    // ...
  }
})
```

**After** (Domain entities + repositories):
```typescript
import { Vendor, ContactInfo } from '@/domain/vendor/vendor.entity'
import { getService, TOKENS } from '@/core/di'

const vendorRepository = getService(TOKENS.VendorRepository)

const vendor = new Vendor({
  id: nanoid(),
  coupleId: user.coupleId,
  businessName,
  contactInfo: new ContactInfo(contactName, email, phone, website),
  // ...
})

await vendorRepository.save(vendor)
```

### Step 3.2: Implement Repositories

For each entity, create a repository following the pattern in `src/infrastructure/persistence/`.

## Phase 4: API Routes Migration

### Step 4.1: Create v2 Routes

Create new routes alongside existing ones:
- `/api/vendors` → `/api/v2/vendors`
- `/api/guests` → `/api/v2/guests`
- `/api/budget` → `/api/v2/budget`

### Step 4.2: Implement Route Handlers

Follow the pattern in `src/app/api/v2/vendors/route.ts`:
```typescript
export const GET = routeHandler(
  requireAuth(
    metricsMiddleware(
      rateLimiters.read.middleware()(
        async (request, { user }) => {
          const service = getService(TOKENS.VendorService)
          const vendors = await service.getVendorsByCouple(user.coupleId)
          return NextResponse.json({ data: vendors })
        }
      )
    )
  )
)
```

### Step 4.3: Update Frontend Calls

Gradually update API calls:
```typescript
// Old
const response = await fetch('/api/vendors')

// New
const response = await fetch('/api/v2/vendors')
```

## Phase 5: Frontend Integration

### Step 5.1: Update API Client

Create typed API client:
```typescript
import { z } from 'zod'

const VendorSchema = z.object({
  id: z.string(),
  businessName: z.string(),
  // ...
})

export class ApiClient {
  async getVendors() {
    const response = await fetch('/api/v2/vendors')
    const data = await response.json()
    return VendorSchema.array().parse(data.data)
  }
}
```

### Step 5.2: Error Handling

Implement proper error handling:
```typescript
try {
  const vendors = await apiClient.getVendors()
} catch (error) {
  if (error instanceof z.ZodError) {
    // Validation error
  } else if (error.status === 401) {
    // Unauthorized
  } else if (error.status === 429) {
    // Rate limited
  }
}
```

## Testing Migration

### Update Test Setup

1. Add test configuration from `src/core/testing/`
2. Update `jest.config.js` as shown
3. Create test files following patterns in `src/__tests__/`

### Write Tests for New Code

```typescript
import { VendorService } from '@/application/services/vendor.service'
import { createMockUserContext } from '@/core/testing/test-helpers'

describe('VendorService', () => {
  // See examples in src/__tests__/unit/services/
})
```

## Rollback Strategy

If issues arise:
1. Keep old routes active during migration
2. Use feature flags to toggle between old/new code
3. Monitor error rates and performance
4. Have database backups before major changes

## Common Issues and Solutions

### Issue: TypeScript Errors
**Solution**: Ensure `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Issue: Dependency Injection Errors
**Solution**: Ensure `reflect-metadata` is imported at app startup

### Issue: Redis Connection Errors
**Solution**: Redis is optional. Set `ENABLE_CACHE=false` to disable

## Monitoring the Migration

1. **Error Rates**: Monitor `/api/v2/metrics` endpoint
2. **Performance**: Check response times in logs
3. **Health Checks**: Use `/api/v2/health` endpoint
4. **User Impact**: Track user sessions and errors

## Timeline Estimate

- **Phase 1**: 1-2 days (Core infrastructure)
- **Phase 2**: 1 day (Authentication)
- **Phase 3**: 3-5 days (Domain layer)
- **Phase 4**: 3-5 days (API migration)
- **Phase 5**: 2-3 days (Frontend)
- **Testing**: 2-3 days

**Total**: 2-3 weeks for complete migration

## Success Criteria

1. All tests pass (>70% coverage)
2. No increase in error rates
3. Performance improvement (or no degradation)
4. Zero downtime during migration
5. All features working as before

## Next Steps After Migration

1. Remove old code paths
2. Update documentation
3. Train team on new patterns
4. Implement additional enterprise features:
   - Event sourcing
   - CQRS
   - Microservices readiness
   - Advanced caching strategies