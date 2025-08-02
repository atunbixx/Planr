import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  getClientIP,
  getUserAgent,
  validateInviteCode,
  createRSVPSession,
  formatErrorResponse,
  formatSuccessResponse,
  trackAccessAttempt,
} from '@/lib/rsvp-utils'
import {
  enhancedRateLimit,
  inviteCodeSchema,
  generateFingerprint,
  getSecurityHeaders,
  logSecurityEvent,
  validateRequestOrigin,
  SECURITY_CONFIG,
} from '@/lib/rsvp-security'

export async function POST(request: NextRequest) {
  try {
    // Validate request origin
    const validOrigin = await validateRequestOrigin(request)
    if (!validOrigin) {
      return NextResponse.json(
        formatErrorResponse('Invalid request origin', 'INVALID_ORIGIN'),
        { status: 403, headers: getSecurityHeaders() }
      )
    }

    // Get client info
    const ip = await getClientIP()
    const userAgent = await getUserAgent()
    const acceptLanguage = request.headers.get('accept-language') || undefined
    const fingerprint = await generateFingerprint(ip, userAgent, acceptLanguage)

    // Parse and validate request body
    let inviteCode: string
    try {
      const body = await request.json()
      inviteCode = inviteCodeSchema.parse(body.inviteCode)
    } catch (error) {
      await logSecurityEvent('validation_failed', {
        ipAddress: ip,
        userAgent,
        reason: 'Invalid input format',
        fingerprint,
      })
      return NextResponse.json(
        formatErrorResponse('Invalid invite code format', 'INVALID_FORMAT'),
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Enhanced rate limiting
    const rateLimitResult = await enhancedRateLimit(
      `rsvp-validate:${fingerprint}`,
      SECURITY_CONFIG.rateLimit.validation,
      ip
    )
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent('rate_limit_exceeded', {
        ipAddress: ip,
        userAgent,
        inviteCode,
        reason: rateLimitResult.reason,
        fingerprint,
      })
      await trackAccessAttempt(inviteCode, ip, userAgent, 'blocked')
      
      return NextResponse.json(
        formatErrorResponse(
          rateLimitResult.reason || 'Too many requests. Please try again later.',
          'RATE_LIMIT_EXCEEDED'
        ),
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'Retry-After': '3600', // 1 hour
          },
        }
      )
    }

    // Validate invite code
    const validation = await validateInviteCode(inviteCode)

    if (!validation.valid) {
      await logSecurityEvent('validation_failed', {
        ipAddress: ip,
        userAgent,
        inviteCode,
        reason: validation.error,
        fingerprint,
      })
      await trackAccessAttempt(inviteCode, ip, userAgent, 'invalid_code')
      
      // Generic error message to prevent code enumeration
      return NextResponse.json(
        formatErrorResponse(
          'The invite code you entered is not valid. Please check your invitation and try again.',
          'INVALID_CODE'
        ),
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Create RSVP session
    const session = await createRSVPSession(
      inviteCode,
      validation.guestId!,
      validation.coupleId!,
      ip,
      userAgent
    )

    if (!session) {
      return NextResponse.json(
        formatErrorResponse('Unable to process request. Please try again.', 'SESSION_ERROR'),
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Get guest details (limited information)
    const supabase = createRouteHandlerClient({ cookies })
    const { data: guest, error: guestError } = await supabase
      .from('wedding_guests')
      .select(`
        id,
        first_name,
        last_name,
        plus_one_allowed,
        rsvp_status,
        couple_id
      `)
      .eq('id', validation.guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        formatErrorResponse('Unable to retrieve guest information', 'GUEST_NOT_FOUND'),
        { status: 404, headers: getSecurityHeaders() }
      )
    }

    // Get meal options for the couple
    const { data: mealOptions } = await supabase
      .from('meal_options')
      .select('id, name, description, category')
      .eq('couple_id', guest.couple_id)
      .eq('is_active', true)
      .order('sort_order')

    const response = NextResponse.json(
      formatSuccessResponse({
        guest: {
          id: guest.id,
          firstName: guest.first_name,
          lastName: guest.last_name,
          plusOneAllowed: guest.plus_one_allowed,
          hasResponded: guest.rsvp_status === 'confirmed',
        },
        mealOptions: mealOptions || [],
        sessionId: session.sessionId,
        requiresCaptcha: rateLimitResult.requiresCaptcha || false,
      }, 'Welcome! Please complete your RSVP below.'),
      { status: 200, headers: getSecurityHeaders() }
    )

    // Set secure session cookie
    response.cookies.set('rsvp_session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7200, // 2 hours
      path: '/',
    })

    // Set fingerprint cookie for tracking
    response.cookies.set('rsvp_fp', fingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error validating invite code:', error)
    await logSecurityEvent('validation_failed', {
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      reason: 'Server error',
    })
    
    return NextResponse.json(
      formatErrorResponse('Unable to process request. Please try again later.', 'SERVER_ERROR'),
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}