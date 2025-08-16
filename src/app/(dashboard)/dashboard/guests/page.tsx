'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import AddGuestDialog from './components/AddGuestDialog'
import EditGuestDialog from './components/EditGuestDialog'
import InvitationDialog from './components/InvitationDialog'
import { PermissionGate } from '@/components/PermissionGate'
import { Search, Plus, Mail, Download, Filter, Copy, Eye, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { enterpriseApi, type GuestResponse } from '@/lib/api/enterprise-client'
import { useApiState } from '@/hooks/useApiState'
import { LoadingCard, SkeletonTable } from '@/components/ui/loading'
import { handleApiError } from '@/lib/api/error-handler'
import { 
  WeddingPageLayout, 
  WeddingPageHeader,
  WeddingStatCard,
  WeddingCard,
  WeddingButton,
  WeddingGrid,
  WeddingContentSection
} from '@/components/wedding-theme'

interface Guest {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  relationship?: string
  side: string
  plusOneAllowed: boolean
  plusOneName?: string
  rsvpStatus: string
  invitationCode?: string
  attendingCount?: number
  respondedAt?: string
  dietaryRestrictions?: string
  specialRequests?: string
  notes?: string
  rsvpDeadline?: string
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
  const [guests, setGuests] = useState<Guest[]>([])
  const [stats, setStats] = useState<GuestStats>({
    total: 0,
    confirmed: 0,
    declined: 0,
    pending: 0,
    withPlusOne: 0
  })
  const guestsApi = useApiState<Guest[]>([], {
      showErrorToast: false,
      onError: (error) => {
        // Allow authentication errors to bubble up for enterprise-client redirect handling
        console.error('Error in guests API:', error)
      }
    })
  const [isAddingGuest, setIsAddingGuest] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [isManagingInvitations, setIsManagingInvitations] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSide, setFilterSide] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchGuests = async (forceRefresh = false) => {
    if (!isSignedIn) {
      console.log('Skipping guest fetch - user not signed in')
      setGuests([])
      setStats({
        total: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
        withPlusOne: 0
      })
      return
    }
    
    console.log('Fetching guests...', forceRefresh ? '(force refresh)' : '')
    
    try {
      const response = await guestsApi.execute(enterpriseApi.guests.list())
      
      if (response) {
        // Transform API guests to match the component interface
        const guestArray = Array.isArray(response) ? response : (response as any).data || []
        const transformedGuests = guestArray.map((guest: GuestResponse) => ({
          id: guest.id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          rsvpStatus: guest.rsvpStatus,
          plusOneAllowed: guest.hasPlusOne || false,
          plusOneName: guest.plusOneName,
          dietaryRestrictions: guest.dietaryRestrictions,
          side: guest.side || 'both',
          tableNumber: guest.tableNumber
        }))
        setGuests(transformedGuests)
        
        // Calculate stats
        const newStats = transformedGuests.reduce((acc: GuestStats, guest: any) => {
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
      }
    } catch (error) {
        console.error('Error fetching guests:', error)
        // Handle authentication errors by clearing data and allowing redirect
        const errorMessage = (error as Error)?.message || ''
        if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
          setGuests([])
          setStats({
            total: 0,
            confirmed: 0,
            declined: 0,
            pending: 0,
            withPlusOne: 0
          })
        }
      }
  }

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      fetchGuests()
    } else if (!isLoading && !isSignedIn) {
      // Handle unauthenticated state gracefully
      setGuests([])
      setStats({
        total: 0,
        confirmed: 0,
        declined: 0,
        pending: 0,
        withPlusOne: 0
      })
    }
  }, [isLoading, isSignedIn])

  // Get data from API state
  const { loading, error } = guestsApi.state
  
  // Filter guests based on search and filters
  const filteredGuests = (guests || []).filter(guest => {
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

  const getRSVPStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-green-100 text-green-800">Confirmed</span>
      case 'declined':
        return <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-red-100 text-red-800">Declined</span>
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-gray-100 text-gray-800">Pending</span>
    }
  }

  const copyRSVPLink = async (guest: Guest) => {
    if (!guest.invitationCode) return
    
    const rsvpUrl = `${window.location.origin}/rsvp/${guest.invitationCode}`
    await navigator.clipboard.writeText(rsvpUrl)
    setCopiedId(guest.id)
    toast.success('RSVP link copied to clipboard!')
    
    setTimeout(() => {
      setCopiedId(null)
    }, 2000)
  }

  if (loading) {
    return (
      <WeddingPageLayout>
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
        </div>
      </WeddingPageLayout>
    )
  }

  // Show loading state
  if (loading && guests.length === 0) {
    return (
      <WeddingPageLayout>
        <WeddingPageHeader
          title="Guest List"
          subtitle="Manage your wedding guest list and RSVPs"
        />
        <LoadingCard message="Loading your guest list..." />
      </WeddingPageLayout>
    )
  }

  // Show error state
  if (error && guests.length === 0) {
    // Check if this is an authentication error
    const isAuthError = error.message?.includes('401') || error.message?.includes('Unauthorized')
    
    if (isAuthError) {
      return (
        <WeddingPageLayout>
          <WeddingPageHeader
            title="Guest List"
            subtitle="Manage your wedding guest list and RSVPs"
          />
          <WeddingCard className="text-center">
            <p className="text-red-600 mb-4">Please sign in to view your guest list</p>
            <WeddingButton onClick={() => window.location.href = '/sign-in?next=/dashboard/guests'}>
              Sign In
            </WeddingButton>
          </WeddingCard>
        </WeddingPageLayout>
      )
    }
    
    return (
      <WeddingPageLayout>
        <WeddingPageHeader
          title="Guest List"
          subtitle="Manage your wedding guest list and RSVPs"
        />
        <WeddingCard className="text-center">
          <p className="text-red-600 mb-4">Failed to load guest list</p>
          <WeddingButton onClick={() => fetchGuests(true)}>Try Again</WeddingButton>
        </WeddingCard>
      </WeddingPageLayout>
    )
  }

  return (
    <WeddingPageLayout>
      {/* Header */}
      <WeddingPageHeader
        title="Guest List"
        subtitle="Manage your wedding guest list and RSVPs"
        data-testid="guests-page-title"
      />

      {/* Stats Cards */}
      <WeddingContentSection>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          <WeddingStatCard
            value={stats.total}
            label="Total Guests"
            data-testid="total-guests"
          />
          <WeddingStatCard
            value={stats.confirmed}
            label="Confirmed"
            valueColor="sage"
          />
          <WeddingStatCard
            value={stats.pending}
            label="Pending"
          />
          <WeddingStatCard
            value={stats.declined}
            label="Declined"
            valueColor="amber"
          />
          <WeddingStatCard
            value={stats.withPlusOne}
            label="Plus Ones"
          />
          <WeddingStatCard
            value={`${stats.total > 0 ? Math.round(((stats.confirmed + stats.declined) / stats.total) * 100) : 0}%`}
            label="Response Rate"
            valueColor="sage"
          />
        </div>
      </WeddingContentSection>

      {/* Actions Bar */}
      <WeddingContentSection>
        <WeddingCard padding="sm">
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
              onClick={() => setIsManagingInvitations(true)}
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
              <WeddingButton
                data-testid="add-guest-button"
                onClick={() => setIsAddingGuest(true)}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Guest
              </WeddingButton>
            </PermissionGate>
          </div>
        </div>
        </WeddingCard>
      </WeddingContentSection>

      {/* Guest List Table */}
      <WeddingCard className="overflow-hidden" padding="sm">
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
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6">
                  <SkeletonTable rows={5} />
                </td>
              </tr>
            ) : filteredGuests.length === 0 ? (
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
                    <div className="space-y-1">
                      {getRSVPStatusBadge(guest.rsvpStatus)}
                      {guest.invitationCode && (
                        <p className="text-xs font-light text-gray-500">
                          {guest.respondedAt ? (
                            <>Responded: {new Date(guest.respondedAt).toLocaleDateString()}</>
                          ) : (
                            <>Invited</>
                          )}
                        </p>
                      )}
                      {!guest.invitationCode && (
                        <p className="text-xs font-light text-amber-600">Not invited yet</p>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-light text-gray-600">
                      {guest.plusOneAllowed ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingGuest(guest)}
                        className="text-gray-500 hover:text-gray-900 text-sm font-light"
                      >
                        Edit
                      </Button>
                      {guest.invitationCode && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyRSVPLink(guest)}
                            className="text-gray-500 hover:text-gray-900"
                            title="Copy RSVP link"
                          >
                            {copiedId === guest.id ? (
                              <span className="text-green-600 text-xs">Copied!</span>
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/rsvp/${guest.invitationCode}`, '_blank')}
                            className="text-gray-500 hover:text-gray-900"
                            title="View RSVP page"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </WeddingCard>

      {/* Add Guest Dialog */}
      <AddGuestDialog
        open={isAddingGuest}
        onClose={() => setIsAddingGuest(false)}
        onGuestAdded={() => fetchGuests(true)}
      />

      {/* Edit Guest Dialog */}
      <EditGuestDialog
        open={!!editingGuest}
        onClose={() => setEditingGuest(null)}
        guest={editingGuest}
        onGuestUpdated={() => fetchGuests(true)}
      />

      {/* Invitation Management Dialog */}
      <InvitationDialog
        open={isManagingInvitations}
        onClose={() => setIsManagingInvitations(false)}
        guests={guests}
        onInvitationsSent={() => fetchGuests(true)}
      />
    </WeddingPageLayout>
  )
}