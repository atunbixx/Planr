import { NextRequest } from 'next/server'
import { createErrorResponse } from '@/lib/supabase-server'

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage for rate limiting
// In production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(request: NextRequest, identifier?: string) {
    // Get identifier from IP or custom identifier
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const key = identifier || ip
    const now = Date.now()
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)
    
    if (!entry || entry.resetTime < now) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + config.windowMs
      }
      rateLimitStore.set(key, entry)
      
      return {
        limited: false,
        remaining: config.max - 1,
        resetTime: entry.resetTime
      }
    }
    
    // Check if limit exceeded
    if (entry.count >= config.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      
      return {
        limited: true,
        remaining: 0,
        resetTime: entry.resetTime,
        response: createErrorResponse(
          'Too many requests. Please try again later.',
          429,
          {
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': retryAfter.toString()
          }
        )
      }
    }
    
    // Increment count
    entry.count++
    
    return {
      limited: false,
      remaining: config.max - entry.count,
      resetTime: entry.resetTime
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 60               // 60 requests per minute
})

export const searchRateLimit = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute  
  max: 30               // 30 searches per minute
})

export const inquiryRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 10                    // 10 inquiries per hour
})

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5                     // 5 attempts per 15 minutes
})