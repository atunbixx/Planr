'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, Store, DollarSign, CheckCircle2, Clock, AlertCircle, Camera, MessageSquare, Heart } from 'lucide-react'
import { format, differenceInDays, addDays, formatDistanceToNow } from 'date-fns'

// This page is a Client Component - authentication will be handled by Clerk
const HeaderClient = dynamic(() => import('@/components/HeaderClient'), { ssr: false })

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

export default function ModernDashboardPage() {
  const { user, isLoaded } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize user and couple in database
    fetch('/api/user/initialize', {
      method: 'POST',
    }).catch(console.error)

    // Load real stats from API
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your dashboard...</div>
      </div>
    )
  }

  const overallProgress = stats.taskStats.total > 0 
    ? Math.round((stats.taskStats.completed / stats.taskStats.total) * 100)
    : 0

  const budgetUsedPercentage = stats.budgetUsedPercentage

  return (
    <>
      <HeaderClient firstName={user?.firstName || 'User'} />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section with Wedding Countdown */}
          <div className="bg-gradient-to-r from-[#6b140e] to-[#8b1a12] rounded-2xl p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user?.firstName || 'User'}! 💍
                </h1>
                <p className="text-white/80 text-lg">
                  Let's make your wedding day perfect together.
                </p>
              </div>
              {stats.daysUntilWedding && stats.daysUntilWedding > 0 && (
                <div className="mt-4 md:mt-0 text-center">
                  <div className="text-5xl font-bold">{stats.daysUntilWedding}</div>
                  <div className="text-white/80">days to go</div>
                  {stats.weddingDate && (
                    <div className="text-sm mt-1 text-white/60">
                      {format(new Date(stats.weddingDate), 'MMMM d, yyyy')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Budget Overview */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Budget</CardTitle>
                  <DollarSign className="h-5 w-5 text-[#6b140e]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    ${stats.totalSpent.toLocaleString()}
                  </div>
                  <Progress value={budgetUsedPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{budgetUsedPercentage}% used</span>
                    <span>${stats.budgetRemaining.toLocaleString()} left</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guest Overview */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Guests</CardTitle>
                  <Users className="h-5 w-5 text-[#6b140e]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.guestStats.confirmed} / {stats.guestStats.total}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {stats.guestStats.pending} pending
                    </Badge>
                    {stats.guestStats.declined > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {stats.guestStats.declined} declined
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Status */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Vendors</CardTitle>
                  <Store className="h-5 w-5 text-[#6b140e]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.vendorStats.booked} / {stats.vendorStats.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Confirmed</span>
                  </div>
                  {stats.vendorStats.pending > 0 && (
                    <div className="text-xs text-gray-500">
                      {stats.vendorStats.pending} awaiting confirmation
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Progress</CardTitle>
                  <Heart className="h-5 w-5 text-[#6b140e]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {overallProgress}%
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {stats.taskStats.completed} of {stats.taskStats.total} tasks done
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Tasks and Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* This Week's Tasks */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>This Week's Tasks</CardTitle>
                      <CardDescription>Stay on track with your planning</CardDescription>
                    </div>
                    {stats.taskStats.overdue > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {stats.taskStats.overdue} overdue
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Finalize catering menu</p>
                        <p className="text-sm text-gray-500">Due: Tomorrow</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Send final guest count to venue</p>
                        <p className="text-sm text-gray-500">Due: Friday</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Book transportation for guests</p>
                        <p className="text-sm text-gray-500">Overdue by 2 days</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href="/dashboard/checklist">
                      <Button variant="outline" className="w-full">
                        View All Tasks
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Payments */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Upcoming Payments</CardTitle>
                  <CardDescription>Keep track of vendor payment deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.upcomingPayments.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{payment.vendor}</p>
                          <p className="text-sm text-gray-500">
                            Due: {format(new Date(payment.dueDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            {payment.daysUntil} days
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href="/dashboard/budget/expenses">
                      <Button variant="outline" className="w-full">
                        Manage Payments
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Actions and Stats */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/dashboard/guests" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Send RSVP Reminders
                    </Button>
                  </Link>
                  <Link href="/dashboard/vendors" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Store className="h-4 w-4" />
                      Contact Vendors
                    </Button>
                  </Link>
                  <Link href="/dashboard/photos" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Camera className="h-4 w-4" />
                      Upload Photos
                    </Button>
                  </Link>
                  <Link href="/dashboard/budget" className="block">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <DollarSign className="h-4 w-4" />
                      Add Expense
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Wedding Details */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-pink-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="text-[#6b140e]">Your Wedding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.venue && (
                    <div>
                      <p className="text-sm text-gray-600">Venue</p>
                      <p className="font-medium">{stats.venue}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Theme</p>
                    <p className="font-medium">Romantic Garden</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Colors</p>
                    <div className="flex gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-[#6b140e]"></div>
                      <div className="w-6 h-6 rounded-full bg-white border"></div>
                      <div className="w-6 h-6 rounded-full bg-pink-200"></div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Link href="/dashboard/settings">
                      <Button size="sm" variant="outline" className="w-full">
                        Edit Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {stats.recentActivity.length > 0 ? (
                      stats.recentActivity.map((activity, index) => {
                        const colorMap = {
                          vendor: 'bg-green-500',
                          guest: 'bg-blue-500',
                          budget: 'bg-yellow-500',
                          photo: 'bg-purple-500',
                          task: 'bg-pink-500'
                        }
                        return (
                          <div key={index} className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full ${colorMap[activity.type]} mt-1.5`}></div>
                            <div>
                              <p className="text-gray-900">{activity.description}</p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}