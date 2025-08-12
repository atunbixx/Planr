'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Plus, 
  Edit,
  Share2,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import TimelineEventDialog from './components/TimelineEventDialog'
import VendorTimelineDialog from './components/VendorTimelineDialog'

interface TimelineEvent {
  id: string
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
  createdAt: string
  updatedAt: string
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

export default function TimelinePage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [activeTab, setActiveTab] = useState('timeline')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)

  // Load timeline data
  useEffect(() => {
    loadTimelineData()
    loadVendors()
  }, [])

  const loadTimelineData = async () => {
    try {
      const response = await fetch('/api/timeline/events')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEvents(data.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to load timeline:', error)
      toast.error('Failed to load timeline events')
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setVendors(data.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to load vendors:', error)
    }
  }

  const handleEventSave = (event: TimelineEvent) => {
    setEvents(prev => {
      const existing = prev.findIndex(e => e.id === event.id)
      if (existing >= 0) {
        return prev.map(e => e.id === event.id ? event : e)
      }
      return [...prev, event]
    })
    setIsAddingEvent(false)
    setEditingEvent(null)
    toast.success('Timeline event saved successfully!')
  }

  const handleEventDelete = async (eventId: string) => {
    try {
      const response = await fetch(`/api/timeline/events/${eventId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId))
        toast.success('Event deleted successfully')
      }
    } catch (error) {
      toast.error('Failed to delete event')
    }
  }

  const shareTimeline = async () => {
    try {
      const response = await fetch('/api/timeline/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      })
      
      if (response.ok) {
        const data = await response.json()
        navigator.clipboard.writeText(data.shareUrl)
        toast.success('Timeline link copied to clipboard!')
      }
    } catch (error) {
      toast.error('Failed to create share link')
    }
  }

  const exportTimeline = () => {
    const csvContent = [
      ['Event', 'Time', 'Duration', 'Location', 'Vendors', 'Status', 'Notes'],
      ...events.map(event => [
        event.title,
        `${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}`,
        event.duration ? `${event.duration} min` : '',
        event.location || '',
        event.vendorIds.map(id => vendors.find(v => v.id === id)?.name).filter(Boolean).join(', '),
        event.status,
        event.notes || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wedding-timeline-${selectedDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Timeline exported!')
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      default: return 'border-gray-200 bg-white'
    }
  }

  // Group events by time for timeline view
  const sortedEvents = events
    .filter(event => {
      const eventDate = new Date(event.startTime).toDateString()
      const filterDate = new Date(selectedDate).toDateString()
      return eventDate === filterDate
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  if (loading) {
    return (
      <div className="px-8 py-12">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="h-32 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Wedding Timeline</h1>
            <p className="text-lg font-light text-gray-600">Coordinate your vendors and manage your wedding day schedule</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={shareTimeline} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Timeline
            </Button>
            <Button onClick={exportTimeline} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <TimelineEventDialog
              vendors={vendors}
              onSave={handleEventSave}
            >
              <Button className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </TimelineEventDialog>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Select Date
              </CardTitle>
              <CardDescription>Choose the date to view and manage timeline events</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-sm text-sm font-light focus:outline-none focus:border-gray-400"
          />
        </CardContent>
      </Card>

      {/* Timeline Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-sm shadow-sm">
          <TabsTrigger value="timeline" className="rounded-sm font-light tracking-wide uppercase text-xs data-[state=active]:bg-[#7a9b7f] data-[state=active]:text-white">
            Timeline View
          </TabsTrigger>
          <TabsTrigger value="vendors" className="rounded-sm font-light tracking-wide uppercase text-xs data-[state=active]:bg-[#7a9b7f] data-[state=active]:text-white">
            Vendor Schedule
          </TabsTrigger>
          <TabsTrigger value="summary" className="rounded-sm font-light tracking-wide uppercase text-xs data-[state=active]:bg-[#7a9b7f] data-[state=active]:text-white">
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Timeline - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
              <CardDescription>Chronological view of all wedding day events</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedEvents.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {sortedEvents.map((event, index) => {
                      const startTime = new Date(event.startTime)
                      const endTime = event.endTime ? new Date(event.endTime) : null
                      const eventVendors = vendors.filter(v => event.vendorIds.includes(v.id))
                      
                      return (
                        <div key={event.id} className="relative flex items-start gap-6">
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute left-6 w-5 h-5 rounded-full border-2 bg-white z-10",
                            event.status === 'completed' ? "border-green-600" :
                            event.status === 'confirmed' ? "border-blue-600" :
                            event.status === 'in_progress' ? "border-yellow-600" :
                            event.status === 'cancelled' ? "border-red-600" :
                            "border-gray-300"
                          )}>
                            {event.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-600 absolute inset-0 m-auto" />}
                            {event.priority === 'high' && <AlertCircle className="w-3 h-3 text-red-600 absolute inset-0 m-auto" />}
                          </div>
                          
                          {/* Event card */}
                          <div className="flex-1 ml-12">
                            <div className={cn(
                              "p-4 rounded-sm border transition-all",
                              getPriorityColor(event.priority)
                            )}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-normal text-gray-900">{event.title}</h3>
                                    <Badge className={cn("text-xs font-light", getStatusColor(event.status))}>
                                      {event.status.replace('_', ' ')}
                                    </Badge>
                                    {event.priority === 'high' && (
                                      <Badge variant="destructive" className="text-xs font-light">
                                        High Priority
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-light text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {endTime && ` - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                      </span>
                                    </div>
                                    
                                    {event.location && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{event.location}</span>
                                      </div>
                                    )}
                                    
                                    {eventVendors.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>{eventVendors.map(v => v.name).join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {event.description && (
                                    <p className="text-sm font-light text-gray-500 mt-2">{event.description}</p>
                                  )}
                                  
                                  {event.notes && (
                                    <p className="text-xs font-light text-gray-400 mt-2 italic">{event.notes}</p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <TimelineEventDialog
                                    event={event}
                                    vendors={vendors}
                                    onSave={handleEventSave}
                                  >
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TimelineEventDialog>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-light mb-4">No events scheduled for this date</p>
                  <TimelineEventDialog
                    vendors={vendors}
                    onSave={handleEventSave}
                  >
                    <Button className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white">
                      Create First Event
                    </Button>
                  </TimelineEventDialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Schedule */}
        <TabsContent value="vendors" className="space-y-6">
          <VendorTimelineDialog
            vendors={vendors}
            events={events}
            selectedDate={selectedDate}
            onEventUpdate={handleEventSave}
          />
        </TabsContent>

        {/* Summary */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{sortedEvents.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Vendors Involved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {new Set(sortedEvents.flatMap(e => e.vendorIds)).size}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>High Priority</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {sortedEvents.filter(e => e.priority === 'high').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}