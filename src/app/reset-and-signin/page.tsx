'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ResetAndSignIn() {
  const [status, setStatus] = useState('Ready to reset and sign in')
  const [loading, setLoading] = useState(false)

  const resetAndSignIn = async () => {
    setLoading(true)
    
    try {
      // Step 1: Clear any existing session
      setStatus('1️⃣ Clearing existing session...')
      await supabase.auth.signOut()
      
      // Step 2: Wait to avoid rate limiting
      setStatus('2️⃣ Waiting to avoid rate limits...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Step 3: Sign in fresh
      setStatus('3️⃣ Signing in...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })

      if (authError) {
        setStatus(`❌ Sign-in failed: ${authError.message}`)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setStatus('❌ No user returned')
        setLoading(false)
        return
      }

      setStatus(`✅ Success! Signed in as: ${authData.user.email}`)
      
      // Step 4: Redirect
      setTimeout(() => {
        setStatus('🏠 Redirecting to dashboard...')
        window.location.href = '/dashboard'
      }, 2000)

    } catch (err: any) {
      setStatus(`💥 Error: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">
        Reset & Sign-In
      </h1>
      
      <p className="text-center text-gray-600 mb-6">
        This clears the session first to avoid rate limiting issues
      </p>
      
      <div className="text-center mb-6">
        <button 
          onClick={resetAndSignIn}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg"
        >
          {loading ? 'Processing...' : 'Reset & Sign In'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg min-h-[100px] font-mono text-sm">
        <strong>Status:</strong><br />
        {status}
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p><strong>Credentials:</strong> hello@atunbi.net / Teniola=1</p>
      </div>
    </div>
  )
}