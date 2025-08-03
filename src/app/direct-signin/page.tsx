'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DirectSignIn() {
  const [status, setStatus] = useState('Ready to sign in')
  const [loading, setLoading] = useState(false)

  const directSignIn = async () => {
    setLoading(true)
    setStatus('🔐 Starting direct sign-in (bypassing AuthContext)...')

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setStatus('⏰ Operation timed out after 30 seconds')
      setLoading(false)
    }, 30000)

    try {
      // Step 1: Test basic connection
      setStatus('1️⃣ Testing Supabase connection...')
      console.log('Testing Supabase connection...')
      
      const { data: testData, error: testError } = await supabase.from('couples').select('count').limit(1)
      console.log('Connection test result:', { testData, testError })
      
      if (testError) {
        setStatus(`❌ Connection test failed: ${testError.message}`)
        console.error('Connection test failed:', testError)
        setLoading(false)
        return
      }
      setStatus('✅ Connection test passed')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 2: Direct sign-in
      setStatus('2️⃣ Signing in directly with Supabase...')
      console.log('Starting sign-in...')
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })
      
      console.log('Sign-in result:', { authData, authError })

      if (authError) {
        setStatus(`❌ Sign-in failed: ${authError.message}`)
        console.error('Sign-in failed:', authError)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setStatus('❌ Sign-in failed: No user returned')
        console.error('No user returned from sign-in')
        setLoading(false)
        return
      }

      setStatus(`✅ Sign-in successful! User: ${authData.user.email}`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 3: Verify session
      setStatus('3️⃣ Verifying session...')
      console.log('Verifying session...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session result:', { session, sessionError })
      
      if (sessionError || !session) {
        setStatus(`❌ Session verification failed: ${sessionError?.message || 'No session'}`)
        console.error('Session verification failed:', sessionError)
        setLoading(false)
        return
      }

      setStatus(`✅ Session verified! User ID: ${session.user.id}`)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 4: Check couple data
      setStatus('4️⃣ Looking up couple profile...')
      console.log('Looking up couple profile for user:', session.user.id)
      
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .or(`partner1_user_id.eq.${session.user.id},partner2_user_id.eq.${session.user.id}`)
        .single()

      console.log('Couple lookup result:', { couple, coupleError })

      if (coupleError && coupleError.code !== 'PGRST116') {
        setStatus(`❌ Couple lookup failed: ${coupleError.message}`)
        console.error('Couple lookup failed:', coupleError)
        setLoading(false)
        return
      }

      if (couple) {
        setStatus(`✅ Found couple profile: ${couple.partner1_name}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setStatus('🏠 Redirecting to dashboard...')
        
        console.log('Redirecting to dashboard...')
        // Force page reload to ensure auth state is fresh
        window.location.href = '/dashboard'
      } else {
        setStatus('ℹ️ No couple profile found')
        await new Promise(resolve => setTimeout(resolve, 1000))
        setStatus('📝 Redirecting to onboarding...')
        
        console.log('Redirecting to onboarding...')
        window.location.href = '/onboarding'
      }

    } catch (err: any) {
      setStatus(`💥 Unexpected error: ${err.message}`)
      console.error('Direct sign-in error:', err)
      setLoading(false)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const clearSession = async () => {
    setLoading(true)
    setStatus('🔄 Clearing session...')
    
    try {
      await supabase.auth.signOut()
      setStatus('✅ Session cleared')
    } catch (err: any) {
      setStatus(`❌ Error clearing session: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'system-ui, sans-serif' 
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Direct Sign-In (AuthContext Bypass)
      </h1>
      
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        This bypasses the AuthContext completely and signs in directly with Supabase
      </p>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button 
          onClick={directSignIn}
          disabled={loading}
          style={{ 
            padding: '15px 30px', 
            fontSize: '18px',
            backgroundColor: loading ? '#ccc' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '15px'
          }}
        >
          {loading ? 'Processing...' : 'Direct Sign In'}
        </button>

        <button 
          onClick={clearSession}
          disabled={loading}
          style={{ 
            padding: '15px 30px', 
            fontSize: '18px',
            backgroundColor: loading ? '#ccc' : '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Clear Session
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        minHeight: '150px',
        border: '1px solid #dee2e6'
      }}>
        <strong>Status:</strong><br />
        {status}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Why This Works:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Bypasses the slow AuthContext initialization</li>
          <li>Uses direct Supabase calls</li>
          <li>Shows each step clearly</li>
          <li>Forces page reload for clean auth state</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p><strong>Credentials:</strong> hello@atunbi.net / Teniola=1</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          <a href="/auth/signin">← Back to regular sign-in</a> | 
          <a href="/test-signin"> Test tools</a>
        </p>
      </div>
    </div>
  )
}