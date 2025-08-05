import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const guestId = resolvedParams.id
    const body = await request.json()

    // Get user's couple data first to verify ownership
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', userId)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Verify guest belongs to this couple
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('id, couple_id')
      .eq('id', guestId)
      .eq('couple_id', coupleId)
      .single()

    if (!existingGuest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Update guest
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .update(body)
      .eq('id', guestId)
      .select(`
        *,
        invitations (
          id,
          status,
          attending_count,
          plus_one_attending,
          responded_at
        )
      `)
      .single()

    if (guestError) {
      console.error('Error updating guest:', guestError)
      return NextResponse.json(
        { error: 'Failed to update guest', details: guestError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: guest
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const guestId = resolvedParams.id

    // Get user's couple data first to verify ownership
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (id)
      `)
      .eq('clerk_user_id', userId)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = userData.couples[0].id

    // Delete guest (this will cascade delete the invitation due to foreign key)
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId)
      .eq('couple_id', coupleId)

    if (error) {
      console.error('Error deleting guest:', error)
      return NextResponse.json(
        { error: 'Failed to delete guest', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Guest deleted successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}