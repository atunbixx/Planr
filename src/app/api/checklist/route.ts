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

    // Get checklist progress
    const { data: progressData, error: progressError } = await supabase.rpc('get_checklist_progress', {
      p_couple_id: coupleId
    })

    if (progressError) {
      console.error('Error fetching checklist progress:', progressError)
    }

    // Get checklist tasks by category
    const { data: checklistData, error: checklistError } = await supabase.rpc('get_checklist_by_category', {
      p_couple_id: coupleId
    })

    if (checklistError) {
      console.error('Error fetching checklist data:', checklistError)
      return NextResponse.json(
        { error: 'Failed to fetch checklist data', details: checklistError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        progress: progressData?.[0] || {
          total_tasks: 0,
          completed_tasks: 0,
          progress_percentage: 0,
          overdue_tasks: 0,
          upcoming_tasks: 0
        },
        categories: checklistData || []
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
      category_id,
      title,
      description,
      priority,
      due_date,
      assigned_to,
      notes
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

    // Create new checklist task
    const { data: task, error } = await supabase
      .from('checklist_tasks')
      .insert({
        couple_id: coupleId,
        category_id: category_id || null,
        title,
        description: description || null,
        priority: priority || 'medium',
        due_date: due_date || null,
        assigned_to: assigned_to || null,
        notes: notes || null,
        is_custom: true // User-created tasks are marked as custom
      })
      .select(`
        *,
        checklist_categories (
          id,
          name,
          color
        )
      `)
      .single()

    if (error) {
      console.error('Error creating checklist task:', error)
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}