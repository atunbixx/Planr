import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guestId = params.id
    const body = await request.json()
    const { 
      status, 
      attending_count, 
      plus_one_attending, 
      plus_one_name, 
      dietary_restrictions, 
      rsvp_notes 
    } = body

    // Get user's couple data first to verify ownership
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

    // Update invitation RSVP status
    const { data: invitation, error } = await supabase
      .from('invitations')
      .update({
        status,
        attending_count: attending_count || 0,
        plus_one_attending: plus_one_attending || false,
        plus_one_name: plus_one_name || null,
        dietary_restrictions: dietary_restrictions || null,
        rsvp_notes: rsvp_notes || null,
        responded_at: status !== 'pending' ? new Date().toISOString() : null
      })
      .eq('guest_id', guestId)
      .eq('couple_id', coupleId)
      .select(`
        *,
        guests (
          id,
          first_name,
          last_name,
          email,
          plus_one_allowed
        )
      `)
      .single()

    if (error) {
      console.error('Error updating RSVP:', error)
      return NextResponse.json(
        { error: 'Failed to update RSVP', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invitation
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}