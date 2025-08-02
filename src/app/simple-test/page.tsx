'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

export default function SimpleTestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'hello@atunbi.net',
      password: 'Teniola=1'
    })
    
    if (error) {
      console.error('Sign in error:', error)
      alert(error.message)
    } else {
      console.log('Sign in success:', data)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Auth Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-semibold">Auth Status:</p>
          <p>{user ? `Signed in as ${user.email} (${user.id})` : 'Not signed in'}</p>
        </div>

        {!user ? (
          <button
            onClick={signIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign In as Dev User
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
            
            <div className="space-x-2">
              <a href="/dashboard" className="text-blue-500 hover:underline">
                Go to Dashboard (link)
              </a>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-blue-500 hover:underline"
              >
                Go to Dashboard (window.location)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}