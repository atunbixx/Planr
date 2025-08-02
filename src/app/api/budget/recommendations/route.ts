import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.generated'
import { BudgetRecommendation, RecommendationType, Severity } from '@/types/budget'

// GET /api/budget/recommendations - Get budget recommendations
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

    // Generate recommendations based on current budget state
    const recommendations: BudgetRecommendation[] = []
    const now = new Date()
    
    // Calculate overall budget metrics
    const totalBudget = categories?.reduce((sum, cat) => sum + (cat.allocated_amount || 0), 0) || 0
    const totalCommitted = categories?.reduce((sum, cat) => {
      const categoryCommitted = cat.budget_expenses?.reduce((expSum, exp) => {
        return exp.payment_status !== 'cancelled' ? expSum + exp.amount : expSum
      }, 0) || 0
      return sum + categoryCommitted
    }, 0) || 0

    // 1. Check for overspending categories
    categories?.forEach(category => {
      const allocated = category.allocated_amount || 0
      const committed = category.budget_expenses?.reduce((sum, exp) => {
        return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
      }, 0) || 0

      if (committed > allocated && allocated > 0) {
        const overspendPercentage = ((committed - allocated) / allocated) * 100
        recommendations.push({
          id: `overspend-${category.id}`,
          couple_id: coupleData.id,
          category_type_id: category.id,
          recommendation_type: 'overspend_warning' as RecommendationType,
          severity: overspendPercentage > 20 ? 'critical' as Severity : 'warning' as Severity,
          title: `${category.name} is over budget`,
          description: `You've committed $${committed.toLocaleString()} but only allocated $${allocated.toLocaleString()} (${overspendPercentage.toFixed(1)}% over).`,
          suggested_action: `Consider reallocating funds from underutilized categories or reducing expenses in ${category.name}.`,
          potential_savings: committed - allocated,
          is_dismissed: false,
          is_applied: false,
          created_at: now.toISOString()
        })
      }
    })

    // 2. Identify savings opportunities
    categories?.forEach(category => {
      const allocated = category.allocated_amount || 0
      const committed = category.budget_expenses?.reduce((sum, exp) => {
        return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
      }, 0) || 0
      const utilizationRate = allocated > 0 ? (committed / allocated) * 100 : 0

      if (utilizationRate < 50 && allocated > 5000) {
        const savingsAmount = allocated - committed
        recommendations.push({
          id: `savings-${category.id}`,
          couple_id: coupleData.id,
          category_type_id: category.id,
          recommendation_type: 'savings_opportunity' as RecommendationType,
          severity: 'info' as Severity,
          title: `Potential savings in ${category.name}`,
          description: `You've only used ${utilizationRate.toFixed(1)}% of your ${category.name} budget.`,
          suggested_action: `Consider reallocating $${Math.floor(savingsAmount * 0.5).toLocaleString()} to categories that need more funding.`,
          potential_savings: Math.floor(savingsAmount * 0.5),
          is_dismissed: false,
          is_applied: false,
          created_at: now.toISOString()
        })
      }
    })

    // 3. Check for vendor alternatives based on average spending
    const categoryAverages: Record<string, number> = {
      'venue': 15000,
      'catering': 12000,
      'photography': 3500,
      'videography': 2500,
      'florist': 3000,
      'music_dj': 1500,
      'band': 3500,
      'attire': 2500,
      'beauty': 1000,
      'transportation': 1200,
      'cake': 800
    }

    categories?.forEach(category => {
      const categoryName = category.name.toLowerCase()
      const avgSpending = categoryAverages[categoryName] || 0
      const committed = category.budget_expenses?.reduce((sum, exp) => {
        return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
      }, 0) || 0

      if (avgSpending > 0 && committed > avgSpending * 1.5) {
        recommendations.push({
          id: `vendor-alt-${category.id}`,
          couple_id: coupleData.id,
          category_type_id: category.id,
          recommendation_type: 'vendor_alternative' as RecommendationType,
          severity: 'info' as Severity,
          title: `${category.name} spending above average`,
          description: `Your ${category.name} budget is ${((committed / avgSpending - 1) * 100).toFixed(0)}% above the typical range.`,
          suggested_action: `Consider comparing quotes from 2-3 additional vendors to ensure competitive pricing.`,
          potential_savings: committed - avgSpending,
          is_dismissed: false,
          is_applied: false,
          created_at: now.toISOString()
        })
      }
    })

    // 4. Timing adjustments for seasonal pricing
    const weddingDate = coupleData.wedding_date ? new Date(coupleData.wedding_date) : null
    if (weddingDate) {
      const weddingMonth = weddingDate.getMonth()
      const isPeakSeason = weddingMonth >= 4 && weddingMonth <= 9 // May to October

      if (isPeakSeason && totalBudget > 0) {
        recommendations.push({
          id: `timing-peak-season`,
          couple_id: coupleData.id,
          recommendation_type: 'timing_adjustment' as RecommendationType,
          severity: 'info' as Severity,
          title: 'Peak season wedding detected',
          description: 'Your wedding is during peak season (May-October) when prices are typically 15-20% higher.',
          suggested_action: 'Consider booking vendors early to lock in better rates, or explore off-peak day options (Friday/Sunday).',
          potential_savings: totalBudget * 0.15,
          is_dismissed: false,
          is_applied: false,
          created_at: now.toISOString()
        })
      }
    }

    // 5. Budget reallocation suggestions
    const overBudgetCategories = categories?.filter(cat => {
      const allocated = cat.allocated_amount || 0
      const committed = cat.budget_expenses?.reduce((sum, exp) => {
        return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
      }, 0) || 0
      return committed > allocated && allocated > 0
    }) || []

    const underBudgetCategories = categories?.filter(cat => {
      const allocated = cat.allocated_amount || 0
      const committed = cat.budget_expenses?.reduce((sum, exp) => {
        return exp.payment_status !== 'cancelled' ? sum + exp.amount : sum
      }, 0) || 0
      return committed < allocated * 0.5 && allocated > 1000
    }) || []

    if (overBudgetCategories.length > 0 && underBudgetCategories.length > 0) {
      const totalOverage = overBudgetCategories.reduce((sum, cat) => {
        const allocated = cat.allocated_amount || 0
        const committed = cat.budget_expenses?.reduce((expSum, exp) => {
          return exp.payment_status !== 'cancelled' ? expSum + exp.amount : expSum
        }, 0) || 0
        return sum + Math.max(0, committed - allocated)
      }, 0)

      recommendations.push({
        id: `reallocation-suggestion`,
        couple_id: coupleData.id,
        recommendation_type: 'reallocation' as RecommendationType,
        severity: 'warning' as Severity,
        title: 'Budget reallocation recommended',
        description: `${overBudgetCategories.length} categories are over budget by a total of $${totalOverage.toLocaleString()}.`,
        suggested_action: `Reallocate funds from ${underBudgetCategories.map(c => c.name).join(', ')} to cover overages.`,
        potential_savings: totalOverage,
        is_dismissed: false,
        is_applied: false,
        created_at: now.toISOString()
      })
    }

    // Sort recommendations by severity and potential savings
    const sortedRecommendations = recommendations.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return (b.potential_savings || 0) - (a.potential_savings || 0)
    })

    return NextResponse.json({ recommendations: sortedRecommendations })
  } catch (error) {
    console.error('Budget recommendations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/budget/recommendations/[id]/dismiss - Dismiss a recommendation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const segments = request.nextUrl.pathname.split('/')
    const action = segments[segments.length - 1]

    if (action === 'dismiss') {
      // For now, just return success since we don't have a recommendations table
      return NextResponse.json({ 
        success: true, 
        recommendation_id: params.id,
        dismissed_at: new Date().toISOString()
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Dismiss recommendation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}