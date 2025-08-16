/**
 * Enterprise Rate Limiting Middleware
 * Provides flexible, configurable rate limiting for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/Logger'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message?: string // Custom error message
  keyGenerator?: (request: NextRequest) => string // Custom key generation
  skip?: (request: NextRequest) => boolean // Skip rate limiting logic
  onLimitReached?: (request: NextRequest, info: RateLimitInfo) => void // Callback when limit is reached
}

interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: Date
  totalHits: number
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {}

// Cleanup interval to remove expired entries
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60000) // Cleanup every minute

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      keyGenerator: this.defaultKeyGenerator,
      skip: () => false,
      ...config
    }
  }

  private defaultKeyGenerator(request: NextRequest): string {
    // Try to get user ID from headers or use IP address
    const userId = request.headers.get('x-user-id')
    if (userId) {
      return `user:${userId}`
    }

    // Fallback to IP address
    const ip = this.getClientIP(request)
    return `ip:${ip}`
  }

  private getClientIP(request: NextRequest): string {
    const xForwardedFor = request.headers.get('x-forwarded-for')
    const xRealIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (xRealIP) return xRealIP
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim()
    
    return '127.0.0.1'
  }

  async middleware(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Check if we should skip rate limiting
      if (this.config.skip && this.config.skip(request)) {
        return null
      }

      const key = this.config.keyGenerator!(request)
      const now = Date.now()
      const resetTime = now + this.config.windowMs

      // Get or create rate limit entry
      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 1,
          resetTime
        }
      } else {
        store[key].count++
      }

      const info: RateLimitInfo = {
        limit: this.config.max,
        remaining: Math.max(0, this.config.max - store[key].count),
        resetTime: new Date(store[key].resetTime),
        totalHits: store[key].count
      }

      // Check if limit exceeded
      if (store[key].count > this.config.max) {
        // Call onLimitReached callback
        if (this.config.onLimitReached) {
          this.config.onLimitReached(request, info)
        }

        // Log rate limit exceeded
        logger.warn('Rate limit exceeded', {
          key,
          path: request.nextUrl.pathname,
          method: request.method,
          limit: this.config.max,
          attempts: store[key].count,
          resetTime: info.resetTime.toISOString()
        })

        // Return rate limit response
        return this.createRateLimitResponse(info)
      }

      // Log successful request (debug level)
      logger.debug('Rate limit check passed', {
        key,
        path: request.nextUrl.pathname,
        remaining: info.remaining,
        limit: info.limit
      })

      return null // Allow request to continue

    } catch (error) {
      logger.error('Rate limiter error', error instanceof Error ? error : new Error(String(error)), {
        path: request.nextUrl.pathname,
        method: request.method
      })
      
      // Fail open - allow request if rate limiter fails
      return null
    }
  }

  private createRateLimitResponse(info: RateLimitInfo): NextResponse {
    const retryAfter = Math.ceil((info.resetTime.getTime() - Date.now()) / 1000)

    const response = NextResponse.json(
      {
        error: this.config.message,
        details: {
          limit: info.limit,
          remaining: info.remaining,
          resetTime: info.resetTime.toISOString(),
          retryAfter
        }
      },
      { status: 429 }
    )

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', info.limit.toString())
    response.headers.set('X-RateLimit-Remaining', info.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(info.resetTime.getTime() / 1000).toString())
    response.headers.set('Retry-After', retryAfter.toString())

    return response
  }
}

// Pre-configured rate limiters
export const standardRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests. Please try again in 15 minutes.'
})

export const strictRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: 'Rate limit exceeded for sensitive operation. Please try again later.'
})

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: (request) => {
    // Always use IP for auth rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               request.headers.get('x-real-ip') ||
               request.headers.get('cf-connecting-ip') ||
               '127.0.0.1'
    return `auth:${ip}`
  }
})

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: 'Upload limit exceeded. Please try again in an hour.'
})

export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Search rate limit exceeded. Please wait a moment before searching again.'
})

// Factory function for creating custom rate limiters
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config)
}

// Helper function to get appropriate rate limiter for endpoint
export function getRateLimiterForEndpoint(pathname: string): RateLimiter {
  // Auth endpoints
  if (pathname.includes('/auth/') || pathname.includes('/sign-in') || pathname.includes('/sign-up')) {
    return authRateLimiter
  }
  
  // Upload endpoints
  if (pathname.includes('/upload') || pathname.includes('/photos')) {
    return uploadRateLimiter
  }
  
  // Search endpoints
  if (pathname.includes('/search')) {
    return searchRateLimiter
  }
  
  // Sensitive operations
  if (pathname.includes('/export') || pathname.includes('/bulk') || pathname.includes('/admin')) {
    return strictRateLimiter
  }
  
  // Default rate limiter
  return standardRateLimiter
}

// Export rate limit error for consistency
export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}