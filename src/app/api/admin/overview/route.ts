import { createClient } from '@/lib/supabase/server'
import { withSuperAdmin } from '@/lib/admin/roles'
import { NextRequest } from 'next/server'

export const GET = withSuperAdmin(async (req: NextRequest, userId: string) => {
  const supabase = await createClient()
  
  // Fetch all KPIs in parallel
  const [
    activeUsers,
    userSegments,
    revenue,
    churn,
    support,
    weddingMetrics,
    recentErrors
  ] = await Promise.all([
    supabase.from('v_active_users').select('*').single(),
    supabase.from('v_user_segments').select('*').single(),
    supabase.from('v_revenue').select('*').single(),
    supabase.from('v_churn').select('*').single(),
    supabase.from('v_support_stats').select('*').single(),
    supabase.from('v_wedding_metrics').select('*').single(),
    getRecentErrors(supabase)
  ])
  
  // Calculate additional metrics
  const arpu = revenue.data?.paying_users_current_month > 0
    ? Math.round(revenue.data.mrr_cents / revenue.data.paying_users_current_month)
    : 0
  
  const stickiness = activeUsers.data?.mau30 > 0
    ? Math.round((activeUsers.data.dau7 / activeUsers.data.mau30) * 100)
    : 0
  
  return {
    success: true,
    data: {
      acquisition: {
        new_today: userSegments.data?.new_today || 0,
        new_week: userSegments.data?.new_week || 0,
        new_month: userSegments.data?.new_month || 0
      },
      engagement: {
        dau7: activeUsers.data?.dau7 || 0,
        mau30: activeUsers.data?.mau30 || 0,
        stickiness: stickiness,
        active_rate: userSegments.data?.total_users > 0
          ? Math.round((activeUsers.data?.mau30 / userSegments.data.total_users) * 100)
          : 0
      },
      segments: {
        total_users: userSegments.data?.total_users || 0,
        free_users: userSegments.data?.free_users || 0,
        premium_users: userSegments.data?.premium_users || 0,
        trial_users: userSegments.data?.trial_users || 0
      },
      revenue: {
        mrr_cents: revenue.data?.mrr_cents || 0,
        revenue_30d_cents: revenue.data?.revenue_30d_cents || 0,
        revenue_90d_cents: revenue.data?.revenue_90d_cents || 0,
        arpu_cents: arpu,
        paying_users: revenue.data?.paying_users_current_month || 0
      },
      churn: {
        churned_30d: churn.data?.churned_30d || 0,
        churned_90d: churn.data?.churned_90d || 0,
        at_risk: churn.data?.at_risk || 0,
        churn_rate_30d: userSegments.data?.premium_users > 0
          ? Math.round((churn.data?.churned_30d / userSegments.data.premium_users) * 100)
          : 0
      },
      support: {
        open_tickets: support.data?.open_tickets || 0,
        pending_tickets: support.data?.pending_tickets || 0,
        closed_30d: support.data?.closed_30d || 0,
        urgent_open: support.data?.urgent_open || 0,
        high_open: support.data?.high_open || 0,
        avg_resolution_hours: support.data?.avg_resolution_hours || 0
      },
      wedding: {
        total_weddings: weddingMetrics.data?.total_weddings || 0,
        upcoming_weddings: weddingMetrics.data?.upcoming_weddings || 0,
        weddings_next_30d: weddingMetrics.data?.weddings_next_30d || 0,
        avg_guest_count: weddingMetrics.data?.avg_guest_count || 0,
        avg_budget: weddingMetrics.data?.avg_budget || 0,
        total_guests: weddingMetrics.data?.total_guests || 0,
        confirmed_guests: weddingMetrics.data?.confirmed_guests || 0
      },
      reliability: {
        error_count_24h: recentErrors.count || 0,
        error_rate: recentErrors.rate || 0,
        top_errors: recentErrors.top || []
      }
    }
  }
})

async function getRecentErrors(supabase: any) {
  // This would normally query your error tracking system
  // For now, return mock data
  return {
    count: 12,
    rate: 0.02,
    top: [
      { error: 'Failed to upload photo', count: 5 },
      { error: 'RSVP submission timeout', count: 3 },
      { error: 'Vendor search error', count: 4 }
    ]
  }
}