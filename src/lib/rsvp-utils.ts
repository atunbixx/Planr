import { headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { nanoid } from 'nanoid'

export interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
}

export interface ValidationResult {
  valid: boolean
  error?: string
  guestId?: string
  coupleId?: string
}

// In-memory rate limiter (for demo - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): Promise<RateLimitResult> {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true }
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  record.count++
  return { allowed: true }
}

export async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIP = headersList.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  return '127.0.0.1'
}

export async function getUserAgent(): Promise<string> {
  const headersList = await headers()
  return headersList.get('user-agent') || 'unknown'
}

export function generateSessionToken(): string {
  return nanoid(32)
}

export async function validateInviteCode(code: string): Promise<ValidationResult> {
  if (!code || code.length < 3) {
    return { valid: false, error: 'Invalid invite code format' }
  }

  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: guest, error } = await supabase
    .from('wedding_guests')
    .select('id, couple_id')
    .eq('invite_code', code.toUpperCase())
    .single()

  if (error || !guest) {
    return { valid: false, error: 'Invalid invitation code' }
  }

  return {
    valid: true,
    guestId: guest.id,
    coupleId: guest.couple_id,
  }
}

export async function createRSVPSession(
  inviteCode: string,
  guestId: string,
  coupleId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ sessionId: string; sessionToken: string } | null> {
  const supabase = createRouteHandlerClient({ cookies })
  const sessionToken = generateSessionToken()

  const { data, error } = await supabase
    .from('rsvp_sessions')
    .insert({
      couple_id: coupleId,
      guest_id: guestId,
      invite_code: inviteCode.toUpperCase(),
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      access_status: 'success',
      device_type: detectDeviceType(userAgent),
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Error creating RSVP session:', error)
    return null
  }

  return {
    sessionId: data.id,
    sessionToken,
  }
}

export async function verifyRSVPSession(sessionToken: string): Promise<boolean> {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data, error } = await supabase
    .from('rsvp_sessions')
    .select('id, last_accessed_at')
    .eq('session_token', sessionToken)
    .single()

  if (error || !data) {
    return false
  }

  // Check if session is still valid (2 hours)
  const lastAccessed = new Date(data.last_accessed_at)
  const now = new Date()
  const hoursSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60)

  if (hoursSinceAccess > 2) {
    return false
  }

  // Update last accessed time
  await supabase
    .from('rsvp_sessions')
    .update({ last_accessed_at: now.toISOString() })
    .eq('id', data.id)

  return true
}

export function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }
  
  if (/ipad|tablet|kindle/i.test(ua)) {
    return 'tablet'
  }
  
  if (/windows|macintosh|linux/i.test(ua)) {
    return 'desktop'
  }
  
  return 'unknown'
}

export function formatErrorResponse(message: string, code?: string) {
  return {
    error: {
      message,
      code: code || 'RSVP_ERROR',
    },
  }
}

export function formatSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    message,
    data,
  }
}

export async function trackAccessAttempt(
  inviteCode: string,
  ipAddress: string,
  userAgent: string,
  status: 'success' | 'invalid_code' | 'blocked'
) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    await supabase.from('rsvp_sessions').insert({
      couple_id: '00000000-0000-0000-0000-000000000000', // Placeholder for failed attempts
      invite_code: inviteCode.toUpperCase(),
      ip_address: ipAddress,
      user_agent: userAgent,
      access_status: status,
      device_type: detectDeviceType(userAgent),
    })
  } catch (error) {
    console.error('Error tracking access attempt:', error)
  }
}