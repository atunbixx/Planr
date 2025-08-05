'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import HeaderClient from '@/components/HeaderClient'

interface DashboardStats {
  daysUntilWedding: number | null
  weddingDate: string | null
  venue: string | null
  totalBudget: number
  totalSpent: number
  budgetRemaining: number
  budgetUsedPercentage: number
  guestStats: {
    total: number
    confirmed: number
    pending: number
    declined: number
    needsRsvp: number
  }
  vendorStats: {
    total: number
    booked: number
    pending: number
    contacted: number
    potential: number
  }
  taskStats: {
    total: number
    completed: number
    thisWeek: number
    overdue: number
  }
  photoStats: {
    total: number
    withAlbums: number
    recent: number
  }
  upcomingPayments: Array<{
    id: string
    vendor: string
    amount: number
    dueDate: string
    daysUntil: number
  }>
  recentActivity: Array<{
    type: 'vendor' | 'guest' | 'budget' | 'photo' | 'task'
    action: string
    description: string
    timestamp: string
  }>
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    // Initialize user and fetch dashboard data
    const initializeAndFetch = async () => {
      try {
        // Initialize user first
        await fetch('/api/user/initialize', { method: 'POST' })
        
        // Then fetch dashboard stats
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard stats: ${response.status}`)
        }
        
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        } else {
          setError(data.error || 'Failed to load dashboard data')
        }
      } catch (err) {
        console.error('Dashboard error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    initializeAndFetch()
  }, [isLoaded])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your wedding dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '$0'
    return `$${amount.toLocaleString()}`
  }
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <HeaderClient firstName={user?.firstName || 'User'} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Wedding Countdown */}
        {stats?.weddingDate && (
          <div className="bg-gradient-to-r from-rose-100 via-pink-50 to-purple-100 rounded-xl p-8 mb-8 border border-rose-200">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {stats.daysUntilWedding && stats.daysUntilWedding > 0 ? `${stats.daysUntilWedding} Days to Go!` : 'Your Wedding Day!'}
              </h1>
              <p className="text-xl text-gray-700 mb-1">
                {formatDate(stats.weddingDate)}
              </p>
              {stats.venue && (
                <p className="text-lg text-gray-600">
                  {stats.venue}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Budget Card */}
          {stats && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Budget Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalSpent)}
                    </span>
                    <span className="text-sm text-gray-500">
                      of {formatCurrency(stats.totalBudget)}
                    </span>
                  </div>
                  <Progress value={stats.budgetUsedPercentage || 0} className="h-2" />
                  <div className="text-sm text-gray-600">
                    {formatCurrency(stats.budgetRemaining)} remaining ({100 - (stats.budgetUsedPercentage || 0)}%)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guests Card */}
          {stats && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Guest RSVPs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {stats.guestStats?.confirmed || 0}
                    </span>
                    <span className="text-sm text-gray-500">
                      of {stats.guestStats?.total || 0} confirmed
                    </span>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {stats.guestStats?.pending || 0} pending
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                      {stats.guestStats?.declined || 0} declined
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vendors Card */}
          {stats && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Vendor Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-purple-600">
                      {stats.vendorStats?.booked || 0}
                    </span>
                    <span className="text-sm text-gray-500">
                      of {stats.vendorStats?.total || 0} booked
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 bg-gray-200 rounded-full flex-1">
                      <div 
                        className="h-2 bg-purple-500 rounded-full" 
                        style={{ width: `${(stats.vendorStats?.total || 0) > 0 ? ((stats.vendorStats?.booked || 0) / (stats.vendorStats?.total || 1)) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {stats.vendorStats?.pending || 0} pending
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overall Progress Card */}
          {stats && (
            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-rose-600">
                      {(stats.taskStats?.total || 0) > 0 ? Math.round(((stats.taskStats?.completed || 0) / (stats.taskStats?.total || 1)) * 100) : 0}%
                    </span>
                    <span className="text-sm text-gray-500">complete</span>
                  </div>
                  <Progress value={(stats.taskStats?.total || 0) > 0 ? Math.round(((stats.taskStats?.completed || 0) / (stats.taskStats?.total || 1)) * 100) : 0} className="h-2" />
                  <div className="text-sm text-gray-600">
                    {stats.taskStats?.completed || 0} of {stats.taskStats?.total || 0} tasks done
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tasks and Payments */}
          <div className="lg:col-span-2 space-y-6">
            {/* This Week's Tasks */}
            {stats && stats.taskStats?.thisWeek && stats.taskStats.thisWeek > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    This Week's Tasks
                    <Link href="/dashboard/tasks">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">You have {stats.taskStats?.thisWeek || 0} tasks due this week</p>
                    <p className="text-sm text-gray-500">Complete task management system coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Payments */}
            {stats?.upcomingPayments && stats.upcomingPayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Upcoming Payments
                    <Link href="/dashboard/budget">
                      <Button variant="outline" size="sm">View Budget</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.upcomingPayments.slice(0, 5).map((payment) => (
                      <div 
                        key={payment.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          payment.daysUntil <= 7 ? 'bg-red-50 border-red-200' :
                          payment.daysUntil <= 30 ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{payment.vendor}</div>
                          <div className="text-sm text-gray-500">
                            Due in {payment.daysUntil} days
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(payment.dueDate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Actions and Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/guests" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    📧 Send RSVP Reminders
                  </Button>
                </Link>
                <Link href="/dashboard/vendors" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    📞 Contact Vendors
                  </Button>
                </Link>
                <Link href="/dashboard/photos" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    📸 Upload Photos
                  </Button>
                </Link>
                <Link href="/dashboard/budget" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    💰 Add Expense
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Wedding Details */}
            {stats && (stats.weddingDate || stats.venue) && (
              <Card>
                <CardHeader>
                  <CardTitle>Wedding Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.venue && (
                    <div>
                      <div className="text-sm text-gray-600">Venue</div>
                      <div className="font-medium">{stats.venue}</div>
                    </div>
                  )}
                  {stats.weddingDate && (
                    <div>
                      <div className="text-sm text-gray-600">Date</div>
                      <div className="font-medium">{formatDate(stats.weddingDate)}</div>
                    </div>
                  )}
                  <Link href="/dashboard/settings">
                    <Button variant="link" className="p-0 h-auto">
                      Edit Details →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            {stats?.recentActivity && stats.recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={`${activity.type}-${index}`} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'budget' ? 'bg-green-500' :
                          activity.type === 'guest' ? 'bg-blue-500' :
                          activity.type === 'vendor' ? 'bg-purple-500' :
                          activity.type === 'photo' ? 'bg-pink-500' :
                          'bg-gray-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{activity.description}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Navigation Cards at Bottom */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link href="/dashboard/budget" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="font-semibold">Budget</div>
                <div className="text-sm text-gray-600">Track expenses</div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/guests" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="font-semibold">Guests</div>
                <div className="text-sm text-gray-600">Manage RSVPs</div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/vendors" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🏪</div>
                <div className="font-semibold">Vendors</div>
                <div className="text-sm text-gray-600">Book services</div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/dashboard/photos" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">📸</div>
                <div className="font-semibold">Photos</div>
                <div className="text-sm text-gray-600">Wedding gallery</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}