'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPageLight() {
  const { user, couple, loading, error } = useAuth()

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Authentication Error</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!user || !couple) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Calculate days until wedding
  const daysUntilWedding = couple.wedding_date 
    ? Math.ceil((new Date(couple.wedding_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const quickActions = [
    { title: 'Add Vendor', description: 'Find and add wedding vendors', href: '/dashboard/vendors', icon: '🏪' },
    { title: 'Invite Guests', description: 'Manage your guest list', href: '/dashboard/guests', icon: '👥' },
    { title: 'Track Budget', description: 'Monitor your expenses', href: '/dashboard/budget', icon: '💰' },
    { title: 'Create Task', description: 'Add planning tasks', href: '/dashboard/tasks', icon: '✅' },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Welcome back, {couple.partner1_name}! 👋
          </h1>
          <p className="text-lg text-gray-700 mb-4">
            {daysUntilWedding !== null ? (
              daysUntilWedding > 0 ? (
                <>Only <strong>{daysUntilWedding} days</strong> until your special day!</>
              ) : daysUntilWedding === 0 ? (
                <>🎉 <strong>Today is your wedding day!</strong> Congratulations!</>
              ) : (
                <>Hope you had an amazing wedding!</>
              )
            ) : (
              <>Let's start planning your perfect wedding day!</>
            )}
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/dashboard/vendors">Continue Planning</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/dashboard/timeline">View Timeline</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Wedding Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💍</span>
              Wedding Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {couple.wedding_date ? (
                <p className="text-sm">
                  <strong>Date:</strong> {new Date(couple.wedding_date).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Date not set</p>
              )}
              
              {couple.venue_name ? (
                <p className="text-sm">
                  <strong>Venue:</strong> {couple.venue_name}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Venue not selected</p>
              )}
              
              {couple.venue_location && (
                <p className="text-sm">
                  <strong>Location:</strong> {couple.venue_location}
                </p>
              )}
              
              <p className="text-sm">
                <strong>Style:</strong> {couple.wedding_style}
              </p>
              
              <p className="text-sm">
                <strong>Guests:</strong> ~{couple.guest_count_estimate}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">
                ${couple.budget_total?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Budget</p>
              
              <div className="space-y-1 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Spent</span>
                  <span className="font-medium">$0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining</span>
                  <span className="font-medium text-green-600">
                    ${couple.budget_total?.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Planning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>15%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Vendors</span>
                  <span className="text-gray-600">0 booked</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks</span>
                  <span className="text-gray-600">0 completed</span>
                </div>
                <div className="flex justify-between">
                  <span>Guests</span>
                  <span className="text-gray-600">0 invited</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="cursor-pointer border border-gray-200 hover:shadow-lg transition-shadow" asChild>
              <Link href={action.href}>
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <p className="text-xs text-indigo-600 font-medium mt-3 uppercase tracking-wide">Get Started</p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Simple Recent Activity */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Recent Activity</h2>
        
        <Card className="border border-gray-200">
          <CardContent className="p-8 text-center">
            <span className="text-4xl mb-4 block">📝</span>
            <p className="text-gray-500 mb-4">No activity yet. Start planning to see updates here!</p>
            <Button asChild>
              <Link href="/dashboard/vendors">Add Your First Vendor</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}