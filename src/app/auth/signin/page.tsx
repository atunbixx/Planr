'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import './signin.css'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check auth status after mounting
  useEffect(() => {
    if (!mounted) return

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('🔄 User already authenticated, redirecting to dashboard')
          router.replace('/dashboard')
        }
      } catch (err) {
        console.error('Error checking auth:', err)
      }
    }

    checkAuth()
  }, [mounted, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading || isRedirecting) return
    
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔐 Attempting sign in...')
      
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        console.error('❌ Sign in error:', signInError)
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      if (!data?.user) {
        setError('Sign in failed. Please try again.')
        setIsLoading(false)
        return
      }

      console.log('✅ Sign in successful:', data.user.id)
      setIsRedirecting(true)
      
      // Check for couple data
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .or(`partner1_user_id.eq.${data.user.id},partner2_user_id.eq.${data.user.id}`)
        .single()
      
      console.log('👫 Couple check:', { found: !!couple, error: coupleError?.message })
      
      // Navigate after successful signin
      if (couple) {
        console.log('🏠 Navigating to dashboard...')
        // Force a complete page reload to ensure auth state is fresh
        window.location.href = '/dashboard'
      } else {
        console.log('📝 Navigating to onboarding...')
        // Force a complete page reload to ensure auth state is fresh
        window.location.href = '/onboarding'
      }
      
    } catch (err) {
      console.error('💥 Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
      setIsRedirecting(false)
    }
  }

  // Show redirecting state
  if (isRedirecting) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #000',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#666' }}>Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fafafa',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        padding: '48px 32px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '36px',
            fontWeight: '300',
            letterSpacing: '-0.02em',
            lineHeight: '1.1',
            color: '#000000',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            Wedding Planner
          </h1>
          <p style={{
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            fontSize: '16px',
            fontWeight: '400',
            letterSpacing: '0',
            lineHeight: '1.6',
            color: '#666666',
            margin: '0'
          }}>
            Sign in to continue planning your perfect day
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '16px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box'
              }}
              placeholder="hello@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '16px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#ffffff',
              backgroundColor: isLoading ? '#9CA3AF' : '#000000',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              marginTop: '8px'
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ 
          marginTop: '32px', 
          paddingTop: '32px',
          borderTop: '1px solid #E5E7EB',
          textAlign: 'center' 
        }}>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '16px'
          }}>
            Don't have an account?{' '}
            <Link href="/auth/signup" style={{
              color: '#000000',
              textDecoration: 'none',
              fontWeight: '600'
            }}>
              Sign up
            </Link>
          </p>
          <Link href="/" style={{
            fontSize: '14px',
            color: '#6B7280',
            textDecoration: 'none'
          }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}