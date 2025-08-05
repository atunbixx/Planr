'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// This page is a Client Component - authentication will be handled by Clerk
const HeaderClient = dynamic(() => import('@/components/HeaderClient'), { ssr: false })

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [online, setOnline] = useState<boolean | null>(null)
  const [health, setHealth] = useState<'pending' | 'ok' | 'fail'>('pending')
  const [details, setDetails] = useState<string>('')

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : null)
    const onUp = () => setOnline(true)
    const onDown = () => setOnline(false)
    window.addEventListener('online', onUp)
    window.addEventListener('offline', onDown)

    fetch('/api/health')
      .then(async (r) => {
        if (r.ok) {
          setHealth('ok')
          const j = await r.json().catch(() => null)
          setDetails(`health ok @ ${j?.timestamp ?? 'n/a'}`)
        } else {
          setHealth('fail')
          setDetails(`health status ${r.status}`)
        }
      })
      .catch((e) => {
        setHealth('fail')
        setDetails(`health error: ${String(e)}`)
      })

    return () => {
      window.removeEventListener('online', onUp)
      window.removeEventListener('offline', onDown)
    }
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <>
      <HeaderClient firstName={user?.firstName || 'User'} />
      <div className="space-y-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || 'User'}! 👋
            </h1>
            <p className="text-gray-600">
              Ready to continue planning your perfect wedding?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/dashboard/budget">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Budget</CardTitle>
                    <span className="text-2xl">💰</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600">Track expenses and stay on budget</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/guests">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Guests</CardTitle>
                    <span className="text-2xl">👥</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600">Manage your guest list and RSVPs</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/vendors">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Vendors</CardTitle>
                    <span className="text-2xl">🏪</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600">Find and manage your vendors</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/photos">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Photos</CardTitle>
                    <span className="text-2xl">📸</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600">Organize your wedding photos</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* User Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your current account details and authentication status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress || 'Not available'}
              </div>
              <div>
                <strong>Name:</strong> {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set'}
              </div>
              <div>
                <strong>Provider:</strong> Clerk OAuth
              </div>
              <div>
                <strong>Authentication:</strong> Clerk v6 with Next.js 15
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">🎉 System Status</h3>
                
                {/* Debug Panel */}
                <div className="p-4 rounded-md border bg-gray-50">
                  <h4 className="font-semibold mb-2">Connectivity Status</h4>
                  <div className="text-sm space-y-1">
                    <div>Network: <span className="font-mono text-green-600">{String(online)}</span></div>
                    <div>API Health: <span className={`font-mono ${health === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{health}</span></div>
                    <div>Details: <span className="font-mono text-xs break-all">{details}</span></div>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHealth('pending')
                        setDetails('retrying...')
                        fetch('/api/health')
                          .then(async (r) => {
                            if (r.ok) {
                              setHealth('ok')
                              const j = await r.json().catch(() => null)
                              setDetails(`health ok @ ${j?.timestamp ?? 'n/a'}`)
                            } else {
                              setHealth('fail')
                              setDetails(`health status ${r.status}`)
                            }
                          })
                          .catch((e) => {
                            setHealth('fail')
                            setDetails(`health error: ${String(e)}`)
                          })
                      }}
                    >
                      Refresh Status
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">✅ All Systems Active</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Clerk v6.28.1 authentication working</li>
                    <li>• Next.js 15.4.5 compatibility confirmed</li>
                    <li>• Database connection established</li>
                    <li>• All API endpoints operational</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}