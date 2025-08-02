# RSVP System Security Requirements

## Overview
This document outlines the security requirements and implementation guidelines for the wedding planner RSVP system. The system must balance accessibility (no user accounts required) with security to protect guest privacy and prevent abuse.

## 1. Authentication & Authorization

### 1.1 Invite Code Security
- **Format**: 6-character alphanumeric (A-Z0-9)
- **Generation**: Cryptographically secure random generation
- **Uniqueness**: Database constraint ensures no duplicates
- **Case Handling**: Store uppercase, accept case-insensitive input
- **No Sequential Codes**: Avoid patterns like ABC123, 123456

```typescript
// Secure code generation
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const crypto = require('crypto')
  let code = ''
  
  // Use crypto.randomBytes for secure randomness
  const bytes = crypto.randomBytes(6)
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length]
  }
  
  return code
}
```

### 1.2 Session Management
- **Session Token**: JWT or secure session ID
- **Expiration**: 2-hour sliding window
- **Storage**: HTTP-only, Secure, SameSite cookies
- **Refresh**: Automatic refresh on activity
- **Invalidation**: Clear on logout or suspicious activity

```typescript
interface RSVPSessionToken {
  guestId: string
  inviteCode: string
  issuedAt: number
  expiresAt: number
  ipAddress: string
  fingerprint: string // Browser fingerprint for additional validation
}
```

## 2. Rate Limiting & Abuse Prevention

### 2.1 Code Validation Rate Limits
```typescript
const rateLimits = {
  perIP: {
    attempts: 5,
    window: '1 hour',
    blockDuration: '1 hour'
  },
  perCode: {
    attempts: 10,
    window: '24 hours',
    blockDuration: '24 hours'
  },
  global: {
    attempts: 1000,
    window: '1 hour'
  }
}
```

### 2.2 Progressive Delays
```typescript
function calculateDelay(attemptNumber: number): number {
  // Exponential backoff: 0s, 2s, 4s, 8s, 16s
  return Math.min(Math.pow(2, attemptNumber - 1) * 1000, 16000)
}
```

### 2.3 CAPTCHA Integration
- **Trigger**: After 3 failed attempts
- **Type**: reCAPTCHA v3 or hCaptcha
- **Fallback**: Simple math challenge for accessibility

## 3. Data Privacy & Protection

### 3.1 Personal Data Handling
- **Minimal Collection**: Only collect necessary data
- **Encryption at Rest**: Encrypt sensitive fields (email, phone)
- **Encryption in Transit**: Enforce HTTPS everywhere
- **Data Retention**: Clear session data after 30 days
- **GDPR Compliance**: Right to access, modify, delete

### 3.2 URL Security
- **No PII in URLs**: Use session-based state management
- **Opaque IDs**: Don't expose database IDs
- **URL Expiration**: Time-limited tokens for email links

### 3.3 Database Security
```sql
-- Row Level Security for guests table
CREATE POLICY "Guests can only view their own data"
  ON wedding_guests
  FOR SELECT
  USING (
    -- Either authenticated as couple who owns the wedding
    (auth.uid() IN (
      SELECT partner1_user_id FROM wedding_couples WHERE id = couple_id
      UNION
      SELECT partner2_user_id FROM wedding_couples WHERE id = couple_id
    ))
    OR
    -- Or accessing via valid RSVP session
    (current_setting('app.current_invite_code', true) = invite_code)
  );
```

## 4. Input Validation & Sanitization

### 4.1 Invite Code Validation
```typescript
function validateInviteCode(code: string): boolean {
  // Remove spaces and convert to uppercase
  const cleaned = code.replace(/\s/g, '').toUpperCase()
  
  // Check format: exactly 6 alphanumeric characters
  if (!/^[A-Z0-9]{6}$/.test(cleaned)) {
    return false
  }
  
  // Check against common patterns to avoid
  const blacklistedPatterns = [
    /^(.)\1{5}$/,        // AAAAAA
    /^123456$/,          // 123456
    /^ABCDEF$/,          // ABCDEF
    /^([A-Z0-9])\1{2,}/, // AAA...
  ]
  
  return !blacklistedPatterns.some(pattern => pattern.test(cleaned))
}
```

### 4.2 Form Input Sanitization
```typescript
const sanitizeRules = {
  name: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    sanitize: (input: string) => input.trim().replace(/<[^>]*>/g, '')
  },
  email: {
    maxLength: 255,
    validate: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    normalize: (email: string) => email.toLowerCase().trim()
  },
  phone: {
    maxLength: 20,
    sanitize: (phone: string) => phone.replace(/[^\d\s\-\+\(\)]/g, '')
  },
  notes: {
    maxLength: 500,
    sanitize: (text: string) => {
      // Remove HTML tags but keep line breaks
      return text
        .replace(/<[^>]*>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }
  }
}
```

## 5. CSRF Protection

### 5.1 Token Generation
```typescript
// Generate CSRF token for session
function generateCSRFToken(sessionId: string): string {
  const secret = process.env.CSRF_SECRET
  return crypto
    .createHmac('sha256', secret)
    .update(sessionId)
    .digest('hex')
}
```

### 5.2 Token Validation
- **Double Submit**: Token in cookie and request header
- **Origin Check**: Validate request origin
- **Referer Check**: Validate referer header

## 6. Security Headers

```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.supabase.co",
    "frame-src https://www.google.com/recaptcha/",
  ].join('; ')
}
```

## 7. Audit Logging

### 7.1 Events to Log
```typescript
enum RSVPAuditEvent {
  CODE_VALIDATION_ATTEMPT = 'code_validation_attempt',
  CODE_VALIDATION_SUCCESS = 'code_validation_success',
  CODE_VALIDATION_FAILURE = 'code_validation_failure',
  RSVP_VIEWED = 'rsvp_viewed',
  RSVP_UPDATED = 'rsvp_updated',
  RSVP_CONFIRMED = 'rsvp_confirmed',
  SESSION_CREATED = 'session_created',
  SESSION_EXPIRED = 'session_expired',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}
```

### 7.2 Log Structure
```typescript
interface AuditLog {
  id: string
  timestamp: Date
  event: RSVPAuditEvent
  guestId?: string
  inviteCode?: string
  ipAddress: string
  userAgent: string
  success: boolean
  metadata: {
    attemptNumber?: number
    changes?: Record<string, any>
    errorCode?: string
    [key: string]: any
  }
}
```

## 8. API Security

### 8.1 API Rate Limiting
```typescript
const apiRateLimits = {
  '/api/rsvp/validate-code': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
  },
  '/api/rsvp/*/response': {
    windowMs: 15 * 60 * 1000,
    max: 10
  },
  '/api/rsvp/*/meal-options': {
    windowMs: 15 * 60 * 1000,
    max: 20
  }
}
```

### 8.2 Request Validation Middleware
```typescript
async function validateRSVPRequest(req: Request, res: Response, next: NextFunction) {
  // Check session validity
  const session = await validateSession(req.cookies.rsvp_session)
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' })
  }
  
  // Check CSRF token
  const csrfToken = req.headers['x-csrf-token']
  if (!validateCSRFToken(session.id, csrfToken)) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  
  // Check rate limits
  const rateLimitCheck = await checkRateLimit(req.ip, req.path)
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: rateLimitCheck.retryAfter
    })
  }
  
  // Attach validated session to request
  req.rsvpSession = session
  next()
}
```

## 9. Error Handling

### 9.1 Safe Error Messages
```typescript
const safeErrorMessages = {
  INVALID_CODE: 'The invite code you entered is not valid. Please check and try again.',
  CODE_NOT_FOUND: 'We could not find an invitation with that code.',
  RATE_LIMITED: 'Too many attempts. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please enter your invite code again.',
  ALREADY_RESPONDED: 'You have already submitted your RSVP. Would you like to update it?',
  SYSTEM_ERROR: 'We encountered an error. Please try again or contact the couple.'
}

// Never expose internal error details
function getSafeErrorMessage(error: any): string {
  if (error.code === 'RATE_LIMIT_EXCEEDED') return safeErrorMessages.RATE_LIMITED
  if (error.code === 'INVALID_CODE') return safeErrorMessages.INVALID_CODE
  // ... other mappings
  
  // Log the actual error internally
  console.error('RSVP Error:', error)
  
  // Return generic message to user
  return safeErrorMessages.SYSTEM_ERROR
}
```

## 10. Monitoring & Alerts

### 10.1 Security Metrics
- **Failed Login Attempts**: Alert on spike (>50/hour)
- **Rate Limit Hits**: Monitor for DDoS attempts
- **Invalid Sessions**: Track expired/invalid sessions
- **Suspicious Patterns**: Multiple codes from same IP
- **Error Rates**: Alert on high error rates

### 10.2 Alert Thresholds
```typescript
const alertThresholds = {
  failedAttempts: {
    count: 50,
    window: '1 hour',
    action: 'email_admin'
  },
  rateLimitHits: {
    count: 100,
    window: '5 minutes',
    action: 'block_ip_range'
  },
  errorRate: {
    percentage: 5,
    window: '10 minutes',
    action: 'page_oncall'
  }
}
```

## 11. Security Checklist

### Pre-Launch
- [ ] HTTPS enabled and enforced
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] CAPTCHA integrated
- [ ] Session management tested
- [ ] Input validation complete
- [ ] CSRF protection active
- [ ] Audit logging enabled
- [ ] Error messages sanitized
- [ ] Monitoring configured

### Post-Launch
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Log analysis
- [ ] Update dependencies
- [ ] Review access patterns
- [ ] Update rate limits
- [ ] Review error logs
- [ ] Check for anomalies

## 12. Incident Response

### 12.1 Security Incident Types
1. **Brute Force Attack**: Mass code guessing
2. **Data Breach**: Unauthorized data access
3. **DDoS Attack**: Service overload
4. **Session Hijacking**: Stolen sessions
5. **XSS/Injection**: Code injection attempts

### 12.2 Response Plan
1. **Detect**: Monitoring alerts trigger
2. **Assess**: Determine severity and scope
3. **Contain**: Block attacking IPs/disable features
4. **Investigate**: Analyze logs and patterns
5. **Remediate**: Fix vulnerabilities
6. **Recover**: Restore normal operation
7. **Document**: Record incident details
8. **Review**: Update security measures