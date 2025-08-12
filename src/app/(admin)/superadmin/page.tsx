'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  UserCheck,
  UserX,
  AlertCircle,
  Calendar,
  HeadphonesIcon,
  Activity,
  Zap,
  BarChart3,
  Settings,
  ArrowRight,
  UserPlus,
  CreditCard,
  FileText,
  MessageSquare,
  Shield,
  Database,
  Gauge
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface OverviewData {
  acquisition: {
    new_today: number
    new_week: number
    new_month: number
  }
  engagement: {
    dau7: number
    mau30: number
    stickiness: number
    active_rate: number
  }
  segments: {
    total_users: number
    free_users: number
    premium_users: number
    trial_users: number
  }
  revenue: {
    mrr_cents: number
    revenue_30d_cents: number
    revenue_90d_cents: number
    arpu_cents: number
    paying_users: number
  }
  churn: {
    churned_30d: number
    churned_90d: number
    at_risk: number
    churn_rate_30d: number
  }
  support: {
    open_tickets: number
    pending_tickets: number
    closed_30d: number
    urgent_open: number
    high_open: number
    avg_resolution_hours: number
  }
  wedding: {
    total_weddings: number
    upcoming_weddings: number
    weddings_next_30d: number
    avg_guest_count: number
    avg_budget: number
    total_guests: number
    confirmed_guests: number
  }
  reliability: {
    error_count_24h: number
    error_rate: number
    top_errors: Array<{ error: string; count: number }>
  }
}

export default function SuperAdminOverview() {
  const router = useRouter()
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchOverviewData()
  }, [])
  
  async function fetchOverviewData() {
    try {
      const response = await fetch('/api/admin/overview')
      
      if (!response.ok) {
        throw new Error(response.status === 403 ? 'Unauthorized' : 'Failed to fetch data')
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }
  
  if (!data) return null
  
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }
  
  // Mock chart data - in production, this would come from the API
  const revenueChart = [
    { date: '2024-01', revenue: 12000 },
    { date: '2024-02', revenue: 15000 },
    { date: '2024-03', revenue: 18000 },
    { date: '2024-04', revenue: 22000 },
    { date: '2024-05', revenue: 28000 },
    { date: '2024-06', revenue: 35000 }
  ]
  
  const userGrowth = [
    { date: '2024-01', users: 100 },
    { date: '2024-02', users: 150 },
    { date: '2024-03', users: 220 },
    { date: '2024-04', users: 310 },
    { date: '2024-05', users: 420 },
    { date: '2024-06', users: 560 }
  ]
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SaaS Overview</h1>
          <p className="mt-2 text-gray-600">Real-time metrics and system health</p>
        </div>
        <div className="flex gap-2">
          <QuickActionButton href="/superadmin/users" icon={Users} label="Users" />
          <QuickActionButton href="/superadmin/revenue" icon={DollarSign} label="Revenue" />
          <QuickActionButton href="/superadmin/support" icon={HeadphonesIcon} label="Support" />
          <QuickActionButton href="/superadmin/settings" icon={Settings} label="Settings" />
        </div>
      </div>
      
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          title="User Management"
          description="Search users, change plans, grant credits"
          icon={Users}
          href="/superadmin/users"
          actions={[
            { label: 'View All Users', href: '/superadmin/users' },
            { label: 'Add New User', href: '/superadmin/users/new' },
            { label: 'Pending Approvals', href: '/superadmin/users?status=pending' }
          ]}
        />
        
        <QuickActionCard
          title="Revenue & Billing"
          description="Track MRR, invoices, failed payments"
          icon={DollarSign}
          href="/superadmin/revenue"
          actions={[
            { label: 'Revenue Dashboard', href: '/superadmin/revenue' },
            { label: 'Failed Payments', href: '/superadmin/revenue?tab=failed' },
            { label: 'Issue Refund', href: '/superadmin/revenue/refund' }
          ]}
        />
        
        <QuickActionCard
          title="Support Center"
          description="Manage tickets, respond to users"
          icon={HeadphonesIcon}
          href="/superadmin/support"
          badge={data.support.open_tickets > 0 ? `${data.support.open_tickets} Open` : undefined}
          badgeColor="red"
          actions={[
            { label: 'Open Tickets', href: '/superadmin/support?status=open' },
            { label: 'Urgent Issues', href: '/superadmin/support?priority=urgent' },
            { label: 'My Assigned', href: '/superadmin/support?assigned=me' }
          ]}
        />
        
        <QuickActionCard
          title="System & Settings"
          description="Feature flags, webhooks, configuration"
          icon={Settings}
          href="/superadmin/settings"
          actions={[
            { label: 'Feature Flags', href: '/superadmin/settings/features' },
            { label: 'Webhook Logs', href: '/superadmin/settings/webhooks' },
            { label: 'Admin Users', href: '/superadmin/settings/admins' }
          ]}
        />
      </div>
      
      {/* Additional Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <QuickLinkButton icon={BarChart3} label="Usage Analytics" href="/superadmin/usage" />
        <QuickLinkButton icon={Activity} label="Audit Events" href="/superadmin/events" />
        <QuickLinkButton icon={Calendar} label="Weddings" href="/superadmin/weddings" />
        <QuickLinkButton icon={AlertCircle} label="System Alerts" href="/superadmin/alerts" />
        <QuickLinkButton icon={MessageSquare} label="Send Message" href="/superadmin/messages/new" />
        <QuickLinkButton icon={Database} label="Database" href="/superadmin/database" />
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="MRR"
          value={formatCurrency(data.revenue.mrr_cents)}
          change="+12.5%"
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Active Users"
          value={data.engagement.mau30.toLocaleString()}
          subtitle={`${data.engagement.stickiness}% stickiness`}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="New Users (30d)"
          value={data.acquisition.new_month.toLocaleString()}
          subtitle={`${data.acquisition.new_today} today`}
          icon={UserCheck}
          color="indigo"
        />
        <MetricCard
          title="Churn Rate"
          value={`${data.churn.churn_rate_30d}%`}
          subtitle={`${data.churn.at_risk} at risk`}
          icon={UserX}
          color="red"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  fill="#4f46e5" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10b981" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Support Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Queue</CardTitle>
            <HeadphonesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Open Tickets</span>
                <span className="font-semibold">{data.support.open_tickets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Urgent</span>
                <span className="font-semibold text-red-600">{data.support.urgent_open}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Resolution</span>
                <span className="font-semibold">{data.support.avg_resolution_hours}h</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Wedding Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wedding Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Weddings</span>
                <span className="font-semibold">{data.wedding.total_weddings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Next 30 Days</span>
                <span className="font-semibold">{data.wedding.weddings_next_30d}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Guest Count</span>
                <span className="font-semibold">{Math.round(data.wedding.avg_guest_count)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* System Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className="font-semibold">{(data.reliability.error_rate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Errors (24h)</span>
                <span className="font-semibold">{data.reliability.error_count_24h}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Top: {data.reliability.top_errors[0]?.error || 'None'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/superadmin/users/new')}
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/superadmin/messages/broadcast')}
            >
              <MessageSquare className="h-4 w-4" />
              Send Broadcast
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/superadmin/revenue/credits')}
            >
              <CreditCard className="h-4 w-4" />
              Grant Credits
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/superadmin/support/new')}
            >
              <HeadphonesIcon className="h-4 w-4" />
              Create Ticket
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/superadmin/settings/features')}
            >
              <Shield className="h-4 w-4" />
              Feature Flags
            </Button>
            <Button 
              variant="outline" 
              className="justify-start gap-2"
              onClick={() => router.push('/superadmin/export')}
            >
              <FileText className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* User Segments */}
      <Card>
        <CardHeader>
          <CardTitle>User Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SegmentBar 
              label="Free Users"
              value={data.segments.free_users}
              total={data.segments.total_users}
              color="gray"
            />
            <SegmentBar 
              label="Trial Users"
              value={data.segments.trial_users}
              total={data.segments.total_users}
              color="yellow"
            />
            <SegmentBar 
              label="Premium Users"
              value={data.segments.premium_users}
              total={data.segments.total_users}
              color="green"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  change, 
  icon: Icon, 
  color 
}: {
  title: string
  value: string
  subtitle?: string
  change?: string
  icon: any
  color: string
}) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    red: 'text-red-600 bg-red-100',
    yellow: 'text-yellow-600 bg-yellow-100'
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {change && (
          <p className={`text-xs mt-1 ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SegmentBar({ 
  label, 
  value, 
  total, 
  color 
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  const colorClasses = {
    gray: 'bg-gray-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500'
  }
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{value.toLocaleString()} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function QuickActionButton({ 
  href, 
  icon: Icon, 
  label 
}: { 
  href: string
  icon: any
  label: string 
}) {
  return (
    <Link href={href}>
      <Button variant="outline" size="sm" className="gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  )
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  actions,
  badge,
  badgeColor = 'blue'
}: {
  title: string
  description: string
  icon: any
  href: string
  actions: Array<{ label: string; href: string }>
  badge?: string
  badgeColor?: string
}) {
  const router = useRouter()
  
  const badgeColors = {
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  }
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(href)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Icon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
          </div>
          {badge && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColors[badgeColor as keyof typeof badgeColors]}`}>
              {badge}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {actions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between text-sm text-gray-600 hover:text-indigo-600 py-1"
            >
              <span>{action.label}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLinkButton({
  icon: Icon,
  label,
  href
}: {
  icon: any
  label: string
  href: string
}) {
  return (
    <Link href={href}>
      <Button variant="outline" className="w-full h-auto py-3 px-2 flex flex-col items-center gap-2 hover:bg-indigo-50 hover:border-indigo-300">
        <Icon className="h-5 w-5 text-gray-600" />
        <span className="text-xs text-gray-600">{label}</span>
      </Button>
    </Link>
  )
}