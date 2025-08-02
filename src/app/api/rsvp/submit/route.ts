import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  getClientIP,
  getUserAgent,
  verifyRSVPSession,
  formatErrorResponse,
  formatSuccessResponse,
} from '@/lib/rsvp-utils'
import {
  enhancedRateLimit,
  rsvpSubmissionSchema,
  generateFingerprint,
  getSecurityHeaders,
  logSecurityEvent,
  validateRequestOrigin,
  validateHoneypot,
  sanitizeInput,
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

    // Verify fingerprint matches session
    const sessionFingerprint = request.cookies.get('rsvp_fp')?.value
    if (sessionFingerprint && sessionFingerprint !== fingerprint) {
      await logSecurityEvent('suspicious_activity', {
        ipAddress: ip,
        userAgent,
        reason: 'Fingerprint mismatch',
        fingerprint,
      })
    }

    // Parse and validate request body
    let validatedData: any
    let submissionTime: number
    try {
      const body = await request.json()
      submissionTime = body.submissionTime || 0
      validatedData = rsvpSubmissionSchema.parse(body)
    } catch (error) {
      await logSecurityEvent('submission_failed', {
        ipAddress: ip,
        userAgent,
        reason: 'Invalid input format',
        fingerprint,
      })
      return NextResponse.json(
        formatErrorResponse('Invalid submission data', 'INVALID_DATA'),
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Validate honeypot
    const honeypotResult = validateHoneypot(validatedData, submissionTime)
    if (!honeypotResult.valid) {
      await logSecurityEvent('honeypot_triggered', {
        ipAddress: ip,
        userAgent,
        reason: honeypotResult.reason,
        fingerprint,
      })
      // Return success to confuse bots
      return NextResponse.json(
        formatSuccessResponse({
          message: 'Thank you for your RSVP!',
        }, 'RSVP submitted successfully'),
        { status: 200, headers: getSecurityHeaders() }
      )
    }

    // Enhanced rate limiting with email
    const rateLimitResult = await enhancedRateLimit(
      `rsvp-submit:${fingerprint}`,
      SECURITY_CONFIG.rateLimit.submission,
      ip,
      validatedData.email
    )
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent('rate_limit_exceeded', {
        ipAddress: ip,
        userAgent,
        email: validatedData.email,
        reason: rateLimitResult.reason,
        fingerprint,
      })
      
      return NextResponse.json(
        formatErrorResponse(
          rateLimitResult.reason || 'Too many submissions. Please try again later.',
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

    // Verify session
    const sessionToken = request.cookies.get('rsvp_session')?.value
    if (!sessionToken) {
      await logSecurityEvent('submission_failed', {
        ipAddress: ip,
        userAgent,
        reason: 'No session token',
        fingerprint,
      })
      return NextResponse.json(
        formatErrorResponse('Session expired. Please enter your invite code again.', 'SESSION_EXPIRED'),
        { status: 401, headers: getSecurityHeaders() }
      )
    }

    const sessionValid = await verifyRSVPSession(sessionToken)
    if (!sessionValid) {
      await logSecurityEvent('submission_failed', {
        ipAddress: ip,
        userAgent,
        reason: 'Invalid session',
        fingerprint,
      })
      return NextResponse.json(
        formatErrorResponse('Invalid or expired session', 'INVALID_SESSION'),
        { status: 401, headers: getSecurityHeaders() }
      )
    }

    // Sanitize text inputs
    const sanitizedData = {
      ...validatedData,
      dietaryRestrictions: validatedData.dietaryRestrictions ? 
        sanitizeInput(validatedData.dietaryRestrictions) : null,
      plusOneName: validatedData.plusOneName ? 
        sanitizeInput(validatedData.plusOneName) : null,
      plusOneDietaryRestrictions: validatedData.plusOneDietaryRestrictions ? 
        sanitizeInput(validatedData.plusOneDietaryRestrictions) : null,
      notes: validatedData.notes ? 
        sanitizeInput(validatedData.notes) : null,
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get session ID from session token
    const { data: session, error: sessionError } = await supabase
      .from('rsvp_sessions')
      .select('id, guest_id')
      .eq('session_token', sessionToken)
      .single()

    if (sessionError || !session) {
      await logSecurityEvent('submission_failed', {
        ipAddress: ip,
        userAgent,
        reason: 'Session not found',
        fingerprint,
      })
      return NextResponse.json(
        formatErrorResponse('Session not found', 'SESSION_NOT_FOUND'),
        { status: 404, headers: getSecurityHeaders() }
      )
    }

    // Verify guest ID matches session
    if (session.guest_id !== sanitizedData.guestId) {
      await logSecurityEvent('suspicious_activity', {
        ipAddress: ip,
        userAgent,
        reason: 'Guest ID mismatch',
        fingerprint,
      })
      return NextResponse.json(
        formatErrorResponse('Invalid submission', 'INVALID_GUEST'),
        { status: 403, headers: getSecurityHeaders() }
      )
    }

    // Submit RSVP response using the stored procedure
    const { data, error } = await supabase.rpc('submit_rsvp_response', {
      p_guest_id: sanitizedData.guestId,
      p_session_id: session.id,
      p_attendance_status: sanitizedData.attending ? 'attending' : 'not_attending',
      p_meal_preference: sanitizedData.attending ? sanitizedData.mealChoice : null,
      p_dietary_restrictions: sanitizedData.dietaryRestrictions,
      p_dietary_allergies: null,
      p_plus_one_attending: sanitizedData.plusOneAttending || false,
      p_plus_one_name: sanitizedData.plusOneName,
      p_plus_one_meal: sanitizedData.plusOneMealChoice,
      p_plus_one_dietary: sanitizedData.plusOneDietaryRestrictions,
      p_special_requests: sanitizedData.notes,
      p_contact_email: sanitizedData.email,
      p_contact_phone: sanitizedData.phone,
    })

    if (error) {
      console.error('Error submitting RSVP:', error)
      await logSecurityEvent('submission_failed', {
        ipAddress: ip,
        userAgent,
        email: sanitizedData.email,
        reason: 'Database error',
        fingerprint,
      })
      return NextResponse.json(
        formatErrorResponse('Failed to submit RSVP. Please try again.', 'SUBMISSION_ERROR'),
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Get limited guest info for response
    const { data: updatedGuest } = await supabase
      .from('wedding_guests')
      .select('id, first_name, last_name')
      .eq('id', sanitizedData.guestId)
      .single()

    // Clear rate limit on successful submission
    const response = NextResponse.json(
      formatSuccessResponse({
        responseId: data,
        guest: updatedGuest ? {
          firstName: updatedGuest.first_name,
          lastName: updatedGuest.last_name,
        } : null,
        message: sanitizedData.attending
          ? 'Thank you for confirming your attendance! We look forward to celebrating with you.'
          : 'Thank you for letting us know. We\'ll miss you at the celebration.',
      }, 'RSVP submitted successfully'),
      { status: 200, headers: getSecurityHeaders() }
    )

    // Clear session cookies after successful submission
    response.cookies.delete('rsvp_session')
    response.cookies.delete('rsvp_fp')

    return response
  } catch (error) {
    console.error('Error submitting RSVP:', error)
    await logSecurityEvent('submission_failed', {
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      reason: 'Server error',
    })
    
    return NextResponse.json(
      formatErrorResponse('Unable to process your RSVP. Please try again later.', 'SERVER_ERROR'),
      { status: 500, headers: getSecurityHeaders() }
    )
  }
}