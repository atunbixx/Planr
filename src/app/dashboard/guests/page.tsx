'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Guest {
  id: string
  name: string
  rsvpStatus: 'pending' | 'accepted' | 'declined'
  mealPreference?: string
  side?: 'bride' | 'groom'
  invitationSent: boolean
  rsvp?: {
    id: string
    status: string
    dateResponded?: string
  }
}

export default function GuestsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    rsvpStatus: 'pending' as const,
    mealPreference: '',
    side: '' as 'bride' | 'groom' | '',
    invitationSent: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load guests on component mount
  useEffect(() => {
    if (user) {
      loadGuests()
    }
  }, [user])

  const loadGuests = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/guests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      if (result.success) {
        setGuests(result.data)
      } else {
        console.error('Failed to load guests:', result.error)
      }
    } catch (error) {
      console.error('Error loading guests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Guest name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/guests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          rsvpStatus: formData.rsvpStatus,
          mealPreference: formData.mealPreference || undefined,
          side: formData.side || undefined,
          invitationSent: formData.invitationSent
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Add new guest to list
        setGuests(prev => [result.data, ...prev])
        
        // Reset form
        setFormData({
          name: '',
          rsvpStatus: 'pending',
          mealPreference: '',
          side: '',
          invitationSent: false
        })
        setShowAddForm(false)
        setErrors({})
      } else {
        setErrors({ submit: result.error?.message || 'Failed to add guest' })
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' })
    }
  }

  const getRsvpStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-100'
      case 'declined':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getSideColor = (side?: string) => {
    switch (side) {
      case 'bride':
        return 'text-pink-600 bg-pink-100'
      case 'groom':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading guests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Guest List</h1>
              <p className="text-sm text-gray-600">
                Manage your wedding guests and RSVPs ({guests.length} total)
              </p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Cancel' : 'Add Guest'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Guest Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Guest</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Guest name *"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="John Doe"
                    required
                  />

                  <div>
                    <label htmlFor="rsvpStatus" className="block text-sm font-medium text-gray-700">
                      RSVP Status
                    </label>
                    <select
                      id="rsvpStatus"
                      name="rsvpStatus"
                      value={formData.rsvpStatus}
                      onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  <Input
                    label="Meal preference"
                    type="text"
                    name="mealPreference"
                    value={formData.mealPreference}
                    onChange={handleChange}
                    placeholder="Vegetarian, Gluten-free, etc."
                  />

                  <div>
                    <label htmlFor="side" className="block text-sm font-medium text-gray-700">
                      Side
                    </label>
                    <select
                      id="side"
                      name="side"
                      value={formData.side}
                      onChange={handleChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select side</option>
                      <option value="bride">Bride's side</option>
                      <option value="groom">Groom's side</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    id="invitationSent"
                    name="invitationSent"
                    type="checkbox"
                    checked={formData.invitationSent}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="invitationSent" className="ml-2 block text-sm text-gray-900">
                    Invitation sent
                  </label>
                </div>

                {errors.submit && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                    {errors.submit}
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1">
                    Add Guest
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Guest List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Guests</CardTitle>
          </CardHeader>
          <CardContent>
            {guests.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No guests yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first wedding guest.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowAddForm(true)}>Add Guest</Button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RSVP Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Side
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meal Preference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invitation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guests.map((guest) => (
                      <tr key={guest.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {guest.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRsvpStatusColor(guest.rsvpStatus)}`}>
                            {guest.rsvpStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {guest.side ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSideColor(guest.side)}`}>
                              {guest.side}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {guest.mealPreference || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            guest.invitationSent 
                              ? 'text-green-600 bg-green-100' 
                              : 'text-gray-600 bg-gray-100'
                          }`}>
                            {guest.invitationSent ? 'Sent' : 'Not sent'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}