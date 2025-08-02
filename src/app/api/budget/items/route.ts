import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'

// GET /api/budget/items - List all budget items (expenses)
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

    // Get filter parameters
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('category_id')
    const vendorId = searchParams.get('vendor_id')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sort_by') || 'due_date'
    const sortOrder = searchParams.get('sort_order') || 'asc'

    // Build query
    let query = supabase
      .from('budget_expenses')
      .select(`
        *,
        budget_categories!category_id(id, name, color, icon),
        couple_vendors!vendor_id(id, business_name, category)
      `)
      .eq('couple_id', coupleData.id)

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (vendorId) {
      query = query.eq('vendor_id', vendorId)
    }
    if (status) {
      query = query.eq('payment_status', status)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    const { data: expenses, error: expensesError } = await query

    if (expensesError) {
      return NextResponse.json({ error: expensesError.message }, { status: 500 })
    }

    return NextResponse.json({ items: expenses || [] })
  } catch (error) {
    console.error('Budget items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/budget/items - Create a new budget item (expense)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.couple_id || !body.category_id || !body.description || typeof body.amount !== 'number') {
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

    // Verify category belongs to couple
    const { data: category, error: categoryError } = await supabase
      .from('budget_categories')
      .select('id')
      .eq('id', body.category_id)
      .eq('couple_id', body.couple_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Create expense
    const { data: expense, error: createError } = await supabase
      .from('budget_expenses')
      .insert({
        couple_id: body.couple_id,
        category_id: body.category_id,
        vendor_id: body.vendor_id,
        description: body.description,
        amount: body.amount,
        due_date: body.due_date,
        expense_type: body.expense_type || 'vendor',
        payment_status: body.payment_status || 'pending',
        payment_method: body.payment_method,
        notes: body.notes
      })
      .select(`
        *,
        budget_categories!category_id(id, name, color, icon),
        couple_vendors!vendor_id(id, business_name, category)
      `)
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Update category spent amount
    await updateCategorySpentAmount(supabase, body.category_id)

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Create budget item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to update category spent amount
async function updateCategorySpentAmount(supabase: any, categoryId: string) {
  const { data: expenses } = await supabase
    .from('budget_expenses')
    .select('amount')
    .eq('category_id', categoryId)
    .in('payment_status', ['paid', 'partial'])

  const spentAmount = expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0

  await supabase
    .from('budget_categories')
    .update({ spent_amount: spentAmount })
    .eq('id', categoryId)
}