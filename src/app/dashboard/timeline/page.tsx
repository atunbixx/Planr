"use client"

import { useEffect, useState } from 'react'
import PremiumDashboardLayout from '@/components/layout/PremiumDashboardLayout'
import { Clock, MapPin, Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AuthClient from '@/lib/auth/client'
import { Button } from '@/components/ui/button'

type TimelineEvent = {
  id: string
  time: string
  title: string
  description?: string
  category?: string
  duration?: number
  location?: string
}

export default function TimelinePage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)

  const [formData, setFormData] = useState({
    time: '',
    title: '',
    description: '',
    category: '',
    duration: '',
    location: ''
  })

  useEffect(() => {
    if (!user) return
    loadEvents()
  }, [user])

  const loadEvents = async () => {
    try {
      const token = AuthClient.getToken()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const response = await fetch('/api/dashboard/timeline', { headers })
      const result = await response.json()
      
      if (result.success) {
        setEvents(result.data.events || [])
      } else {
        console.error('Timeline API error:', result)
        setError(result.error?.message || 'Failed to load timeline')
      }
    } catch (err) {
      console.error('Timeline fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load timeline')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.time || !formData.title) return

    try {
      const token = AuthClient.getToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const payload = {
        time: formData.time,
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category || undefined,
        duration: formData.duration ? Number(formData.duration) : undefined,
        location: formData.location || undefined
      }

      const url = editingEvent 
        ? `/api/dashboard/timeline/${editingEvent.id}`
        : '/api/dashboard/timeline'
      
      const method = editingEvent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      
      if (result.success) {
        await loadEvents()
        resetForm()
      } else {
        setError(result.error?.message || 'Failed to save event')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    }
  }

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event)
    setFormData({
      time: event.time,
      title: event.title,
      description: event.description || '',
      category: event.category || '',
      duration: event.duration?.toString() || '',
      location: event.location || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const token = AuthClient.getToken()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`/api/dashboard/timeline/${eventId}`, {
        method: 'DELETE',
        headers
      })

      const result = await response.json()
      
      if (result.success) {
        await loadEvents()
      } else {
        setError(result.error?.message || 'Failed to delete event')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
    }
  }

  const resetForm = () => {
    setFormData({
      time: '',
      title: '',
      description: '',
      category: '',
      duration: '',
      location: ''
    })
    setShowAddForm(false)
    setEditingEvent(null)
  }

  const formatTime = (time: string) => {
    try {
      const date = new Date(`2000-01-01T${time}`)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return time
    }
  }

  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time))

  if (loading) {
    return (
      <PremiumDashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-dark dark:text-white">Wedding Timeline</h1>
          <div className="mt-4 text-dark-6">Loading timeline...</div>
        </div>
      </PremiumDashboardLayout>
    )
  }

  return (
    <PremiumDashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark dark:text-white">Wedding Timeline</h1>
            <p className="text-dark-6 dark:text-dark-4 mt-2">
              Plan your perfect wedding day with a detailed timeline of events.
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-dark-2 rounded-lg border border-stroke dark:border-dark-3 p-6">
            <h2 className="text-lg font-semibold text-dark dark:text-white mb-4">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-stroke dark:border-dark-3 rounded-lg bg-white dark:bg-dark-2 text-dark dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-stroke dark:border-dark-3 rounded-lg bg-white dark:bg-dark-2 text-dark dark:text-white"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stroke dark:border-dark-3 rounded-lg bg-white dark:bg-dark-2 text-dark dark:text-white"
                  placeholder="Ceremony, Reception, Photos..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-stroke dark:border-dark-3 rounded-lg bg-white dark:bg-dark-2 text-dark dark:text-white"
                  >
                    <option value="">Select category</option>
                    <option value="ceremony">Ceremony</option>
                    <option value="reception">Reception</option>
                    <option value="photos">Photos</option>
                    <option value="preparation">Preparation</option>
                    <option value="transportation">Transportation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-stroke dark:border-dark-3 rounded-lg bg-white dark:bg-dark-2 text-dark dark:text-white"
                    placeholder="Church, Reception Hall..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stroke dark:border-dark-3 rounded-lg bg-white dark:bg-dark-2 text-dark dark:text-white"
                  rows={3}
                  placeholder="Additional details about this event..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Timeline Events */}
        <div className="bg-white dark:bg-dark-2 rounded-lg border border-stroke dark:border-dark-3">
          <div className="p-6 border-b border-stroke dark:border-dark-3">
            <h2 className="text-lg font-semibold text-dark dark:text-white">Timeline Events</h2>
          </div>
          
          {sortedEvents.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-dark-6 dark:text-dark-4">No events scheduled yet.</p>
              <p className="text-sm text-dark-6 dark:text-dark-4 mt-1">
                Add your first event to start planning your wedding timeline.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stroke dark:divide-dark-3">
              {sortedEvents.map((event) => (
                <div key={event.id} className="p-6 flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-dark dark:text-white">
                          {event.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-dark-6 dark:text-dark-4">
                          <span className="font-medium">{formatTime(event.time)}</span>
                          {event.duration && (
                            <span>({event.duration} min)</span>
                          )}
                          {event.category && (
                            <span className="capitalize bg-gray-100 dark:bg-dark-3 px-2 py-1 rounded">
                              {event.category}
                            </span>
                          )}
                        </div>
                        {event.location && (
                          <div className="flex items-center mt-2 text-sm text-dark-6 dark:text-dark-4">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.description && (
                          <p className="mt-2 text-sm text-dark-6 dark:text-dark-4">
                            {event.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PremiumDashboardLayout>
  )
}
