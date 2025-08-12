'use client'

import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

// Client-side auth utilities with reactive state
export function useSupabaseAuth() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(false)
  
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (!error && session) {
        setSession(session)
        setUser(session.user)
        setIsSignedIn(true)
      }
      setIsLoading(false)
    }
    
    getInitialSession()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsSignedIn(!!session)
        setIsLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [supabase.auth])
  
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  }
  
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    return data
  }
  
  const signInWithGoogle = async () => {
    try {
      console.log('🔄 Starting Google OAuth sign-in...');
      console.log('📍 Redirect URL:', `${window.location.origin}/auth/callback`);
      
      // Check if we're in a valid environment
      if (typeof window === 'undefined') {
        const error = new Error('Google sign-in must be called from browser environment');
        console.error('❌ Environment error:', error);
        throw error;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ Google OAuth error:', {
          message: error.message,
          status: error.status,
          details: error
        });
        
        // Provide user-friendly error messages
        let userMessage = 'Failed to sign in with Google. ';
        if (error.message?.includes('Invalid login credentials')) {
          userMessage += 'Please check your Google account credentials.';
        } else if (error.message?.includes('Email not confirmed')) {
          userMessage += 'Please verify your email address first.';
        } else if (error.message?.includes('Provider not enabled')) {
          userMessage += 'Google sign-in is not properly configured. Please contact support.';
        } else {
          userMessage += 'Please try again or contact support if the issue persists.';
        }
        
        const enhancedError = new Error(userMessage);
        enhancedError.originalError = error;
        throw enhancedError;
      }

      console.log('✅ Google OAuth initiated successfully:', {
        provider: data?.provider,
        url: data?.url ? 'URL generated' : 'No URL'
      });

      // Check if we got a redirect URL
      if (!data?.url) {
        const error = new Error('No redirect URL received from Google OAuth. This may indicate a configuration issue.');
        console.error('❌ OAuth configuration error:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Google sign-in failed:', {
        message: error.message,
        stack: error.stack,
        originalError: error.originalError
      });
      
      // Show user-friendly error in UI
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(error.message || 'Failed to sign in with Google. Please try again.');
      }
      
      return { data: null, error };
    }
  }
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
  
  const getUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }
  
  const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }
  
  return {
    user,
    session,
    isLoading,
    isSignedIn,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    getUser,
    getSession,
    supabase,
  }
}

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

// Default export to ensure module recognition
export default {
  useSupabaseAuth,
  hasCompletedOnboarding,
  setOnboardingCompleted
}