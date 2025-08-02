import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'

// GET /api/budget/categories/[id] - Get a specific budget category
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

    const { data: category, error: categoryError } = await supabase
      .from('budget_categories')
      .select(`
        *,
        budget_expenses(*)
      `)
      .eq('id', params.id)
      .eq('couple_id', coupleData.id)
      .single()

    if (categoryError) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const spentAmount = category.budget_expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
    const allocatedAmount = category.allocated_amount || 0

    const categoryWithTotals = {
      ...category,
      spent_amount: spentAmount,
      remaining_amount: allocatedAmount - spentAmount,
      percentage_used: allocatedAmount > 0 ? (spentAmount / allocatedAmount) * 100 : 0,
      expense_count: category.budget_expenses?.length || 0
    }

    return NextResponse.json(categoryWithTotals)
  } catch (error) {
    console.error('Get budget category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/budget/categories/[id] - Update a budget category
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
    const { data: category, error: fetchError } = await supabase
      .from('budget_categories')
      .select('couple_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('id', category.couple_id)
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update category
    const { data: updatedCategory, error: updateError } = await supabase
      .from('budget_categories')
      .update({
        name: body.name,
        allocated_amount: body.allocated_amount,
        percentage_of_total: body.percentage_of_total,
        color: body.color,
        icon: body.icon,
        priority: body.priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Update budget category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/budget/categories/[id] - Delete a budget category
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
    const { data: category, error: fetchError } = await supabase
      .from('budget_categories')
      .select('couple_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('id', category.couple_id)
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if category has expenses
    const { count, error: countError } = await supabase
      .from('budget_expenses')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', params.id)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if (count && count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with existing expenses' 
      }, { status: 400 })
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from('budget_categories')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted_id: params.id })
  } catch (error) {
    console.error('Delete budget category error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}