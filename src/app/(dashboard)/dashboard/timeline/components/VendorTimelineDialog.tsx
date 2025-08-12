'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Phone, Mail, Calendar, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  location?: string
  category: string
  vendorIds: string[]
  status: string
  priority: string
}

interface Vendor {
  id: string
  name: string
  category: string
  contactName?: string
  phone?: string
  email?: string
  status: string
}

interface VendorTimelineDialogProps {
  vendors: Vendor[]
  events: TimelineEvent[]
  selectedDate: string
  onEventUpdate: (event: TimelineEvent) => void
}

export default function VendorTimelineDialog({ 
  vendors, 
  events, 
  selectedDate,
  onEventUpdate 
}: VendorTimelineDialogProps) {
  
  // Group events by vendor
  const vendorSchedules = vendors.map(vendor => {
    const vendorEvents = events
      .filter(event => {
        const eventDate = new Date(event.startTime).toDateString()
        const filterDate = new Date(selectedDate).toDateString()
        return eventDate === filterDate && event.vendorIds.includes(vendor.id)
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    
    return {
      vendor,
      events: vendorEvents,
      earliestArrival: vendorEvents[0]?.startTime,
      latestDeparture: vendorEvents[vendorEvents.length - 1]?.endTime || vendorEvents[vendorEvents.length - 1]?.startTime
    }
  }).filter(schedule => schedule.events.length > 0)

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      photography: '📸',
      videography: '🎥',
      catering: '🍽️',
      flowers: '🌺',
      music: '🎵',
      venue: '🏛️',
      coordination: '📋',
      hair_makeup: '💄',
      transportation: '🚗',
      cake: '🎂',
      other: '🔧'
    }
    return icons[category] || icons.other
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (vendorSchedules.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-light mb-2">No vendor schedules for this date</p>
          <p className="text-sm text-gray-400">Create timeline events and assign vendors to see their schedules</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Schedules - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
          <CardDescription>
            Individual vendor timelines and coordination details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vendorSchedules.map(({ vendor, events, earliestArrival, latestDeparture }) => (
              <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                {/* Vendor Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(vendor.category)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{vendor.name}</h3>
                      <p className="text-sm text-gray-500">{vendor.category}</p>
                      {vendor.contactName && (
                        <p className="text-xs text-gray-400">Contact: {vendor.contactName}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {events.length} event{events.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Vendor Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Phone className="h-3 w-3" />
                      {vendor.phone}
                    </a>
                  )}
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 hover:text-blue-600">
                      <Mail className="h-3 w-3" />
                      {vendor.email}
                    </a>
                  )}
                </div>

                {/* Vendor Schedule Summary */}
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Arrival Time:</span>
                    <span className="font-medium">{formatTime(earliestArrival)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-600">Departure Time:</span>
                    <span className="font-medium">{formatTime(latestDeparture)}</span>
                  </div>
                </div>

                {/* Event Timeline */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Schedule Details</h4>
                  {events.map((event, index) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          event.priority === 'high' ? 'bg-red-500' :
                          event.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        )} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(event.startTime)}
                                {event.endTime && ` - ${formatTime(event.endTime)}`}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                          {event.priority === 'high' && (
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs text-gray-600">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Send Schedule Button */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // TODO: Implement send schedule functionality
                      console.log('Send schedule to vendor:', vendor.id)
                    }}
                  >
                    Send Schedule to Vendor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coordination Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Coordination</CardTitle>
          <CardDescription>
            Important coordination notes and reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overlap Warnings */}
            {vendors.map(vendor => {
              const vendorEvents = events.filter(e => 
                e.vendorIds.includes(vendor.id) && 
                new Date(e.startTime).toDateString() === new Date(selectedDate).toDateString()
              )
              
              // Check for overlapping events
              const overlaps = vendorEvents.filter((event, index) => {
                return vendorEvents.some((otherEvent, otherIndex) => {
                  if (index === otherIndex) return false
                  const start1 = new Date(event.startTime).getTime()
                  const end1 = event.endTime ? new Date(event.endTime).getTime() : start1
                  const start2 = new Date(otherEvent.startTime).getTime()
                  const end2 = otherEvent.endTime ? new Date(otherEvent.endTime).getTime() : start2
                  
                  return (start1 < end2 && end1 > start2)
                })
              })

              if (overlaps.length > 0) {
                return (
                  <div key={vendor.id} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Schedule Conflict - {vendor.name}</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This vendor has overlapping events. Please review the schedule.
                      </p>
                    </div>
                  </div>
                )
              }
              return null
            }).filter(Boolean)}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{vendorSchedules.length}</p>
                <p className="text-xs text-gray-600">Active Vendors</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {events.filter(e => 
                    new Date(e.startTime).toDateString() === new Date(selectedDate).toDateString()
                  ).length}
                </p>
                <p className="text-xs text-gray-600">Total Events</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {events.filter(e => 
                    e.priority === 'high' && 
                    new Date(e.startTime).toDateString() === new Date(selectedDate).toDateString()
                  ).length}
                </p>
                <p className="text-xs text-gray-600">High Priority</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {events.filter(e => 
                    e.status === 'confirmed' && 
                    new Date(e.startTime).toDateString() === new Date(selectedDate).toDateString()
                  ).length}
                </p>
                <p className="text-xs text-gray-600">Confirmed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}