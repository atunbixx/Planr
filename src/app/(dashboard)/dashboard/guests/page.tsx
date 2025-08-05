import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AddGuestDialog from './components/AddGuestDialog'
import GuestList from './components/GuestList'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function GuestsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // For now, we'll get user email from Clerk in a client component
  // or we can get it here using clerkClient if needed
  const userEmail = null // TODO: Get from Clerk user data
  
  let guests: any[] = []
  let stats = {
    total_invited: 0,
    total_confirmed: 0,
    total_declined: 0,
    total_pending: 0,
    total_attending: 0,
    response_rate: 0
  }
  
  if (userEmail) {
    // Get user's couple data and guests
    const { data: userData } = await supabase
      .from('users')
      .select(`
        couples (
          id,
          guests (
            id,
            first_name,
            last_name,
            email,
            phone,
            relationship,
            side,
            plus_one_allowed,
            plus_one_name,
            dietary_restrictions,
            notes,
            created_at,
            invitations (
              id,
              status,
              attending_count,
              plus_one_attending,
              plus_one_name,
              responded_at,
              rsvp_deadline,
              invitation_code
            )
          )
        )
      `)
      .eq('email', userEmail)
      .single()
    
    if (userData?.couples?.[0]) {
      const coupleData = userData.couples[0]
      guests = coupleData.guests || []
      
      // Get guest statistics
      const { data: statsData } = await supabase.rpc('get_guest_stats', {
        p_couple_id: coupleData.id
      })
      
      if (statsData?.[0]) {
        stats = statsData[0]
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>
      case 'declined':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Declined</Badge>
      case 'pending':
      case 'no_response':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getInitialsColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-red-100 text-red-600',
      'bg-indigo-100 text-indigo-600',
      'bg-pink-100 text-pink-600',
      'bg-teal-100 text-teal-600'
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guest Management</h1>
          <p className="text-gray-600 mt-2">Manage your guest list and track RSVPs</p>
        </div>
        <AddGuestDialog />
      </div>

      {/* Guest Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invited</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_invited}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.total_confirmed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_attending} attending • {Math.round((stats.total_confirmed / Math.max(stats.total_invited, 1)) * 100)}% confirmed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Declined</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.total_declined}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.total_declined / Math.max(stats.total_invited, 1)) * 100)}% declined
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.total_pending}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(stats.response_rate)}% response rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Guest List */}
      <Card>
        <CardHeader>
          <CardTitle>Guest List</CardTitle>
          <CardDescription>View and manage your wedding guests</CardDescription>
        </CardHeader>
        <CardContent>
          {guests.length > 0 ? (
            <GuestList guests={guests} />
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">No guests added yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start building your guest list by adding family and friends to your wedding.
              </p>
              <AddGuestDialog />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}