'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthStatusPage() {
  const { user, couple, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p>Checking authentication status...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className={`p-3 rounded ${user ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <h3 className="font-semibold">User Authentication:</h3>
              {user ? (
                <div className="text-sm space-y-1">
                  <p>✅ <strong>Signed In</strong></p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm">❌ <strong>Not signed in</strong></p>
              )}
            </div>

            <div className={`p-3 rounded ${couple ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <h3 className="font-semibold">Couple Profile:</h3>
              {couple ? (
                <div className="text-sm space-y-1">
                  <p>✅ <strong>Profile Complete</strong></p>
                  <p><strong>Names:</strong> {couple.partner1_name} {couple.partner2_name ? `& ${couple.partner2_name}` : ''}</p>
                  <p><strong>Wedding Date:</strong> {couple.wedding_date || 'Not set'}</p>
                  <p><strong>Guest Count:</strong> {couple.guest_count_estimate}</p>
                  <p><strong>Budget:</strong> ${couple.budget_total?.toLocaleString()}</p>
                </div>
              ) : user ? (
                <p className="text-sm">⚠️ <strong>Couple profile needed</strong></p>
              ) : (
                <p className="text-sm">❌ <strong>Sign in first</strong></p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold text-red-800">Error:</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <h3 className="font-semibold">🎯 Next Steps:</h3>
            {!user ? (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/auth/signup">Create Account</Link>
                </Button>
              </div>
            ) : !couple ? (
              <Button asChild className="w-full">
                <Link href="/dashboard/profile">Complete Couple Profile</Link>
              </Button>
            ) : (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard/vendors">✅ Add Vendors (Ready!)</Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}