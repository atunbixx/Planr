'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

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
  dietaryRestrictions?: string
  notes?: string
  rsvpDeadline?: string
}

interface EditGuestDialogProps {
  open: boolean
  onClose: () => void
  guest: Guest | null
  onGuestUpdated?: () => void
}

export default function EditGuestDialog({ open, onClose, guest, onGuestUpdated }: EditGuestDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    relationship: '',
    side: 'both',
    plusOneAllowed: false,
    plusOneName: '',
    dietaryRestrictions: '',
    notes: '',
    rsvpDeadline: ''
  })

  const relationshipOptions = [
    'Family',
    'Friend',
    'Colleague',
    'Classmate',
    'Neighbor',
    'Wedding Party',
    'Extended Family',
    'Other'
  ]

  // Update form when guest changes
  useEffect(() => {
    if (guest) {
      const nameParts = guest.name.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      setFormData({
        firstName,
        lastName,
        email: guest.email || '',
        phone: guest.phone || '',
        address: guest.address || '',
        relationship: guest.relationship || '',
        side: guest.side || 'both',
        plusOneAllowed: guest.plusOneAllowed || false,
        plusOneName: guest.plusOneName || '',
        dietaryRestrictions: guest.dietaryRestrictions || '',
        notes: guest.notes || '',
        rsvpDeadline: guest.rsvpDeadline || ''
      })
    }
  }, [guest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guest || loading) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/guests/${guest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          relationship: formData.relationship || undefined,
          side: formData.side,
          plusOneAllowed: formData.plusOneAllowed,
          plusOneName: formData.plusOneAllowed ? formData.plusOneName : undefined,
          dietaryRestrictions: formData.dietaryRestrictions || undefined,
          notes: formData.notes || undefined,
          rsvpDeadline: formData.rsvpDeadline || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update guest' }))
        throw new Error(errorData.error || 'Failed to update guest')
      }

      const data = await response.json()
      console.log('Guest update response:', data)

      if (data.success) {
        console.log('Guest updated successfully!')
        // Reset form state
        setError(null)
        // Close the dialog first
        onClose()
        // Add a small delay before refreshing to ensure cache is invalidated
        setTimeout(() => {
          onGuestUpdated?.()
        }, 100)
      } else {
        throw new Error(data.error || 'Failed to update guest')
      }
    } catch (error) {
      console.error('Error updating guest:', error)
      setError(error instanceof Error ? error.message : 'Failed to update guest')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!guest || !window.confirm('Are you sure you want to delete this guest?')) return
    
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/guests/${guest.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete guest' }))
        throw new Error(errorData.error || 'Failed to delete guest')
      }

      // Close dialog first
      onClose()
      // Add a small delay before refreshing
      setTimeout(() => {
        onGuestUpdated?.()
      }, 100)
    } catch (error) {
      console.error('Error deleting guest:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete guest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-light tracking-wide uppercase">Edit Guest</DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-sm text-sm font-light">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
                Relationship
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              >
                <option value="">Select relationship</option>
                {relationshipOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
                Side *
              </label>
              <select
                required
                value={formData.side}
                onChange={(e) => setFormData({ ...formData, side: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              >
                <option value="bride">Bride's Side</option>
                <option value="groom">Groom's Side</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.plusOneAllowed}
                onChange={(e) => setFormData({ ...formData, plusOneAllowed: e.target.checked })}
                className="rounded border-gray-300 text-[#7a9b7f] focus:ring-[#7a9b7f]"
              />
              <span className="text-sm font-medium tracking-wide text-gray-700 uppercase">
                Allow Plus One
              </span>
            </label>
          </div>

          {formData.plusOneAllowed && (
            <div>
              <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
                Plus One Name
              </label>
              <input
                type="text"
                value={formData.plusOneName}
                onChange={(e) => setFormData({ ...formData, plusOneName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
              Dietary Restrictions
            </label>
            <input
              type="text"
              value={formData.dietaryRestrictions}
              onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
              placeholder="e.g., Vegetarian, Gluten-free, Nut allergy"
              className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium tracking-wide text-gray-700 uppercase mb-2">
              RSVP Deadline
            </label>
            <input
              type="date"
              value={formData.rsvpDeadline}
              onChange={(e) => setFormData({ ...formData, rsvpDeadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase"
            >
              Delete Guest
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                disabled={loading}
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}