import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'

// GET /api/budget/items/[id] - Get a specific budget item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: expense, error: expenseError } = await supabase
      .from('budget_expenses')
      .select(`
        *,
        budget_categories!category_id(id, name, color, icon),
        couple_vendors!vendor_id(id, business_name, category)
      `)
      .eq('id', params.id)
      .eq('couple_id', coupleData.id)
      .single()

    if (expenseError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Get budget item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/budget/items/[id] - Update a budget item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Verify ownership
    const { data: expense, error: fetchError } = await supabase
      .from('budget_expenses')
      .select('couple_id, category_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('id', expense.couple_id)
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Store old category ID in case it changed
    const oldCategoryId = expense.category_id

    // Update expense
    const { data: updatedExpense, error: updateError } = await supabase
      .from('budget_expenses')
      .update({
        category_id: body.category_id,
        vendor_id: body.vendor_id,
        description: body.description,
        amount: body.amount,
        due_date: body.due_date,
        expense_type: body.expense_type,
        payment_status: body.payment_status,
        payment_method: body.payment_method,
        paid_date: body.paid_date,
        receipt_url: body.receipt_url,
        notes: body.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        budget_categories!category_id(id, name, color, icon),
        couple_vendors!vendor_id(id, business_name, category)
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update category spent amounts
    await updateCategorySpentAmount(supabase, oldCategoryId)
    if (body.category_id && body.category_id !== oldCategoryId) {
      await updateCategorySpentAmount(supabase, body.category_id)
    }

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Update budget item error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/budget/items/[id] - Delete a budget item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: expense, error: fetchError } = await supabase
      .from('budget_expenses')
      .select('couple_id, category_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('id', expense.couple_id)
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete expense
    const { error: deleteError } = await supabase
      .from('budget_expenses')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Update category spent amount
    await updateCategorySpentAmount(supabase, expense.category_id)

    return NextResponse.json({ success: true, deleted_id: params.id })
  } catch (error) {
    console.error('Delete budget item error:', error)
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