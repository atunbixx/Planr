'use client'

import { useState, useEffect } from 'react'

export default function BasicSignIn() {
  const [status, setStatus] = useState('Loading...')
  const [loading, setLoading] = useState(false)
  const [supabaseClient, setSupabaseClient] = useState<any>(null)

  useEffect(() => {
    // Initialize Supabase client on the client side
    const initSupabase = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!url || !key) {
          setStatus('❌ Missing environment variables')
          return
        }

        const client = createClient(url, key, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          }
        })

        setSupabaseClient(client)
        setStatus('✅ Supabase client ready')
        
      } catch (error) {
        setStatus(`❌ Failed to initialize: ${error}`)
        console.error('Supabase init error:', error)
      }
    }

    initSupabase()
  }, [])

  const basicSignIn = async () => {
    if (!supabaseClient) {
      setStatus('❌ Supabase client not ready')
      return
    }

    setLoading(true)
    setStatus('🔐 Signing in...')

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })

      if (error) {
        setStatus(`❌ Sign-in failed: ${error.message}`)
        setLoading(false)
        return
      }

      if (!data.user) {
        setStatus('❌ No user returned')
        setLoading(false)
        return
      }

      setStatus(`✅ Signed in as: ${data.user.email}`)
      
      // Simple redirect
      setTimeout(() => {
        setStatus('🏠 Redirecting...')
        window.location.href = '/dashboard'
      }, 1500)

    } catch (err: any) {
      setStatus(`💥 Error: ${err.message}`)
      setLoading(false)
    }
  }

  const clearAll = () => {
    localStorage.clear()
    sessionStorage.clear()
    setStatus('✅ Storage cleared')
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-blue-600 text-center mb-6">
          Basic Sign-In
        </h1>
        
        <div className="space-y-4 mb-6">
          <button 
            onClick={basicSignIn}
            disabled={loading || !supabaseClient}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold"
          >
            {loading ? '🔄 Signing In...' : '🔐 Sign In'}
          </button>

          <button 
            onClick={clearAll}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold"
          >
            🧹 Clear Storage
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg min-h-[100px]">
          <div className="font-mono text-sm">
            <strong>Status:</strong><br />
            <span className={status.includes('❌') ? 'text-red-600' : 'text-green-600'}>
              {status}
            </span>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p><strong>Credentials:</strong> hello@atunbi.net / Teniola=1</p>
        </div>
      </div>
    </div>
  )
}