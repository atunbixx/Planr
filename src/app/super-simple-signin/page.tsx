'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SuperSimpleSignIn() {
  const [message, setMessage] = useState('Ready to sign in')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    setMessage('Signing in...')

    try {
      const result = await supabase.auth.signInWithPassword({
        email: 'hello@atunbi.net',
        password: 'Teniola=1'
      })

      if (result.error) {
        setMessage('Error: ' + result.error.message)
      } else if (result.data.user) {
        setMessage('Success! Redirecting...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        setMessage('No user returned')
      }
    } catch (error: any) {
      setMessage('Exception: ' + error.message)
    }

    setIsLoading(false)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Super Simple Sign In</h1>
      
      <button 
        onClick={handleSignIn}
        disabled={isLoading}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          backgroundColor: isLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isLoading ? 'Processing...' : 'Sign In'}
      </button>

      <div style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        {message}
      </div>

      <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Credentials: hello@atunbi.net / Teniola=1
      </p>
    </div>
  )
}