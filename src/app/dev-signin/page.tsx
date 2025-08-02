'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DevSignIn() {
  const [status, setStatus] = useState('')
  const router = useRouter()

  const quickSignIn = async () => {
    setStatus('Attempting sign in...')
    
    try {
      const response = await fetch('/api/dev-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setStatus('Sign in successful! Redirecting...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      } else {
        setStatus(`Error: ${data.error}`)
        if (data.instructions) {
          console.log('Instructions:', data.instructions)
        }
      }
    } catch (error) {
      setStatus(`Network error: ${error}`)
    }
  }

  const bypassToDashboard = () => {
    // Enable dev bypass and go to dashboard
    localStorage.setItem('dev-bypass', 'true')
    window.location.href = '/dashboard?dev=true'
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Development Sign In</h1>
      <p>Quick access for development and testing.</p>
      
      <div style={{ marginBottom: '30px' }}>
        <button 
          onClick={quickSignIn}
          style={{ 
            padding: '12px 24px', 
            marginRight: '15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Quick Sign In
        </button>
        
        <button 
          onClick={bypassToDashboard}
          style={{ 
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Bypass to Dashboard
        </button>
      </div>

      {status && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {status}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>Other Options</h3>
        <ul>
          <li><a href="/auth/signin">Regular Sign In Page</a></li>
          <li><a href="/working-test">Test Basic App</a></li>
          <li><a href="/table-test">Test Database Tables</a></li>
          <li><a href="/test-supabase">Test Supabase Connection</a></li>
        </ul>
      </div>
    </div>
  )
}