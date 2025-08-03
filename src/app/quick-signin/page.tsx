'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function QuickSignIn() {
  const [status, setStatus] = useState('Ready to test sign-in')
  const [loading, setLoading] = useState(false)

  const quickSignIn = async () => {
    setLoading(true)
    setStatus('🔐 Attempting sign-in...')

    try {
      // Step 1: Test connection
      setStatus('1️⃣ Testing connection...')
      const { data: testData, error: testError } = await supabase.from('couples').select('count').limit(1)
      if (testError) {
        setStatus(`❌ Connection failed: ${testError.message}`)
        return
      }
      setStatus('✅ Connection successful')

      // Step 2: Sign in
      setStatus('2️⃣ Signing in...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })

      if (error) {
        setStatus(`❌ Sign-in failed: ${error.message}`)
        return
      }

      setStatus(`✅ Sign-in successful! User: ${data.user.email}`)

      // Step 3: Check couple
      setStatus('3️⃣ Looking up couple data...')
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .or(`partner1_user_id.eq.${data.user.id},partner2_user_id.eq.${data.user.id}`)
        .single()

      if (couple) {
        setStatus(`✅ Found couple: ${couple.partner1_name}. Redirecting to dashboard...`)
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        setStatus(`ℹ️ No couple found. Redirecting to onboarding...`)
        setTimeout(() => {
          window.location.href = '/onboarding'
        }, 2000)
      }

    } catch (err: any) {
      setStatus(`💥 Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Quick Sign-In Test</h1>
      <p>One-click sign-in with your credentials</p>

      <button 
        onClick={quickSignIn}
        disabled={loading}
        style={{ 
          padding: '15px 30px', 
          fontSize: '18px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '30px'
        }}
      >
        {loading ? 'Testing...' : 'Quick Sign In'}
      </button>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        minHeight: '100px',
        textAlign: 'left'
      }}>
        {status}
      </div>

      <div style={{ marginTop: '20px' }}>
        <p><strong>Credentials being used:</strong></p>
        <p>Email: hello@atunbi.net</p>
        <p>Password: Teniola=1</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Other Options:</h3>
        <ul style={{ textAlign: 'left' }}>
          <li><a href="/test-signin">Detailed Test Tool</a></li>
          <li><a href="/auth/signin-fixed">Fixed Sign-In Form</a></li>
          <li><a href="/auth/signin">Regular Sign-In</a></li>
        </ul>
      </div>
    </div>
  )
}