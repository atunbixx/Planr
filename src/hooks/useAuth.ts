'use client'

import { useState, useEffect } from 'react'
import AuthClient from '@/lib/auth/client'
import { WeddingDetailsInput } from '@/lib/validation/auth'

interface User {
  id: string
  email: string
  role: string
  onboardingCompleted: boolean
}

interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
  }
  error?: {
    message: string
    statusCode?: number
  }
}

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signin: (email: string, password: string) => Promise<AuthResponse>
  signup: (email: string, password: string, role?: string) => Promise<AuthResponse>
  signout: () => void
  completeOnboarding: (details: WeddingDetailsInput) => Promise<AuthResponse>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from localStorage
    const initializeAuth = async () => {
      setIsLoading(true)
      
      const token = AuthClient.getToken()
      const storedUser = AuthClient.getUser()
      
      if (token && storedUser) {
        // Verify token is still valid by fetching fresh user data
        try {
          console.log('Verifying token and getting fresh user data...')
          const freshUser = await AuthClient.getProfile()
          console.log('Fresh user data:', freshUser)
          if (freshUser) {
            setUser(freshUser)
          } else {
            console.log('No fresh user data, clearing auth')
            // Token is invalid, clear auth
            AuthClient.signout()
          }
        } catch (error) {
          console.error('Error verifying token:', error)
          // Token is invalid, clear auth
          AuthClient.signout()
        }
      } else {
        console.log('No token or stored user found')
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const signin = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const result = await AuthClient.signin(email, password)
      if (result.success && (result as any).data) {
        setUser((result as any).data.user)
      }
      return (result as unknown) as AuthResponse
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, role: string = 'couple'): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const result = await AuthClient.signup(email, password, role)
      if (result.success && (result as any).data) {
        setUser((result as any).data.user)
      }
      return (result as unknown) as AuthResponse
    } finally {
      setIsLoading(false)
    }
  }

  const signout = () => {
    setUser(null)
    AuthClient.signout()
  }

  const completeOnboarding = async (details: WeddingDetailsInput): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const result = await AuthClient.completeOnboarding(details)
      if (result.success && (result as any).data) {
        setUser((result as any).data.user)
      }
      return (result as unknown) as AuthResponse
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const freshUser = await AuthClient.getProfile()
      if (freshUser) {
        setUser(freshUser)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signin,
    signup,
    signout,
    completeOnboarding,
    refreshUser
  }
}
