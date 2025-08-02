'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignInDebug() {
  const [email, setEmail] = useState('hello@atunbi.net')
  const [password, setPassword] = useState('Teniola=1')
  const [results, setResults] = useState<string[]>([])
  const supabase = createClientComponentClient()

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setResults([])
    addResult('Testing Supabase connection...')
    
    try {
      const { data, error } = await supabase.from('couples').select('count').limit(1)
      if (error) {
        addResult(`❌ Database connection failed: ${error.message}`)
      } else {
        addResult(`✅ Database connection successful`)
      }
    } catch (err: any) {
      addResult(`❌ Connection error: ${err.message}`)
    }
  }

  const testAuth = async () => {
    addResult('Testing auth session...')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        addResult(`❌ Auth session error: ${error.message}`)
      } else {
        addResult(`✅ Auth session: ${session ? 'Logged in as ' + session.user.email : 'Not logged in'}`)
      }
    } catch (err: any) {
      addResult(`❌ Auth error: ${err.message}`)
    }
  }

  const testSignIn = async () => {
    addResult(`Attempting sign in with ${email}...`)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        addResult(`❌ Sign in failed: ${error.message}`)
        
        // Check if it's an email confirmation issue
        if (error.message.includes('Email not confirmed')) {
          addResult('💡 This user needs email confirmation in Supabase dashboard')
        }
      } else {
        addResult(`✅ Sign in successful! User ID: ${data.user.id}`)
        addResult(`📧 Email: ${data.user.email}`)
        addResult(`✅ Session created successfully`)
        
        // Test couple lookup
        addResult('Testing couple lookup...')
        const { data: couple, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .or(`partner1_user_id.eq.${data.user.id},partner2_user_id.eq.${data.user.id}`)
          .single()
        
        if (coupleError) {
          addResult(`❌ Couple lookup failed: ${coupleError.message}`)
        } else if (couple) {
          addResult(`✅ Found couple: ${couple.partner1_name}`)
        } else {
          addResult(`ℹ️ No couple found - user needs onboarding`)
        }
      }
    } catch (err: any) {
      addResult(`❌ Unexpected error: ${err.message}`)
    }
  }

  const createTestUser = async () => {
    addResult(`Creating test user with ${email}...`)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      })

      if (error) {
        addResult(`❌ Sign up failed: ${error.message}`)
      } else {
        addResult(`✅ User created! ID: ${data.user?.id}`)
        if (data.user && !data.session) {
          addResult(`📧 Check email for confirmation link`)
        }
      }
    } catch (err: any) {
      addResult(`❌ Sign up error: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Sign-In Debug Tool</h1>
      <p>Diagnose sign-in issues step by step.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email: </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '5px', marginLeft: '10px', width: '200px' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label>Password: </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '5px', marginLeft: '10px', width: '200px' }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          1. Test Connection
        </button>
        
        <button 
          onClick={testAuth}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          2. Test Auth
        </button>
        
        <button 
          onClick={testSignIn}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          3. Test Sign In
        </button>
        
        <button 
          onClick={createTestUser}
          style={{ 
            padding: '10px 15px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create Test User
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {results.length === 0 ? (
          <p>Click the buttons above to test each step of the sign-in process.</p>
        ) : (
          results.map((result, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {result}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Next Steps</h3>
        <p>After testing, try the actual sign-in page:</p>
        <a href="/auth/signin" style={{ color: '#007bff' }}>Go to Sign In Page</a>
      </div>
    </div>
  )
}