import { getCurrentUser as getSupabaseUser } from './auth/server'
import { prisma } from './prisma'

export interface AuthUser {
  id: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
}

/**
 * Unified auth interface that works with both Clerk and Supabase
 * Defaults to Supabase authentication
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    // Default to Supabase auth
    const supabaseUser = await getSupabaseUser()
    
    if (supabaseUser) {
      // Get user from database
      const dbUser = await prisma.user.findUnique({
        where: { supabase_user_id: supabaseUser.id }
      })
      
      return {
        id: dbUser?.id || supabaseUser.id,
        email: supabaseUser.email,
        firstName: dbUser?.firstName,
        lastName: dbUser?.lastName
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting auth user:', error)
    return null
  }
}

/**
 * Get or create user in database
 */
export async function ensureDbUser(supabaseUserId: string, email: string): Promise<string> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUserId }
    })
    
    if (existingUser) {
      return existingUser.id
    }
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        supabase_user_id: supabaseUserId,
        email: email
      }
    })
    
    return newUser.id
  } catch (error) {
    console.error('Error ensuring DB user:', error)
    throw error
  }
}