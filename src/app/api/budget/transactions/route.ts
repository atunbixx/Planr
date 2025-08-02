import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'
import { RecordPaymentRequest } from '@/types/budget'

// GET /api/budget/transactions - List all transactions
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
    const expenseId = searchParams.get('expense_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Get all expenses with payment information
    let query = supabase
      .from('budget_expenses')
      .select(`
        id,
        description,
        amount,
        payment_status,
        payment_method,
        paid_date,
        receipt_url,
        notes,
        created_at,
        updated_at,
        budget_categories!category_id(id, name, color, icon),
        couple_vendors!vendor_id(id, business_name)
      `)
      .eq('couple_id', coupleData.id)
      .in('payment_status', ['paid', 'partial'])
      .order('paid_date', { ascending: false })

    if (expenseId) {
      query = query.eq('id', expenseId)
    }
    if (startDate) {
      query = query.gte('paid_date', startDate)
    }
    if (endDate) {
      query = query.lte('paid_date', endDate)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      return NextResponse.json({ error: transactionsError.message }, { status: 500 })
    }

    // Transform to transaction format
    const formattedTransactions = transactions?.map(expense => ({
      id: `transaction-${expense.id}`,
      expense_id: expense.id,
      amount: expense.amount,
      payment_method: expense.payment_method,
      payment_date: expense.paid_date,
      receipt_url: expense.receipt_url,
      notes: expense.notes,
      description: expense.description,
      category: expense.budget_categories,
      vendor: expense.couple_vendors,
      created_at: expense.paid_date || expense.created_at
    }))

    return NextResponse.json({ transactions: formattedTransactions || [] })
  } catch (error) {
    console.error('Budget transactions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/budget/transactions - Record a payment
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RecordPaymentRequest = await request.json()

    // Validate required fields
    if (!body.couple_id || !body.budget_item_id || typeof body.amount !== 'number' || !body.payment_method) {
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

    // Get the expense
    const { data: expense, error: expenseError } = await supabase
      .from('budget_expenses')
      .select('*, budget_categories!category_id(id)')
      .eq('id', body.budget_item_id)
      .eq('couple_id', body.couple_id)
      .single()

    if (expenseError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Update expense with payment information
    const paymentDate = body.payment_date || new Date().toISOString()
    const newPaymentStatus = body.amount >= expense.amount ? 'paid' : 'partial'

    const { data: updatedExpense, error: updateError } = await supabase
      .from('budget_expenses')
      .update({
        payment_status: newPaymentStatus,
        payment_method: body.payment_method,
        paid_date: paymentDate,
        receipt_url: body.receipt_url,
        notes: body.notes || expense.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.budget_item_id)
      .select(`
        *,
        budget_categories!category_id(id, name, color, icon),
        couple_vendors!vendor_id(id, business_name, category)
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update category spent amount
    await updateCategorySpentAmount(supabase, expense.budget_categories.id)

    // Return transaction format
    const transaction = {
      id: `transaction-${updatedExpense.id}-${Date.now()}`,
      expense_id: updatedExpense.id,
      amount: body.amount,
      payment_method: body.payment_method,
      payment_date: paymentDate,
      receipt_url: body.receipt_url,
      notes: body.notes,
      description: updatedExpense.description,
      category: updatedExpense.budget_categories,
      vendor: updatedExpense.couple_vendors,
      created_at: paymentDate,
      paid_by: body.paid_by || session.user.email
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Record payment error:', error)
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