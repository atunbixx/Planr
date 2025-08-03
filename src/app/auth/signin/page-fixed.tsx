'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignInPageFixed() {
  const [email, setEmail] = useState('hello@atunbi.net')
  const [password, setPassword] = useState('Teniola=1')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setStatus('Signing in...')

    try {
      console.log('🔐 Starting sign in process...')
      
      // Step 1: Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        console.error('❌ Auth error:', authError)
        setError(authError.message)
        setStatus('Sign in failed')
        return
      }

      console.log('✅ Authentication successful:', authData.user.id)
      setStatus('Authentication successful! Loading profile...')

      // Step 2: Check for couple data
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .or(`partner1_user_id.eq.${authData.user.id},partner2_user_id.eq.${authData.user.id}`)
        .single()

      if (coupleError && coupleError.code !== 'PGRST116') {
        console.error('❌ Couple lookup error:', coupleError)
        setStatus('Profile lookup failed, but you are signed in')
      } else if (couple) {
        console.log('✅ Found couple profile:', couple.partner1_name)
        setStatus('Profile found! Redirecting to dashboard...')
      } else {
        console.log('ℹ️ No couple profile found, redirecting to onboarding')
        setStatus('No profile found. Redirecting to setup...')
      }

      // Step 3: Redirect based on profile status
      setTimeout(() => {
        if (couple) {
          window.location.href = '/dashboard'
        } else {
          window.location.href = '/onboarding'
        }
      }, 1500)

    } catch (err: any) {
      console.error('💥 Unexpected error:', err)
      setError(`Unexpected error: ${err.message}`)
      setStatus('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setStatus('Testing connection...')
    try {
      const { data, error } = await supabase.from('couples').select('count').limit(1)
      if (error) {
        setStatus(`❌ Connection failed: ${error.message}`)
      } else {
        setStatus('✅ Connection successful!')
      }
    } catch (err: any) {
      setStatus(`❌ Connection error: ${err.message}`)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: '#111827'
          }}>
            Sign In (Fixed)
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Streamlined sign-in without AuthContext issues
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {status && (
            <div style={{
              backgroundColor: '#f0f9ff',
              color: '#0369a1',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {status}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px',
              color: '#374151'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#9ca3af' : '#1f2937',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '12px'
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={testConnection}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Test Connection
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          <p>This bypasses the AuthContext for testing</p>
          <p><a href="/auth/signin" style={{ color: '#3b82f6' }}>← Back to regular sign-in</a></p>
        </div>
      </div>
    </div>
  )
}