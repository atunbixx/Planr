'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleSignIn() {
  const [email, setEmail] = useState('hello@atunbi.net')
  const [password, setPassword] = useState('Teniola=1')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('Attempting sign in...')

    try {
      console.log('🔐 Starting sign in process...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        setStatus(`❌ Error: ${error.message}`)
        
        if (error.message.includes('Invalid login credentials')) {
          setStatus('❌ Invalid email or password. Try creating an account first.')
        } else if (error.message.includes('Email not confirmed')) {
          setStatus('❌ Email not confirmed. Check your email or confirm in Supabase dashboard.')
        }
      } else {
        console.log('✅ Sign in successful:', data.user?.id)
        setStatus('✅ Sign in successful! Redirecting...')
        
        // Simple redirect without complex logic
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (err: any) {
      console.error('💥 Unexpected error:', err)
      setStatus(`💥 Unexpected error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createAccount = async () => {
    setLoading(true)
    setStatus('Creating account...')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      if (error) {
        setStatus(`❌ Sign up error: ${error.message}`)
      } else {
        setStatus('✅ Account created! You can now sign in.')
        console.log('✅ Account created:', data.user?.id)
      }
    } catch (err: any) {
      setStatus(`💥 Sign up error: ${err.message}`)
    } finally {
      setLoading(false)
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
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Simple Sign In Test</h1>
      <p>Minimal sign-in form to test authentication.</p>

      <form onSubmit={handleSignIn} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            disabled={loading}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <button
            type="button"
            onClick={createAccount}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Create Account
          </button>
          
          <button
            type="button"
            onClick={testConnection}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Test Connection
          </button>
        </div>
      </form>

      {status && (
        <div style={{
          padding: '15px',
          backgroundColor: status.includes('❌') ? '#f8d7da' : '#d4edda',
          border: `1px solid ${status.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {status}
        </div>
      )}

      <div>
        <h3>Other Options</h3>
        <ul>
          <li><a href="/auth/signin">Regular Sign In Page</a></li>
          <li><a href="/signin-debug">Detailed Debug Tool</a></li>
        </ul>
      </div>
    </div>
  )
}