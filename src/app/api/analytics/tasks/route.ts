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
    const timeRange = searchParams.get('time_range') || 'all' // week, month, all

    // Get task analytics from view
    const { data: analytics, error: analyticsError } = await supabase
      .from('task_analytics')
      .select('*')
      .eq('couple_id', couple.id)
      .single()

    if (analyticsError) {
      console.error('Error fetching task analytics:', analyticsError)
      return NextResponse.json({ error: 'Failed to fetch task analytics' }, { status: 500 })
    }

    // Get additional analytics based on time range
    let dateFilter = ''
    if (timeRange === 'week') {
      dateFilter = `AND created_at >= NOW() - INTERVAL '7 days'`
    } else if (timeRange === 'month') {
      dateFilter = `AND created_at >= NOW() - INTERVAL '30 days'`
    }

    // Get tasks by category
    const { data: categoryBreakdown, error: categoryError } = await supabase
      .rpc('get_task_category_breakdown', {
        p_couple_id: couple.id,
        p_date_filter: dateFilter
      })

    if (categoryError) {
      console.error('Error fetching category breakdown:', categoryError)
    }

    // Get tasks by priority
    const { data: priorityBreakdown, error: priorityError } = await supabase
      .rpc('get_task_priority_breakdown', {
        p_couple_id: couple.id,
        p_date_filter: dateFilter
      })

    if (priorityError) {
      console.error('Error fetching priority breakdown:', priorityError)
    }

    // Get completion trends
    const { data: completionTrends, error: trendsError } = await supabase
      .rpc('get_task_completion_trends', {
        p_couple_id: couple.id,
        p_days: timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
      })

    if (trendsError) {
      console.error('Error fetching completion trends:', trendsError)
    }

    // Get overdue tasks
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        priority,
        category,
        days_overdue: EXTRACT(DAY FROM (CURRENT_DATE - due_date))::INTEGER
      `)
      .eq('couple_id', couple.id)
      .eq('completed', false)
      .lt('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (overdueError) {
      console.error('Error fetching overdue tasks:', overdueError)
    }

    // Get upcoming tasks
    const { data: upcomingTasks, error: upcomingError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        priority,
        category,
        days_until_due: EXTRACT(DAY FROM (due_date - CURRENT_DATE))::INTEGER
      `)
      .eq('couple_id', couple.id)
      .eq('completed', false)
      .gte('due_date', new Date().toISOString().split('T')[0])
      .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (upcomingError) {
      console.error('Error fetching upcoming tasks:', upcomingError)
    }

    // Calculate additional metrics
    const totalTasks = analytics?.total_tasks || 0
    const completedTasks = analytics?.completed_tasks || 0
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const response = {
      overview: {
        totalTasks,
        completedTasks,
        overdueTasks: analytics?.overdue_tasks || 0,
        upcomingWeekTasks: analytics?.upcoming_week_tasks || 0,
        urgentTasks: analytics?.urgent_tasks || 0,
        criticalPathTasks: analytics?.critical_path_tasks || 0,
        blockedTasks: analytics?.blocked_tasks || 0,
        completionRate: Math.round(completionRate * 100) / 100,
        avgCompletionDelay: analytics?.avg_completion_delay_days || 0,
        activeCategories: analytics?.active_categories || 0,
        vendorsWithTasks: analytics?.vendors_with_tasks || 0,
        avgTaskProgress: analytics?.avg_task_progress || 0
      },
      breakdowns: {
        byCategory: categoryBreakdown || [],
        byPriority: priorityBreakdown || []
      },
      trends: {
        completionTrends: completionTrends || []
      },
      tasks: {
        overdue: overdueTasks || [],
        upcoming: upcomingTasks || []
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in task analytics GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 