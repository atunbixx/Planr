'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Mail, Copy, Check, Send, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Guest {
  id: string
  name: string
  email?: string
  invitationCode?: string
  rsvpStatus?: string
  attendingCount?: number
  respondedAt?: string
  rsvpDeadline?: string
}

interface InvitationDialogProps {
  open: boolean
  onClose: () => void
  guests: Guest[]
  onInvitationsSent?: () => void
}

export default function InvitationDialog({ open, onClose, guests, onInvitationsSent }: InvitationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [invitationMessage, setInvitationMessage] = useState(`
Dear [Guest Name],

We are delighted to invite you to celebrate our wedding!

Please RSVP by clicking the link below:
[RSVP Link]

We look forward to celebrating with you!

With love,
[Your Names]
  `.trim())
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Filter guests who haven't been invited or need re-invitation
  const uninvitedGuests = guests.filter(g => !g.invitationCode || g.rsvpStatus === 'pending')
  const invitedGuests = guests.filter(g => g.invitationCode && g.rsvpStatus !== 'pending')

  useEffect(() => {
    // Reset selection when dialog opens
    if (open) {
      setSelectedGuests([])
    }
  }, [open])

  const handleSelectAll = () => {
    if (selectedGuests.length === uninvitedGuests.length) {
      setSelectedGuests([])
    } else {
      setSelectedGuests(uninvitedGuests.map(g => g.id))
    }
  }

  const handleSelectGuest = (guestId: string) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    )
  }

  const copyInvitationLink = async (guest: Guest) => {
    if (!guest.invitationCode) return
    
    const rsvpUrl = `${window.location.origin}/rsvp/${guest.invitationCode}`
    await navigator.clipboard.writeText(rsvpUrl)
    setCopiedCode(guest.id)
    toast.success('RSVP link copied to clipboard')
    
    setTimeout(() => {
      setCopiedCode(null)
    }, 2000)
  }

  const sendInvitations = async () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestIds: selectedGuests,
          message: invitationMessage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send invitations')
      }

      const data = await response.json()
      toast.success(`Successfully sent ${data.sent} invitation${data.sent > 1 ? 's' : ''}`)
      
      onInvitationsSent?.()
      onClose()
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast.error('Failed to send invitations')
    } finally {
      setLoading(false)
    }
  }

  const getRSVPStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
      case 'attending':
        return <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-sm">Confirmed</span>
      case 'declined':
        return <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-sm">Declined</span>
      case 'pending':
      default:
        return <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-sm">Pending</span>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-light tracking-wide uppercase">Manage Invitations</DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Uninvited Guests Section */}
          {uninvitedGuests.length > 0 && (
            <div>
              <h3 className="text-lg font-light tracking-wide text-gray-900 uppercase mb-4">
                Send Invitations ({uninvitedGuests.length} guests)
              </h3>
              
              <div className="bg-gray-50 rounded-sm p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedGuests.length === uninvitedGuests.length && uninvitedGuests.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#7a9b7f] focus:ring-[#7a9b7f]"
                    />
                    <span className="text-sm font-light text-gray-700">Select All</span>
                  </label>
                  <span className="text-sm font-light text-gray-500">
                    {selectedGuests.length} selected
                  </span>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uninvitedGuests.map(guest => (
                    <label
                      key={guest.id}
                      className="flex items-center justify-between p-2 bg-white rounded-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(guest.id)}
                          onChange={() => handleSelectGuest(guest.id)}
                          className="rounded border-gray-300 text-[#7a9b7f] focus:ring-[#7a9b7f]"
                        />
                        <div>
                          <p className="font-light text-gray-900">{guest.name}</p>
                          {guest.email && (
                            <p className="text-xs font-light text-gray-500">{guest.email}</p>
                          )}
                        </div>
                      </div>
                      {!guest.email && (
                        <span className="text-xs text-amber-600">No email</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Message Template */}
              <div className="mb-4">
                <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
                  Invitation Message
                </label>
                <textarea
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
                  placeholder="Enter your invitation message..."
                />
                <p className="text-xs font-light text-gray-500 mt-1">
                  Use [Guest Name], [RSVP Link], and [Your Names] as placeholders
                </p>
              </div>

              <Button
                onClick={sendInvitations}
                disabled={loading || selectedGuests.length === 0}
                className="w-full bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-3 text-sm font-light tracking-wider uppercase"
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {selectedGuests.length} Invitation{selectedGuests.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Invited Guests Section */}
          {invitedGuests.length > 0 && (
            <div>
              <h3 className="text-lg font-light tracking-wide text-gray-900 uppercase mb-4">
                Invitation Status ({invitedGuests.length} guests)
              </h3>
              
              <div className="space-y-2">
                {invitedGuests.map(guest => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-light text-gray-900">{guest.name}</p>
                        {getRSVPStatusBadge(guest.rsvpStatus)}
                      </div>
                      {guest.email && (
                        <p className="text-xs font-light text-gray-500 mt-1">{guest.email}</p>
                      )}
                      {guest.respondedAt && (
                        <p className="text-xs font-light text-gray-500 mt-1">
                          Responded: {new Date(guest.respondedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => copyInvitationLink(guest)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900"
                      >
                        {copiedCode === guest.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => window.open(`/rsvp/${guest.invitationCode}`, '_blank')}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {uninvitedGuests.length === 0 && invitedGuests.length === 0 && (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-light text-gray-500">No guests to invite</p>
              <p className="text-sm font-light text-gray-400 mt-2">
                Add guests to your list first, then send invitations
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}