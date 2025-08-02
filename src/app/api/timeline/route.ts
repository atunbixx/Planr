import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TimelineItemInsert } from '@/types/timeline'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get couple ID
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const type = searchParams.get('type')
    const vendorId = searchParams.get('vendor_id')
    const milestoneId = searchParams.get('milestone_id')
    const confirmed = searchParams.get('confirmed')

    // Build query
    let query = supabase
      .from('timeline_items')
      .select(`
        *,
        couple_vendors (
          id,
          vendor_name,
          vendor_type,
          contact_email,
          contact_phone
        )
      `)
      .eq('couple_id', couple.id)
      .order('start_time', { ascending: true })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }
    if (vendorId) {
      query = query.eq('vendor_id', vendorId)
    }
    if (milestoneId) {
      query = query.eq('milestone_id', milestoneId)
    }
    if (confirmed !== null) {
      query = query.eq('confirmed', confirmed === 'true')
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Error fetching timeline items:', error)
      return NextResponse.json({ error: 'Failed to fetch timeline items' }, { status: 500 })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Timeline GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get couple ID
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    // Parse request body
    const body: TimelineItemInsert = await request.json()

    // Calculate end time if not provided
    let endTime = body.end_time
    if (!endTime && body.start_time && body.duration_minutes) {
      const [hours, minutes] = body.start_time.split(':').map(Number)
      const startDate = new Date()
      startDate.setHours(hours, minutes, 0, 0)
      const endDate = new Date(startDate.getTime() + (body.duration_minutes + (body.buffer_time_minutes || 0)) * 60000)
      endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
    }

    // Create timeline item
    const { data: item, error } = await supabase
      .from('timeline_items')
      .insert({
        ...body,
        couple_id: couple.id,
        type: body.type || 'other',
        buffer_time_minutes: body.buffer_time_minutes || 15,
        end_time: endTime,
        confirmed: false,
        critical_path: false,
        weather_dependent: body.weather_dependent || false,
        special_requirements: body.special_requirements || []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating timeline item:', error)
      return NextResponse.json({ error: 'Failed to create timeline item' }, { status: 500 })
    }

    // Detect conflicts
    await supabase.rpc('detect_timeline_conflicts', {
      p_couple_id: couple.id
    })

    // Log activity
    await supabase
      .from('activity_feed')
      .insert({
        couple_id: couple.id,
        user_id: user.id,
        user_name: user.email || 'User',
        user_email: user.email || '',
        action_type: 'timeline_item_added',
        entity_type: 'timeline',
        entity_id: item.id,
        entity_name: item.title,
        details: {
          type: item.type,
          start_time: item.start_time,
          location: item.location
        }
      })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Timeline POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}