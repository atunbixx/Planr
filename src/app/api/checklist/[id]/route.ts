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
    const taskId = resolvedParams.id
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

    // Verify task belongs to this couple
    const { data: existingTask } = await supabase
      .from('checklist_tasks')
      .select('id, couple_id')
      .eq('id', taskId)
      .eq('couple_id', coupleId)
      .single()

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = { ...body }
    
    // If marking as completed, set completed_at timestamp
    if (updateData.is_completed === true && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString()
    } else if (updateData.is_completed === false) {
      updateData.completed_at = null
    }

    // Update task
    const { data: task, error } = await supabase
      .from('checklist_tasks')
      .update(updateData)
      .eq('id', taskId)
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
      console.error('Error updating checklist task:', error)
      return NextResponse.json(
        { error: 'Failed to update task', details: error.message },
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
    const taskId = resolvedParams.id

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

    // Delete task (only allow deletion of custom tasks to preserve system defaults)
    const { error } = await supabase
      .from('checklist_tasks')
      .delete()
      .eq('id', taskId)
      .eq('couple_id', coupleId)
      .eq('is_custom', true) // Only allow deletion of custom tasks

    if (error) {
      console.error('Error deleting checklist task:', error)
      return NextResponse.json(
        { error: 'Failed to delete task', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}