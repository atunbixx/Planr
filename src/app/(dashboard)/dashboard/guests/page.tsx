'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import AddGuestDialog from './components/AddGuestDialog'
import GuestList from './components/GuestList'

interface Guest {
  id: string
  name: string
  email?: string
  phone?: string
  relationship?: string
  side: string
  plusOne: boolean
  rsvpStatus: string
  invitationCode?: string
  dietaryNotes?: string
  specialRequests?: string
  notes?: string
}

interface GuestStats {
  total: number
  confirmed: number
  declined: number
  pending: number
  withPlusOne: number
}

export default function GuestsPage() {
  const { user, isLoaded } = useUser()
  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] = useState<GuestStats>({
    total: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    withPlusOne: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuests = async () => {
    try {
      setLoading(true)
      setError(null)

      // Initialize user first
      await fetch('/api/user/initialize', {
        method: 'POST',
      })

      // Then fetch guests
      const response = await fetch('/api/guests')
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view guests')
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch guests')
      }

      const data = await response.json()
      setGuests(data.guests || [])
      setStats(data.stats || {
        total: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
        withPlusOne: 0
      })
    } catch (error) {
      console.error('Error fetching guests:', error)
      setError(error instanceof Error ? error.message : 'Failed to load guests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && user) {
      fetchGuests()
    }
  }, [isLoaded, user])

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Please sign in to view guests</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Guest List</h1>
          <p className="text-gray-600 mt-2">
            Manage your wedding guest list and RSVPs
          </p>
        </div>
        <AddGuestDialog onGuestAdded={fetchGuests} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchGuests} 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Badge variant="secondary">{stats.total}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Badge variant="default" className="bg-green-500">{stats.confirmed}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
            <Badge variant="destructive">{stats.declined}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge variant="outline">{stats.pending}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plus Ones</CardTitle>
            <Badge variant="secondary">{stats.withPlusOne}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withPlusOne}</div>
          </CardContent>
        </Card>
      </div>

      {/* Guest List */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading guests...</div>
          </CardContent>
        </Card>
      ) : guests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Guests Yet</CardTitle>
            <CardDescription>
              Start building your guest list by adding your first guest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddGuestDialog onGuestAdded={fetchGuests} />
          </CardContent>
        </Card>
      ) : (
        <GuestList guests={guests} />
      )}
    </div>
  )
}