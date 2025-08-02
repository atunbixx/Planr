import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assigned_to')
    const vendorId = searchParams.get('vendor_id')
    const milestoneId = searchParams.get('milestone_id')
    const criticalPath = searchParams.get('critical_path')
    const dueDateFrom = searchParams.get('due_date_from')
    const dueDateTo = searchParams.get('due_date_to')
    const completed = searchParams.get('completed')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
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
          status
        ),
        timeline_items (
          id,
          title,
          start_time,
          end_time
        ),
        task_assignments (
          id,
          assigned_to_user_id,
          assigned_to_vendor_id,
          accepted
        ),
        task_comments (
          id,
          comment,
          created_at,
          user_id
        )
      `)
      .eq('couple_id', couple.id)
      .order('due_date', { ascending: true, nullsLast: true })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }
    if (vendorId) {
      query = query.eq('vendor_id', vendorId)
    }
    if (milestoneId) {
      query = query.eq('milestone_id', milestoneId)
    }
    if (criticalPath !== null) {
      query = query.eq('critical_path', criticalPath === 'true')
    }
    if (dueDateFrom) {
      query = query.gte('due_date', dueDateFrom)
    }
    if (dueDateTo) {
      query = query.lte('due_date', dueDateTo)
    }
    if (completed !== null) {
      query = query.eq('completed', completed === 'true')
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: tasks, error, count } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json({
      tasks,
      pagination: {
        limit,
        offset,
        total: count || tasks.length
      }
    })

  } catch (error) {
    console.error('Error in tasks GET:', error)
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
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        ...body,
        couple_id: couple.id,
        status: body.status || 'todo',
        priority: body.priority || 'medium',
        category: body.category || 'planning',
        assigned_to: body.assigned_to || 'both',
        critical_path: body.critical_path || false,
        progress_percentage: body.progress_percentage || 0,
        completed: body.completed || false,
        tags: body.tags || [],
        attachments: body.attachments || []
      })
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

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    return NextResponse.json({ task }, { status: 201 })

  } catch (error) {
    console.error('Error in tasks POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 