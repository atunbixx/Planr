'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useTheme } from '@/components/providers/ThemeProvider'
import { useTranslations, useLocale } from 'next-intl'
import { formatDate, formatCurrency, formatNumber } from '@/lib/localization'
import type { LocaleCode } from '@/lib/localization'
import { formatDistanceToNow } from 'date-fns'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { StatCardSkeleton } from '@/components/ui/StatCardSkeleton'

interface DashboardStats {
  daysUntilWedding: number | null
  weddingDate: string | null
  venue: string | null
  totalBudget: number
  totalSpent: number
  budgetRemaining: number
  budgetUsedPercentage: number
  userInfo: {
    firstName: string
    lastName: string
    partner1Name: string
  }
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
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const { theme } = useTheme()
  const t = useTranslations()
  const locale = useLocale() as LocaleCode
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messagesPreview, setMessagesPreview] = useState<Array<{ id: string; sender: string; avatarUrl?: string; snippet: string; timeAgo: string }>>([])
  const [tasksPreview, setTasksPreview] = useState<Array<{ id: string; title: string; dueDate?: string }>>([])

  useEffect(() => {
    if (isLoading) return

    const initializeAndFetch = async () => {
      try {
        try {
          await fetch('/api/user/initialize', { method: 'POST' })
        } catch (initError) {
          console.warn('User initialization failed, continuing with dashboard:', initError)
        }
        
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
  }, [isLoading, isSignedIn])

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (theme !== 'bridal') {
        setMessagesPreview([]);
        setTasksPreview([]);
        return;
      }
      try {
        const [mRes, tRes] = await Promise.allSettled([
          fetch('/api/dashboard/messages-preview'),
          fetch('/api/dashboard/tasks'),
        ]);

        if (mRes.status === 'fulfilled' && mRes.value.ok) {
          const data = await mRes.value.json();
          if (!cancelled) {
            const items = Array.isArray(data?.items) ? data.items : [];
            setMessagesPreview(
              items.slice(0, 5).map((m: any, idx: number) => ({
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
              items.slice(0, 5).map((t: any, idx: number) => ({
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

  if (isLoading || loading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-light mb-4 text-gray-900">Something went wrong</h2>
          <p className="text-gray-600 mb-8 font-light">{error}</p>
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

  if (!stats) return null

  // Calculate key metrics
  const overallProgress = stats.taskStats.total > 0 
    ? Math.round((stats.taskStats.completed / stats.taskStats.total) * 100) 
    : 0

  const nextPayment = stats.upcomingPayments?.[0] || null
  const guestProgress = stats.guestStats.total > 0 
    ? Math.round((stats.guestStats.confirmed / stats.guestStats.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        {/* Hero Section - SRH Style */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light tracking-wide text-gray-900 mb-4 uppercase">
            {stats.daysUntilWedding && stats.daysUntilWedding > 0 
              ? `${stats.daysUntilWedding} Days Until`
              : stats.daysUntilWedding === 0
              ? 'Today is'
              : 'Plan'}
          </h1>
          <h2 className="text-5xl md:text-6xl font-light tracking-wide text-gray-900 mb-8 uppercase">
            Your Perfect Day
          </h2>
          {stats.weddingDate && (
            <p className="text-lg font-light text-gray-600 tracking-wide">
              {formatDate(stats.weddingDate, locale, 'PPPP')}
              {stats.venue && ` • ${stats.venue}`}
            </p>
          )}
        </div>

        {/* Quick Actions - SRH Style CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link href="/dashboard/guests">
            <Button className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white px-8 py-3 rounded-none font-light tracking-wider uppercase text-sm">
              Send RSVP Reminders
            </Button>
          </Link>
          <Link href="/dashboard/budget">
            <Button variant="outline" className="border-[#5a524a] text-[#5a524a] hover:bg-[#5a524a] hover:text-white px-8 py-3 rounded-none font-light tracking-wider uppercase text-sm">
              Add New Expense
            </Button>
          </Link>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Metrics */}
          <div className="space-y-8">
            {/* Guest RSVPs */}
            <div className="bg-white p-8 rounded-sm shadow-sm">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-4">Guest RSVPs</h3>
              <div className="text-4xl font-light text-gray-900 mb-2">
                {stats.guestStats.confirmed}
                <span className="text-2xl text-gray-400">/{stats.guestStats.total}</span>
              </div>
              <Progress value={guestProgress} className="h-1 bg-gray-100 mb-4" />
              <div className="flex gap-6 text-sm font-light text-gray-600">
                <span>{stats.guestStats.pending} pending</span>
                <span>{stats.guestStats.declined} declined</span>
              </div>
            </div>

            {/* Budget Status */}
            <div className="bg-white p-8 rounded-sm shadow-sm">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-4">Budget Status</h3>
              <div className="text-4xl font-light text-gray-900 mb-2">
                {stats.budgetUsedPercentage}%
              </div>
              <p className="text-sm font-light text-gray-600 mb-3">
                of {formatCurrency(stats.totalBudget, 'USD', locale)}
              </p>
              <Progress value={stats.budgetUsedPercentage} className="h-1 bg-gray-100 mb-4" />
              <p className="text-sm font-light text-[#7a9b7f]">
                {formatCurrency(stats.budgetRemaining, 'USD', locale)} remaining
              </p>
            </div>

            {/* Planning Progress */}
            <div className="bg-white p-8 rounded-sm shadow-sm">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-4">Planning Progress</h3>
              <div className="text-4xl font-light text-gray-900 mb-2">{overallProgress}%</div>
              <Progress value={overallProgress} className="h-1 bg-gray-100 mb-4" />
              <p className="text-sm font-light text-gray-600">
                {stats.taskStats.completed} of {stats.taskStats.total} tasks complete
              </p>
            </div>
          </div>

          {/* Center Column - Join the Family Style */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Section */}
            <div className="bg-white p-12 rounded-sm shadow-sm">
              <h2 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-8">Join the SRH Family</h2>
              
              {/* Upcoming Payments List */}
              <div className="space-y-6">
                <h3 className="text-2xl font-light text-gray-900 mb-6">Upcoming Payments</h3>
                {stats.upcomingPayments.slice(0, 5).map((payment, index) => (
                  <div key={payment.id} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-lg font-light text-gray-900">{payment.vendor}</p>
                      <p className="text-sm font-light text-gray-500">Due in {payment.daysUntil} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-light text-gray-900">{formatCurrency(payment.amount, 'USD', locale)}</p>
                      <p className="text-sm font-light text-gray-500">{formatDate(payment.dueDate, locale, 'PP')}</p>
                    </div>
                  </div>
                ))}
                {stats.upcomingPayments.length === 0 && (
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
              <div className="bg-white p-12 rounded-sm shadow-sm">
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
            {stats.recentActivity.length > 0 && (
              <div className="bg-white p-12 rounded-sm shadow-sm">
                <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {stats.recentActivity.slice(0, 5).map((activity, index) => (
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          <Link href="/dashboard/guests" className="group">
            <div className="bg-white p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Guests</h3>
              <p className="text-3xl font-light text-gray-900">{stats.guestStats.total}</p>
            </div>
          </Link>
          <Link href="/dashboard/vendors" className="group">
            <div className="bg-white p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Vendors</h3>
              <p className="text-3xl font-light text-gray-900">{stats.vendorStats.total}</p>
            </div>
          </Link>
          <Link href="/dashboard/photos" className="group">
            <div className="bg-white p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Photos</h3>
              <p className="text-3xl font-light text-gray-900">{stats.photoStats.total}</p>
            </div>
          </Link>
          <Link href="/dashboard/checklist" className="group">
            <div className="bg-white p-8 rounded-sm shadow-sm text-center hover:shadow-md transition-shadow">
              <h3 className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2">Tasks</h3>
              <p className="text-3xl font-light text-gray-900">{stats.taskStats.total}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}