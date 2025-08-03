'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Couple } from '@/types/database'

// =============================================
// IMPROVED AUTHENTICATION CONTEXT
// =============================================
// Fixes hydration issues, race conditions, and loading states

interface AuthContextType {
  user: User | null
  couple: Couple | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  createCouple: (coupleData: CreateCoupleData) => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

interface SignUpData {
  fullName: string
  partnerName?: string
}

interface CreateCoupleData {
  partner1Name: string
  partner2Name?: string
  weddingDate?: string
  venueName?: string
  venueLocation?: string
  guestCountEstimate?: number
  budgetTotal?: number
  weddingStyle?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fetch couple data for a user
  const fetchCoupleData = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Fetching couple data for user:', userId)
      const { data, error } = await supabase
        .from('couples')
        .select('*')
        .or(`partner1_user_id.eq.${userId},partner2_user_id.eq.${userId}`)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No couple profile found for user')
          return null
        }
        throw error
      }

      console.log('✅ Couple data fetched:', data?.id)
      return data
    } catch (err) {
      console.error('Error fetching couple data:', err)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    setMounted(true)
    let isCancelled = false

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...')
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (!isCancelled) {
          if (sessionError) {
            console.error('Session error:', sessionError)
            setError(sessionError.message)
          } else if (initialSession) {
            console.log('✅ Session found:', initialSession.user.email)
            setSession(initialSession)
            setUser(initialSession.user)
            
            // Fetch couple data
            const coupleData = await fetchCoupleData(initialSession.user.id)
            if (!isCancelled) {
              setCouple(coupleData)
            }
          } else {
            console.log('No active session')
          }
          
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to initialize auth')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Auth state changed:', event)
        
        if (!isCancelled) {
          switch (event) {
            case 'SIGNED_IN':
              if (newSession) {
                setSession(newSession)
                setUser(newSession.user)
                setError(null)
                
                // Fetch couple data
                const coupleData = await fetchCoupleData(newSession.user.id)
                setCouple(coupleData)
              }
              break
              
            case 'SIGNED_OUT':
              setSession(null)
              setUser(null)
              setCouple(null)
              setError(null)
              break
              
            case 'TOKEN_REFRESHED':
              if (newSession) {
                setSession(newSession)
                setUser(newSession.user)
              }
              break
              
            case 'USER_UPDATED':
              if (newSession) {
                setSession(newSession)
                setUser(newSession.user)
              }
              break
          }
        }
      }
    )

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [fetchCoupleData])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (!data.session) {
        throw new Error('Sign in failed - no session returned')
      }

      // Session and user will be updated via onAuthStateChange
      console.log('✅ Sign in successful')
    } catch (err: any) {
      console.error('Sign in error:', err)
      const errorMessage = err.message || 'Failed to sign in'
      setError(errorMessage)
      throw err
    }
  }

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      setError(null)

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: userData.fullName,
            partner_name: userData.partnerName,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (!data.user) {
        throw new Error('Sign up failed - no user returned')
      }

      console.log('✅ Sign up successful')
    } catch (err: any) {
      console.error('Sign up error:', err)
      const errorMessage = err.message || 'Failed to sign up'
      setError(errorMessage)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      // State will be cleared via onAuthStateChange
      console.log('✅ Sign out successful')
    } catch (err: any) {
      console.error('Sign out error:', err)
      const errorMessage = err.message || 'Failed to sign out'
      setError(errorMessage)
      throw err
    }
  }

  const createCouple = async (coupleData: CreateCoupleData) => {
    try {
      setError(null)
      
      if (!user) {
        throw new Error('Must be authenticated to create couple profile')
      }

      // Format wedding date
      let formattedWeddingDate = null
      if (coupleData.weddingDate) {
        const date = new Date(coupleData.weddingDate)
        if (!isNaN(date.getTime())) {
          formattedWeddingDate = date.toISOString().split('T')[0]
        }
      }

      const { data, error } = await supabase
        .from('couples')
        .insert({
          partner1_user_id: user.id,
          partner1_name: coupleData.partner1Name,
          partner2_name: coupleData.partner2Name || null,
          wedding_date: formattedWeddingDate,
          venue_name: coupleData.venueName || null,
          venue_location: coupleData.venueLocation || null,
          guest_count_estimate: coupleData.guestCountEstimate || 100,
          total_budget: coupleData.budgetTotal || 50000,
          wedding_style: coupleData.weddingStyle || 'traditional',
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      console.log('✅ Couple created successfully:', data.id)
      setCouple(data)
      
      return data
    } catch (err: any) {
      console.error('Create couple error:', err)
      const errorMessage = err?.message || 'Failed to create couple profile'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        throw error
      }

      if (refreshedSession) {
        setSession(refreshedSession)
        setUser(refreshedSession.user)
        
        // Refresh couple data
        const coupleData = await fetchCoupleData(refreshedSession.user.id)
        setCouple(coupleData)
      }
    } catch (err) {
      console.error('Error refreshing session:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh session')
    }
  }

  const value: AuthContextType = {
    user,
    couple,
    session,
    loading: loading || !mounted, // Prevent hydration issues
    error,
    signIn,
    signUp,
    signOut,
    createCouple,
    refreshSession,
    clearError,
  }

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}