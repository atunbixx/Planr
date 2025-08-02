import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const body = await request.json()
    const { completed = true, notes } = body

    // Update task completion status
    const { data: task, error } = await supabase
      .from('tasks')
      .update({
        completed,
        completed_date: completed ? new Date().toISOString() : null,
        completed_by_user_id: completed ? user.id : null,
        progress_percentage: completed ? 100 : 0,
        status: completed ? 'completed' : 'todo',
        notes: notes ? `${task?.notes || ''}\n\nCompleted: ${new Date().toLocaleString()}` : task?.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('couple_id', couple.id)
      .select(`
        *,
        couple_vendors (
          id,
          vendor_name,
          vendor_type
        ),
        milestones (
          id,
          title,
          target_date
        )
      `)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ task })

  } catch (error) {
    console.error('Error in task complete POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Mark task as incomplete
    const { data: task, error } = await supabase
      .from('tasks')
      .update({
        completed: false,
        completed_date: null,
        completed_by_user_id: null,
        progress_percentage: 0,
        status: 'todo',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('couple_id', couple.id)
      .select(`
        *,
        couple_vendors (
          id,
          vendor_name,
          vendor_type
        ),
        milestones (
          id,
          title,
          target_date
        )
      `)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found or update failed' }, { status: 404 })
    }

    return NextResponse.json({ task })

  } catch (error) {
    console.error('Error in task complete DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 