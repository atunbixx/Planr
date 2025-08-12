# Enterprise Rate Limiting Guide

## Overview

This guide describes the comprehensive rate limiting system implemented for the Wedding Planner API. The system provides flexible, configurable rate limiting with support for different strategies, custom rules, and distributed environments.

## Features

- **Multiple Rate Limiting Strategies**: Per-user, per-IP, per-endpoint, custom keys
- **Flexible Configuration**: Window-based limiting with customizable thresholds
- **Pre-configured Limiters**: Standard, strict, auth, upload, and search limiters
- **Custom Rate Limiters**: Create specific limiters for unique requirements
- **Rate Limit Headers**: Standard headers for client awareness
- **Skip Logic**: Bypass rate limiting for specific conditions
- **Distributed Support**: Redis integration for multi-instance deployments
- **Cost-based Quotas**: Advanced quota system based on operation costs

## How It Works

### Basic Concept

Rate limiting uses a sliding window algorithm:
- Requests are counted within a time window (e.g., 15 minutes)
- If the count exceeds the limit, subsequent requests are rejected
- The window slides forward as time passes

### Default Configuration

```typescript
// Standard rate limiter: 100 requests per 15 minutes
const standardRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests
});
```

## Pre-configured Rate Limiters

### 1. Standard Rate Limiter
- **Window**: 15 minutes
- **Limit**: 100 requests
- **Use**: General API endpoints

### 2. Strict Rate Limiter
- **Window**: 15 minutes
- **Limit**: 20 requests
- **Use**: Sensitive endpoints (export, bulk operations)

### 3. Auth Rate Limiter
- **Window**: 15 minutes
- **Limit**: 5 attempts
- **Use**: Login, registration, password reset
- **Key**: IP-based only

### 4. Upload Rate Limiter
- **Window**: 1 hour
- **Limit**: 50 uploads
- **Use**: File uploads, photo uploads

### 5. Search Rate Limiter
- **Window**: 1 minute
- **Limit**: 30 searches
- **Use**: Search endpoints

## Implementation

### Automatic Application

Rate limiting is automatically applied in `middleware.ts`:

```typescript
// middleware.ts
if (pathname.startsWith('/api/')) {
  // Rate limiting applied based on endpoint
  const rateLimiter = getRateLimiterForEndpoint(pathname);
  const rateLimitResponse = await rateLimiter.middleware(request);
  if (rateLimitResponse) return rateLimitResponse;
}
```

### Custom Rate Limiter

Create a custom rate limiter for specific needs:

```typescript
import { createRateLimiter } from '@/infrastructure/api/middleware/rateLimiter';

const customLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 10,                   // 10 requests
  message: 'Custom rate limit message',
  keyGenerator: (request) => {
    // Custom key generation logic
    const userId = request.userId;
    const feature = request.headers.get('X-Feature');
    return `${userId}:${feature}`;
  },
  skip: (request) => {
    // Skip for premium users
    return request.user?.isPremium === true;
  },
  onLimitReached: (request, info) => {
    // Custom handling when limit is reached
    console.log('Rate limit hit:', info);
  }
});
```

### Route-specific Rate Limiting

Apply different rate limits within a route:

```typescript
export async function POST(request: NextRequest) {
  const { operation } = await request.json();
  
  // Different limits for different operations
  let limiter;
  if (operation === 'bulk_delete') {
    limiter = createRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,                    // 5 bulk deletes per hour
    });
  } else {
    limiter = standardRateLimiter;
  }
  
  const limitResponse = await limiter.middleware(request);
  if (limitResponse) return limitResponse;
  
  // Process request...
}
```

## Rate Limit Headers

The system automatically adds standard rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200000
Retry-After: 900 (only when limit exceeded)
```

### Client Usage

```javascript
// Client-side handling
const response = await fetch('/api/users');

const limit = response.headers.get('X-RateLimit-Limit');
const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
}
```

## Advanced Features

### 1. Skip Logic

Skip rate limiting for certain conditions:

```typescript
const limiter = createRateLimiter({
  skip: (request) => {
    // Skip for internal services
    if (request.headers.get('X-Internal-Service')) {
      return true;
    }
    
    // Skip for admin users
    const user = request.user;
    return user?.role === 'admin';
  }
});
```

### 2. Custom Key Generation

Control how requests are grouped:

```typescript
const limiter = createRateLimiter({
  keyGenerator: (request) => {
    // Rate limit by organization
    const orgId = request.headers.get('X-Organization-ID');
    const endpoint = request.nextUrl.pathname;
    return `org:${orgId}:${endpoint}`;
  }
});
```

### 3. Dynamic Rate Limits

Adjust limits based on user tier:

```typescript
function getRateLimiterForUser(user: User) {
  const limits = {
    free: { windowMs: 15 * 60 * 1000, max: 50 },
    pro: { windowMs: 15 * 60 * 1000, max: 500 },
    enterprise: { windowMs: 15 * 60 * 1000, max: 5000 },
  };
  
  return createRateLimiter(limits[user.tier] || limits.free);
}
```

### 4. Cost-based Quotas

Implement point-based quotas:

```typescript
class QuotaManager {
  private costs = {
    read: 1,
    write: 5,
    analyze: 10,
    export: 20,
  };
  
  async checkAndConsume(userId: string, operation: string): Promise<boolean> {
    const cost = this.costs[operation] || 1;
    const remaining = await this.getRemaining(userId);
    
    if (remaining < cost) {
      return false;
    }
    
    await this.consume(userId, cost);
    return true;
  }
}
```

## Error Responses

When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "limit": 100,
      "windowMs": 900000,
      "retryAfter": 547
    },
    "correlationId": "req_abc123"
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Best Practices

### 1. Choose Appropriate Limits

```typescript
// Public endpoints: More restrictive
public: { max: 10, windowMs: 15 * 60 * 1000 }

// Authenticated endpoints: Standard
authenticated: { max: 100, windowMs: 15 * 60 * 1000 }

// Paid features: More generous
premium: { max: 1000, windowMs: 15 * 60 * 1000 }
```

### 2. Inform Users

Always inform users about rate limits:
- Include limits in API documentation
- Return clear error messages
- Provide rate limit headers
- Show remaining quota in UI

### 3. Gradual Degradation

```typescript
// Warn before limiting
if (remaining < limit * 0.2) {
  response.headers.set('X-RateLimit-Warning', 'Approaching rate limit');
}
```

### 4. Monitor and Adjust

Track rate limit metrics:
- How often limits are hit
- Which endpoints are affected
- Which users are affected
- Adjust limits based on usage patterns

## Testing Rate Limits

### Unit Tests

```typescript
describe('Rate Limiter', () => {
  it('should limit after max requests', async () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000 });
    
    for (let i = 0; i < 3; i++) {
      const response = await limiter.middleware(mockRequest);
      expect(response).toBeNull();
    }
    
    const response = await limiter.middleware(mockRequest);
    expect(response?.status).toBe(429);
  });
});
```

### Integration Tests

```typescript
it('should rate limit API endpoint', async () => {
  // Make requests up to limit
  for (let i = 0; i < 100; i++) {
    await fetch('/api/users');
  }
  
  // Next request should be rate limited
  const response = await fetch('/api/users');
  expect(response.status).toBe(429);
  expect(response.headers.get('Retry-After')).toBeDefined();
});
```

## Distributed Rate Limiting

For multi-instance deployments:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const distributedLimiter = createRateLimiter({
  keyGenerator: async (request) => {
    const key = generateKey(request);
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    return key;
  }
});
```

## Monitoring

Track rate limiting metrics:

```typescript
// Log when limits are hit
onLimitReached: (request, info) => {
  logger.warn('Rate limit exceeded', {
    path: request.url,
    remaining: info.remaining,
    resetTime: info.resetTime,
  });
  
  // Send metrics
  metrics.increment('rate_limit.exceeded', {
    endpoint: request.url,
    limit_type: 'standard',
  });
}
```

## Common Patterns

### 1. Tiered Rate Limiting

```typescript
const tierLimiters = {
  free: createRateLimiter({ max: 100 }),
  pro: createRateLimiter({ max: 1000 }),
  enterprise: createRateLimiter({ max: 10000 }),
};
```

### 2. Burst Protection

```typescript
// Allow bursts but limit sustained usage
const burstLimiter = createRateLimiter({
  windowMs: 1000,    // 1 second
  max: 10,           // 10 requests per second
});

const sustainedLimiter = createRateLimiter({
  windowMs: 60000,   // 1 minute
  max: 100,          // 100 requests per minute
});
```

### 3. Progressive Penalties

```typescript
// Increase penalty for repeated violations
const progressiveLimiter = {
  first: { windowMs: 15 * 60 * 1000 },
  second: { windowMs: 60 * 60 * 1000 },
  third: { windowMs: 24 * 60 * 60 * 1000 },
};
```