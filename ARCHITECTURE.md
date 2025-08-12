# Wedding Planner v2 - Architecture Documentation

## Overview

This document describes the refactored architecture of the Wedding Planner application, focusing on maintainability, scalability, and performance. The application follows enterprise-level patterns with proper separation of concerns.

## Architecture Layers

### 1. API Layer (`src/app/api/`)

**Base Handler Pattern**
- `BaseAPIHandler` provides consistent response formatting
- Standardized error handling across all endpoints
- Built-in request validation and pagination
- Centralized logging and monitoring hooks

```typescript
// Example API route implementation
class GuestsHandler extends BaseAPIHandler {
  async handle(request: NextRequest): Promise<NextResponse> {
    try {
      const auth = await this.requireAuth(request)
      const result = await guestService.getGuestsForCouple(auth.coupleId)
      return this.successResponse(result)
    } catch (error) {
      return this.handleError(error)
    }
  }
}
```

### 2. Service Layer (`src/lib/services/`)

**Business Logic Separation**
- Services contain all business logic
- Database-agnostic operations
- Caching integration at service level
- Transaction management

**Base Service Pattern**
```typescript
abstract class BaseService<T> {
  protected abstract entityName: string
  protected abstract getTags(coupleId: string): string[]
  
  protected async cachedQuery<R>(
    key: string,
    queryFn: () => Promise<R>,
    coupleId: string,
    ttl?: number
  ): Promise<R>
}
```

### 3. Repository Layer (`src/lib/repositories/`)

**Data Access Abstraction**
- Repository pattern for database operations
- Query optimization and N+1 prevention
- Consistent data access patterns
- Transaction support

### 4. Caching Layer (`src/lib/cache.ts`)

**Enhanced Caching System**
- Tag-based cache invalidation
- Pattern-based bulk operations
- TTL management with different strategies
- Memory-efficient cleanup

**Features:**
- Automatic cache warming
- Cache statistics and monitoring
- Invalidation cascading
- Performance metrics

## Key Design Patterns

### 1. Dependency Injection

Services and repositories follow dependency injection principles:

```typescript
class GuestService extends BaseService<Guest> {
  constructor(
    private guestRepo = guestRepository,
    private cache = cache
  ) {
    super()
  }
}
```

### 2. Repository Pattern

Abstracts data access logic:

```typescript
class GuestRepository extends BaseRepository<Guest> {
  async findByCouple(coupleId: string): Promise<Guest[]> {
    return this.prisma.guest.findMany({
      where: { coupleId },
      include: this.getDefaultIncludes()
    })
  }
}
```

### 3. Service Pattern

Encapsulates business logic:

```typescript
class GuestService {
  async createGuest(coupleId: string, data: CreateGuestDto): Promise<Guest> {
    // Business logic
    const guest = await this.repository.create(coupleId, processedData)
    
    // Cache invalidation
    await this.clearEntityCache(coupleId)
    
    return guest
  }
}
```

## Caching Strategy

### Cache Structure

```
Cache Key Structure:
- Entity lists: `{entity}-{coupleId}`
- Individual items: `{entity}-{coupleId}-{itemId}`
- Stats/aggregates: `{entity}-{coupleId}:stats`
- Paginated results: `{entity}-{coupleId}:page:{page}:{pageSize}`
```

### Tag-Based Invalidation

```typescript
// Tags enable efficient bulk invalidation
const tags = [
  getCacheTags.guests(coupleId),    // "guests:couple-123"
  getCacheTags.couple(coupleId)     // "couple:couple-123"
]

// Invalidate all guest-related cache entries
invalidateCache.guests(coupleId)
```

### TTL Strategies

- **SHORT (1 min)**: Frequently changing data (stats, counts)
- **MEDIUM (5 min)**: Standard business data (guests, vendors)
- **LONG (30 min)**: Reference data (categories, settings)
- **DASHBOARD (2 min)**: Dashboard aggregates

## Authentication & Authorization

### Centralized Auth Service

```typescript
class AuthService {
  async getAuthenticatedUser(request?: NextRequest): Promise<AuthContext | null>
  async requireAuth(request?: NextRequest): Promise<AuthContext>
  async getUserCouple(userId: string): Promise<Couple>
}
```

### Security Features

- JWT validation through Clerk
- Row-level security with Prisma
- Request validation middleware
- CORS and rate limiting ready

## Performance Optimizations

### Query Optimization

1. **N+1 Query Prevention**
   - Proper use of Prisma `include` and `select`
   - Batch loading for related data
   - Query result caching

2. **Database Indexing**
   - Composite indexes on frequently queried fields
   - Foreign key optimization
   - Query performance monitoring

### Caching Strategy

1. **Multi-Level Caching**
   - In-memory cache for hot data
   - Query result caching
   - Computed value caching (stats, aggregates)

2. **Cache Invalidation**
   - Tag-based invalidation prevents stale data
   - Cascade invalidation for related entities
   - Pattern-based bulk operations

### Request Optimization

1. **Pagination**
   - Consistent pagination across all endpoints
   - Cursor-based pagination for large datasets
   - Total count caching

2. **Response Optimization**
   - Consistent API response format
   - Selective field loading
   - Compressed responses

## Error Handling

### Standardized Error Responses

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: any
}
```

### Error Types

- **Validation Errors**: Input validation failures
- **Authentication Errors**: Auth/authorization failures  
- **Business Logic Errors**: Domain-specific errors
- **System Errors**: Database, network, or infrastructure errors

## Testing Strategy

### Test Structure

```
src/__tests__/
├── lib/
│   ├── test-utils.ts           # Test utilities and mocks
│   ├── api/
│   │   └── base-handler.test.ts
│   └── cache.test.ts
├── services/
│   └── guest.service.test.ts
└── integration/
    └── api-integration.test.ts
```

### Testing Patterns

1. **Unit Tests**: Service and repository logic
2. **Integration Tests**: API endpoint testing
3. **Cache Tests**: Cache behavior and invalidation
4. **Performance Tests**: Query optimization validation

### Mock Strategies

- Prisma client mocking
- Cache system mocking
- Authentication mocking
- External service mocking

## Monitoring & Observability

### Performance Metrics

- API response times
- Cache hit rates
- Database query performance
- Memory usage tracking

### Logging Strategy

- Structured logging with context
- Error tracking and alerting
- Performance monitoring
- Business metrics tracking

## Deployment Considerations

### Environment Configuration

- Environment-specific configurations
- Secret management
- Database connection pooling
- Cache configuration

### Scalability Preparation

- Stateless service design
- Horizontal scaling ready
- Database connection optimization
- Cache distribution ready

## Migration Guide

### From Legacy Code

1. **API Routes**: Migrate to handler pattern
2. **Business Logic**: Extract to service layer
3. **Data Access**: Implement repository pattern
4. **Caching**: Integrate enhanced cache system

### Breaking Changes

- API response format standardization
- Authentication flow changes
- Cache key structure changes
- Database query optimizations

## Best Practices

### Code Organization

1. **Separation of Concerns**: Clear layer boundaries
2. **Single Responsibility**: Each class/function has one purpose
3. **Dependency Injection**: Testable and maintainable code
4. **Error Handling**: Consistent error management

### Performance

1. **Caching First**: Cache frequently accessed data
2. **Query Optimization**: Minimize database calls
3. **Batch Operations**: Group related operations
4. **Memory Management**: Efficient object lifecycle

### Testing

1. **Test Pyramid**: Unit > Integration > E2E
2. **Mock External Dependencies**: Isolate units under test
3. **Performance Testing**: Validate optimization assumptions
4. **Cache Testing**: Verify invalidation logic

## Future Enhancements

### Planned Improvements

1. **Event-Driven Architecture**: Implement domain events
2. **CQRS Pattern**: Separate read/write models
3. **Microservices**: Domain-based service separation
4. **Real-time Updates**: WebSocket integration

### Monitoring Enhancements

1. **APM Integration**: Application performance monitoring
2. **Distributed Tracing**: Request flow tracking
3. **Business Metrics**: Domain-specific KPIs
4. **Automated Alerting**: Proactive issue detection