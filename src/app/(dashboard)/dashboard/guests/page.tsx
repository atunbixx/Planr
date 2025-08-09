'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import AddGuestDialog from './components/AddGuestDialog'
import { PermissionGate } from '@/components/PermissionGate'
import { Search, Plus, Mail, Download, Filter } from 'lucide-react'

interface Guest {
  id: string
  name: string
  email?: string
  phone?: string
  relationship?: string
  side: string
  plusOneAllowed: boolean
  rsvpStatus: string
  invitationCode?: string
  dietaryRestrictions?: string
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
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const t = useTranslations()
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
  const [isAddingGuest, setIsAddingGuest] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSide, setFilterSide] = useState<string>('all')

  const fetchGuests = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/guests')
      if (!response.ok) {
        throw new Error(`Failed to fetch guests: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setGuests(data.guests)
        
        // Calculate stats
        const newStats = data.guests.reduce((acc: GuestStats, guest: Guest) => {
          acc.total++
          if (guest.rsvpStatus === 'confirmed') acc.confirmed++
          else if (guest.rsvpStatus === 'declined') acc.declined++
          else acc.pending++
          if (guest.plusOneAllowed) acc.withPlusOne++
          return acc
        }, {
          total: 0,
          confirmed: 0,
          declined: 0,
          pending: 0,
          withPlusOne: 0
        })
        
        setStats(newStats)
      } else {
        setError(data.error || 'Failed to load guests')
      }
    } catch (err) {
      console.error('Error fetching guests:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      fetchGuests()
    }
  }, [isLoading, isSignedIn])

  // Filter guests based on search and filters
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || guest.rsvpStatus === filterStatus
    const matchesSide = filterSide === 'all' || guest.side === filterSide
    
    return matchesSearch && matchesStatus && matchesSide
  })

  const getRSVPStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-[#7a9b7f]'
      case 'declined': return 'text-red-600'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="px-8 py-12">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 data-testid="guests-page-title" className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Guest List</h1>
        <p className="text-lg font-light text-gray-600">Manage your wedding guest list and RSVPs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p data-testid="total-guests" className="text-3xl font-light text-gray-900">{stats.total}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Total Guests</p>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-[#7a9b7f]">{stats.confirmed}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Confirmed</p>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-gray-400">{stats.pending}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Pending</p>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-red-600">{stats.declined}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Declined</p>
        </div>
        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-gray-900">{stats.withPlusOne}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Plus Ones</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white p-6 rounded-sm shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>
            
            {/* Filters */}
            <select
              data-testid="filter-status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
            </select>
            
            <select
              data-testid="filter-side-select"
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
            >
              <option value="all">All Sides</option>
              <option value="bride">Bride's Side</option>
              <option value="groom">Groom's Side</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm px-4 py-2 text-sm font-light"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Invites
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm px-4 py-2 text-sm font-light"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <PermissionGate permissions="manage_guests" fallback={null}>
              <Button
                data-testid="add-guest-button"
                onClick={() => setIsAddingGuest(true)}
                className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Guest
              </Button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Guest List Table */}
      <div className="bg-white rounded-sm shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left p-6 text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Name</th>
              <th className="text-left p-6 text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Contact</th>
              <th className="text-left p-6 text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Side</th>
              <th className="text-left p-6 text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">RSVP Status</th>
              <th className="text-left p-6 text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Plus One</th>
              <th className="text-left p-6 text-xs font-medium tracking-[0.2em] text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500 font-light" data-testid="empty-guests">
                  {searchTerm || filterStatus !== 'all' || filterSide !== 'all' 
                    ? 'No guests match your search criteria' 
                    : 'No guests added yet'}
                </td>
              </tr>
            ) : (
              filteredGuests.map((guest) => (
                <tr key={guest.id} data-testid="guest-item" className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-6">
                    <div>
                      <p className="font-light text-gray-900">{guest.name}</p>
                      {guest.relationship && (
                        <p className="text-sm font-light text-gray-500">{guest.relationship}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-sm font-light text-gray-600">
                      {guest.email && <p>{guest.email}</p>}
                      {guest.phone && <p>{guest.phone}</p>}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-light text-gray-600 capitalize">{guest.side}</span>
                  </td>
                  <td className="p-6">
                    <span className={`text-sm font-light capitalize ${getRSVPStatusColor(guest.rsvpStatus)}`}>
                      {guest.rsvpStatus}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-light text-gray-600">
                      {guest.plusOneAllowed ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900 text-sm font-light"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900 text-sm font-light"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Guest Dialog */}
      <AddGuestDialog
        open={isAddingGuest}
        onClose={() => setIsAddingGuest(false)}
        onGuestAdded={fetchGuests}
      />
    </div>
  )
}