'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  CheckSquare, 
  Clock,
  Camera,
  Store,
  LayoutGrid,
  Activity,
  TrendingUp,
  Heart
} from 'lucide-react'

// Demo data
const demoStats = {
  daysUntilWedding: 180,
  totalGuests: 150,
  confirmedGuests: 85,
  totalBudget: 50000,
  spentBudget: 22500,
  completedTasks: 15,
  totalTasks: 42,
  vendors: 8,
  photos: 24
}

const demoActivities = [
  {
    id: '1',
    user_name: 'Sarah',
    action_type: 'created',
    entity_type: 'vendor',
    entity_name: 'Bloom & Grow Florists',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    user_name: 'John',
    action_type: 'updated',
    entity_type: 'guest',
    entity_name: 'Emily Johnson',
    details: { changes: 'RSVP confirmed' },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    user_name: 'Sarah',
    action_type: 'created',
    entity_type: 'task',
    entity_name: 'Book wedding photographer',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
]

const features = [
  { name: 'Vendors', href: '/demo-dashboard/vendors', icon: Store, description: 'Manage vendors and appointments' },
  { name: 'Guests', href: '/demo-dashboard/guests', icon: Users, description: 'Track RSVPs and preferences' },
  { name: 'Budget', href: '/demo-dashboard/budget', icon: DollarSign, description: 'Monitor wedding expenses' },
  { name: 'Tasks', href: '/demo-dashboard/tasks', icon: CheckSquare, description: 'Organize your to-do list' },
  { name: 'Timeline', href: '/demo-dashboard/timeline', icon: Clock, description: 'View countdown and milestones' },
  { name: 'Calendar', href: '/demo-dashboard/calendar', icon: Calendar, description: 'Schedule vendor appointments' },
  { name: 'Photos', href: '/demo-dashboard/photos', icon: Camera, description: 'Upload and organize photos' },
  { name: 'Seating', href: '/demo-dashboard/seating', icon: LayoutGrid, description: 'Design your seating chart' }
]

export default function DemoDashboardPage() {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-serif font-bold text-ink">Wedding Planner Demo</h1>
              <div className="ml-6 pl-6 border-l border-gray-200">
                <p className="text-sm font-medium text-gray-700">Sarah & John</p>
                <p className="text-xs text-gray-500">June 15, 2024</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">Exit Demo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-accent mx-auto mb-4" />
            <h2 className="text-3xl font-serif font-bold text-ink mb-2">
              Welcome to Your Wedding Dashboard
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              This is a demo of the wedding planner app. Explore all the features below to see how 
              you can organize your perfect wedding day.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Days Until Wedding</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{demoStats.daysUntilWedding}</div>
                <p className="text-xs text-muted-foreground">June 15, 2024</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Guest RSVPs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {demoStats.confirmedGuests}/{demoStats.totalGuests}
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {Math.round((demoStats.confirmedGuests / demoStats.totalGuests) * 100)}% confirmed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${demoStats.spentBudget.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  of ${demoStats.totalBudget.toLocaleString()} budget
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {demoStats.completedTasks}/{demoStats.totalTasks}
                </div>
                <div className="flex items-center text-xs text-blue-600">
                  <Activity className="h-3 w-3 mr-1" />
                  {Math.round((demoStats.completedTasks / demoStats.totalTasks) * 100)}% complete
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Explore Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.name} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <Link href={feature.href}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-accent/10 rounded-lg">
                            <Icon className="h-6 w-6 text-accent" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{feature.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {feature.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Link>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your wedding planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Activity className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user_name}</span>
                        {' '}{activity.action_type}{' '}
                        <span className="font-medium">{activity.entity_name}</span>
                      </p>
                      {activity.details?.changes && (
                        <p className="text-xs text-gray-500">{activity.details.changes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demo Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Demo Mode</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    You're viewing a demo of the wedding planner. Data shown is for demonstration purposes only.
                    Click on any feature above to explore its functionality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}