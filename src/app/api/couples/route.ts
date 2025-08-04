import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received onboarding data:', JSON.stringify(body, null, 2))
    
    const {
      clerk_user_id,
      email,
      partner1_name,
      partner2_name,
      wedding_style,
      wedding_date,
      venue_name,
      venue_location,
      guest_count_estimate,
      budget_total,
      onboarding_completed = true
    } = body

    // Validate required fields
    if (!clerk_user_id || !partner1_name) {
      return NextResponse.json(
        { error: 'Missing required fields: clerk_user_id and partner1_name' },
        { status: 400 }
      )
    }

    // First, ensure user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerk_user_id)
      .single()

    let userId: string

    if (existingUser) {
      userId = existingUser.id
      // Update existing user
      await supabase
        .from('users')
        .update({
          email: email || undefined,
          first_name: partner1_name.split(' ')[0],
          last_name: partner1_name.split(' ').slice(1).join(' ') || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_user_id,
          email: email || `${clerk_user_id}@placeholder.com`,
          first_name: partner1_name.split(' ')[0],
          last_name: partner1_name.split(' ').slice(1).join(' ') || undefined,
        })
        .select('id')
        .single()

      if (createError || !newUser) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: 'Failed to create user', details: createError?.message },
          { status: 500 }
        )
      }
      userId = newUser.id
    }

    console.log('User processed successfully:', userId)

    // Check if couple record exists
    const { data: existingCouple } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', userId)
      .single()

    const coupleData = {
      user_id: userId,
      partner1_name,
      partner2_name: partner2_name || null,
      wedding_style: wedding_style || null,
      wedding_date: wedding_date || null,
      venue_name: venue_name || null,
      venue_location: venue_location || null,
      guest_count_estimate: guest_count_estimate || null,
      budget_total: budget_total || null,
      onboarding_completed,
      updated_at: new Date().toISOString()
    }

    let coupleResult
    if (existingCouple) {
      // Update existing couple
      const { data, error } = await supabase
        .from('couples')
        .update(coupleData)
        .eq('id', existingCouple.id)
        .select()

      if (error) {
        console.error('Error updating couple:', error)
        return NextResponse.json(
          { error: 'Failed to update couple profile', details: error.message },
          { status: 500 }
        )
      }
      coupleResult = data
    } else {
      // Create new couple
      const { data, error } = await supabase
        .from('couples')
        .insert(coupleData)
        .select()

      if (error) {
        console.error('Error creating couple:', error)
        return NextResponse.json(
          { error: 'Failed to create couple profile', details: error.message },
          { status: 500 }
        )
      }
      coupleResult = data
    }

    console.log('Couple profile created/updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Couple profile created successfully',
      data: coupleResult
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clerk_user_id = searchParams.get('clerk_user_id')

    if (!clerk_user_id) {
      return NextResponse.json(
        { error: 'clerk_user_id is required' },
        { status: 400 }
      )
    }

    // Get user and their couple data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        clerk_user_id,
        email,
        first_name,
        last_name,
        couples (*)
      `)
      .eq('clerk_user_id', clerk_user_id)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: userData
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}