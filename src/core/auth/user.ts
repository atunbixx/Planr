/**
 * User Authentication - Current user context and utilities
 */

import { getCurrentUser as getSupabaseUser } from '@/lib/auth/server'
import { ApiError } from '@/shared/validation/errors'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  roles?: string[]
  permissions?: string[]
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabaseUser = await getSupabaseUser()
    
    if (!supabaseUser) {
      return null
    }

    // Convert Supabase user to our User interface
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      firstName: supabaseUser.user_metadata?.firstName,
      lastName: supabaseUser.user_metadata?.lastName,
      roles: [],
      permissions: []
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Require authenticated user or throw error
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new ApiError('Authentication required', 401)
  }
  
  return user
}

/**
 * Get user ID from request context
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

/**
 * Require user ID or throw error
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    throw new ApiError('Authentication required', 401)
  }
  
  return userId
}