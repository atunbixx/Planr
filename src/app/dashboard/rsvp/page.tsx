'use client'

import { useState, useMemo } from 'react'
import { useGuests } from '@/hooks/useGuests'
import { useToastContext } from '@/contexts/ToastContext'
import { RSVPStats } from '@/components/dashboard/rsvp/RSVPStats'
import { RSVPTimeline } from '@/components/dashboard/rsvp/RSVPTimeline'
import { RSVPTable } from '@/components/dashboard/rsvp/RSVPTable'
import { RSVPFilters } from '@/components/dashboard/rsvp/RSVPFilters'
import { RSVPExport } from '@/components/dashboard/rsvp/RSVPExport'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { RSVPStatus, GuestCategory } from '@/types/database'
import { Mail, MessageSquare, Phone, Users } from 'lucide-react'

export default function RSVPDashboardPage() {
  const { 
    guests, 
    loading, 
    error, 
    guestStats, 
    updateRSVP,
    sendInvitation,
    refreshGuests 
  } = useGuests()
  const { addToast } = useToastContext()

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<RSVPStatus | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<GuestCategory | 'all'>('all')
  const [selectedMeal, setSelectedMeal] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  })

  // UI states
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [isSendingReminders, setIsSendingReminders] = useState(false)

  // Filter guests based on all criteria
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesStatus = selectedStatus === 'all' || guest.rsvp_status === selectedStatus
      const matchesCategory = selectedCategory === 'all' || guest.category === selectedCategory
      const matchesMeal = selectedMeal === 'all' || guest.meal_choice === selectedMeal
      const matchesSearch = searchQuery === '' || 
        guest.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        \`\${guest.first_name} \${guest.last_name}\`.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Date range filter for RSVP date
      let matchesDate = true
      if (dateRange.start || dateRange.end) {
        const rsvpDate = guest.rsvp_date ? new Date(guest.rsvp_date) : null
        if (rsvpDate) {
          if (dateRange.start && rsvpDate < dateRange.start) matchesDate = false
          if (dateRange.end && rsvpDate > dateRange.end) matchesDate = false
        } else {
          matchesDate = false // No RSVP date means doesn't match date filter
        }
      }
      
      return matchesStatus && matchesCategory && matchesMeal && matchesSearch && matchesDate
    })
  }, [guests, selectedStatus, selectedCategory, selectedMeal, searchQuery, dateRange])

  // Get pending guests who haven't responded
  const pendingGuests = useMemo(() => {
    return guests.filter(guest => 
      guest.rsvp_status === 'pending' && 
      guest.invitation_sent_date // Only include those who have been invited
    )
  }, [guests])

  // Send reminder emails
  const handleSendReminders = async () => {
    if (selectedGuests.length === 0) {
      addToast({
        type: 'error',
        message: 'Please select guests to send reminders to'
      })
      return
    }

    setIsSendingReminders(true)
    try {
      // Import the reminder function
      const { sendRSVPReminders } = await import('@/lib/rsvp-reminders')
      
      if (!couple?.id) {
        throw new Error('No couple ID found')
      }

      const result = await sendRSVPReminders(couple.id, selectedGuests)
      
      if (result.success) {
        addToast({
          type: 'success',
          message: \`Reminder sent to \${result.sent} guest(s)\`
        })
      } else {
        addToast({
          type: 'error',
          message: result.errors[0] || 'Failed to send some reminders'
        })
      }
      
      if (result.sent > 0) {
        // Refresh guests to update reminder data
        await refreshGuests()
        setSelectedGuests([])
      }
    } catch (error: any) {
      console.error('Error sending reminders:', error)
      addToast({
        type: 'error',
        message: error.message || 'Failed to send reminders. Please try again.'
      })
    } finally {
      setIsSendingReminders(false)
    }
  }

  // Quick actions for bulk operations
  const handleBulkRSVP = async (status: RSVPStatus) => {
    if (selectedGuests.length === 0) {
      addToast({
        type: 'error',
        message: 'Please select guests to update'
      })
      return
    }

    try {
      await Promise.all(
        selectedGuests.map(guestId => updateRSVP(guestId, status))
      )
      
      addToast({
        type: 'success',
        message: \`Updated RSVP status for \${selectedGuests.length} guest(s)\`
      })
      
      setSelectedGuests([])
      refreshGuests()
    } catch (error) {
      console.error('Error updating RSVPs:', error)
      addToast({
        type: 'error',
        message: 'Failed to update some RSVPs. Please try again.'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RSVP data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading RSVP data</p>
          <Button onClick={refreshGuests}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RSVP Dashboard</h1>
          <p className="text-gray-600">Track and manage your wedding guest responses</p>
        </div>

        {/* Stats Overview */}
        <RSVPStats guests={guests} guestStats={guestStats} />

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleSendReminders}
                disabled={selectedGuests.length === 0 || isSendingReminders}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Send Reminders ({selectedGuests.length})
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleBulkRSVP('attending')}
                disabled={selectedGuests.length === 0}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Mark as Attending
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleBulkRSVP('not_attending')}
                disabled={selectedGuests.length === 0}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Mark as Not Attending
              </Button>

              <div className="ml-auto">
                <RSVPExport guests={filteredGuests} />
              </div>
            </div>

            {/* Pending Reminders Alert */}
            {pendingGuests.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>{pendingGuests.length} guests</strong> haven't responded yet.
                  {pendingGuests.length > 5 && (
                    <span> Consider sending a reminder to those who were invited more than 2 weeks ago.</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <RSVPFilters
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedMeal={selectedMeal}
          setSelectedMeal={setSelectedMeal}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          guests={guests}
        />

        {/* Response Timeline */}
        <div className="mb-8">
          <RSVPTimeline guests={guests} />
        </div>

        {/* Guest Table */}
        <RSVPTable
          guests={filteredGuests}
          selectedGuests={selectedGuests}
          setSelectedGuests={setSelectedGuests}
          onUpdateRSVP={updateRSVP}
          onRefresh={refreshGuests}
        />
      </div>
    </div>
  )
}