'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AddGuestDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    relationship: '',
    side: 'both',
    plus_one_allowed: false,
    plus_one_name: '',
    dietary_restrictions: '',
    notes: '',
    rsvp_deadline: ''
  })
  const router = useRouter()

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

    try {
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address: '',
          relationship: '',
          side: 'both',
          plus_one_allowed: false,
          plus_one_name: '',
          dietary_restrictions: '',
          notes: '',
          rsvp_deadline: ''
        })
        router.refresh()
      } else {
        const error = await response.json()
        console.error('Error creating guest:', error)
        alert('Failed to create guest. Please try again.')
      }
    } catch (error) {
      console.error('Error creating guest:', error)
      alert('Failed to create guest. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Guest</DialogTitle>
          <DialogDescription>
            Add a guest to your wedding invitation list.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="guest@email.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address for save-the-dates and invitations"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((relationship) => (
                    <SelectItem key={relationship} value={relationship.toLowerCase()}>
                      {relationship}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="side">Side</Label>
              <Select
                value={formData.side}
                onValueChange={(value) => setFormData({ ...formData, side: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="bride">Bride's Side</SelectItem>
                  <SelectItem value="groom">Groom's Side</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="plus_one_allowed"
                checked={formData.plus_one_allowed}
                onCheckedChange={(checked) => setFormData({ ...formData, plus_one_allowed: Boolean(checked) })}
              />
              <Label htmlFor="plus_one_allowed">Allow plus one</Label>
            </div>
            
            {formData.plus_one_allowed && (
              <div>
                <Label htmlFor="plus_one_name">Plus One Name (Optional)</Label>
                <Input
                  id="plus_one_name"
                  value={formData.plus_one_name}
                  onChange={(e) => setFormData({ ...formData, plus_one_name: e.target.value })}
                  placeholder="Name of plus one if known"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
            <Textarea
              id="dietary_restrictions"
              value={formData.dietary_restrictions}
              onChange={(e) => setFormData({ ...formData, dietary_restrictions: e.target.value })}
              placeholder="Any dietary restrictions or allergies"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
            <Input
              id="rsvp_deadline"
              type="date"
              value={formData.rsvp_deadline}
              onChange={(e) => setFormData({ ...formData, rsvp_deadline: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this guest"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Guest'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}