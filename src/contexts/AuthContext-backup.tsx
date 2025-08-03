'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getCurrentUser, getCurrentCouple } from '@/lib/supabase'
import { Couple } from '@/types/database'

// =============================================
// AUTHENTICATION CONTEXT
// =============================================
// Manages user authentication and couple data

interface AuthContextType {
  user: User | null
  couple: Couple | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  createCouple: (coupleData: CreateCoupleData) => Promise<void>
  refreshUser: () => Promise<void>
  refreshCouple: () => Promise<void>
  refreshSession: () => Promise<void>
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  
  // Debounce auth state changes to prevent rapid updates
  const [authChangeTimeout, setAuthChangeTimeout] = useState<NodeJS.Timeout | null>(null)

  // No development bypass - use real authentication

  // Initialize auth state with improved timing and better error handling
  useEffect(() => {
    if (initialized) return // Prevent re-initialization
    
    let mounted = true

    // Much shorter timeout - if Supabase takes longer than 2s, something is wrong
    const emergencyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth initialization timeout after 2s, completing with no user')
        setLoading(false)
        setInitialized(true)
        setUser(null)
        setCouple(null)
        setError(null)
      }
    }, 2000) // 2 seconds max

    const initializeAuth = async () => {
      console.log('🔄 Quick auth initialization...')
      
      try {
        // Single attempt with short timeout
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.warn('⚠️ Session error, continuing without auth:', sessionError.message)
        }
        
        console.log('Auth result:', { 
          hasSession: !!session,
          hasError: !!sessionError
        })
        
        if (mounted) {
          setUser(session?.user ?? null)
          setError(sessionError ? sessionError.message : null)
          
          if (session?.user) {
            console.log('✅ User found:', session.user.email)
            
            // Load couple data quickly
            try {
              const coupleData = await getCurrentCouple()
              if (mounted) {
                setCouple(coupleData)
                console.log('✅ Couple data loaded:', !!coupleData)
              }
            } catch (err) {
              console.error('❌ Failed to load couple data:', {
                userId: session.user.id,
                error: err instanceof Error ? err.message : 'Unknown error',
                timestamp: new Date().toISOString()
              })
              if (mounted) setCouple(null)
            }
          } else {
            console.log('❌ No authenticated user found')
          }
          
          // Always complete initialization
          setLoading(false)
          setInitialized(true)
          console.log('🏁 Auth initialization complete:', {
            hasUser: !!session?.user,
            hasCouple: !!couple,
            timestamp: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        
        // Always complete initialization even on error
        if (mounted) {
          setUser(null)
          setError(err instanceof Error ? err.message : 'Failed to initialize authentication')
          setLoading(false)
          setInitialized(true)
          console.error('🚨 Auth initialization failed:', err)
        }
      }
    }

    initializeAuth() // Start initialization

    // Listen for auth changes with improved timing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('🔄 Auth state changed:', event, session?.user?.id)
        
        // Clear existing timeout
        if (authChangeTimeout) {
          clearTimeout(authChangeTimeout)
        }
        
        // Immediate update for critical events
        if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out, clearing state')
          setUser(null)
          setCouple(null)
          setError(null)
          return
        }
        
        if (event === 'SIGNED_IN') {
          console.log('🔑 User signed in immediately, updating state:', session?.user?.id)
          
          // Immediately update state to prevent dashboard redirect loop
          if (mounted) {
            setUser(session?.user ?? null)
            setError(null)
            setLoading(false) // Ensure loading is false when user is signed in
            
            console.log('✅ User state updated immediately:', {
              userId: session?.user?.id,
              email: session?.user?.email
            })
          }
          
          // Load couple data immediately for signed in users
          if (session?.user && mounted) {
            try {
              const coupleData = await getCurrentCouple()
              if (mounted) {
                setCouple(coupleData)
                console.log('✅ Couple data loaded after sign in:', {
                  coupleId: coupleData?.id,
                  hasCouple: !!coupleData
                })
              }
            } catch (err) {
              console.error('❌ Could not fetch couple data after sign in:', err)
              if (mounted) setCouple(null)
            }
          }
          return
        }
        
        // Debounced update for other events (TOKEN_REFRESHED, etc.)
        const timeout = setTimeout(async () => {
          if (!mounted) return
          
          console.log('🔄 Processing auth state change (debounced):', event, !!session?.user)
          setUser(session?.user ?? null)
          setError(null)
          
          if (session?.user) {
            // User state updated, get couple data
            try {
              const coupleData = await getCurrentCouple()
              if (mounted) {
                setCouple(coupleData)
                console.log('✅ Couple data loaded after auth change:', !!coupleData)
              }
            } catch (err) {
              console.warn('Could not fetch couple data after auth change:', err)
              if (mounted) setCouple(null)
            }
          } else {
            // User signed out
            if (mounted) setCouple(null)
          }
        }, 100) // Slightly longer debounce for non-critical events
        
        setAuthChangeTimeout(timeout)
      }
    )

    return () => {
      mounted = false
      clearTimeout(emergencyTimeout)
      if (authChangeTimeout) {
        clearTimeout(authChangeTimeout)
      }
      subscription.unsubscribe()
    }
  }, [initialized])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      // User state will be updated via the auth state change listener
    } catch (err: any) {
      console.error('Sign in error:', err)
      setError(err.message || 'Failed to sign in')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      setError(null)
      setLoading(true)

      const { error: signUpError } = await supabase.auth.signUp({
        email,
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

      // User state will be updated via the auth state change listener
    } catch (err: any) {
      console.error('Sign up error:', err)
      setError(err.message || 'Failed to sign up')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      // State will be updated via the auth state change listener
    } catch (err: any) {
      console.error('Sign out error:', err)
      setError(err.message || 'Failed to sign out')
      throw err
    }
  }

  const createCouple = async (coupleData: CreateCoupleData) => {
    try {
      setError(null)
      
      if (!user) {
        throw new Error('Must be authenticated to create couple profile')
      }

      console.log('Creating couple with data:', {
        partner1_user_id: user.id,
        partner1_name: coupleData.partner1Name,
        partner2_name: coupleData.partner2Name || null,
        wedding_date: coupleData.weddingDate || null,
        venue_name: coupleData.venueName || null,
        venue_location: coupleData.venueLocation || null,
        guest_count: coupleData.guestCountEstimate || 100,
        total_budget: coupleData.budgetTotal || 50000, // Changed from budget_total to total_budget
        wedding_style: coupleData.weddingStyle || 'traditional',
      })

      // Check if user is properly authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session - please log in again')
      }

      console.log('Session valid, making database request...')

      // Format wedding date properly for PostgreSQL
      let formattedWeddingDate = null
      if (coupleData.weddingDate) {
        try {
          const date = new Date(coupleData.weddingDate)
          if (!isNaN(date.getTime())) {
            formattedWeddingDate = date.toISOString().split('T')[0] // YYYY-MM-DD format
          }
        } catch (err) {
          console.warn('Invalid wedding date format:', coupleData.weddingDate)
        }
      }

      const insertData = {
        partner1_user_id: user.id,
        partner1_name: coupleData.partner1Name,
        partner2_name: coupleData.partner2Name || null,
        wedding_date: formattedWeddingDate,
        venue_name: coupleData.venueName || null,
        venue_location: coupleData.venueLocation || null,
        guest_count: coupleData.guestCountEstimate || 100,
        total_budget: coupleData.budgetTotal || 50000,
        wedding_style: coupleData.weddingStyle || 'traditional',
      }

      console.log('About to insert data:', insertData)

      const { data, error } = await supabase
        .from('couples')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // Handle specific error codes
        if (error.code === 'PGRST406') {
          throw new Error('Request format not accepted by server. Please check your data.')
        } else if (error.code === 'PGRST301') {
          throw new Error('Authentication failed. Please log in again.')
        } else if (error.code === 'PGRST116') {
          throw new Error('No matching record found.')
        } else {
          throw new Error(`Database error: ${error.message} (Code: ${error.code})`)
        }
      }

      console.log('Couple created successfully:', data)
      
      // Update couple state
      setCouple(data)
      
      // Return the created couple data
      return data
    } catch (err: any) {
      console.error('Create couple error:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack
      })
      const errorMessage = err?.message || 'Failed to create couple profile'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshUser = async () => {
    try {
      const user = await getCurrentUser()
      setUser(user)
    } catch (err) {
      console.error('Error refreshing user:', err)
      setUser(null)
    }
  }

  const refreshCouple = async () => {
    try {
      const couple = await getCurrentCouple()
      setCouple(couple)
    } catch (err) {
      console.error('Error refreshing couple:', err)
      setCouple(null)
    }
  }

  const refreshSession = async () => {
    try {
      // Refresh both user and couple data
      await refreshUser()
      await refreshCouple()
    } catch (err) {
      console.error('Error refreshing session:', err)
    }
  }

  const value: AuthContextType = {
    user,
    couple,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    createCouple,
    refreshUser,
    refreshCouple,
    refreshSession,
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