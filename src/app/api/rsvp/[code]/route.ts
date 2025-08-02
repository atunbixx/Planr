import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  rateLimit,
  getClientIP,
  validateInviteCode,
  formatErrorResponse,
  formatSuccessResponse,
  verifyRSVPSession,
} from '@/lib/rsvp-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Rate limiting
    const ip = await getClientIP()
    const rateLimitResult = await rateLimit(`rsvp-get:${ip}`, 30, 60000) // 30 requests per minute
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        formatErrorResponse('Too many requests', 'RATE_LIMIT_EXCEEDED'),
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    const inviteCode = params.code

    if (!inviteCode) {
      return NextResponse.json(
        formatErrorResponse('Invite code is required', 'MISSING_INVITE_CODE'),
        { status: 400 }
      )
    }

    // Validate invite code
    const validation = await validateInviteCode(inviteCode)

    if (!validation.valid) {
      return NextResponse.json(
        formatErrorResponse(validation.error || 'Invalid invite code', 'INVALID_CODE'),
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get guest details
    const { data: guest, error: guestError } = await supabase
      .from('wedding_guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        plus_one_allowed,
        meal_preference,
        dietary_restrictions,
        rsvp_status,
        rsvp_date,
        plus_one_name,
        plus_one_meal_preference,
        plus_one_dietary_restrictions,
        couple_id
      `)
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        formatErrorResponse('Guest not found', 'GUEST_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Get meal options
    const { data: mealOptions } = await supabase
      .from('meal_options')
      .select('*')
      .eq('couple_id', guest.couple_id)
      .eq('is_active', true)
      .order('sort_order')

    // Get RSVP history
    const { data: rsvpHistory } = await supabase
      .from('rsvp_responses')
      .select(`
        id,
        response_version,
        attendance_status,
        response_date,
        meal_preference,
        plus_one_attending,
        plus_one_name
      `)
      .eq('guest_id', guest.id)
      .order('response_version', { ascending: false })
      .limit(5)

    return NextResponse.json(
      formatSuccessResponse({
        guest: {
          id: guest.id,
          firstName: guest.first_name,
          lastName: guest.last_name,
          email: guest.email,
          phone: guest.phone,
          plusOneAllowed: guest.plus_one_allowed,
          mealChoice: guest.meal_preference,
          dietaryRestrictions: guest.dietary_restrictions,
          rsvpStatus: guest.rsvp_status,
          rsvpDate: guest.rsvp_date,
          plusOneName: guest.plus_one_name,
          plusOneMealChoice: guest.plus_one_meal_preference,
          plusOneDietaryRestrictions: guest.plus_one_dietary_restrictions,
        },
        mealOptions: mealOptions || [],
        rsvpHistory: rsvpHistory || [],
      }, 'Guest information retrieved successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error getting guest info:', error)
    return NextResponse.json(
      formatErrorResponse('Internal server error', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Rate limiting
    const ip = await getClientIP()
    const rateLimitResult = await rateLimit(`rsvp-update:${ip}`, 10, 60000) // 10 updates per minute
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        formatErrorResponse('Too many requests', 'RATE_LIMIT_EXCEEDED'),
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        }
      )
    }

    // Verify session
    const sessionToken = request.cookies.get('rsvp_session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        formatErrorResponse('Session expired. Please enter your invite code again.', 'SESSION_EXPIRED'),
        { status: 401 }
      )
    }

    const sessionValid = await verifyRSVPSession(sessionToken)
    if (!sessionValid) {
      return NextResponse.json(
        formatErrorResponse('Invalid or expired session', 'INVALID_SESSION'),
        { status: 401 }
      )
    }

    const inviteCode = params.code

    // Validate invite code
    const validation = await validateInviteCode(inviteCode)

    if (!validation.valid) {
      return NextResponse.json(
        formatErrorResponse(validation.error || 'Invalid invite code', 'INVALID_CODE'),
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      attending,
      email,
      phone,
      mealChoice,
      dietaryRestrictions,
      plusOneAttending,
      plusOneName,
      plusOneMealChoice,
      plusOneDietaryRestrictions,
      notes,
    } = body

    const supabase = createRouteHandlerClient({ cookies })

    // Get session ID
    const { data: session } = await supabase
      .from('rsvp_sessions')
      .select('id')
      .eq('session_token', sessionToken)
      .single()

    if (!session) {
      return NextResponse.json(
        formatErrorResponse('Session not found', 'SESSION_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Update RSVP response
    const { data, error } = await supabase.rpc('submit_rsvp_response', {
      p_guest_id: validation.guestId,
      p_session_id: session.id,
      p_attendance_status: attending ? 'attending' : 'not_attending',
      p_meal_preference: attending ? mealChoice : null,
      p_dietary_restrictions: dietaryRestrictions || null,
      p_dietary_allergies: null,
      p_plus_one_attending: plusOneAttending || false,
      p_plus_one_name: plusOneName || null,
      p_plus_one_meal: plusOneMealChoice || null,
      p_plus_one_dietary: plusOneDietaryRestrictions || null,
      p_special_requests: notes || null,
      p_contact_email: email || null,
      p_contact_phone: phone || null,
    })

    if (error) {
      console.error('Error updating RSVP:', error)
      return NextResponse.json(
        formatErrorResponse('Failed to update RSVP', 'UPDATE_ERROR'),
        { status: 500 }
      )
    }

    return NextResponse.json(
      formatSuccessResponse({
        responseId: data,
        message: 'RSVP updated successfully',
      }, 'RSVP updated successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return NextResponse.json(
      formatErrorResponse('Internal server error', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}