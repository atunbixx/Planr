'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugSignIn() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setStatus('Testing connection...')
    
    try {
      const { data, error } = await supabase.from('couples').select('count').limit(1)
      if (error) {
        setStatus(`Connection failed: ${error.message}`)
      } else {
        setStatus('Connection successful!')
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSignIn = async () => {
    setLoading(true)
    setStatus('Testing sign-in...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })
      
      if (error) {
        setStatus(`Sign-in failed: ${error.message}`)
      } else if (data.user) {
        setStatus(`Sign-in successful: ${data.user.email}`)
      } else {
        setStatus('Sign-in failed: No user returned')
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSession = async () => {
    setLoading(true)
    setStatus('Testing session...')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setStatus(`Session error: ${error.message}`)
      } else if (session) {
        setStatus(`Session found: ${session.user.email}`)
      } else {
        setStatus('No session found')
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Sign-In</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Test Connection
        </button>
        
        <button 
          onClick={testSignIn}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400 ml-2"
        >
          Test Sign-In
        </button>
        
        <button 
          onClick={testSession}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:bg-gray-400 ml-2"
        >
          Test Session
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded min-h-[100px]">
        <strong>Status:</strong><br />
        {status || 'Ready to test...'}
      </div>
    </div>
  )
}