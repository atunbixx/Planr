'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Get environment variables safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a fresh Supabase client to avoid conflicts
let emergencySupabase: any = null

try {
  if (supabaseUrl && supabaseKey) {
    emergencySupabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  }
} catch (error) {
  console.error('Failed to create Supabase client:', error)
}

export default function EmergencySignIn() {
  const [status, setStatus] = useState(() => {
    // Debug info on load
    const hasUrl = !!supabaseUrl
    const hasKey = !!supabaseKey
    const hasClient = !!emergencySupabase
    return `Ready - URL: ${hasUrl}, Key: ${hasKey}, Client: ${hasClient}`
  })
  const [loading, setLoading] = useState(false)

  const emergencySignIn = async () => {
    setLoading(true)
    setStatus('🚨 Emergency sign-in starting...')

    try {
      // Check if Supabase client is available
      if (!emergencySupabase) {
        setStatus('❌ Supabase client not available')
        setLoading(false)
        return
      }

      if (!supabaseUrl || !supabaseKey) {
        setStatus('❌ Missing Supabase environment variables')
        setLoading(false)
        return
      }

      // Step 1: Sign in with fresh client
      setStatus('🔐 Signing in with fresh client...')
      
      const { data, error } = await emergencySupabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })

      if (error) {
        setStatus(`❌ Sign-in failed: ${error.message}`)
        setLoading(false)
        return
      }

      if (!data.user) {
        setStatus('❌ No user data returned')
        setLoading(false)
        return
      }

      setStatus(`✅ Emergency sign-in successful!`)
      console.log('Emergency sign-in successful:', data.user.email)

      // Step 2: Set session in localStorage manually
      setStatus('💾 Setting session manually...')
      
      if (data.session && supabaseUrl) {
        try {
          const storageKey = 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token'
          localStorage.setItem(storageKey, JSON.stringify(data.session))
          setStatus('✅ Session stored manually')
        } catch (storageError) {
          console.error('Storage error:', storageError)
          setStatus('⚠️ Session storage failed but continuing...')
        }
      }

      // Step 3: Force redirect
      setStatus('🏠 Forcing redirect to dashboard...')
      
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)

    } catch (err: any) {
      setStatus(`💥 Emergency error: ${err.message}`)
      console.error('Emergency sign-in error:', err)
      setLoading(false)
    }
  }

  const clearEverything = async () => {
    setLoading(true)
    setStatus('🧹 Clearing everything...')
    
    try {
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Sign out from emergency client if available
      if (emergencySupabase) {
        await emergencySupabase.auth.signOut()
      }
      
      setStatus('✅ Everything cleared')
    } catch (err: any) {
      setStatus(`❌ Clear error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 text-center mb-2">
          🚨 Emergency Sign-In
        </h1>
        
        <p className="text-center text-gray-600 mb-6">
          This bypasses all rate limits and problematic code
        </p>
        
        <div className="space-y-4 mb-6">
          <button 
            onClick={emergencySignIn}
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold"
          >
            {loading ? '🔄 Processing...' : '🚨 Emergency Sign In'}
          </button>

          <button 
            onClick={clearEverything}
            disabled={loading}
            className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold"
          >
            🧹 Clear Everything
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg min-h-[120px]">
          <div className="font-mono text-sm">
            <strong>Status:</strong><br />
            <span className="text-green-600">{status}</span>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p><strong>Credentials:</strong> hello@atunbi.net / Teniola=1</p>
          <p className="mt-2">This creates a fresh Supabase client to avoid conflicts</p>
        </div>
      </div>
    </div>
  )
}