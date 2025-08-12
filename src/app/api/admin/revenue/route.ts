import { createClient } from '@/lib/supabase/server'
import { withSuperAdmin } from '@/lib/admin/roles'
import { NextRequest } from 'next/server'

export const GET = withSuperAdmin(async (req: NextRequest, userId: string) => {
  const supabase = await createClient()
  
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '90')
  const groupBy = searchParams.get('groupBy') || 'day'
  
  // Get revenue over time
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('status', 'paid')
    .gte('paid_at', startDate.toISOString())
    .order('paid_at', { ascending: false })
  
  // Get current subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plans (
        name,
        price_cents,
        interval
      ),
      users (
        email,
        first_name,
        last_name
      )
    `)
    .in('status', ['active', 'trialing'])
  
  // Calculate MRR
  const mrr = subscriptions?.reduce((total, sub) => {
    if (!sub.plans) return total
    const monthlyAmount = sub.plans.interval === 'year' 
      ? Math.round(sub.plans.price_cents / 12)
      : sub.plans.price_cents
    return total + monthlyAmount
  }, 0) || 0
  
  // Calculate ARR
  const arr = mrr * 12
  
  // Group revenue by period
  const revenueByPeriod = groupRevenueByPeriod(invoices || [], groupBy)
  
  // Get failed payments
  const { data: failedPayments } = await supabase
    .from('invoices')
    .select('*')
    .eq('status', 'uncollectible')
    .gte('created_at', startDate.toISOString())
  
  // Get refunds
  const { data: refunds } = await supabase
    .from('invoices')
    .select('*')
    .eq('status', 'refunded')
    .gte('created_at', startDate.toISOString())
  
  // Calculate key metrics
  const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.amount_cents, 0) || 0
  const totalRefunds = refunds?.reduce((sum, inv) => sum + inv.amount_cents, 0) || 0
  const netRevenue = totalRevenue - totalRefunds
  
  // Get revenue by plan
  const revenueByPlan = await getRevenueByPlan(supabase)
  
  // Get top paying customers
  const { data: topCustomers } = await supabase
    .from('invoices')
    .select(`
      user_id,
      users (
        email,
        first_name,
        last_name
      ),
      SUM(amount_cents) as total_spent
    `)
    .eq('status', 'paid')
    .group('user_id')
    .order('total_spent', { ascending: false })
    .limit(10)
  
  return {
    success: true,
    data: {
      summary: {
        mrr_cents: mrr,
        arr_cents: arr,
        total_revenue_cents: totalRevenue,
        total_refunds_cents: totalRefunds,
        net_revenue_cents: netRevenue,
        active_subscriptions: subscriptions?.length || 0,
        arpu_cents: subscriptions?.length > 0 ? Math.round(mrr / subscriptions.length) : 0,
        ltv_cents: calculateSimpleLTV(mrr, subscriptions?.length || 0)
      },
      trends: {
        revenue_by_period: revenueByPeriod,
        mrr_trend: calculateMRRTrend(subscriptions || [], days)
      },
      breakdowns: {
        by_plan: revenueByPlan,
        by_status: {
          paid: invoices?.length || 0,
          failed: failedPayments?.length || 0,
          refunded: refunds?.length || 0
        }
      },
      failed_payments: failedPayments || [],
      recent_refunds: refunds || [],
      top_customers: topCustomers || [],
      subscriptions: subscriptions || []
    }
  }
})

function groupRevenueByPeriod(invoices: any[], groupBy: string) {
  const grouped: Record<string, number> = {}
  
  invoices.forEach(invoice => {
    const date = new Date(invoice.paid_at)
    let key: string
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }
    
    grouped[key] = (grouped[key] || 0) + invoice.amount_cents
  })
  
  return Object.entries(grouped)
    .map(([period, amount]) => ({ period, amount }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

async function getRevenueByPlan(supabase: any) {
  const { data } = await supabase
    .from('subscriptions')
    .select(`
      plan_id,
      plans (
        name,
        price_cents
      )
    `)
    .in('status', ['active', 'trialing'])
  
  const byPlan: Record<string, { count: number; mrr_cents: number }> = {}
  
  data?.forEach((sub: any) => {
    if (!byPlan[sub.plan_id]) {
      byPlan[sub.plan_id] = { count: 0, mrr_cents: 0 }
    }
    byPlan[sub.plan_id].count++
    byPlan[sub.plan_id].mrr_cents += sub.plans?.price_cents || 0
  })
  
  return byPlan
}

function calculateMRRTrend(subscriptions: any[], days: number) {
  // Simple MRR trend calculation
  // In production, you'd track MRR changes over time
  const trend = []
  const now = new Date()
  
  for (let i = days; i >= 0; i -= 7) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    const activeOnDate = subscriptions.filter(sub => {
      const startDate = new Date(sub.started_at)
      const endDate = sub.canceled_at ? new Date(sub.canceled_at) : new Date()
      return startDate <= date && endDate >= date
    })
    
    const mrr = activeOnDate.reduce((total, sub) => {
      return total + (sub.plans?.price_cents || 0)
    }, 0)
    
    trend.push({
      date: date.toISOString().split('T')[0],
      mrr_cents: mrr,
      subscription_count: activeOnDate.length
    })
  }
  
  return trend
}

function calculateSimpleLTV(mrr: number, customerCount: number) {
  if (customerCount === 0) return 0
  
  // Simple LTV = ARPU * average customer lifetime (assume 24 months)
  const arpu = mrr / customerCount
  return Math.round(arpu * 24)
}