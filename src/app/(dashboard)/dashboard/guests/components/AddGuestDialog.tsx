'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { enterpriseApi } from '@/lib/api/enterprise-client'

interface AddGuestDialogProps {
  open: boolean
  onClose: () => void
  onGuestAdded?: () => void
}

export default function AddGuestDialog({ open, onClose, onGuestAdded }: AddGuestDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const guest = await enterpriseApi.guests.create({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        dietaryRestrictions: formData.dietaryRestrictions || undefined,
        plusOneAllowed: formData.plusOneAllowed,
        plusOneName: formData.plusOneAllowed ? formData.plusOneName : undefined,
      })

      console.log('Guest created successfully:', guest)

      onGuestAdded?.()
      onClose()
        
      // Reset form
      setFormData({
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
    } catch (error) {
      console.error('Error adding guest:', error)
      setError(error instanceof Error ? error.message : 'Failed to add guest. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white rounded-sm shadow-xl p-0 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 data-testid="add-guest-dialog" className="text-2xl font-light tracking-wide text-gray-900 uppercase">Add Guest</h2>
              <p className="text-sm font-light text-gray-600 mt-1">Enter guest information below</p>
            </div>
            <button
              data-testid="close-button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} id="guest-form" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-8">
            {error && (
              <div data-testid="error-message" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-sm text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Fields */}
            <div>
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                First Name *
              </label>
              <input
                data-testid="first-name-input"
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                Last Name *
              </label>
              <input
                data-testid="last-name-input"
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Contact Fields */}
            <div>
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                Email
              </label>
              <input
                data-testid="email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                Phone
              </label>
              <input
                data-testid="phone-input"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Relationship Fields */}
            <div>
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                Relationship
              </label>
              <select
                data-testid="relationship-select"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              >
                <option value="">Select relationship</option>
                {relationshipOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                Side *
              </label>
              <select
                data-testid="side-select"
                required
                value={formData.side}
                onChange={(e) => setFormData({ ...formData, side: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
              >
                <option value="bride">Bride's Side</option>
                <option value="groom">Groom's Side</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Plus One */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.plusOneAllowed}
                  onChange={(e) => setFormData({ ...formData, plusOneAllowed: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-gray-300"
                />
                <span className="text-sm font-light text-gray-700">Allow plus one</span>
              </label>
            </div>

            {formData.plusOneAllowed && (
              <div className="md:col-span-2">
                <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                  Plus One Name
                </label>
                <input
                  type="text"
                  value={formData.plusOneName}
                  onChange={(e) => setFormData({ ...formData, plusOneName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
                  placeholder="Optional"
                />
              </div>
            )}

            {/* Address */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400 resize-none"
              />
            </div>

            {/* Dietary Restrictions */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                Dietary Restrictions
              </label>
              <input
                type="text"
                value={formData.dietaryRestrictions}
                onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
                placeholder="Vegetarian, vegan, gluten-free, etc."
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mb-2 block">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400 resize-none"
                placeholder="Any additional notes about this guest"
              />
            </div>
            </div>
          </div>

          {/* Actions - Fixed Footer inside form */}
          <div className="p-8 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex justify-end gap-3">
              <Button
                data-testid="cancel-button"
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase"
              >
                Cancel
              </Button>
              <Button
                data-testid="submit-guest"
                type="submit"
                disabled={loading}
                className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-6 py-2 text-sm font-light tracking-wider uppercase"
              >
                {loading ? 'Adding...' : 'Add Guest'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}