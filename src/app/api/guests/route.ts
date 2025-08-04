import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Get user's couple data first
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Build query for guests with invitations
    let query = supabase
      .from('guests')
      .select(`
        *,
        invitations (
          id,
          status,
          attending_count,
          plus_one_attending,
          plus_one_name,
          responded_at,
          rsvp_deadline
        )
      `)
      .eq('couple_id', coupleId)

    // Apply search filter if provided
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('invitations.status', status)
    }

    const { data: guests, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching guests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch guests', details: error.message },
        { status: 500 }
      )
    }

    // Get guest statistics
    const { data: stats, error: statsError } = await supabase.rpc('get_guest_stats', {
      p_couple_id: coupleId
    })

    if (statsError) {
      console.error('Error fetching guest stats:', statsError)
    }

    return NextResponse.json({
      success: true,
      data: {
        guests: guests || [],
        stats: stats?.[0] || {
          total_invited: 0,
          total_confirmed: 0,
          total_declined: 0,
          total_pending: 0,
          total_attending: 0,
          response_rate: 0
        }
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      first_name,
      last_name,
      email,
      phone,
      address,
      relationship,
      side,
      plus_one_allowed,
      plus_one_name,
      dietary_restrictions,
      notes,
      rsvp_deadline
    } = body

    // Get user's couple data
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', user.id)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Create new guest
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        couple_id: coupleId,
        first_name,
        last_name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        relationship: relationship || null,
        side: side || 'both',
        plus_one_allowed: plus_one_allowed || false,
        plus_one_name: plus_one_name || null,
        dietary_restrictions: dietary_restrictions || null,
        notes: notes || null
      })
      .select()
      .single()

    if (guestError) {
      console.error('Error creating guest:', guestError)
      return NextResponse.json(
        { error: 'Failed to create guest', details: guestError.message },
        { status: 500 }
      )
    }

    // Generate invitation code and create invitation
    const { data: invitationCode } = await supabase.rpc('generate_invitation_code')
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        guest_id: guest.id,
        couple_id: coupleId,
        invitation_code: invitationCode,
        status: 'pending',
        attending_count: plus_one_allowed ? 2 : 1,
        rsvp_deadline: rsvp_deadline || null
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      // Don't fail the whole request, just log the error
    }

    return NextResponse.json({
      success: true,
      data: {
        guest,
        invitation
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}