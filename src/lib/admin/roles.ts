import { createClient } from '@/lib/supabase/server'
import { unstable_noStore as noStore } from 'next/cache'

export type UserRole = 'superAdmin' | 'admin' | 'planner' | 'vendor' | 'guest' | null

export async function getUserRole(authUserId: string): Promise<UserRole> {
  noStore()
  
  const supabase = await createClient()
  
  // First, find the public.users record using the auth user ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('supabase_user_id', authUserId)
    .single()
  
  if (userError || !user) {
    return null
  }
  
  // Then get the role using the public.users ID
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data.role as UserRole
}

export async function requireSuperAdmin(userId: string): Promise<void> {
  const role = await getUserRole(userId)
  
  if (role !== 'superAdmin') {
    throw new Error('Unauthorized: SuperAdmin access required')
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  const role = await getUserRole(userId)
  
  if (role !== 'superAdmin' && role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
}

export async function grantRole(userId: string, role: UserRole, actorId: string): Promise<void> {
  const supabase = await createClient()
  
  // Check if actor is superAdmin
  await requireSuperAdmin(actorId)
  
  // Grant the role
  const { error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role: role
    }, {
      onConflict: 'user_id,role'
    })
  
  if (error) {
    throw error
  }
  
  // Log the action
  await logAdminAction(actorId, 'admin.role.grant', {
    target_user_id: userId,
    role: role
  })
}

export async function revokeRole(userId: string, actorId: string): Promise<void> {
  const supabase = await createClient()
  
  // Check if actor is superAdmin
  await requireSuperAdmin(actorId)
  
  // Get current role for logging
  const currentRole = await getUserRole(userId)
  
  // Revoke the role
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
  
  if (error) {
    throw error
  }
  
  // Log the action
  await logAdminAction(actorId, 'admin.role.revoke', {
    target_user_id: userId,
    previous_role: currentRole
  })
}

export async function logAdminAction(
  actorId: string,
  eventType: string,
  payload: Record<string, any>,
  targetUserId?: string
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('audit_events')
    .insert({
      actor_user_id: actorId,
      target_user_id: targetUserId,
      event_type: eventType,
      event_payload: payload,
      ip_address: null, // Will be set by API route
      user_agent: null  // Will be set by API route
    })
  
  if (error) {
    console.error('Failed to log admin action:', error)
  }
}

// Middleware helper for API routes
export async function withSuperAdmin<T>(
  handler: (req: Request, userId: string) => Promise<T>
): Promise<(req: Request) => Promise<Response>> {
  return async (req: Request) => {
    try {
      const supabase = await createClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return Response.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      await requireSuperAdmin(user.id)
      
      const result = await handler(req, user.id)
      
      return Response.json(result)
    } catch (error) {
      console.error('SuperAdmin middleware error:', error)
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return Response.json(
          { error: error.message },
          { status: 403 }
        )
      }
      
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}