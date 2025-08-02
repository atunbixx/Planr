import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
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

    // Get task with all related data
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        couple_vendors (
          id,
          vendor_name,
          vendor_type,
          contact_email,
          contact_phone
        ),
        milestones (
          id,
          title,
          target_date,
          status,
          progress_percentage
        ),
        timeline_items (
          id,
          title,
          start_time,
          end_time,
          location
        ),
        task_assignments (
          id,
          assigned_to_user_id,
          assigned_to_vendor_id,
          accepted,
          assigned_at,
          notes
        ),
        task_comments (
          id,
          comment,
          created_at,
          updated_at,
          user_id
        ),
        task_dependencies (
          id,
          depends_on_task_id,
          dependency_type,
          lag_days
        )
      `)
      .eq('id', params.id)
      .eq('couple_id', couple.id)
      .single()

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })

  } catch (error) {
    console.error('Error in task GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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

    // Update task
    const { data: task, error } = await supabase
      .from('tasks')
      .update({
        ...body,
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
    console.error('Error in task PUT:', error)
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

    // Delete task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', params.id)
      .eq('couple_id', couple.id)

    if (error) {
      console.error('Error deleting task:', error)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Task deleted successfully' })

  } catch (error) {
    console.error('Error in task DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 