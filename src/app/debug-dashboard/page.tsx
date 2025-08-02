'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DebugDashboard() {
  const [authStatus, setAuthStatus] = useState('checking')
  
  const testAuth = async () => {
    setAuthStatus('testing')
    try {
      const response = await fetch('/api/dev-auth')
      const data = await response.json()
      console.log('Auth test result:', data)
      setAuthStatus('success')
    } catch (error) {
      console.error('Auth test failed:', error)
      setAuthStatus('failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Dashboard</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
          <button 
            onClick={testAuth}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Auth Connection
          </button>
          <p className="mt-2">Status: {authStatus}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/dashboard" className="block text-blue-500 hover:underline">
              Try Dashboard (with auth)
            </Link>
            <Link href="/demo-dashboard" className="block text-blue-500 hover:underline">
              Demo Dashboard (no auth)
            </Link>
            <Link href="/auth/signin" className="block text-blue-500 hover:underline">
              Sign In Page
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2 text-sm">
            <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}