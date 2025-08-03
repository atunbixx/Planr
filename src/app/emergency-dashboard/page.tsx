'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Fresh client for emergency dashboard
const emergencySupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EmergencyDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setStatus('Checking authentication...')
      
      const { data: { user }, error } = await emergencySupabase.auth.getUser()
      
      if (error) {
        setStatus(`Auth error: ${error.message}`)
        setLoading(false)
        return
      }

      if (!user) {
        setStatus('No user found - redirecting to emergency sign-in...')
        setTimeout(() => {
          window.location.href = '/emergency-signin'
        }, 2000)
        return
      }

      setUser(user)
      setStatus(`Welcome ${user.email}!`)
      setLoading(false)

    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await emergencySupabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/emergency-signin'
    } catch (err: any) {
      console.error('Sign out error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{status}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{status}</p>
          <a 
            href="/emergency-signin"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Go to Emergency Sign-In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              🚨 Emergency Dashboard
            </h1>
            <button
              onClick={signOut}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                ✅ Authentication Working!
              </h2>
              
              <div className="space-y-4">
                <div>
                  <strong>User ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Status:</strong> <span className="text-green-600">{status}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">
                  Next Steps:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Authentication is now working</li>
                  <li>You can access the regular dashboard at <a href="/dashboard" className="text-blue-500 hover:underline">/dashboard</a></li>
                  <li>The AuthContext issues have been bypassed</li>
                  <li>Session is properly stored</li>
                </ul>
              </div>

              <div className="mt-6">
                <a 
                  href="/dashboard"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 mr-4"
                >
                  Try Regular Dashboard
                </a>
                <a 
                  href="/emergency-signin"
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Back to Emergency Sign-In
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}