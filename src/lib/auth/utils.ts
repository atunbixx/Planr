import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// Server-side auth utilities
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  
  return user
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await createServerClient()
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

// Note: Client-side auth utilities have been moved to @/lib/auth/client

// Auth state management
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

// Helper to check if user has completed onboarding
export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  return document.cookie.includes('onboardingCompleted=true')
}

// Helper to set onboarding completion
export function setOnboardingCompleted(completed: boolean = true): void {
  if (typeof window === 'undefined') return
  
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1) // 1 year from now
  
  document.cookie = `onboardingCompleted=${completed}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}