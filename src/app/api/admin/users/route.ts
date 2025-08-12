import { createClient } from '@/lib/supabase/server'
import { withSuperAdmin, logAdminAction } from '@/lib/admin/roles'
import { NextRequest } from 'next/server'

export const GET = withSuperAdmin(async (req: NextRequest, userId: string) => {
  const supabase = await createClient()
  
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''
  const plan = searchParams.get('plan') || ''
  const status = searchParams.get('status') || ''
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  
  const offset = (page - 1) * limit
  
  // Build query
  let query = supabase
    .from('users')
    .select(`
      *,
      subscriptions!inner (
        plan_id,
        status,
        current_period_end
      ),
      couples (
        id,
        wedding_date,
        guest_count_estimate
      ),
      _count:invoices(count),
      usage:usage_daily (
        storage_bytes,
        api_calls
      )
    `, { count: 'exact' })
  
  // Apply filters
  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }
  
  if (plan) {
    query = query.eq('subscriptions.plan_id', plan)
  }
  
  if (status) {
    query = query.eq('subscriptions.status', status)
  }
  
  // Apply sorting
  const orderColumn = sortBy === 'email' ? 'email' : 
                     sortBy === 'name' ? 'first_name' :
                     sortBy === 'plan' ? 'subscriptions.plan_id' :
                     'created_at'
  
  query = query.order(orderColumn, { ascending: sortOrder === 'asc' })
  
  // Apply pagination
  query = query.range(offset, offset + limit - 1)
  
  const { data: users, error, count } = await query
  
  if (error) {
    throw error
  }
  
  // Transform data
  const transformedUsers = users?.map(user => {
    const subscription = user.subscriptions?.[0]
    const couple = user.couples?.[0]
    const totalUsage = user.usage?.reduce((acc: any, day: any) => ({
      storage_bytes: acc.storage_bytes + (day.storage_bytes || 0),
      api_calls: acc.api_calls + (day.api_calls || 0)
    }), { storage_bytes: 0, api_calls: 0 })
    
    return {
      id: user.id,
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed',
      created_at: user.created_at,
      plan: subscription?.plan_id || 'free',
      subscription_status: subscription?.status || 'none',
      current_period_end: subscription?.current_period_end,
      wedding_date: couple?.wedding_date,
      guest_count: couple?.guest_count_estimate || 0,
      invoice_count: user._count || 0,
      storage_mb: Math.round((totalUsage?.storage_bytes || 0) / 1024 / 1024),
      api_calls: totalUsage?.api_calls || 0,
      last_active: user.updated_at
    }
  }) || []
  
  // Get usage stats for the page
  const { data: pageStats } = await supabase
    .from('usage_daily')
    .select('user_id, SUM(storage_bytes) as total_storage, SUM(api_calls) as total_calls')
    .in('user_id', users?.map(u => u.id) || [])
    .gte('day', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .group('user_id')
  
  // Log the search
  await logAdminAction(userId, 'admin.users.search', {
    filters: { search, plan, status },
    page,
    results_count: transformedUsers.length
  })
  
  return {
    success: true,
    data: {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    }
  }
})