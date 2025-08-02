'use client'

import { useState } from 'react'
import { useGuests, GUEST_CATEGORIES, RSVP_STATUSES } from '@/hooks/useGuests'
import { useToastContext } from '@/contexts/ToastContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { cn } from '@/utils/cn'
import { GuestCategory, RSVPStatus } from '@/types/database'
import { MealPreferences } from '@/components/guests/MealPreferences'

export default function GuestsPage() {
  const { 
    guests, 
    loading, 
    error, 
    guestStats, 
    addGuest, 
    updateGuest, 
    deleteGuest,
    updateRSVP,
    sendInvitation,
    refreshGuests 
  } = useGuests()
  const { addToast } = useToastContext()

  const [isAddingGuest, setIsAddingGuest] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<GuestCategory | 'all'>('all')
  const [selectedRSVP, setSelectedRSVP] = useState<RSVPStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'guests' | 'meals'>('guests')

  // Filter guests based on selection
  const filteredGuests = guests.filter(guest => {
    const matchesCategory = selectedCategory === 'all' || guest.category === selectedCategory
    const matchesRSVP = selectedRSVP === 'all' || guest.rsvp_status === selectedRSVP
    const matchesSearch = searchQuery === '' || 
      guest.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${guest.first_name} ${guest.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesRSVP && matchesSearch
  })

  // Add guest form component
  const AddGuestForm = () => {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      category: 'friends' as GuestCategory,
      rsvp_status: 'pending' as RSVPStatus,
      address: '',
      city: '',
      state: '',
      zip_code: '',
      is_adult: true,
      plus_one_allowed: false,
      plus_one_name: '',
      dietary_restrictions: '',
      accessibility_needs: '',
      relationship_to_couple: '',
      notes: '',
      meal_preference: 'standard' as string,
      dietary_allergies: '',
      meal_notes: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
      setFormData(prev => ({ ...prev, [field]: value }))
      // Clear error for this field
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: '' }))
      }
    }

    const validateForm = () => {
      const errors: Record<string, string> = {}
      
      if (!formData.first_name.trim()) {
        errors.first_name = 'First name is required'
      }
      
      if (!formData.last_name.trim()) {
        errors.last_name = 'Last name is required'
      }
      
      if (!formData.category) {
        errors.category = 'Category is required'
      }

      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Invalid email format'
      }

      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)
      
      try {
        const newGuest = await addGuest({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          category: formData.category,
          rsvp_status: formData.rsvp_status,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip_code: formData.zip_code.trim() || null,
          is_adult: formData.is_adult,
          plus_one_allowed: formData.plus_one_allowed,
          plus_one_name: formData.plus_one_name.trim() || null,
          dietary_restrictions: formData.dietary_restrictions.trim() || null,
          accessibility_needs: formData.accessibility_needs.trim() || null,
          relationship_to_couple: formData.relationship_to_couple.trim() || null,
          relationship_notes: formData.notes.trim() || null,
          meal_preference: formData.meal_preference,
          dietary_allergies: formData.dietary_allergies ? formData.dietary_allergies.split(',').map(a => a.trim()) : null,
          meal_notes: formData.meal_notes.trim() || null,
        })
        
        // Show success toast
        addToast({
          title: 'Guest Added',
          description: `${formData.first_name} ${formData.last_name} has been added to your guest list.`,
          type: 'success'
        })
        
        // Reset form and close
        setFormData({
          first_name: '', last_name: '', email: '', phone: '', category: 'friends',
          rsvp_status: 'pending', address: '', city: '', state: '', zip_code: '',
          is_adult: true, plus_one_allowed: false, plus_one_name: '',
          dietary_restrictions: '', accessibility_needs: '', relationship_to_couple: '', notes: '',
          meal_preference: 'standard', dietary_allergies: '', meal_notes: ''
        })
        setIsAddingGuest(false)
        
      } catch (error: any) {
        console.error('Failed to add guest:', error)
        setFormErrors({ general: error.message || 'Failed to add guest' })
      } finally {
        setIsSubmitting(false)
      }
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Guest</CardTitle>
          <CardDescription>
            Add a guest to your wedding invitation list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formErrors.general && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {formErrors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                error={formErrors.first_name}
                placeholder="e.g., Emma"
                fullWidth
                disabled={isSubmitting}
              />

              <Input
                label="Last Name"
                value={formData.last_name}
                onChange={handleChange('last_name')}
                error={formErrors.last_name}
                placeholder="e.g., Davis"
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email (Optional)"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={formErrors.email}
                placeholder="e.g., emma.davis@email.com"
                fullWidth
                disabled={isSubmitting}
              />

              <Input
                label="Phone (Optional)"
                value={formData.phone}
                onChange={handleChange('phone')}
                error={formErrors.phone}
                placeholder="e.g., (555) 123-4567"
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={formData.category}
                onChange={handleChange('category')}
                error={formErrors.category}
                fullWidth
                disabled={isSubmitting}
              >
                {GUEST_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </Select>

              <Select
                label="RSVP Status"
                value={formData.rsvp_status}
                onChange={handleChange('rsvp_status')}
                error={formErrors.rsvp_status}
                fullWidth
                disabled={isSubmitting}
              >
                {RSVP_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Relationship to Couple"
                value={formData.relationship_to_couple}
                onChange={handleChange('relationship_to_couple')}
                error={formErrors.relationship_to_couple}
                placeholder="e.g., College friend, Sister, Coworker"
                fullWidth
                disabled={isSubmitting}
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_adult}
                    onChange={handleChange('is_adult')}
                    disabled={isSubmitting}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Adult (18+)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.plus_one_allowed}
                    onChange={handleChange('plus_one_allowed')}
                    disabled={isSubmitting}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Plus One Allowed</span>
                </label>
              </div>
            </div>

            {formData.plus_one_allowed && (
              <Input
                label="Plus One Name (Optional)"
                value={formData.plus_one_name}
                onChange={handleChange('plus_one_name')}
                placeholder="e.g., John Smith"
                fullWidth
                disabled={isSubmitting}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Dietary Restrictions (Optional)"
                value={formData.dietary_restrictions}
                onChange={handleChange('dietary_restrictions')}
                placeholder="e.g., Vegetarian, Gluten-free"
                fullWidth
                disabled={isSubmitting}
              />

              <Input
                label="Accessibility Needs (Optional)"
                value={formData.accessibility_needs}
                onChange={handleChange('accessibility_needs')}
                placeholder="e.g., Wheelchair accessible"
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Meal Preference"
                value={formData.meal_preference}
                onChange={handleChange('meal_preference')}
                fullWidth
                disabled={isSubmitting}
              >
                <option value="standard">Standard</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="gluten_free">Gluten Free</option>
                <option value="kids_meal">Kids Meal</option>
                <option value="vendor_meal">Vendor Meal</option>
                <option value="no_meal">No Meal</option>
              </Select>

              <Input
                label="Dietary Allergies (comma-separated)"
                value={formData.dietary_allergies}
                onChange={handleChange('dietary_allergies')}
                placeholder="e.g., nuts, shellfish, dairy"
                fullWidth
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Notes (Optional)"
              value={formData.notes}
              onChange={handleChange('notes')}
              placeholder="Any additional notes about this guest..."
              fullWidth
              disabled={isSubmitting}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Guest...' : 'Add Guest'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddingGuest(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  const handleBulkInvitation = async () => {
    if (selectedGuests.length === 0) return
    
    try {
      await sendInvitation(selectedGuests)
      setSelectedGuests([])
      
      // Show success toast
      addToast({
        title: 'Invitations Sent',
        description: `Successfully sent invitations to ${selectedGuests.length} guests.`,
        type: 'success'
      })
    } catch (error: any) {
      console.error('Failed to send invitations:', error)
      addToast({
        title: 'Error',
        description: 'Failed to send invitations. Please try again.',
        type: 'error'
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold text-ink">Guests</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your guest list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Guests</h1>
          <p className="text-gray-600 mt-1">Manage your wedding guest list and RSVPs</p>
        </div>
        <div className="flex gap-3">
          {selectedGuests.length > 0 && (
            <Button variant="secondary" onClick={handleBulkInvitation}>
              Send Invitations ({selectedGuests.length})
            </Button>
          )}
          <Button onClick={() => setIsAddingGuest(true)} disabled={isAddingGuest}>
            Add Guest
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-red-700">{error}</p>
              <Button variant="secondary" size="sm" onClick={refreshGuests} className="ml-auto">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={activeTab === 'guests' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('guests')}
          className={cn(
            "px-4 py-2",
            activeTab === 'guests' && "bg-white shadow-sm"
          )}
        >
          Guest List
        </Button>
        <Button
          variant={activeTab === 'meals' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('meals')}
          className={cn(
            "px-4 py-2",
            activeTab === 'meals' && "bg-white shadow-sm"
          )}
        >
          Meal Preferences
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'guests' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-ink">{guestStats.totalGuests}</div>
            <p className="text-xs text-gray-500">Total Guests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{guestStats.attendingGuests}</div>
            <p className="text-xs text-gray-500">Attending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{guestStats.pendingResponses}</div>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-accent">{guestStats.totalMealsNeeded}</div>
            <p className="text-xs text-gray-500">Meals Needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Guest Form */}
      {isAddingGuest && <AddGuestForm />}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search Guests"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              fullWidth
            />
            
            <Select
              label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as GuestCategory | 'all')}
              fullWidth
            >
              <option value="all">All Categories</option>
              {GUEST_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </Select>

            <Select
              label="Filter by RSVP"
              value={selectedRSVP}
              onChange={(e) => setSelectedRSVP(e.target.value as RSVPStatus | 'all')}
              fullWidth
            >
              <option value="all">All RSVP Status</option>
              {RSVP_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Guests List */}
      {filteredGuests.length > 0 ? (
        <div className="grid gap-4">
          {filteredGuests.map((guest) => {
            const category = GUEST_CATEGORIES.find(c => c.value === guest.category)
            const rsvpStatus = RSVP_STATUSES.find(s => s.value === guest.rsvp_status)
            
            return (
              <Card key={guest.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(guest.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGuests(prev => [...prev, guest.id])
                            } else {
                              setSelectedGuests(prev => prev.filter(id => id !== guest.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${category?.color}20` }}
                        >
                          {category?.icon}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-ink">
                          {guest.first_name} {guest.last_name}
                        </h3>
                        {guest.relationship_to_couple && (
                          <p className="text-sm text-gray-600">{guest.relationship_to_couple}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{category?.label}</span>
                          <span 
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${rsvpStatus?.color}20`,
                              color: rsvpStatus?.color 
                            }}
                          >
                            {rsvpStatus?.label}
                          </span>
                          {guest.is_adult ? (
                            <span>👤 Adult</span>
                          ) : (
                            <span>👶 Child</span>
                          )}
                          {guest.plus_one_allowed && (
                            <span>➕ Plus One</span>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-2">
                          {guest.email && (
                            <a 
                              href={`mailto:${guest.email}`}
                              className="text-xs text-accent hover:underline"
                            >
                              Email
                            </a>
                          )}
                          {guest.phone && (
                            <a 
                              href={`tel:${guest.phone}`}
                              className="text-xs text-accent hover:underline"
                            >
                              Call
                            </a>
                          )}
                        </div>
                        
                        {guest.dietary_restrictions && (
                          <p className="text-sm text-gray-600 mt-2">
                            🍽️ Dietary: {guest.dietary_restrictions}
                          </p>
                        )}
                        
                        {guest.plus_one_name && (
                          <p className="text-sm text-gray-600 mt-1">
                            ➕ Plus One: {guest.plus_one_name}
                          </p>
                        )}
                        
                        {guest.invite_code && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                            <p className="font-medium text-gray-700">RSVP Code: {guest.invite_code}</p>
                            <a 
                              href={`/rsvp/${guest.invite_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              View RSVP Page →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={async () => {
                          if (confirm('Are you sure you want to remove this guest?')) {
                            try {
                              await deleteGuest(guest.id)
                              addToast({
                                title: 'Guest Removed',
                                description: `${guest.first_name} ${guest.last_name} has been removed from your guest list.`,
                                type: 'success'
                              })
                            } catch (error) {
                              addToast({
                                title: 'Error',
                                description: 'Failed to remove guest. Please try again.',
                                type: 'error'
                              })
                            }
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : guests.length > 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500">No guests match your current filters.</p>
            <Button 
              variant="secondary" 
              onClick={() => {
                setSelectedCategory('all')
                setSelectedRSVP('all')
                setSearchQuery('')
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <span className="text-6xl mb-4 block">👥</span>
            <h3 className="text-lg font-semibold text-ink mb-2">No guests yet</h3>
            <p className="text-gray-500 mb-4">
              Start building your guest list by adding your first guest.
            </p>
            <Button onClick={() => setIsAddingGuest(true)}>
              Add Your First Guest
            </Button>
          </CardContent>
        </Card>
      )}
        </>
      ) : (
        /* Meal Preferences Tab */
        <MealPreferences />
      )}
    </div>
  )
}