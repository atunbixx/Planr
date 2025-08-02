import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  rateLimit,
  getClientIP,
  formatErrorResponse,
  formatSuccessResponse,
} from '@/lib/rsvp-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Rate limiting
    const ip = await getClientIP()
    const rateLimitResult = await rateLimit(`rsvp-session:${ip}`, 30, 60000) // 30 requests per minute
    
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

    const sessionId = params.sessionId

    if (!sessionId) {
      return NextResponse.json(
        formatErrorResponse('Session ID is required', 'MISSING_SESSION_ID'),
        { status: 400 }
      )
    }

    // Also check for session token in cookies
    const sessionToken = request.cookies.get('rsvp_session')?.value

    const supabase = createRouteHandlerClient({ cookies })

    // Query by session ID or token
    let query = supabase
      .from('rsvp_sessions')
      .select(`
        id,
        guest_id,
        invite_code,
        access_status,
        created_at,
        last_accessed_at,
        completed_at,
        wedding_guests (
          id,
          first_name,
          last_name,
          rsvp_status
        )
      `)

    if (sessionToken) {
      query = query.or(`id.eq.${sessionId},session_token.eq.${sessionToken}`)
    } else {
      query = query.eq('id', sessionId)
    }

    const { data: session, error } = await query.single()

    if (error || !session) {
      return NextResponse.json(
        formatErrorResponse('Session not found', 'SESSION_NOT_FOUND'),
        { status: 404 }
      )
    }

    // Check if session is still valid (2 hours)
    const lastAccessed = new Date(session.last_accessed_at)
    const now = new Date()
    const hoursSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60)

    if (hoursSinceAccess > 2) {
      return NextResponse.json(
        formatErrorResponse('Session expired', 'SESSION_EXPIRED'),
        { status: 401 }
      )
    }

    // Update last accessed time
    await supabase
      .from('rsvp_sessions')
      .update({ last_accessed_at: now.toISOString() })
      .eq('id', session.id)

    return NextResponse.json(
      formatSuccessResponse({
        sessionId: session.id,
        guestId: session.guest_id,
        inviteCode: session.invite_code,
        status: session.access_status,
        guest: session.wedding_guests,
        isValid: true,
        isCompleted: !!session.completed_at,
        expiresIn: Math.max(0, 120 - Math.floor(hoursSinceAccess * 60)), // Minutes remaining
      }, 'Session verified successfully'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying session:', error)
    return NextResponse.json(
      formatErrorResponse('Internal server error', 'SERVER_ERROR'),
      { status: 500 }
    )
  }
}