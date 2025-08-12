'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('TestPassword123!')
  const [status, setStatus] = useState<any>({})
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  
  // Check auth status on load
  useEffect(() => {
    checkAuthStatus()
  }, [])
  
  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    setStatus({
      user: user ? { id: user.id, email: user.email } : null,
      session: session ? { expires: session.expires_at } : null,
      cookies: document.cookie.split(';').filter(c => c.includes('sb-'))
    })
  }
  
  const testSignUp = async () => {
    setLoading(true)
    const testEmail = `test-${Date.now()}@example.com`
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
      })
      
      if (error) throw error
      
      setStatus(prev => ({ ...prev, signUp: { success: true, userId: data.user?.id } }))
      setEmail(testEmail)
    } catch (error: any) {
      setStatus(prev => ({ ...prev, signUp: { error: error.message } }))
    } finally {
      setLoading(false)
      checkAuthStatus()
    }
  }
  
  const testSignIn = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      setStatus(prev => ({ ...prev, signIn: { success: true, userId: data.user?.id } }))
      
      // Wait a bit for cookies to be set
      setTimeout(() => {
        checkAuthStatus()
      }, 500)
    } catch (error: any) {
      setStatus(prev => ({ ...prev, signIn: { error: error.message } }))
    } finally {
      setLoading(false)
    }
  }
  
  const testSignOut = async () => {
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setStatus(prev => ({ ...prev, signOut: { success: true } }))
    } catch (error: any) {
      setStatus(prev => ({ ...prev, signOut: { error: error.message } }))
    } finally {
      setLoading(false)
      checkAuthStatus()
    }
  }
  
  const testApiAuth = async () => {
    try {
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      setStatus(prev => ({ ...prev, apiAuth: data }))
    } catch (error: any) {
      setStatus(prev => ({ ...prev, apiAuth: { error: error.message } }))
    }
  }
  
  const testProtectedRoute = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      setStatus(prev => ({ ...prev, protectedRoute: { status: response.status, data } }))
    } catch (error: any) {
      setStatus(prev => ({ ...prev, protectedRoute: { error: error.message } }))
    }
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-2"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Button onClick={testSignUp} disabled={loading} className="w-full">
                1. Create Test User
              </Button>
              <Button onClick={testSignIn} disabled={loading} className="w-full">
                2. Sign In
              </Button>
              <Button onClick={checkAuthStatus} disabled={loading} className="w-full">
                3. Check Auth Status
              </Button>
              <Button onClick={testApiAuth} disabled={loading} className="w-full">
                4. Test API Auth
              </Button>
              <Button onClick={testProtectedRoute} disabled={loading} className="w-full">
                5. Test Protected Route
              </Button>
              <Button onClick={testSignOut} disabled={loading} className="w-full">
                6. Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Debug Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Create Test User" to create a new user</li>
            <li>Click "Sign In" to authenticate</li>
            <li>Check the status panel - you should see user and session info</li>
            <li>Click "Test API Auth" - should show authenticated: true</li>
            <li>Click "Test Protected Route" - should return data</li>
            <li>Open browser DevTools &gt; Application &gt; Cookies to inspect cookies</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}