'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

export default function TestNavPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setLoading(false)
  }

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'hello@atunbi.net',
      password: 'Teniola=1'
    })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Signed in successfully!')
      await checkUser()
    }
  }

  const checkCoupleAndNavigate = async () => {
    if (!user) {
      alert('Please sign in first')
      return
    }

    const { data: couple, error } = await supabase
      .from('couples')
      .select('*')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single()

    if (error && error.code !== 'PGRST116') {
      alert('Error checking couple: ' + error.message)
      return
    }

    if (couple) {
      alert('Couple found! Navigating to dashboard...')
      window.location.href = '/dashboard'
    } else {
      alert('No couple found! Navigating to onboarding...')
      window.location.href = '/onboarding'
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Navigation Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <p className="font-semibold">Current Status:</p>
          <p>{user ? `Signed in as: ${user.email}` : 'Not signed in'}</p>
          {user && <p className="text-sm text-gray-600">User ID: {user.id}</p>}
        </div>

        {!user ? (
          <button
            onClick={signIn}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sign In (hello@atunbi.net)
          </button>
        ) : (
          <div className="space-y-4">
            <button
              onClick={checkCoupleAndNavigate}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Check Couple Profile & Navigate
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Force Dashboard
              </button>
              
              <button
                onClick={() => window.location.href = '/onboarding'}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Force Onboarding
              </button>
            </div>
            
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                await checkUser()
              }}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 rounded text-sm">
        <p className="font-semibold mb-2">Debug Info:</p>
        <ul className="space-y-1">
          <li>Middleware: Enabled</li>
          <li>Auth State: {user ? 'Authenticated' : 'Not authenticated'}</li>
          <li>Next Step: {user ? 'Click "Check Couple Profile & Navigate"' : 'Sign in first'}</li>
        </ul>
      </div>
    </div>
  )
}