'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SimpleDirectSignIn() {
  const [status, setStatus] = useState('Ready to sign in')
  const [loading, setLoading] = useState(false)

  const simpleSignIn = async () => {
    setLoading(true)
    setStatus('🔐 Signing in...')

    try {
      // Just sign in - skip all the database checks that are failing
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

      setStatus(`✅ Signed in as: ${authData.user.email}`)
      
      // Wait a moment then redirect
      setTimeout(() => {
        setStatus('🏠 Redirecting to dashboard...')
        window.location.href = '/dashboard'
      }, 1000)

    } catch (err: any) {
      setStatus(`💥 Error: ${err.message}`)
      setLoading(false)
    }
  }

  const clearSession = async () => {
    setLoading(true)
    setStatus('🔄 Clearing session...')
    
    try {
      await supabase.auth.signOut()
      setStatus('✅ Session cleared')
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">
        Simple Direct Sign-In
      </h1>
      
      <div className="text-center mb-6">
        <button 
          onClick={simpleSignIn}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg mr-3"
        >
          {loading ? 'Processing...' : 'Sign In'}
        </button>

        <button 
          onClick={clearSession}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg"
        >
          Clear Session
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg min-h-[100px] font-mono text-sm">
        <strong>Status:</strong><br />
        {status}
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p><strong>Credentials:</strong> hello@atunbi.net / Teniola=1</p>
        <p>
          <a href="/debug-signin" className="text-blue-500 hover:underline">Debug Tools</a> | 
          <a href="/auth/signin" className="text-blue-500 hover:underline ml-2">Regular Sign-in</a>
        </p>
      </div>
    </div>
  )
}