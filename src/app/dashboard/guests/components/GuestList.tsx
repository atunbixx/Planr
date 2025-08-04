'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, MoreHorizontal, Mail, Phone } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface Guest {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  relationship?: string
  side?: string
  plus_one_allowed: boolean
  plus_one_name?: string
  dietary_restrictions?: string
  notes?: string
  created_at: string
  invitations: Array<{
    id: string
    status: string
    attending_count: number
    plus_one_attending?: boolean
    plus_one_name?: string
    responded_at?: string
    rsvp_deadline?: string
    invitation_code: string
  }>
}

interface GuestListProps {
  guests: Guest[]
}

export default function GuestList({ guests }: GuestListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sideFilter, setSideFilter] = useState('all')
  const router = useRouter()

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = 
      guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ''
    
    const matchesStatus = statusFilter === 'all' || guest.invitations[0]?.status === statusFilter
    const matchesSide = sideFilter === 'all' || guest.side === sideFilter
    
    return matchesSearch && matchesStatus && matchesSide
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Declined</Badge>
      case 'pending':
      case 'no_response':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
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

  const handleRSVPUpdate = async (guestId: string, status: string) => {
    try {
      const response = await fetch(`/api/guests/${guestId}/rsvp`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          attending_count: status === 'confirmed' ? 1 : 0
        })
      })

      if (response.ok) {
        router.refresh()
      } else {
        console.error('Failed to update RSVP')
      }
    } catch (error) {
      console.error('Error updating RSVP:', error)
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('Are you sure you want to delete this guest?')) {
      return
    }

    try {
      const response = await fetch(`/api/guests/${guestId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        console.error('Failed to delete guest')
      }
    } catch (error) {
      console.error('Error deleting guest:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sideFilter} onValueChange={setSideFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Side" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sides</SelectItem>
              <SelectItem value="bride">Bride</SelectItem>
              <SelectItem value="groom">Groom</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredGuests.length} of {guests.length} guests
      </div>

      {/* Guest List */}
      <div className="space-y-3">
        {filteredGuests.map((guest) => {
          const invitation = guest.invitations[0]
          const fullName = `${guest.first_name} ${guest.last_name}`
          
          return (
            <div key={guest.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getInitialsColor(fullName)}`}>
                  <span className="text-sm font-semibold">{getInitials(guest.first_name, guest.last_name)}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{fullName}</h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {guest.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{guest.email}</span>
                      </div>
                    )}
                    {guest.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                  </div>
                  {guest.relationship && (
                    <div className="text-xs text-muted-foreground">
                      {guest.relationship}
                      {guest.side && guest.side !== 'both' && (
                        <> • {guest.side === 'bride' ? 'Bride\'s side' : 'Groom\'s side'}</>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {invitation && getStatusBadge(invitation.status)}
                
                <div className="text-sm text-muted-foreground">
                  {guest.plus_one_allowed ? (
                    invitation?.plus_one_attending ? 
                      '+1 attending' : 
                      '+1 invited'
                  ) : (
                    'No +1'
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {invitation?.status !== 'confirmed' && (
                      <DropdownMenuItem onClick={() => handleRSVPUpdate(guest.id, 'confirmed')}>
                        Mark Confirmed
                      </DropdownMenuItem>
                    )}
                    {invitation?.status !== 'declined' && (
                      <DropdownMenuItem onClick={() => handleRSVPUpdate(guest.id, 'declined')}>
                        Mark Declined
                      </DropdownMenuItem>
                    )}
                    {invitation?.status !== 'pending' && (
                      <DropdownMenuItem onClick={() => handleRSVPUpdate(guest.id, 'pending')}>
                        Mark Pending
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="text-red-600"
                    >
                      Delete Guest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No guests found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}