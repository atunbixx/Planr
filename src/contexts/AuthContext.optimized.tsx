'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, getCurrentUser, getCurrentCouple } from '@/lib/supabase'
import { Couple } from '@/types/database'

// =============================================
// OPTIMIZED AUTHENTICATION CONTEXT
// =============================================
// Addresses redirect loops, excessive recompilation, and state inconsistencies

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
  isInitialized: boolean
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
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Prevent multiple initialization attempts
  const initializationAttempted = useRef(false)
  const authStateSubscription = useRef<any>(null)

  // Stable error handler to prevent re-renders
  const handleError = useCallback((err: any, context: string) => {
    console.error(`${context}:`, err)
    setError(err?.message || `Failed: ${context}`)
  }, [])

  // Memoized user setter to prevent unnecessary updates
  const updateUser = useCallback((newUser: User | null) => {
    setUser(currentUser => {
      if (currentUser?.id === newUser?.id) return currentUser
      return newUser
    })
  }, [])

  // Memoized couple setter to prevent unnecessary updates
  const updateCouple = useCallback((newCouple: Couple | null) => {
    setCouple(currentCouple => {
      if (currentCouple?.id === newCouple?.id) return currentCouple
      return newCouple
    })
  }, [])

  // Initialize auth state once and only once
  useEffect(() => {
    if (initializationAttempted.current) return

    initializationAttempted.current = true
    let mounted = true

    const initializeAuth = async () => {
      console.log('🔄 Initializing optimized auth...')
      
      try {
        // Get initial session state in a single call
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            setError(sessionError.message)
            setUser(null)
            setCouple(null)
          }
          return
        }

        const initialUser = session?.user || null
        console.log('Initial auth state:', { 
          hasUser: !!initialUser,
          userId: initialUser?.id 
        })
        
        if (mounted) {
          updateUser(initialUser)
          
          // If user exists, fetch couple data
          if (initialUser) {
            try {
              const coupleData = await getCurrentCouple()
              updateCouple(coupleData)
            } catch (err) {
              console.warn('Could not fetch couple data:', err)
              updateCouple(null)
            }
          } else {
            updateCouple(null)
          }
        }
      } catch (err) {
        handleError(err, 'Auth initialization')
        if (mounted) {
          updateUser(null)
          updateCouple(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setIsInitialized(true)
          console.log('✅ Auth initialization complete')
        }
      }
    }

    // Set up auth state listener once
    if (!authStateSubscription.current) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return

          console.log('🔄 Auth state changed:', event, session?.user?.id)
          
          const sessionUser = session?.user ?? null
          updateUser(sessionUser)
          setError(null)
          
          if (sessionUser) {
            // User signed in, get couple data
            try {
              const coupleData = await getCurrentCouple()
              updateCouple(coupleData)
            } catch (err) {
              console.warn('Could not fetch couple data:', err)
              updateCouple(null)
            }
          } else {
            // User signed out
            updateCouple(null)
          }
        }
      )
      authStateSubscription.current = subscription
    }

    initializeAuth()

    return () => {
      mounted = false
      if (authStateSubscription.current) {
        authStateSubscription.current.unsubscribe()
        authStateSubscription.current = null
      }
    }
  }, [updateUser, updateCouple, handleError])

  // Optimized sign in with proper error handling
  const signIn = useCallback(async (email: string, password: string) => {
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
      handleError(err, 'Sign in')
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError])

  // Optimized sign up with proper error handling
  const signUp = useCallback(async (email: string, password: string, userData: SignUpData) => {
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
      handleError(err, 'Sign up')
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError])

  // Optimized sign out
  const signOut = useCallback(async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      // State will be updated via the auth state change listener
    } catch (err: any) {
      handleError(err, 'Sign out')
      throw err
    }
  }, [handleError])

  // Optimized couple creation with better error handling
  const createCouple = useCallback(async (coupleData: CreateCoupleData) => {
    try {
      setError(null)
      
      if (!user) {
        throw new Error('Must be authenticated to create couple profile')
      }

      // Verify session is still valid
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session - please log in again')
      }

      // Format wedding date properly for PostgreSQL
      let formattedWeddingDate = null
      if (coupleData.weddingDate) {
        try {
          const date = new Date(coupleData.weddingDate)
          if (!isNaN(date.getTime())) {
            formattedWeddingDate = date.toISOString().split('T')[0]
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

      const { data, error } = await supabase
        .from('couples')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        
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
      updateCouple(data)
      
      return data
    } catch (err: any) {
      handleError(err, 'Create couple')
      throw err
    }
  }, [user, updateCouple, handleError])

  // Optimized refresh functions
  const refreshUser = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      updateUser(user)
    } catch (err) {
      console.error('Error refreshing user:', err)
      updateUser(null)
    }
  }, [updateUser])

  const refreshCouple = useCallback(async () => {
    try {
      const couple = await getCurrentCouple()
      updateCouple(couple)
    } catch (err) {
      console.error('Error refreshing couple:', err)
      updateCouple(null)
    }
  }, [updateCouple])

  // Memoized context value to prevent unnecessary re-renders
  const value: AuthContextType = React.useMemo(() => ({
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
    isInitialized,
  }), [
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
    isInitialized,
  ])

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