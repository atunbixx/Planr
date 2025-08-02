import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'
import { 
  BudgetPeriod, 
  CreateBudgetPeriodRequest,
  BudgetCategoryType 
} from '@/types/budget'

// GET /api/budget/periods - List all budget periods
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    // For now, return a default period since the budget_periods table doesn't exist yet
    const defaultPeriod: BudgetPeriod = {
      id: 'default-period',
      couple_id: coupleData.id,
      name: 'Wedding Budget',
      start_date: new Date().toISOString(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      total_budget: 50000,
      currency: 'USD',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ periods: [defaultPeriod] })
  } catch (error) {
    console.error('Budget periods error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/budget/periods - Create a new budget period
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateBudgetPeriodRequest = await request.json()

    // Validate required fields
    if (!body.couple_id || !body.name || !body.start_date || !body.end_date || !body.total_budget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify couple ownership
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('id', body.couple_id)
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // For now, return a mock response since the table doesn't exist
    const newPeriod: BudgetPeriod = {
      id: `period-${Date.now()}`,
      couple_id: body.couple_id,
      name: body.name,
      start_date: body.start_date,
      end_date: body.end_date,
      total_budget: body.total_budget,
      currency: body.currency || 'USD',
      is_active: true,
      notes: body.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: session.user.id
    }

    return NextResponse.json(newPeriod)
  } catch (error) {
    console.error('Create budget period error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}