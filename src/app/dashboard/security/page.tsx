'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, UserX, Clock, Activity, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SecurityEvent {
  id: string
  created_at: string
  ip_address: string
  user_agent: string
  access_status: string
  invite_code?: string
  device_type: string
  guest?: {
    first_name: string
    last_name: string
  }
}

interface SecurityStats {
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  blockedAttempts: number
  uniqueIPs: number
  suspiciousActivity: number
}

export default function SecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    blockedAttempts: 0,
    uniqueIPs: 0,
    suspiciousActivity: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClientComponentClient()

  const loadSecurityData = async () => {
    try {
      setRefreshing(true)
      
      // Get recent RSVP sessions
      const { data: sessions, error } = await supabase
        .from('rsvp_sessions')
        .select(`
          id,
          created_at,
          ip_address,
          user_agent,
          access_status,
          invite_code,
          device_type,
          guest:wedding_guests(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading security data:', error)
        return
      }

      setEvents(sessions || [])

      // Calculate stats
      if (sessions) {
        const uniqueIPs = new Set(sessions.map(s => s.ip_address)).size
        const stats: SecurityStats = {
          totalAttempts: sessions.length,
          successfulAttempts: sessions.filter(s => s.access_status === 'success').length,
          failedAttempts: sessions.filter(s => s.access_status === 'invalid_code').length,
          blockedAttempts: sessions.filter(s => s.access_status === 'blocked').length,
          uniqueIPs,
          suspiciousActivity: sessions.filter(s => 
            s.access_status === 'blocked' || 
            s.access_status === 'invalid_code'
          ).length,
        }
        setStats(stats)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadSecurityData()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadSecurityData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>
      case 'invalid_code':
        return <Badge variant="warning">Invalid Code</Badge>
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return '📱'
      case 'tablet':
        return '📋'
      case 'desktop':
        return '💻'
      default:
        return '❓'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">RSVP Security Monitor</h1>
          <p className="text-muted-foreground">
            Track and monitor RSVP access attempts and security events
          </p>
        </div>
        <Button
          onClick={() => loadSecurityData()}
          disabled={refreshing}
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successfulAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.failedAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.blockedAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.suspiciousActivity}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Access Attempts</CardTitle>
          <CardDescription>
            Last 100 RSVP access attempts with security status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(event.access_status)}</TableCell>
                    <TableCell>
                      {event.guest ? (
                        <span className="font-medium">
                          {event.guest.first_name} {event.guest.last_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{event.ip_address}</TableCell>
                    <TableCell>
                      <span className="text-lg mr-1">{getDeviceIcon(event.device_type)}</span>
                      <span className="text-sm text-muted-foreground">{event.device_type}</span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {event.user_agent}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}