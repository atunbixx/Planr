import { createClient } from '@/lib/supabase/server'
import { User, Session } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// Server-side auth utilities
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting current session:', error)
    return null
  }
  
  return session
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  return user
}

export async function requireSession(): Promise<Session> {
  const session = await getCurrentSession()
  
  if (!session) {
    redirect('/sign-in')
  }
  
  return session
}

// Helper function for API routes
export async function getUser(): Promise<User | null> {
  return await getCurrentUser()
}