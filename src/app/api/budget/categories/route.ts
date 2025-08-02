import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'

// GET /api/budget/categories - List all budget categories
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

    // Get categories with expenses
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select(`
        *,
        budget_expenses(*)
      `)
      .eq('couple_id', coupleData.id)
      .order('priority', { ascending: false })

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 })
    }

    // Calculate spent amounts for each category
    const categoriesWithTotals = categories?.map(category => {
      const spentAmount = category.budget_expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
      const allocatedAmount = category.allocated_amount || 0
      
      return {
        ...category,
        spent_amount: spentAmount,
        remaining_amount: allocatedAmount - spentAmount,
        percentage_used: allocatedAmount > 0 ? (spentAmount / allocatedAmount) * 100 : 0,
        expense_count: category.budget_expenses?.length || 0
      }
    })

    return NextResponse.json({ categories: categoriesWithTotals })
  } catch (error) {
    console.error('Budget categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/budget/categories - Create a new budget category
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.couple_id || !body.name || typeof body.allocated_amount !== 'number') {
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

    // Create category
    const { data: category, error: createError } = await supabase
      .from('budget_categories')
      .insert({
        couple_id: body.couple_id,
        name: body.name,
        allocated_amount: body.allocated_amount,
        percentage_of_total: body.percentage_of_total,
        color: body.color,
        icon: body.icon,
        priority: body.priority || 'medium',
        spent_amount: 0
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Create budget category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}