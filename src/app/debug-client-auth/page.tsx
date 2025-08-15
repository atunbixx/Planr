'use client'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { createClient } from '@/lib/supabase/client'

export default function DebugClientAuthPage() {
  const { user, session, isSignedIn, isLoading } = useSupabaseAuth()
  const [clientDebug, setClientDebug] = useState<any>(null)
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    const debugClientAuth = async () => {
      try {
        const supabase = createClient()
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        setClientDebug({
          hook: {
            isSignedIn,
            isLoading,
            userId: user?.id,
            email: user?.email,
            sessionExists: !!session
          },
          direct: {
            session: {
              exists: !!sessionData?.session,
              hasAccessToken: !!sessionData?.session?.access_token,
              hasRefreshToken: !!sessionData?.session?.refresh_token,
              userId: sessionData?.session?.user?.id,
              email: sessionData?.session?.user?.email,
              expiresAt: sessionData?.session?.expires_at
            },
            user: {
              exists: !!userData?.user,
              userId: userData?.user?.id,
              email: userData?.user?.email
            },
            errors: {
              session: sessionError?.message,
              user: userError?.message
            }
          }
        })
        
        // Get browser cookies
        setCookies(document.cookie)
        
      } catch (error) {
        console.error('Client debug error:', error)
        setClientDebug({ error: error.message })
      }
    }

    debugClientAuth()
  }, [user, session, isSignedIn, isLoading])

  const testServerAuth = async () => {
    try {
      const response = await fetch('/api/test-auth', {
        credentials: 'include'
      })
      const data = await response.json()
      console.log('Server auth test:', data)
      alert('Server auth test completed - check console')
    } catch (error) {
      console.error('Server auth test failed:', error)
      alert('Server auth test failed - check console')
    }
  }

  const refreshClientSession = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.refreshSession()
      console.log('Client session refresh:', { data, error })
      alert('Client session refresh completed - check console')
    } catch (error) {
      console.error('Client session refresh failed:', error)
      alert('Client session refresh failed - check console')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Client Authentication Debug</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Client State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Client State</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(clientDebug, null, 2)}
            </pre>
          </div>
          
          {/* Browser Cookies */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Browser Cookies</h2>
            <div className="bg-gray-100 p-4 rounded text-sm">
              {cookies ? (
                <div>
                  {cookies.split(';').map((cookie, index) => (
                    <div key={index} className="mb-1">
                      {cookie.trim()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No cookies found</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Test Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={testServerAuth}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Server Auth
          </button>
          <button
            onClick={refreshClientSession}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Refresh Client Session
          </button>
        </div>
      </div>
    </div>
  )
}