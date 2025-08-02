'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function EnvDebugPage() {
  const refreshPage = () => {
    window.location.reload()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Environment Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Environment Variables:</h3>
            <div className="text-sm font-mono bg-gray-100 p-4 rounded space-y-1">
              <div><strong>SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</div>
              <div><strong>SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set'}</div>
              <div><strong>APP_URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}</div>
              <div><strong>NODE_ENV:</strong> {process.env.NODE_ENV || 'Not set'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Expected vs Actual:</h3>
            <div className="text-sm bg-yellow-50 p-4 rounded space-y-1">
              <div><strong>Expected (Local):</strong> http://localhost:54321</div>
              <div><strong>Actual:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
              <div><strong>Status:</strong> {
                process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost') 
                  ? '✅ Using Local' 
                  : '❌ Using Cloud'
              }</div>
            </div>
          </div>

          <Button onClick={refreshPage} className="w-full">
            🔄 Refresh Environment Check
          </Button>

          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🔧 Quick Fixes</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p><strong>If using Cloud Supabase:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Go to signup page and create account: hello@atunbi.net</li>
                <li>Use password: Teniola=1</li>
                <li>Complete couple profile setup</li>
              </ul>
              
              <p><strong>If should use Local Supabase:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Check .env.local file has correct localhost URL</li>
                <li>Restart Next.js server</li>
                <li>Start Supabase: npx supabase start</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}