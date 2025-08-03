'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSignIn() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testSignIn = async () => {
    setLoading(true)
    setResult('Testing sign-in...')

    try {
      // Test the exact credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })

      if (error) {
        setResult(`❌ Sign-in failed: ${error.message}`)
      } else {
        setResult(`✅ Sign-in successful! User: ${data.user.email} (ID: ${data.user.id})`)
        
        // Test couple lookup
        const { data: couple, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .or(`partner1_user_id.eq.${data.user.id},partner2_user_id.eq.${data.user.id}`)
          .single()

        if (couple) {
          setResult(prev => prev + `\n✅ Found couple: ${couple.partner1_name}`)
        } else {
          setResult(prev => prev + `\nℹ️ No couple found (${coupleError?.message || 'not an error'})`)
        }
      }
    } catch (err: any) {
      setResult(`💥 Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setResult('Testing connection...')

    try {
      const { data, error } = await supabase.from('couples').select('count').limit(1)
      if (error) {
        setResult(`❌ Connection failed: ${error.message}`)
      } else {
        setResult('✅ Connection successful!')
      }
    } catch (err: any) {
      setResult(`❌ Connection error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentSession = async () => {
    setLoading(true)
    setResult('Checking current session...')

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        setResult(`❌ Session error: ${error.message}`)
      } else if (session) {
        setResult(`✅ Already signed in: ${session.user.email}`)
      } else {
        setResult('ℹ️ No active session')
      }
    } catch (err: any) {
      setResult(`❌ Session check error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setResult('Signing out...')

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setResult(`❌ Sign out error: ${error.message}`)
      } else {
        setResult('✅ Signed out successfully')
      }
    } catch (err: any) {
      setResult(`❌ Sign out error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Sign-In Test Tool</h1>
      <p>Test the sign-in functionality step by step.</p>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          1. Test Connection
        </button>

        <button 
          onClick={checkCurrentSession}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          2. Check Session
        </button>

        <button 
          onClick={testSignIn}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          3. Test Sign In
        </button>

        <button 
          onClick={signOut}
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        whiteSpace: 'pre-wrap',
        minHeight: '100px'
      }}>
        {result || 'Click a button to test...'}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Next Steps</h3>
        <ul>
          <li><a href="/auth/signin/page-fixed">Try Fixed Sign-In Page</a></li>
          <li><a href="/auth/signin">Regular Sign-In Page</a></li>
          <li><a href="/dashboard">Dashboard (if signed in)</a></li>
        </ul>
      </div>
    </div>
  )
}