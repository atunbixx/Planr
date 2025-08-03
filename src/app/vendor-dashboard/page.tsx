'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Star, 
  TrendingUp,
  MapPin,
  Package,
  Settings,
  Users
} from 'lucide-react'

interface VendorDashboardData {
  vendor: {
    id: string
    business_name: string
    category: string
    average_rating: number
    total_reviews: number
    total_bookings: number
    verified: boolean
    featured: boolean
    latitude?: number
    longitude?: number
  }
  stats: {
    totalInquiries: number
    unreadInquiries: number
    responseRate: number
    averageResponseTime: number
    monthlyViews: number
    conversionRate: number
  }
  recentInquiries: Array<{
    id: string
    name: string
    email: string
    event_date: string
    message: string
    created_at: string
    responded: boolean
  }>
  upcomingBookings: Array<{
    id: string
    couple_name: string
    event_date: string
    package_name: string
    status: string
  }>
}

export default function VendorDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // For MVP, using mock data. In production, this would fetch from API
      const mockData: VendorDashboardData = {
        vendor: {
          id: '1',
          business_name: 'Elegant Events Co.',
          category: 'planner',
          average_rating: 4.8,
          total_reviews: 124,
          total_bookings: 89,
          verified: true,
          featured: true,
          latitude: 37.7749,
          longitude: -122.4194
        },
        stats: {
          totalInquiries: 45,
          unreadInquiries: 3,
          responseRate: 98,
          averageResponseTime: 2.5,
          monthlyViews: 1234,
          conversionRate: 15.6
        },
        recentInquiries: [
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            event_date: '2025-06-15',
            message: 'Hi, I love your portfolio! We are planning a garden wedding...',
            created_at: new Date().toISOString(),
            responded: false
          },
          {
            id: '2',
            name: 'Michael Chen',
            email: 'mchen@example.com',
            event_date: '2025-09-20',
            message: 'Looking for a full-service wedding planner for 150 guests...',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            responded: true
          }
        ],
        upcomingBookings: [
          {
            id: '1',
            couple_name: 'Emma & James',
            event_date: '2025-04-12',
            package_name: 'Full Planning Package',
            status: 'confirmed'
          },
          {
            id: '2',
            couple_name: 'Lisa & Robert',
            event_date: '2025-05-20',
            package_name: 'Day-of Coordination',
            status: 'pending'
          }
        ]
      }
      
      setDashboardData(mockData)
      setLoading(false)
    } catch (err) {
      setError('Failed to load dashboard data')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Failed to load dashboard'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { vendor, stats, recentInquiries, upcomingBookings } = dashboardData

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{vendor.business_name}</h1>
            <p className="text-muted-foreground capitalize">{vendor.category} Services</p>
          </div>
          <div className="flex gap-2">
            {vendor.verified && <Badge variant="secondary">Verified</Badge>}
            {vendor.featured && <Badge variant="default">Featured</Badge>}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{vendor.average_rating} ({vendor.total_reviews} reviews)</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{vendor.total_bookings} bookings</span>
          </div>
          {vendor.latitude && vendor.longitude && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Location set</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInquiries}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unreadInquiries} unread
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              ~{stats.averageResponseTime}h avg response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Views</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyViews}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Inquiry to booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="inquiries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inquiries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inquiries</CardTitle>
              <CardDescription>
                Respond quickly to maintain your high response rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{inquiry.name}</p>
                        {!inquiry.responded && (
                          <Badge variant="outline" className="text-orange-600">Unread</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                      <p className="text-sm">Event Date: {new Date(inquiry.event_date).toLocaleDateString()}</p>
                      <p className="text-sm line-clamp-2">{inquiry.message}</p>
                    </div>
                    <Button size="sm">
                      {inquiry.responded ? 'View' : 'Respond'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>
                Your confirmed and pending bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{booking.couple_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.event_date).toLocaleDateString()} • {booking.package_name}
                      </p>
                    </div>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Manage your business information and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full sm:w-auto" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button className="w-full sm:w-auto" variant="outline">
                <MapPin className="mr-2 h-4 w-4" />
                Update Location
              </Button>
              <Button className="w-full sm:w-auto" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Manage Availability
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Packages</CardTitle>
              <CardDescription>
                Create and manage your service offerings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full sm:w-auto">
                <Package className="mr-2 h-4 w-4" />
                Add New Package
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}