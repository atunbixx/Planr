import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get couple_id
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    // Get budget overview
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select('*, budget_expenses(*)')
      .eq('couple_id', coupleData.id)
      .order('priority', { ascending: false })

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 })
    }

    // Calculate totals
    const totalBudget = categories?.reduce((sum, cat) => sum + (cat.allocated_amount || 0), 0) || 0
    const totalSpent = categories?.reduce((sum, cat) => {
      const categorySpent = cat.budget_expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0
      return sum + categorySpent
    }, 0) || 0

    const overview = {
      couple_id: coupleData.id,
      total_budget: totalBudget,
      total_allocated: totalBudget,
      total_spent: totalSpent,
      total_remaining: totalBudget - totalSpent,
      categories: categories?.map(cat => {
        const categorySpent = cat.budget_expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
        const categoryAllocated = cat.allocated_amount || 0
        
        return {
          id: cat.id,
          name: cat.name,
          allocated_amount: categoryAllocated,
          spent_amount: categorySpent,
          remaining_amount: categoryAllocated - categorySpent,
          percentage_used: categoryAllocated > 0 ? (categorySpent / categoryAllocated) * 100 : 0,
          expense_count: cat.budget_expenses?.length || 0,
          color: cat.color,
          icon: cat.icon,
          priority: cat.priority
        }
      }) || []
    }

    return NextResponse.json(overview)
  } catch (error) {
    console.error('Budget overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}