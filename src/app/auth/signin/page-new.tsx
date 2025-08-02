'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Direct Supabase import to avoid any context issues
import { createClient } from '@supabase/supabase-js'

// Use direct values to avoid any env variable issues
const supabaseUrl = 'https://gpfxxbhowailwllpgphe.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODMyMTIsImV4cCI6MjA2ODQ1OTIxMn0.FMY9ABxdunqpLk-smoVRYycqdRoTIF8I9dDgJ0bZl-c'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function SignInPageNew() {
  const [email, setEmail] = useState('hello@atunbi.net')
  const [password, setPassword] = useState('Teniola=1')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugLog, setDebugLog] = useState<string[]>([])
  const router = useRouter()

  const addDebugLog = (message: string) => {
    console.log(message)
    setDebugLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addDebugLog('🔍 SignInPageNew mounted and ready')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    addDebugLog('🔥 Form submitted!')
    
    setError('')
    
    if (!email || !password) {
      addDebugLog('❌ Validation failed - missing credentials')
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    addDebugLog('🔐 Starting authentication...')

    try {
      // Step 1: Authenticate
      addDebugLog('Step 1: Calling supabase.auth.signInWithPassword...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        addDebugLog(`❌ Authentication failed: ${authError.message}`)
        setError(authError.message)
        return
      }

      addDebugLog(`✅ Authentication successful! User ID: ${authData.user.id}`)

      // Step 2: Check couple data
      addDebugLog('Step 2: Checking for couple data...')
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('partner1_user_id', authData.user.id)
        .single()

      if (coupleError && coupleError.code !== 'PGRST116') {
        addDebugLog(`❌ Error checking couple data: ${coupleError.message}`)
        setError('Error loading user data')
        return
      }

      // Step 3: Redirect
      addDebugLog('Step 3: Preparing to redirect...')
      
      if (!coupleData) {
        addDebugLog('👫 No couple data found, redirecting to onboarding')
        router.push('/onboarding')
        addDebugLog('✅ router.push("/onboarding") called')
      } else {
        addDebugLog(`✅ Couple data found: ${coupleData.partner1_name} & ${coupleData.partner2_name}`)
        addDebugLog('🔄 Redirecting to dashboard...')
        router.push('/dashboard')
        addDebugLog('✅ router.push("/dashboard") called')
      }

    } catch (err: any) {
      addDebugLog(`❌ Unexpected error: ${err.message}`)
      setError('An unexpected error occurred: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectLogin = async () => {
    addDebugLog('🧪 Testing direct login...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })
      
      if (error) {
        addDebugLog(`❌ Direct login failed: ${error.message}`)
      } else {
        addDebugLog(`✅ Direct login successful: ${data.user.id}`)
        
        // Check session
        const { data: { session } } = await supabase.auth.getSession()
        addDebugLog(`Session exists: ${!!session}`)
        
        if (session) {
          addDebugLog('🔄 Attempting direct redirect to dashboard...')
          window.location.href = '/dashboard'
        }
      }
    } catch (err: any) {
      addDebugLog(`❌ Direct login error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wedding Studio</h1>
          <h2 className="text-xl text-gray-600">Sign in to your account (DEBUG VERSION)</h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Debug Log */}
          <div className="mb-6 p-3 bg-gray-100 rounded text-xs">
            <h4 className="font-semibold mb-2">Debug Log:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {debugLog.map((log, i) => (
                <div key={i} className="text-gray-700">{log}</div>
              ))}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign in with Router'
                )}
              </button>
              
              <button
                type="button"
                onClick={testDirectLogin}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                🧪 Test Direct Login (window.location)
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}