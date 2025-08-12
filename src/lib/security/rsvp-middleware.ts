import { NextRequest, NextResponse } from 'next/server'
import { RSVPRateLimiter } from './rsvp-rate-limiter'

/**
 * RSVP Security Middleware
 * Enforces rate limiting and IP blocking for public RSVP endpoints
 */
export async function rsvpSecurityMiddleware(
  request: NextRequest,
  invitationCode?: string
): Promise<NextResponse | null> {
  try {
    // Check rate limits and IP blocklist
    const rateLimitResult = await RSVPRateLimiter.checkRateLimit(request, invitationCode)
    
    if (!rateLimitResult.allowed) {
      // Create appropriate response based on block reason
      const response = createRateLimitResponse(rateLimitResult)
      
      // Add security headers
      response.headers.set('X-RateLimit-Limit', RSVPRateLimiter['MAX_ATTEMPTS_PER_IP'].toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.attemptsRemaining.toString())
      
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', Math.ceil((rateLimitResult.retryAfter.getTime() - Date.now()) / 1000).toString())
      }
      
      return response
    }
    
    // Request is allowed - return null to continue processing
    return null
    
  } catch (error) {
    console.error('RSVP middleware error:', error)
    
    // Log error but don't block request (fail open)
    return null
  }
}

/**
 * Create appropriate response for rate limit violations
 */
function createRateLimitResponse(rateLimitResult: any): NextResponse {
  const statusCode = 429 // Too Many Requests
  
  let message: string
  let details: any = {}
  
  switch (rateLimitResult.reason) {
    case 'ip_blocked':
      message = 'Your IP address has been temporarily blocked due to suspicious activity. Please contact support if you believe this is an error.'
      details = { 
        reason: 'ip_blocked',
        contact: 'support@example.com' // TODO: Replace with actual support contact
      }
      break
      
    case 'rate_limit_exceeded':
      message = 'Too many RSVP attempts. Please wait before trying again.'
      details = { 
        reason: 'rate_limit_exceeded',
        attemptsRemaining: rateLimitResult.attemptsRemaining
      }
      
      if (rateLimitResult.retryAfter) {
        const waitMinutes = Math.ceil((rateLimitResult.retryAfter.getTime() - Date.now()) / 60000)
        details.retryAfterMinutes = waitMinutes
      }
      break
      
    default:
      message = 'Request blocked due to security restrictions.'
      details = { reason: 'security_restriction' }
  }
  
  return NextResponse.json(
    { 
      error: message,
      details,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  )
}

/**
 * Add security headers to successful RSVP responses
 */
export function addSecurityHeaders(response: NextResponse, attemptsRemaining: number): NextResponse {
  // Rate limit headers
  response.headers.set('X-RateLimit-Limit', RSVPRateLimiter['MAX_ATTEMPTS_PER_IP'].toString())
  response.headers.set('X-RateLimit-Remaining', attemptsRemaining.toString())
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Cache control for RSVP endpoints
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

/**
 * Validate invitation code format
 */
export function validateInvitationCode(code: string): boolean {
  // Basic validation - code should be alphanumeric and reasonable length
  if (!code || typeof code !== 'string') {
    return false
  }
  
  // Allow alphanumeric codes, hyphens, and underscores, 3-50 characters
  const codeRegex = /^[a-zA-Z0-9\-_]{3,50}$/
  return codeRegex.test(code)
}

/**
 * Sanitize RSVP form data
 */
export function sanitizeRSVPData(data: any): any {
  // Remove any potentially harmful fields
  const sanitized: any = {}
  
  // Allowed fields for RSVP updates
  const allowedFields = [
    'rsvpStatus', 
    'attendingStatus',
    'dietaryNotes', 
    'dietaryRestrictions',
    'specialRequests', 
    'notes',
    'plusOneAttending',
    'plusOneAttending'
  ]
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      // Basic sanitization
      let value = data[field]
      
      if (typeof value === 'string') {
        // Trim whitespace and limit length
        value = value.trim().slice(0, 1000) // Max 1000 chars
        
        // Remove potentially dangerous characters
        value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        value = value.replace(/javascript:/gi, '')
        value = value.replace(/on\w+=/gi, '')
      }
      
      sanitized[field] = value
    }
  }
  
  return sanitized
}

/**
 * Check if request appears to be from a bot
 */
export function detectBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  // Common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /node/i
  ]
  
  // Check if user agent matches bot patterns
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return true
    }
  }
  
  // Check for missing common browser headers
  const hasAccept = request.headers.has('accept')
  const hasAcceptLanguage = request.headers.has('accept-language')
  const hasAcceptEncoding = request.headers.has('accept-encoding')
  
  // Browsers typically send these headers
  if (!hasAccept || !hasAcceptLanguage || !hasAcceptEncoding) {
    return true
  }
  
  return false
}

/**
 * Honeypot validation - check for hidden fields that should not be filled
 */
export function validateHoneypot(data: any): boolean {
  // Common honeypot field names
  const honeypotFields = [
    'email_confirm',
    'phone_check', 
    'name_verify',
    'website',
    'url',
    'comment',
    'message_extra'
  ]
  
  for (const field of honeypotFields) {
    if (data[field] && data[field].trim() !== '') {
      return false // Honeypot field was filled - likely a bot
    }
  }
  
  return true
}