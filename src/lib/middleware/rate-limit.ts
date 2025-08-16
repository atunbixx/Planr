/**
 * Rate Limiting Middleware
 * Provides configurable rate limiting for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'rate-limit' });

export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  window: number;
  /** Custom key generator function */
  keyGenerator?: (req: NextRequest) => string;
  /** Skip function to bypass rate limiting */
  skip?: (req: NextRequest) => boolean;
  /** Custom error message */
  message?: string;
  /** Include rate limit headers in response */
  includeHeaders?: boolean;
  /** Different limits for different methods */
  methodLimits?: {
    GET?: number;
    POST?: number;
    PUT?: number;
    DELETE?: number;
    PATCH?: number;
  };
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Create separate caches for different rate limit tiers
const caches = new Map<string, LRUCache<string, RateLimitEntry>>();

/**
 * Get or create a cache for a specific tier
 */
function getCache(tier: string): LRUCache<string, RateLimitEntry> {
  if (!caches.has(tier)) {
    caches.set(tier, new LRUCache<string, RateLimitEntry>({
      max: 10000, // Maximum number of entries
      ttl: 60 * 60 * 1000, // 1 hour TTL
    }));
  }
  return caches.get(tier)!;
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || 'unknown';
  
  // Include user ID if authenticated
  const userId = req.headers.get('x-user-id');
  
  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Rate limiting middleware factory
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    limit,
    window,
    keyGenerator = defaultKeyGenerator,
    skip,
    message = 'Too many requests, please try again later',
    includeHeaders = true,
    methodLimits,
  } = config;

  return async function rateLimitMiddleware(
    req: NextRequest
  ): Promise<NextResponse | null> {
    // Check if we should skip rate limiting
    if (skip && skip(req)) {
      return null;
    }

    const key = keyGenerator(req);
    const method = req.method as keyof typeof methodLimits;
    const requestLimit = methodLimits?.[method] ?? limit;
    const cache = getCache(`${requestLimit}-${window}`);
    
    const now = Date.now();
    const entry = cache.get(key);

    let currentCount = 0;
    let resetTime = now + window;

    if (entry) {
      if (now < entry.resetTime) {
        // Still within the window
        currentCount = entry.count;
        resetTime = entry.resetTime;
      } else {
        // Window has expired, reset
        currentCount = 0;
      }
    }

    currentCount++;
    
    // Update cache
    cache.set(key, {
      count: currentCount,
      resetTime,
    });

    // Check if limit exceeded
    if (currentCount > requestLimit) {
      log.warn('Rate limit exceeded', {
        key,
        count: currentCount,
        limit: requestLimit,
        path: req.nextUrl.pathname,
        method: req.method,
      });

      const response = NextResponse.json(
        { 
          error: message,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        },
        { status: 429 }
      );

      if (includeHeaders) {
        response.headers.set('X-RateLimit-Limit', requestLimit.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', resetTime.toString());
        response.headers.set('Retry-After', Math.ceil((resetTime - now) / 1000).toString());
      }

      return response;
    }

    // Add rate limit headers to successful responses
    if (includeHeaders) {
      return new NextResponse(null, {
        headers: {
          'X-RateLimit-Limit': requestLimit.toString(),
          'X-RateLimit-Remaining': (requestLimit - currentCount).toString(),
          'X-RateLimit-Reset': resetTime.toString(),
        },
      });
    }

    return null;
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    limit: 5,
    window: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts, please try again later',
  }),

  // Moderate rate limiting for API endpoints
  api: rateLimit({
    limit: 100,
    window: 60 * 1000, // 1 minute
    methodLimits: {
      GET: 200,
      POST: 50,
      PUT: 50,
      DELETE: 30,
      PATCH: 50,
    },
  }),

  // Lenient rate limiting for read-only endpoints
  public: rateLimit({
    limit: 300,
    window: 60 * 1000, // 1 minute
  }),

  // Very strict rate limiting for sensitive operations
  sensitive: rateLimit({
    limit: 3,
    window: 60 * 60 * 1000, // 1 hour
    message: 'This operation is rate limited for security, please try again later',
  }),

  // Rate limiting for file uploads
  upload: rateLimit({
    limit: 10,
    window: 60 * 60 * 1000, // 1 hour
    message: 'Upload limit exceeded, please try again later',
  }),
};

/**
 * Apply rate limiting to an API route handler
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  const limiter = rateLimit(config);
  
  return async function rateLimitedHandler(req: NextRequest): Promise<NextResponse> {
    const rateLimitResponse = await limiter(req);
    
    if (rateLimitResponse && rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
    
    // Call the original handler
    const response = await handler(req);
    
    // Add rate limit headers if they were set
    if (rateLimitResponse?.headers) {
      rateLimitResponse.headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}