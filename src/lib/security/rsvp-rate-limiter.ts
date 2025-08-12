import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

interface RateLimitResult {
  allowed: boolean
  reason?: string
  retryAfter?: Date
  attemptsRemaining: number
}

interface SecurityAuditData {
  ip_address: string
  invitationCode?: string
  eventType: 'rate_limit_exceeded' | 'blocked_access' | 'suspicious_activity' | 'rsvp_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userAgent?: string
  request_headers?: Record<string, string>
  request_path?: string
  response_status?: number
  details?: Record<string, any>
}

export class RSVPRateLimiter {
  private static readonly MAX_ATTEMPTS_PER_IP = 5
  private static readonly MAX_ATTEMPTS_PER_CODE = 10
  private static readonly WINDOW_MINUTES = 60
  private static readonly SUSPICIOUS_THRESHOLD = 20 // Attempts that trigger investigation

  /**
   * Check if an IP address is allowed to make RSVP requests
   */
  static async checkRateLimit(
    request: NextRequest,
    invitationCode?: string
  ): Promise<RateLimitResult> {
    const ipAddress = this.getClientIP(request)
    
    try {
      // First check if IP is in blocklist
      const isBlocked = await this.isIPBlocked(ipAddress)
      if (isBlocked) {
        await this.logSecurityEvent({
          ip_address: ipAddress,
          invitationCode: invitationCode,
          eventType: 'blocked_access',
          severity: 'high',
          userAgent: request.headers.get('user-agent') || undefined,
          request_path: request.nextUrl.pathname,
          response_status: 429,
          details: { reason: 'ip_in_blocklist' }
        })
        
        return {
          allowed: false,
          reason: 'ip_blocked',
          attemptsRemaining: 0
        }
      }

      // Check rate limits using database function
      const result = await prisma.$queryRaw<Array<{ check_rsvp_rate_limit: any }>>`
        SELECT check_rsvp_rate_limit(
          ${ipAddress}::inet,
          ${invitationCode || null}::varchar,
          ${this.MAX_ATTEMPTS_PER_IP}::integer,
          ${this.WINDOW_MINUTES}::integer
        ) as check_rsvp_rate_limit
      `

      const rateLimitResult = result[0]?.check_rsvp_rate_limit

      if (!rateLimitResult.allowed) {
        // Check if this IP should be automatically blocked
        await this.checkForSuspiciousActivity(ipAddress, invitationCode, request)
        
        return {
          allowed: false,
          reason: rateLimitResult.reason,
          retryAfter: rateLimitResult.retry_after ? new Date(rateLimitResult.retry_after) : undefined,
          attemptsRemaining: rateLimitResult.attempts_remaining
        }
      }

      // Log successful rate limit check
      await this.logSecurityEvent({
        ip_address: ipAddress,
        invitationCode: invitationCode,
        eventType: 'rsvp_attempt',
        severity: 'low',
        userAgent: request.headers.get('user-agent') || undefined,
        request_path: request.nextUrl.pathname,
        details: { 
          attempts_remaining: rateLimitResult.attempts_remaining,
          allowed: true 
        }
      })

      return {
        allowed: true,
        attemptsRemaining: rateLimitResult.attempts_remaining
      }

    } catch (error) {
      console.error('Rate limiting error:', error)
      
      // Log the error and allow the request (fail open)
      await this.logSecurityEvent({
        ip_address: ipAddress,
        invitationCode: invitationCode,
        eventType: 'suspicious_activity',
        severity: 'medium',
        userAgent: request.headers.get('user-agent') || undefined,
        request_path: request.nextUrl.pathname,
        details: { 
          error: 'rate_limiter_error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      // Fail open - allow request when rate limiter fails
      return {
        allowed: true,
        attemptsRemaining: this.MAX_ATTEMPTS_PER_IP
      }
    }
  }

  /**
   * Extract client IP address from request
   */
  private static getClientIP(request: NextRequest): string {
    // Check various headers for client IP (in order of preference)
    const xForwardedFor = request.headers.get('x-forwarded-for')
    const xRealIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    if (xRealIP) {
      return xRealIP
    }
    
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return xForwardedFor.split(',')[0].trim()
    }
    
    // Fallback to a default IP if none found (shouldn't happen in production)
    return '127.0.0.1'
  }

  /**
   * Check if an IP address is in the blocklist
   */
  private static async isIPBlocked(ipAddress: string): Promise<boolean> {
    try {
      const blocked = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS(
          SELECT 1 FROM rsvp_ip_blocklist 
          WHERE ip_address = ${ipAddress}::inet 
          AND (blocked_until IS NULL OR blocked_until > now())
        ) as exists
      `
      
      return blocked[0]?.exists || false
    } catch (error) {
      console.error('Error checking IP blocklist:', error)
      return false // Fail open
    }
  }

  /**
   * Check for suspicious activity and auto-block if needed
   */
  private static async checkForSuspiciousActivity(
    ipAddress: string,
    invitationCode: string | undefined,
    request: NextRequest
  ): Promise<void> {
    try {
      // Count recent attempts from this IP
      const recentAttempts = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count
        FROM rsvp_security_audit 
        WHERE ip_address = ${ipAddress}::inet 
        AND createdAt > now() - INTERVAL '1 hour'
        AND eventType IN ('rate_limit_exceeded', 'rsvp_attempt')
      `

      const attemptCount = Number(recentAttempts[0]?.count || 0)

      if (attemptCount >= this.SUSPICIOUS_THRESHOLD) {
        // Auto-block for 24 hours
        await this.addIPToBlocklist(
          ipAddress,
          `Automatic block: ${attemptCount} attempts in 1 hour`,
          24,
          'system'
        )

        await this.logSecurityEvent({
          ip_address: ipAddress,
          invitationCode: invitationCode,
          eventType: 'suspicious_activity',
          severity: 'critical',
          userAgent: request.headers.get('user-agent') || undefined,
          request_path: request.nextUrl.pathname,
          details: {
            reason: 'auto_blocked',
            attempt_count: attemptCount,
            threshold: this.SUSPICIOUS_THRESHOLD,
            block_duration_hours: 24
          }
        })
      }
    } catch (error) {
      console.error('Error checking suspicious activity:', error)
    }
  }

  /**
   * Add an IP address to the blocklist
   */
  static async addIPToBlocklist(
    ipAddress: string,
    reason: string,
    durationHours?: number,
    createdBy: string = 'system'
  ): Promise<string | null> {
    try {
      const result = await prisma.$queryRaw<Array<{ add_ip_to_blocklist: string }>>`
        SELECT add_ip_to_blocklist(
          ${ipAddress}::inet,
          ${reason}::varchar,
          ${durationHours || null}::integer,
          ${createdBy}::varchar
        ) as add_ip_to_blocklist
      `

      return result[0]?.add_ip_to_blocklist || null
    } catch (error) {
      console.error('Error adding IP to blocklist:', error)
      return null
    }
  }

  /**
   * Remove an IP address from the blocklist
   */
  static async removeIPFromBlocklist(ipAddress: string): Promise<boolean> {
    try {
      await prisma.$executeRaw`
        DELETE FROM rsvp_ip_blocklist 
        WHERE ip_address = ${ipAddress}::inet
      `
      
      await this.logSecurityEvent({
        ip_address: ipAddress,
        eventType: 'suspicious_activity',
        severity: 'low',
        details: { reason: 'ip_unblocked' }
      })
      
      return true
    } catch (error) {
      console.error('Error removing IP from blocklist:', error)
      return false
    }
  }

  /**
   * Log security events for audit purposes
   */
  private static async logSecurityEvent(data: SecurityAuditData): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO rsvp_security_audit (
          ip_address, invitationCode, eventType, severity, 
          userAgent, request_headers, request_path, response_status, details
        ) VALUES (
          ${data.ip_address}::inet,
          ${data.invitationCode || null},
          ${data.eventType},
          ${data.severity},
          ${data.userAgent || null},
          ${data.request_headers ? JSON.stringify(data.request_headers) : null}::jsonb,
          ${data.request_path || null},
          ${data.response_status || null},
          ${data.details ? JSON.stringify(data.details) : null}::jsonb
        )
      `
    } catch (error) {
      // Don't throw error for logging failures, just log it
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Get rate limit stats for an IP address
   */
  static async getRateLimitStats(ipAddress: string): Promise<any> {
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          attempt_count,
          first_attempt_at,
          last_attempt_at,
          window_start,
          (SELECT blocked_until FROM rsvp_ip_blocklist WHERE ip_address = ${ipAddress}::inet) as blocked_until
        FROM rsvp_rate_limits 
        WHERE ip_address = ${ipAddress}::inet 
        AND window_start > now() - INTERVAL '1 hour'
        ORDER BY createdAt DESC 
        LIMIT 1
      `
      
      return stats
    } catch (error) {
      console.error('Error getting rate limit stats:', error)
      return null
    }
  }

  /**
   * Clean up old rate limit records (should be run periodically)
   */
  static async cleanupOldRecords(hoursOld: number = 24): Promise<number> {
    try {
      const result = await prisma.$queryRaw<Array<{ cleanup_rsvp_rate_limits: number }>>`
        SELECT cleanup_rsvp_rate_limits(${hoursOld}::integer) as cleanup_rsvp_rate_limits
      `
      
      return result[0]?.cleanup_rsvp_rate_limits || 0
    } catch (error) {
      console.error('Error cleaning up rate limit records:', error)
      return 0
    }
  }
}