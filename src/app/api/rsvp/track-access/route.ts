import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  rateLimit,
  getClientIP,
  getUserAgent,
  formatErrorResponse,
  formatSuccessResponse,
  detectDeviceType,
} from '@/lib/rsvp-utils'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = await getClientIP()
    const rateLimitResult = await rateLimit(`rsvp-track:${ip}`, 50, 60000) // 50 attempts per minute
    
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

    // Parse request body
    const body = await request.json()
    const { inviteCode, referrer } = body

    if (!inviteCode) {
      return NextResponse.json(
        formatErrorResponse('Invite code is required', 'MISSING_INVITE_CODE'),
        { status: 400 }
      )
    }

    const userAgent = await getUserAgent()
    const deviceType = detectDeviceType(userAgent)
    const supabase = createRouteHandlerClient({ cookies })

    // Use the track_rsvp_access function
    const { data, error } = await supabase.rpc('track_rsvp_access', {
      p_invite_code: inviteCode.toUpperCase(),
      p_ip_address: ip,
      p_user_agent: userAgent,
      p_device_type: deviceType,
      p_referrer_url: referrer || null,
    })

    if (error) {
      console.error('Error tracking RSVP access:', error)
      return NextResponse.json(
        formatErrorResponse('Failed to track access', 'TRACKING_ERROR'),
        { status: 500 }
      )
    }

    const result = data?.[0]

    if (!result || !result.access_granted) {
      return NextResponse.json(
        formatErrorResponse(
          result?.error_message || 'Invalid invitation code',
          'INVALID_CODE'
        ),
        { status: 400 }
      )
    }

    return NextResponse.json(
      formatSuccessResponse({
        sessionId: result.session_id,
        guestId: result.guest_id,
        accessGranted: result.access_granted,
      }, 'Access tracked successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error tracking RSVP access:', error)
    return NextResponse.json(
      formatErrorResponse('Internal server error', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}