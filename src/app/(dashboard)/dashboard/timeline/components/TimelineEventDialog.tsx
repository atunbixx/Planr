'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react'
import { toast } from 'sonner'

interface TimelineEvent {
  id?: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  duration?: number
  location?: string
  category: string
  vendorIds: string[]
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  notes?: string
}

interface Vendor {
  id: string
  name: string
  category: string
  contactName?: string
}

interface TimelineEventDialogProps {
  event?: TimelineEvent
  vendors: Vendor[]
  onSave: (event: TimelineEvent) => void
  children: React.ReactNode
}

export default function TimelineEventDialog({ event, vendors, onSave, children }: TimelineEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [eventData, setEventData] = useState<TimelineEvent>({
    title: '',
    description: '',
    startTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    endTime: '',
    location: '',
    category: 'ceremony',
    vendorIds: [],
    status: 'scheduled',
    priority: 'medium',
    notes: '',
    ...event
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // Validate required fields
      if (!eventData.title.trim()) {
        toast.error('Please enter an event title')
        return
      }
      
      if (!eventData.startTime) {
        toast.error('Please select a start time')
        return
      }

      // Calculate duration if end time is provided
      let duration = eventData.duration
      if (eventData.endTime && eventData.startTime) {
        const start = new Date(eventData.startTime)
        const end = new Date(eventData.endTime)
        duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
      }

      const eventToSave = {
        ...eventData,
        duration: duration || undefined,
        id: event?.id
      }

      // TODO: Make API call to save event
      const response = await fetch('/api/timeline/events', {
        method: event?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventToSave)
      })

      if (!response.ok) {
        throw new Error('Failed to save event')
      }

      const savedEvent = await response.json()
      onSave(savedEvent.data)
      setOpen(false)
      
      // Reset form for new events
      if (!event?.id) {
        setEventData({
          title: '',
          description: '',
          startTime: new Date().toISOString().slice(0, 16),
          endTime: '',
          location: '',
          category: 'ceremony',
          vendorIds: [],
          status: 'scheduled',
          priority: 'medium',
          notes: ''
        })
      }
    } catch (error) {
      console.error('Error saving event:', error)
      toast.error('Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  const toggleVendor = (vendorId: string) => {
    setEventData(prev => ({
      ...prev,
      vendorIds: prev.vendorIds.includes(vendorId)
        ? prev.vendorIds.filter(id => id !== vendorId)
        : [...prev.vendorIds, vendorId]
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const eventCategories = [
    { value: 'ceremony', label: 'Ceremony', icon: '💒' },
    { value: 'reception', label: 'Reception', icon: '🎉' },
    { value: 'photos', label: 'Photography', icon: '📸' },
    { value: 'preparation', label: 'Preparation', icon: '💄' },
    { value: 'transportation', label: 'Transportation', icon: '🚗' },
    { value: 'catering', label: 'Catering', icon: '🍽️' },
    { value: 'music', label: 'Music/Entertainment', icon: '🎵' },
    { value: 'flowers', label: 'Flowers/Decor', icon: '🌺' },
    { value: 'other', label: 'Other', icon: '📋' }
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {event?.id ? 'Edit Timeline Event' : 'Add Timeline Event'}
          </DialogTitle>
          <DialogDescription>
            Create and manage wedding day events with vendor coordination
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Status */}
          {event?.id && (
            <div className="flex gap-2">
              <Badge className={getStatusColor(eventData.status)}>
                {eventData.status.replace('_', ' ')}
              </Badge>
              <Badge variant={eventData.priority === 'high' ? 'destructive' : 'secondary'}>
                {eventData.priority} priority
              </Badge>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={eventData.title}
                onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Wedding Ceremony, First Dance, Cake Cutting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={eventData.description || ''}
                onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this event..."
                rows={2}
              />
            </div>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={eventData.category} onValueChange={(value) => setEventData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={eventData.priority} onValueChange={(value: any) => setEventData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={eventData.startTime}
                  onChange={(e) => setEventData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Optional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={eventData.endTime || ''}
                  onChange={(e) => setEventData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  value={eventData.location || ''}
                  onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location or venue area"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label>Assigned Vendors</Label>
            <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              {vendors.length > 0 ? (
                <div className="space-y-3">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={eventData.vendorIds.includes(vendor.id)}
                          onCheckedChange={() => toggleVendor(vendor.id)}
                        />
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-sm text-gray-500">{vendor.category}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {vendor.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No vendors available</p>
                  <p className="text-xs text-gray-400">Add vendors to assign them to events</p>
                </div>
              )}
            </div>
            
            {/* Selected vendors preview */}
            {eventData.vendorIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {eventData.vendorIds.map(vendorId => {
                  const vendor = vendors.find(v => v.id === vendorId)
                  return vendor ? (
                    <Badge key={vendorId} variant="secondary" className="flex items-center gap-1">
                      {vendor.name}
                      <button
                        onClick={() => toggleVendor(vendorId)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Status (for existing events) */}
          {event?.id && (
            <div className="space-y-2">
              <Label htmlFor="status">Event Status</Label>
              <Select value={eventData.status} onValueChange={(value: any) => setEventData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={eventData.notes || ''}
              onChange={(e) => setEventData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Special instructions, vendor coordination notes, or reminders..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : event?.id ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}