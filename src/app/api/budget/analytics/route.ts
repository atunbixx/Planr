import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'
import { BudgetHealthStatus } from '@/types/budget'

// GET /api/budget/analytics - Get budget analytics and insights
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id, wedding_date')
      .eq('partner1_email', session.user.email)
      .or(`partner2_email.eq.${session.user.email}`)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    // Get all categories with expenses
    const { data: categories, error: categoriesError } = await supabase
      .from('budget_categories')
      .select(`
        *,
        budget_expenses(*)
      `)
      .eq('couple_id', coupleData.id)

    if (categoriesError) {
      return NextResponse.json({ error: categoriesError.message }, { status: 500 })
    }

    // Calculate overall budget metrics
    const totalBudget = categories?.reduce((sum, cat) => sum + (cat.allocated_amount || 0), 0) || 0
    const totalSpent = categories?.reduce((sum, cat) => {
      const categorySpent = cat.budget_expenses?.reduce((expSum, exp) => {
        return exp.payment_status === 'paid' ? expSum + exp.amount : expSum
      }, 0) || 0
      return sum + categorySpent
    }, 0) || 0
    const totalCommitted = categories?.reduce((sum, cat) => {
      const categoryCommitted = cat.budget_expenses?.reduce((expSum, exp) => {
        return exp.payment_status !== 'cancelled' ? expSum + exp.amount : expSum
      }, 0) || 0
      return sum + categoryCommitted
    }, 0) || 0

    // Calculate budget health
    const budgetUtilization = totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0
    const healthStatus: BudgetHealthStatus = 
      budgetUtilization <= 70 ? 'excellent' :
      budgetUtilization <= 85 ? 'good' :
      budgetUtilization <= 95 ? 'warning' : 'critical'

    // Calculate days until wedding
    const daysUntilWedding = coupleData.wedding_date 
      ? Math.max(0, Math.ceil((new Date(coupleData.wedding_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null

    // Get spending by month
    const monthlySpending = await getMonthlySpending(supabase, coupleData.id)

    // Get category breakdown
    const categoryBreakdown = categories?.map(cat => {
      const spent = cat.budget_expenses?.reduce((sum, exp) => {
        return exp.payment_status === 'paid' ? sum + exp.amount : sum
      }, 0) || 0
      const committed = cat.budget_expenses?.reduce((sum, exp) => {
        return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
      }, 0) || 0
      const allocated = cat.allocated_amount || 0

      return {
        category_id: cat.id,
        category_name: cat.name,
        color: cat.color,
        icon: cat.icon,
        allocated_amount: allocated,
        spent_amount: spent,
        committed_amount: committed,
        remaining_amount: allocated - committed,
        percentage_allocated: totalBudget > 0 ? (allocated / totalBudget) * 100 : 0,
        percentage_spent: allocated > 0 ? (spent / allocated) * 100 : 0,
        expense_count: cat.budget_expenses?.length || 0,
        paid_count: cat.budget_expenses?.filter(e => e.payment_status === 'paid').length || 0
      }
    }).sort((a, b) => b.allocated_amount - a.allocated_amount)

    // Get top vendors by spending
    const topVendors = await getTopVendors(supabase, coupleData.id)

    // Get upcoming payments
    const upcomingPayments = await getUpcomingPayments(supabase, coupleData.id)

    // Calculate payment timeline
    const paymentTimeline = await getPaymentTimeline(supabase, coupleData.id)

    const analytics = {
      overview: {
        total_budget: totalBudget,
        total_spent: totalSpent,
        total_committed: totalCommitted,
        total_remaining: totalBudget - totalCommitted,
        budget_utilization: budgetUtilization,
        spent_percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        health_status: healthStatus,
        days_until_wedding: daysUntilWedding,
        average_expense: categories?.reduce((sum, cat) => sum + (cat.budget_expenses?.length || 0), 0) || 0 > 0
          ? totalCommitted / categories.reduce((sum, cat) => sum + (cat.budget_expenses?.length || 0), 0)
          : 0
      },
      categories: categoryBreakdown,
      monthly_spending: monthlySpending,
      top_vendors: topVendors,
      upcoming_payments: upcomingPayments,
      payment_timeline: paymentTimeline,
      insights: generateInsights(totalBudget, totalSpent, totalCommitted, categoryBreakdown, daysUntilWedding)
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Budget analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get monthly spending
async function getMonthlySpending(supabase: any, coupleId: string) {
  const { data: expenses } = await supabase
    .from('budget_expenses')
    .select('amount, paid_date, payment_status')
    .eq('couple_id', coupleId)
    .eq('payment_status', 'paid')
    .order('paid_date', { ascending: true })

  const monthlyData: Record<string, number> = {}
  
  expenses?.forEach((expense: any) => {
    if (expense.paid_date) {
      const month = expense.paid_date.substring(0, 7) // YYYY-MM format
      monthlyData[month] = (monthlyData[month] || 0) + expense.amount
    }
  })

  return Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount,
    display: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }))
}

// Helper function to get top vendors
async function getTopVendors(supabase: any, coupleId: string) {
  const { data: expenses } = await supabase
    .from('budget_expenses')
    .select(`
      amount,
      payment_status,
      couple_vendors!vendor_id(id, business_name, category)
    `)
    .eq('couple_id', coupleId)
    .not('vendor_id', 'is', null)

  const vendorTotals: Record<string, any> = {}

  expenses?.forEach((expense: any) => {
    if (expense.couple_vendors) {
      const vendorId = expense.couple_vendors.id
      if (!vendorTotals[vendorId]) {
        vendorTotals[vendorId] = {
          vendor_id: vendorId,
          vendor_name: expense.couple_vendors.business_name,
          category: expense.couple_vendors.category,
          total_amount: 0,
          paid_amount: 0,
          expense_count: 0
        }
      }
      vendorTotals[vendorId].total_amount += expense.amount
      vendorTotals[vendorId].expense_count += 1
      if (expense.payment_status === 'paid') {
        vendorTotals[vendorId].paid_amount += expense.amount
      }
    }
  })

  return Object.values(vendorTotals)
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 5)
}

// Helper function to get upcoming payments
async function getUpcomingPayments(supabase: any, coupleId: string) {
  const { data: expenses } = await supabase
    .from('budget_expenses')
    .select(`
      *,
      budget_categories!category_id(id, name, color, icon),
      couple_vendors!vendor_id(id, business_name)
    `)
    .eq('couple_id', coupleId)
    .in('payment_status', ['pending', 'partial'])
    .not('due_date', 'is', null)
    .gte('due_date', new Date().toISOString())
    .order('due_date', { ascending: true })
    .limit(10)

  return expenses || []
}

// Helper function to get payment timeline
async function getPaymentTimeline(supabase: any, coupleId: string) {
  const { data: expenses } = await supabase
    .from('budget_expenses')
    .select('amount, due_date, payment_status')
    .eq('couple_id', coupleId)
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true })

  const timeline: Record<string, any> = {}

  expenses?.forEach((expense: any) => {
    const month = expense.due_date.substring(0, 7)
    if (!timeline[month]) {
      timeline[month] = {
        month,
        due_amount: 0,
        paid_amount: 0,
        pending_amount: 0
      }
    }
    
    if (expense.payment_status === 'paid') {
      timeline[month].paid_amount += expense.amount
    } else if (expense.payment_status !== 'cancelled') {
      timeline[month].pending_amount += expense.amount
    }
    timeline[month].due_amount += expense.amount
  })

  return Object.values(timeline)
}

// Helper function to generate insights
function generateInsights(
  totalBudget: number,
  totalSpent: number,
  totalCommitted: number,
  categories: any[],
  daysUntilWedding: number | null
) {
  const insights = []

  // Budget utilization insight
  const utilization = totalBudget > 0 ? (totalCommitted / totalBudget) * 100 : 0
  if (utilization > 90) {
    insights.push({
      type: 'warning',
      title: 'High Budget Utilization',
      message: `You've committed ${utilization.toFixed(1)}% of your budget. Consider reviewing upcoming expenses carefully.`
    })
  } else if (utilization < 50 && daysUntilWedding && daysUntilWedding < 180) {
    insights.push({
      type: 'info',
      title: 'Budget Underutilization',
      message: 'You have significant budget remaining. Make sure you haven\'t missed any important vendors or services.'
    })
  }

  // Category imbalance insight
  const overBudgetCategories = categories.filter(cat => cat.percentage_spent > 100)
  if (overBudgetCategories.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Over-budget Categories',
      message: `${overBudgetCategories.length} categories are over budget. Consider reallocating funds from underutilized categories.`
    })
  }

  // Payment timing insight
  if (daysUntilWedding && daysUntilWedding < 60) {
    const unpaidAmount = totalCommitted - totalSpent
    if (unpaidAmount > totalBudget * 0.3) {
      insights.push({
        type: 'urgent',
        title: 'Significant Unpaid Balances',
        message: `You have $${unpaidAmount.toLocaleString()} in unpaid balances with ${daysUntilWedding} days until your wedding.`
      })
    }
  }

  return insights
}