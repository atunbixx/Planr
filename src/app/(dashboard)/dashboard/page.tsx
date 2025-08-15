'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress-simple'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useLocale } from '@/providers/LocaleProvider'
import { formatDistanceToNow } from 'date-fns'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { StatCardSkeleton } from '@/components/ui/StatCardSkeleton'
import { enterpriseApi } from '@/lib/api/enterprise-client'
import { useApiState } from '@/hooks/useApiState'
import { LoadingCard } from '@/components/ui/loading'

import type { DashboardStats as ApiDashboardStats } from '@/lib/api/client'

// Type definitions for dashboard data
interface UpcomingPayment {
  id: string
  vendor: string
  amount: number
  dueDate: string
  daysUntil: number
}

interface RecentActivity {
  type: string
  description: string
  timestamp: string
}

export default function DashboardPage() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const { theme } = useTheme()
  const { formatCurrency, formatDate } = useLocale()
  const dashboardApi = useApiState<any>(null, {
    onError: (error) => console.error('Failed to load dashboard:', error)
  })
  const activityApi = useApiState<any[]>([], {
    onError: (error) => console.warn('Failed to load activity:', error)
  })
  const [messagesPreview, setMessagesPreview] = useState<Array<{ id: string; sender: string; avatarUrl?: string; snippet: string; timeAgo: string }>>([])
  const [tasksPreview, setTasksPreview] = useState<Array<{ id: string; title: string; dueDate?: string }>>([])

  useEffect(() => {
    if (isLoading) return
    
    // Only proceed if user is signed in
    if (!isSignedIn || !user) {
      console.log('User not authenticated, skipping dashboard data fetch')
      return
    }

    const initializeAndFetch = async () => {
      try {
        await fetch('/api/user/initialize', { 
          method: 'POST',
          credentials: 'include'
        })
      } catch (initError) {
        console.warn('User initialization failed, continuing with dashboard:', initError)
      }
      
      // Fetch dashboard stats (only if onboarding is completed)
      let statsData = null
      try {
        statsData = await dashboardApi.execute(enterpriseApi.dashboard.getStats())
      } catch (dashboardError: any) {
        console.error('Dashboard API Error:', {
          error: dashboardError,
          statusCode: dashboardError?.statusCode,
          message: dashboardError?.message,
          name: dashboardError?.name
        })
        
        // Check if this is an authentication error (401) or onboarding completion error (403)
        if (dashboardError?.statusCode === 401 || 
            dashboardError?.statusCode === 403 || 
            dashboardError?.message?.includes('Authentication required') ||
            dashboardError?.message?.includes('complete your wedding setup') ||
            dashboardError?.message?.includes('Onboarding must be completed')) {
          
          // For auth errors (401), redirect to sign-in
          if (dashboardError?.statusCode === 401 || dashboardError?.message?.includes('Authentication required')) {
            console.log('Authentication required, redirecting to sign-in...')
            window.location.href = '/sign-in?message=Please sign in to access your dashboard'
            return
          }
          
          // For onboarding errors (403), redirect to onboarding
          console.log('Onboarding not completed, redirecting...')
          window.location.href = '/onboarding/welcome?message=Please complete your wedding setup to access your dashboard'
          return
        } else {
          console.error('Error loading dashboard stats:', dashboardError)
          // Set empty stats instead of throwing error to prevent page crash
          statsData = {
            wedding: { daysUntil: null, date: null, venue: null },
            budget: { totalBudget: 0, totalSpent: 0, remaining: 0, percentageSpent: 0 },
            guests: { total: 0, confirmed: 0, pending: 0, declined: 0 },
            vendors: { total: 0, booked: 0, pending: 0, contacted: 0 },
            checklist: { total: 0, completed: 0, dueSoon: 0 },
            photos: { totalPhotos: 0 }
          }
        }
      }
      
      if (statsData) {
        // Map the API response to the expected format
        const mappedStats: any = {
          daysUntilWedding: statsData.wedding.daysUntil,
          weddingDate: statsData.wedding.date,
          venue: statsData.wedding.venue?.name || null,
          totalBudget: statsData.budget.totalBudget,
          totalSpent: statsData.budget.totalSpent,
          budgetRemaining: statsData.budget.remaining,
          budgetUsedPercentage: statsData.budget.percentageSpent,
          userInfo: {
            firstName: '',
            lastName: '',
            partner1Name: '',
            partner2Name: ''
          },
          guestStats: statsData.guests,
          vendorStats: {
            total: statsData.vendors.total,
            booked: statsData.vendors.booked,
            pending: statsData.vendors.pending,
            contacted: statsData.vendors.contacted,
            potential: statsData.vendors.pending
          },
          taskStats: {
            total: statsData.checklist.total,
            completed: statsData.checklist.completed,
            thisWeek: statsData.checklist.dueSoon,
            overdue: 0
          },
          photoStats: {
            total: statsData.photos.totalPhotos,
            withAlbums: statsData.photos.totalAlbums,
            recent: 0
          },
          upcomingPayments: [],
          recentActivity: []
        }
        dashboardApi.setData(mappedStats)
        
        // Fetch recent activity separately
        const activityData = await activityApi.execute(enterpriseApi.dashboard.getActivity(10))
        
        if (activityData) {
          dashboardApi.setData((prev: any) => ({
            ...prev!,
            recentActivity: activityData.map(item => ({
              type: item.type as any,
              action: item.type,
              description: item.description,
              timestamp: item.timestamp.toString()
            }))
          }))
        }
      }
    }

    initializeAndFetch()
  }, [isLoading, isSignedIn])

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Only proceed if user is authenticated
      if (!isSignedIn || !user) {
        return;
      }
      
      if (theme !== 'bridal') {
        setMessagesPreview([]);
        setTasksPreview([]);
        return;
      }
      try {
        const [mRes, tRes] = await Promise.allSettled([
          fetch('/api/dashboard/messages-preview', { credentials: 'include' }),
          fetch('/api/dashboard/tasks', { credentials: 'include' }),
        ]);

        if (mRes.status === 'fulfilled' && mRes.value.ok) {
          const data = await mRes.value.json();
          if (!cancelled) {
            const items = Array.isArray(data?.items) ? data.items : [];
            setMessagesPreview(
              (items || []).slice(0, 5).map((m: any, idx: number) => ({
                id: String(m.id ?? idx),
                sender: String(m.sender_name ?? m.vendor ?? 'Unknown'),
                avatarUrl: m.avatarUrl ?? undefined,
                snippet: String(m.content ?? m.snippet ?? ''),
                timeAgo: String(
                  m.timeAgo ??
                    (m.timestamp
                      ? formatDistanceToNow(new Date(m.timestamp), { addSuffix: true })
                      : formatDistanceToNow(new Date(), { addSuffix: true })
                    )
                ),
              }))
            );
          }
        }

        if (tRes.status === 'fulfilled' && tRes.value.ok) {
          const data = await tRes.value.json();
          if (!cancelled) {
            const items = Array.isArray(data?.items) ? data.items : [];
            setTasksPreview(
              (items || []).slice(0, 5).map((t: any, idx: number) => ({
                id: String(t.id ?? idx),
                title: String(t.title ?? t.name ?? 'Untitled'),
                dueDate: t.dueDate ?? undefined,
              }))
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load bridal dashboard previews:', error);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [theme])

  if (isLoading || dashboardApi.state.loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7]">
        <div className="max-w-[1400px] mx-auto px-8 py-12">
          <div className="animate-pulse">
            <div className="h-24 bg-gray-200/50 rounded-lg mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  // Redirect to home if not authenticated
  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  if (dashboardApi.state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-light mb-4 text-gray-900">Something went wrong</h2>
          <p className="text-gray-600 mb-8 font-light">{dashboardApi.state.error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#5a524a] hover:bg-[#4a423a] text-white rounded-full px-8 py-3 font-light tracking-wide"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const stats = dashboardApi.state.data
  if (!stats) return null

  // Calculate key metrics
  const overallProgress = stats?.taskStats?.total > 0 
    ? Math.round((stats.taskStats.completed / stats.taskStats.total) * 100) 
    : 0

  const nextPayment = stats.upcomingPayments?.[0] || null
  const guestProgress = stats?.guestStats?.total > 0 
    ? Math.round((stats.guestStats.confirmed / stats.guestStats.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#faf9f7] w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Hero Section - SRH Style */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-gray-900 mb-2 sm:mb-4 uppercase">
            {stats.daysUntilWedding && stats.daysUntilWedding > 0 
              ? `${stats.daysUntilWedding} Days Until`
              : stats.daysUntilWedding === 0
              ? 'Today is'
              : 'Plan'}
          </h1>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-gray-900 mb-4 sm:mb-8 uppercase">
            Your Perfect Day
          </h2>
          {stats.weddingDate && (
            <p className="text-sm sm:text-base lg:text-lg font-light text-gray-600 tracking-wide px-4">
              {formatDate(new Date(stats.weddingDate), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {stats.venue && ` • ${stats.venue}`}
            </p>
          )}
        </div>

        {/* Quick Actions - SRH Style CTA Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 lg:mb-16">
          <Link href="/dashboard/guests">
            <Button className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-none font-light tracking-wider uppercase text-xs sm:text-sm w-full sm:w-auto">
              Send RSVP Reminders
            </Button>
          </Link>
          <Link href="/dashboard/budget">
            <Button variant="outline" className="border-[#5a524a] text-[#5a524a] hover:bg-[#5a524a] hover:text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-none font-light tracking-wider uppercase text-xs sm:text-sm w-full sm:w-auto">
              Add New Expense
            </Button>
          </Link>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Left Column - Metrics */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Guest RSVPs */}
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-4">Guest RSVPs</h3>
              <div className="text-4xl font-light text-gray-900 mb-2">
                {stats?.guestStats?.confirmed || 0}
                <span className="text-2xl text-gray-400">/{stats?.guestStats?.total || 0}</span>
              </div>
              <Progress value={guestProgress} className="h-1 bg-gray-100 mb-4" />
              <div className="flex gap-6 text-sm font-light text-gray-600">
                <span>{stats?.guestStats?.pending || 0} pending</span>
                <span>{stats?.guestStats?.declined || 0} declined</span>
              </div>
            </div>

            {/* Budget Status */}
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-4">Budget Status</h3>
              <div className="text-4xl font-light text-gray-900 mb-2">
                {stats.budgetUsedPercentage}%
              </div>
              <p className="text-sm font-light text-gray-600 mb-3">
                of {formatCurrency(stats.totalBudget, true)}
              </p>
              <Progress value={stats.budgetUsedPercentage} className="h-1 bg-gray-100 mb-4" />
              <p className="text-sm font-light text-[#7a9b7f]">
                {formatCurrency(stats.budgetRemaining, true)} remaining
              </p>
            </div>

            {/* Planning Progress */}
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-4">Planning Progress</h3>
              <div className="text-4xl font-light text-gray-900 mb-2">{overallProgress}%</div>
              <Progress value={overallProgress} className="h-1 bg-gray-100 mb-4" />
              <p className="text-sm font-light text-gray-600">
                {stats?.taskStats?.completed || 0} of {stats?.taskStats?.total || 0} tasks complete
              </p>
            </div>
          </div>

          {/* Center Column - Join the Family Style */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Featured Section */}
            <div className="bg-white p-4 sm:p-8 lg:p-12 rounded-sm shadow-sm">
              <h2 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-8">Join the SRH Family</h2>
              
              {/* Upcoming Payments List */}
              <div className="space-y-6">
                <h3 className="text-2xl font-light text-gray-900 mb-6">Upcoming Payments</h3>
                {(stats?.upcomingPayments || []).slice(0, 5).map((payment: UpcomingPayment, index: number) => (
                  <div key={payment.id} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-lg font-light text-gray-900">{payment.vendor}</p>
                      <p className="text-sm font-light text-gray-500">Due in {payment.daysUntil} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-light text-gray-900">{formatCurrency(payment.amount, true)}</p>
                      <p className="text-sm font-light text-gray-500">{formatDate(new Date(payment.dueDate))}</p>
                    </div>
                  </div>
                ))}
                {(stats?.upcomingPayments || []).length === 0 && (
                  <p className="text-gray-500 font-light">No upcoming payments</p>
                )}
              </div>

              <div className="mt-8">
                <Link href="/dashboard/budget">
                  <Button variant="link" className="text-[#7a9b7f] font-light p-0 hover:underline">
                    View All Payments →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Messages Preview (Bridal theme only) */}
            {theme === 'bridal' && messagesPreview.length > 0 && (
              <div className="bg-white p-4 sm:p-8 lg:p-12 rounded-sm shadow-sm">
                <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-6">Recent Messages</h3>
                <div className="space-y-4">
                  {messagesPreview.map((m) => (
                    <div key={m.id} className="flex items-start gap-4 py-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-light text-gray-600">
                          {m.sender.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-light text-gray-900">{m.sender}</span>
                          <span className="text-sm font-light text-gray-500">{m.timeAgo}</span>
                        </div>
                        <p className="text-sm font-light text-gray-600">{m.snippet}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link href="/dashboard/messages">
                    <Button variant="link" className="text-[#7a9b7f] font-light p-0 hover:underline">
                      View All Messages →
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {(stats?.recentActivity || []).length > 0 && (
              <div className="bg-white p-4 sm:p-8 lg:p-12 rounded-sm shadow-sm">
                <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {(stats?.recentActivity || []).slice(0, 5).map((activity: RecentActivity, index: number) => (
                    <div key={`${activity.type}-${index}`} className="flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'budget' ? 'bg-[#7a9b7f]' :
                        activity.type === 'guest' ? 'bg-[#5a524a]' :
                        activity.type === 'vendor' ? 'bg-gray-400' :
                        activity.type === 'photo' ? 'bg-gray-600' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1">
                        <p className="font-light text-gray-900">{activity.description}</p>
                        <p className="text-sm font-light text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-8 sm:mt-12 lg:mt-16">
          <Link href="/dashboard/guests" className="group">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Guests</h3>
              <p className="text-3xl font-light text-gray-900">{stats?.guestStats?.total || 0}</p>
            </div>
          </Link>
          <Link href="/dashboard/vendors" className="group">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Vendors</h3>
              <p className="text-3xl font-light text-gray-900">{stats?.vendorStats?.total || 0}</p>
            </div>
          </Link>
          <Link href="/dashboard/photos" className="group">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Photos</h3>
              <p className="text-3xl font-light text-gray-900">{stats?.photoStats?.total || 0}</p>
            </div>
          </Link>
          <Link href="/dashboard/checklist" className="group">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Tasks</h3>
              <p className="text-3xl font-light text-gray-900">{stats?.taskStats?.total || 0}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}