'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuthTestPage() {
  const [email, setEmail] = useState('hello@atunbi.net')
  const [password, setPassword] = useState('Teniola=1')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setMessage('Testing Supabase connection...')
    
    try {
      // Test basic connection
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setMessage(`❌ Connection Error: ${error.message}`)
        return
      }
      
      setMessage(`✅ Connection successful! Session: ${data.session ? 'Active' : 'None'}`)
      
    } catch (err: any) {
      setMessage(`❌ Network Error: ${err.message}`)
      console.error('Connection test failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const testSignIn = async () => {
    setLoading(true)
    setMessage('Testing sign in...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setMessage(`❌ Sign In Error: ${error.message}`)
        return
      }
      
      setMessage(`✅ Sign in successful! User: ${data.user?.email}`)
      
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        setMessage(`❌ Network Error: Supabase server not responding. Check if local Supabase is running on port 54321.`)
      } else {
        setMessage(`❌ Unexpected Error: ${err.message}`)
      }
      console.error('Sign in test failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const testDifferentUrl = async () => {
    setLoading(true)
    setMessage('Testing with different Supabase URL...')
    
    try {
      // Test if we can reach the health endpoint
      const response = await fetch('http://localhost:54321/health')
      
      if (!response.ok) {
        setMessage(`❌ Supabase health check failed: ${response.status}`)
        return
      }
      
      const health = await response.json()
      setMessage(`✅ Supabase is healthy! Version: ${health.version || 'unknown'}`)
      
    } catch (err: any) {
      setMessage(`❌ Supabase not reachable: ${err.message}`)
      console.error('Health check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button 
              onClick={testConnection} 
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Testing...' : '🔗 Test Connection'}
            </Button>
            
            <Button 
              onClick={testDifferentUrl} 
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? 'Testing...' : '🏥 Test Health Endpoint'}
            </Button>
          </div>

          <div className="space-y-2">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </div>

          <Button 
            onClick={testSignIn} 
            disabled={loading || !email || !password}
            className="w-full"
          >
            {loading ? 'Testing...' : '🧪 Test Sign In'}
          </Button>

          {message && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm whitespace-pre-wrap">
              {message}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">🔧 Quick Fixes</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>If "Failed to fetch":</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Supabase local server is not running</li>
                <li>Run: <code>npx supabase start</code></li>
                <li>Or use cloud Supabase instead of local</li>
              </ul>
              
              <p className="mt-2"><strong>If connection works but sign in fails:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>User doesn't exist in database</li>
                <li>Password is incorrect</li>
                <li>Database schema issues</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}