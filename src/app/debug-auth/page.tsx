'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugAuthPage() {
  const [directAuthResult, setDirectAuthResult] = useState<any>(null)
  const [authContextResult, setAuthContextResult] = useState<any>(null)
  const { user, loading, error } = useAuth()

  useEffect(() => {
    // Test direct supabase auth
    const testDirectAuth = async () => {
      try {
        console.log('Testing direct supabase auth...')
        const { data, error } = await supabase.auth.getUser()
        console.log('Direct auth result:', { user: data.user?.id, error: error?.message })
        setDirectAuthResult({ user: data.user, error })
      } catch (err) {
        console.error('Direct auth error:', err)
        setDirectAuthResult({ user: null, error: err })
      }
    }

    testDirectAuth()
  }, [])

  useEffect(() => {
    setAuthContextResult({ user, loading, error })
    console.log('AuthContext state:', { user: user?.id, loading, error })
  }, [user, loading, error])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Direct Supabase Auth */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Direct Supabase Auth</h2>
            <div className="space-y-2 text-sm">
              <div><strong>User ID:</strong> {directAuthResult?.user?.id || 'null'}</div>
              <div><strong>Email:</strong> {directAuthResult?.user?.email || 'null'}</div>
              <div><strong>Error:</strong> {directAuthResult?.error?.message || 'none'}</div>
              <div><strong>Status:</strong> {directAuthResult?.user ? '✅ Authenticated' : '❌ Not authenticated'}</div>
            </div>
          </div>

          {/* AuthContext */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AuthContext</h2>
            <div className="space-y-2 text-sm">
              <div><strong>User ID:</strong> {authContextResult?.user?.id || 'null'}</div>
              <div><strong>Email:</strong> {authContextResult?.user?.email || 'null'}</div>
              <div><strong>Loading:</strong> {authContextResult?.loading ? 'true' : 'false'}</div>
              <div><strong>Error:</strong> {authContextResult?.error || 'none'}</div>
              <div><strong>Status:</strong> {authContextResult?.user ? '✅ Authenticated' : '❌ Not authenticated'}</div>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Info</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}</div>
              <div><strong>Cookies:</strong> {typeof document !== 'undefined' ? (document.cookie ? 'Present' : 'None') : 'N/A'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.href = '/auth/signin'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Go to Sign In
              </button>
              <button 
                onClick={() => window.location.href = '/onboarding'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Go to Onboarding
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>

        {/* Console Logs */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="text-sm text-gray-600">
            <p>1. Open browser console (F12) to see detailed logs</p>
            <p>2. This page shows the real auth state vs what Playwright sees</p>
            <p>3. Compare Direct Supabase Auth vs AuthContext results</p>
            <p>4. If they differ, there's an issue with the AuthContext</p>
          </div>
        </div>
      </div>
    </div>
  )
}