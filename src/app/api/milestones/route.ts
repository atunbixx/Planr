import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { MilestoneInsert } from '@/types/timeline'

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

    // Get milestones with progress
    const { data: milestones, error } = await supabase
      .from('milestone_progress')
      .select('*')
      .eq('couple_id', couple.id)
      .order('target_date', { ascending: true })

    if (error) {
      console.error('Error fetching milestones:', error)
      return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
    }

    return NextResponse.json({ milestones })
  } catch (error) {
    console.error('Milestones GET error:', error)
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
    const body: MilestoneInsert = await request.json()

    // Create milestone
    const { data: milestone, error } = await supabase
      .from('milestones')
      .insert({
        ...body,
        couple_id: couple.id,
        status: 'pending',
        progress_percentage: 0,
        task_ids: body.task_ids || [],
        timeline_item_ids: body.timeline_item_ids || []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating milestone:', error)
      return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })
    }

    // Update linked tasks with milestone ID
    if (body.task_ids && body.task_ids.length > 0) {
      await supabase
        .from('tasks')
        .update({ milestone_id: milestone.id })
        .in('id', body.task_ids)
        .eq('couple_id', couple.id)
    }

    // Update linked timeline items with milestone ID
    if (body.timeline_item_ids && body.timeline_item_ids.length > 0) {
      await supabase
        .from('timeline_items')
        .update({ milestone_id: milestone.id })
        .in('id', body.timeline_item_ids)
        .eq('couple_id', couple.id)
    }

    // Log activity
    await supabase
      .from('activity_feed')
      .insert({
        couple_id: couple.id,
        user_id: user.id,
        user_name: user.email || 'User',
        user_email: user.email || '',
        action_type: 'milestone_created',
        entity_type: 'milestone',
        entity_id: milestone.id,
        entity_name: milestone.title,
        details: {
          type: milestone.type,
          target_date: milestone.target_date
        }
      })

    return NextResponse.json({ milestone })
  } catch (error) {
    console.error('Milestones POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}