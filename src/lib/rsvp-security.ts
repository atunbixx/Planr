import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { z } from 'zod'

// Enhanced rate limiting with multiple tiers
interface RateLimitConfig {
  ipLimit: number
  ipWindow: number
  emailLimit: number
  emailWindow: number
  globalLimit: number
  globalWindow: number
}

// Rate limit store with expiration
interface RateLimitEntry {
  count: number
  resetTime: number
  blockedUntil?: number
}

// Enhanced in-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()
const suspiciousIPs = new Set<string>()
const honeypotTriggers = new Map<string, number>()

// Security configuration
export const SECURITY_CONFIG = {
  rateLimit: {
    validation: {
      ipLimit: 5,
      ipWindow: 3600000, // 1 hour
      emailLimit: 10,
      emailWindow: 86400000, // 24 hours
      globalLimit: 100,
      globalWindow: 3600000, // 1 hour
    },
    submission: {
      ipLimit: 3,
      ipWindow: 3600000, // 1 hour
      emailLimit: 5,
      emailWindow: 86400000, // 24 hours
      globalLimit: 50,
      globalWindow: 3600000, // 1 hour
    },
  },
  honeypot: {
    fields: ['website', 'url', 'company', 'address2'],
    timeThreshold: 3000, // Minimum time in ms before submission
  },
  captcha: {
    threshold: 3, // Failed attempts before requiring captcha
  },
  logging: {
    suspicious: true,
    failed: true,
    successful: false, // Only log suspicious successful attempts
  },
}

// Input validation schemas
export const inviteCodeSchema = z.string()
  .length(6)
  .regex(/^[A-Z0-9]{6}$/, 'Invalid invite code format')
  .transform(val => val.toUpperCase())

export const rsvpSubmissionSchema = z.object({
  guestId: z.string().uuid(),
  attending: z.boolean(),
  email: z.string().email().optional().nullable(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional().nullable(),
  mealChoice: z.string().optional().nullable(),
  dietaryRestrictions: z.string().max(500).optional().nullable(),
  plusOneAttending: z.boolean().optional(),
  plusOneName: z.string().max(100).optional().nullable(),
  plusOneMealChoice: z.string().optional().nullable(),
  plusOneDietaryRestrictions: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  // Honeypot fields
  website: z.string().optional(),
  url: z.string().optional(),
  company: z.string().optional(),
  address2: z.string().optional(),
  // Timing field
  submissionTime: z.number().optional(),
})

// Enhanced rate limiting with multiple checks
export async function enhancedRateLimit(
  identifier: string,
  config: RateLimitConfig,
  ipAddress: string,
  email?: string
): Promise<{ allowed: boolean; reason?: string; requiresCaptcha?: boolean }> {
  const now = Date.now()
  
  // Check if IP is blocked
  if (suspiciousIPs.has(ipAddress)) {
    return { allowed: false, reason: 'IP temporarily blocked due to suspicious activity' }
  }

  // IP-based rate limiting
  const ipKey = `ip:${ipAddress}`
  const ipResult = checkRateLimit(ipKey, config.ipLimit, config.ipWindow, now)
  if (!ipResult.allowed) {
    // Mark IP as suspicious after exceeding limit
    suspiciousIPs.add(ipAddress)
    setTimeout(() => suspiciousIPs.delete(ipAddress), config.ipWindow)
    return { allowed: false, reason: 'Too many attempts from this IP address' }
  }

  // Email-based rate limiting (if provided)
  if (email) {
    const emailKey = `email:${email.toLowerCase()}`
    const emailResult = checkRateLimit(emailKey, config.emailLimit, config.emailWindow, now)
    if (!emailResult.allowed) {
      return { allowed: false, reason: 'Too many attempts for this email address' }
    }
  }

  // Global rate limiting
  const globalKey = 'global:rsvp'
  const globalResult = checkRateLimit(globalKey, config.globalLimit, config.globalWindow, now)
  if (!globalResult.allowed) {
    return { allowed: false, reason: 'System is experiencing high traffic. Please try again later.' }
  }

  // Check if captcha is required
  const attemptCount = rateLimitStore.get(ipKey)?.count || 0
  const requiresCaptcha = attemptCount >= SECURITY_CONFIG.captcha.threshold

  return { allowed: true, requiresCaptcha }
}

function checkRateLimit(
  key: string,
  limit: number,
  window: number,
  now: number
): { allowed: boolean; retryAfter?: number } {
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + window,
    })
    return { allowed: true }
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000) 
    }
  }

  if (record.count >= limit) {
    // Exponential backoff for repeat offenders
    const blockDuration = Math.min(window * 2, 86400000) // Max 24 hours
    record.blockedUntil = now + blockDuration
    return { 
      allowed: false, 
      retryAfter: Math.ceil(blockDuration / 1000) 
    }
  }

  record.count++
  return { allowed: true }
}

// Honeypot validation
export function validateHoneypot(data: any, startTime: number): {
  valid: boolean
  reason?: string
} {
  const now = Date.now()
  const submissionTime = now - startTime

  // Check if form was filled too quickly (bot behavior)
  if (submissionTime < SECURITY_CONFIG.honeypot.timeThreshold) {
    return { valid: false, reason: 'Form submitted too quickly' }
  }

  // Check honeypot fields
  for (const field of SECURITY_CONFIG.honeypot.fields) {
    if (data[field]) {
      // Track honeypot triggers
      const ipAddress = data.ipAddress || 'unknown'
      honeypotTriggers.set(ipAddress, (honeypotTriggers.get(ipAddress) || 0) + 1)
      return { valid: false, reason: 'Invalid form submission detected' }
    }
  }

  return { valid: true }
}

// Generate fingerprint for tracking
export async function generateFingerprint(
  ipAddress: string,
  userAgent: string,
  acceptLanguage?: string
): Promise<string> {
  const data = `${ipAddress}|${userAgent}|${acceptLanguage || ''}`
  return createHash('sha256').update(data).digest('hex')
}

// Security headers for responses
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  // Remove any potential XSS attempts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// Logging for security monitoring
export async function logSecurityEvent(
  event: 'validation_failed' | 'submission_failed' | 'honeypot_triggered' | 'rate_limit_exceeded' | 'suspicious_activity',
  details: {
    ipAddress: string
    userAgent?: string
    inviteCode?: string
    email?: string
    reason?: string
    fingerprint?: string
  }
) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    event,
    ...details,
  }

  // In production, send to logging service
  if (SECURITY_CONFIG.logging[event] || SECURITY_CONFIG.logging.suspicious) {
    console.log('[SECURITY]', JSON.stringify(logEntry))
  }

  // Track patterns for adaptive security
  if (event === 'suspicious_activity' || event === 'honeypot_triggered') {
    suspiciousIPs.add(details.ipAddress)
  }
}

// Validate request origin
export async function validateRequestOrigin(request: Request): Promise<boolean> {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // In production, check against allowed origins
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
    if (origin && !allowedOrigins.includes(origin)) {
      return false
    }
  }

  return true
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
      rateLimitStore.delete(key)
    }
  }
}, 300000) // Clean up every 5 minutes