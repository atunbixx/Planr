import { createClient } from '@/lib/supabase/server'
import { withSuperAdmin, logAdminAction } from '@/lib/admin/roles'
import { NextRequest } from 'next/server'

export const GET = withSuperAdmin(async (req: NextRequest, adminId: string) => {
  const supabase = await createClient()
  const id = req.url.split('/').pop()
  
  if (!id) {
    throw new Error('User ID required')
  }
  
  // Get user details with all related data
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      user_roles (role),
      subscriptions (
        id,
        plan_id,
        status,
        started_at,
        current_period_end,
        canceled_at
      ),
      couples (
        id,
        partner1_name,
        partner2_name,
        wedding_date,
        venue_name,
        guest_count_estimate,
        total_budget
      ),
      invoices (
        id,
        amount_cents,
        currency,
        status,
        paid_at,
        created_at
      ),
      support_tickets (
        id,
        subject,
        status,
        priority,
        created_at
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !user) {
    throw new Error('User not found')
  }
  
  // Get usage summary
  const { data: usageSummary } = await supabase
    .from('usage_daily')
    .select('SUM(storage_bytes), SUM(api_calls), SUM(files_uploaded), SUM(guests_added), SUM(invites_sent)')
    .eq('user_id', id)
    .gte('day', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .single()
  
  // Get recent activity
  const { data: recentActivity } = await supabase
    .from('audit_events')
    .select('*')
    .or(`actor_user_id.eq.${id},target_user_id.eq.${id}`)
    .order('created_at', { ascending: false })
    .limit(20)
  
  // Get recent errors (mock for now)
  const recentErrors = [
    { timestamp: new Date().toISOString(), error: 'Failed to upload photo', context: { file: 'IMG_1234.jpg' } }
  ]
  
  // Log the view
  await logAdminAction(adminId, 'admin.user.view', {
    viewed_user_id: id
  }, id)
  
  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        phone: user.phone,
        created_at: user.created_at,
        updated_at: user.updated_at,
        role: user.user_roles?.[0]?.role || 'guest',
        preferences: user.preferences
      },
      subscription: user.subscriptions?.[0] || null,
      couple: user.couples?.[0] || null,
      invoices: user.invoices || [],
      tickets: user.support_tickets || [],
      usage: {
        storage_mb: Math.round((usageSummary?.sum || 0) / 1024 / 1024),
        api_calls: usageSummary?.sum_2 || 0,
        files_uploaded: usageSummary?.sum_3 || 0,
        guests_added: usageSummary?.sum_4 || 0,
        invites_sent: usageSummary?.sum_5 || 0
      },
      activity: recentActivity || [],
      errors: recentErrors
    }
  }
})

export const PUT = withSuperAdmin(async (req: NextRequest, adminId: string) => {
  const supabase = await createClient()
  const id = req.url.split('/').pop()
  const body = await req.json()
  
  if (!id) {
    throw new Error('User ID required')
  }
  
  // Handle different update types
  const { action, ...data } = body
  
  switch (action) {
    case 'update_plan':
      await updateUserPlan(supabase, id, data.plan_id, adminId)
      break
      
    case 'grant_credits':
      await grantCredits(supabase, id, data.amount_cents, adminId)
      break
      
    case 'suspend':
      await suspendUser(supabase, id, adminId)
      break
      
    case 'reactivate':
      await reactivateUser(supabase, id, adminId)
      break
      
    case 'reset_password':
      await sendPasswordReset(supabase, id, adminId)
      break
      
    default:
      throw new Error(`Unknown action: ${action}`)
  }
  
  return { success: true }
})

async function updateUserPlan(supabase: any, userId: string, planId: string, adminId: string) {
  // Get current subscription
  const { data: current } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  // Update or create subscription
  if (current) {
    await supabase
      .from('subscriptions')
      .update({
        plan_id: planId,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', current.id)
  } else {
    await supabase
      .from('subscriptions')
      .insert({
        id: `sub_admin_${Date.now()}`,
        user_id: userId,
        plan_id: planId,
        status: 'active',
        started_at: new Date().toISOString()
      })
  }
  
  await logAdminAction(adminId, 'admin.user.plan_change', {
    user_id: userId,
    old_plan: current?.plan_id || 'free',
    new_plan: planId
  }, userId)
}

async function grantCredits(supabase: any, userId: string, amountCents: number, adminId: string) {
  // Create a credit invoice
  await supabase
    .from('invoices')
    .insert({
      id: `inv_credit_${Date.now()}`,
      user_id: userId,
      amount_cents: -amountCents, // Negative for credit
      currency: 'usd',
      status: 'paid',
      description: 'Admin credit',
      paid_at: new Date().toISOString()
    })
  
  await logAdminAction(adminId, 'admin.user.credit_grant', {
    user_id: userId,
    amount_cents: amountCents
  }, userId)
}

async function suspendUser(supabase: any, userId: string, adminId: string) {
  // Update user status - you might want to add a status field to users table
  // For now, we'll cancel their subscription
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  await logAdminAction(adminId, 'admin.user.suspend', {
    user_id: userId
  }, userId)
}

async function reactivateUser(supabase: any, userId: string, adminId: string) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      canceled_at: null
    })
    .eq('user_id', userId)
  
  await logAdminAction(adminId, 'admin.user.reactivate', {
    user_id: userId
  }, userId)
}

async function sendPasswordReset(supabase: any, userId: string, adminId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()
  
  if (user) {
    // This would trigger password reset email
    // await supabase.auth.resetPasswordForEmail(user.email)
  }
  
  await logAdminAction(adminId, 'admin.user.password_reset', {
    user_id: userId
  }, userId)
}