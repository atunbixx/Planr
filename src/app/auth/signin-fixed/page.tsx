'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignInPageHydrationFixed() {
  const [email, setEmail] = useState('hello@atunbi.net')
  const [password, setPassword] = useState('Teniola=1')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Fix hydration by ensuring component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔐 Attempting sign in...')
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (signInError) {
        console.error('❌ Sign in error:', signInError)
        setError(signInError.message)
        return
      }

      if (!data?.user) {
        setError('Sign in failed. Please try again.')
        return
      }

      console.log('✅ Sign in successful:', data.user.id)
      setIsRedirecting(true)
      
      // Check for couple data
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('id')
        .or(`partner1_user_id.eq.${data.user.id},partner2_user_id.eq.${data.user.id}`)
        .single()
      
      console.log('👫 Couple check:', { found: !!couple, error: coupleError?.message })
      
      // Navigate after successful signin
      setTimeout(() => {
        if (couple) {
          console.log('🏠 Navigating to dashboard...')
          window.location.href = '/dashboard'
        } else {
          console.log('📝 Navigating to onboarding...')
          window.location.href = '/onboarding'
        }
      }, 1000)

    } catch (err: any) {
      console.error('💥 Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  // Show redirecting state
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Wedding Planner (Fixed)
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in without hydration issues
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Having trouble? Try the{' '}
            <a href="/test-signin" className="font-medium text-indigo-600 hover:text-indigo-500">
              diagnostic tool
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}