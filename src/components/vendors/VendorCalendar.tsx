'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar'
import moment from 'moment'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { Calendar as CalendarIcon, Clock, MapPin, X, CheckCircle } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { cn } from '@/utils/cn'

const localizer = momentLocalizer(moment)

interface VendorAppointment {
  id: string
  vendor_id: string
  couple_id: string
  appointment_date: string
  start_time: string
  end_time: string
  appointment_type: string
  status: string
  location?: string
  notes?: string
  vendor?: {
    business_name: string
    category: string
  }
  couple?: {
    partner1_name: string
    partner2_name?: string
  }
}

interface VendorCalendarProps {
  vendorId?: string
  coupleId?: string
  isVendorView?: boolean
}

interface CalendarEvent extends Event {
  id: string
  appointment: VendorAppointment
}

export function VendorCalendar({ vendorId, coupleId, isVendorView = false }: VendorCalendarProps) {
  const [appointments, setAppointments] = useState<VendorAppointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<VendorAppointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  
  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  // Load appointments
  useEffect(() => {
    loadAppointments()
  }, [vendorId, coupleId])

  const loadAppointments = async () => {
    try {
      let query = supabase
        .from('vendor_appointments')
        .select(`
          *,
          vendor:vendors(business_name, category),
          couple:wedding_couples(partner1_name, partner2_name)
        `)

      if (vendorId) {
        query = query.eq('vendor_id', vendorId)
      }
      if (coupleId) {
        query = query.eq('couple_id', coupleId)
      }

      const { data, error } = await query.order('appointment_date', { ascending: true })

      if (error) throw error

      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load appointments',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Convert appointments to calendar events
  const events: CalendarEvent[] = appointments.map(appointment => {
    const startDateTime = moment(`${appointment.appointment_date} ${appointment.start_time}`).toDate()
    const endDateTime = moment(`${appointment.appointment_date} ${appointment.end_time}`).toDate()
    
    return {
      id: appointment.id,
      title: isVendorView 
        ? `${appointment.couple?.partner1_name}${appointment.couple?.partner2_name ? ` & ${appointment.couple.partner2_name}` : ''}`
        : appointment.vendor?.business_name || 'Appointment',
      start: startDateTime,
      end: endDateTime,
      appointment,
      resource: appointment
    }
  })

  // Custom event style
  const eventStyleGetter = (event: CalendarEvent) => {
    const appointment = event.appointment
    let backgroundColor = '#3b82f6' // default blue
    
    switch (appointment.status) {
      case 'confirmed':
        backgroundColor = '#10b981' // green
        break
      case 'cancelled':
        backgroundColor = '#ef4444' // red
        break
      case 'completed':
        backgroundColor = '#6b7280' // gray
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.appointment)
  }, [])

  // Cancel appointment
  const cancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const { error } = await supabase
        .from('vendor_appointments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error

      await loadAppointments()
      setSelectedAppointment(null)
      
      addToast({
        title: 'Appointment cancelled',
        description: 'The appointment has been cancelled',
        type: 'success'
      })
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      addToast({
        title: 'Error',
        description: 'Failed to cancel appointment',
        type: 'error'
      })
    }
  }

  // Confirm appointment
  const confirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_appointments')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error

      await loadAppointments()
      setSelectedAppointment(null)
      
      addToast({
        title: 'Appointment confirmed',
        description: 'The appointment has been confirmed',
        type: 'success'
      })
    } catch (error) {
      console.error('Error confirming appointment:', error)
      addToast({
        title: 'Error',
        description: 'Failed to confirm appointment',
        type: 'error'
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default' as const
      case 'cancelled':
        return 'destructive' as const
      case 'completed':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isVendorView ? 'Your Appointments' : 'Vendor Appointments'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              views={['month', 'week', 'day', 'agenda']}
              className="vendor-calendar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Appointment Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAppointment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vendor/Couple Info */}
              <div>
                <h4 className="font-medium mb-1">
                  {isVendorView 
                    ? `${selectedAppointment.couple?.partner1_name}${selectedAppointment.couple?.partner2_name ? ` & ${selectedAppointment.couple.partner2_name}` : ''}`
                    : selectedAppointment.vendor?.business_name
                  }
                </h4>
                {!isVendorView && selectedAppointment.vendor?.category && (
                  <p className="text-sm text-gray-600 capitalize">
                    {selectedAppointment.vendor.category.replace('_', ' ')}
                  </p>
                )}
              </div>

              {/* Date and Time */}
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>
                  {moment(selectedAppointment.appointment_date).format('MMMM D, YYYY')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>
                  {moment(selectedAppointment.start_time, 'HH:mm:ss').format('h:mm A')} - 
                  {moment(selectedAppointment.end_time, 'HH:mm:ss').format('h:mm A')}
                </span>
              </div>

              {/* Location */}
              {selectedAppointment.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{selectedAppointment.location}</span>
                </div>
              )}

              {/* Type and Status */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {selectedAppointment.appointment_type.replace('_', ' ')}
                </Badge>
                <Badge variant={getStatusBadgeVariant(selectedAppointment.status)}>
                  {selectedAppointment.status}
                </Badge>
              </div>

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <h5 className="text-sm font-medium mb-1">Notes</h5>
                  <p className="text-sm text-gray-600">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {selectedAppointment.status === 'scheduled' && (
                  <>
                    <Button
                      onClick={() => confirmAppointment(selectedAppointment.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => cancelAppointment(selectedAppointment.id)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelAppointment(selectedAppointment.id)}
                    className="w-full"
                  >
                    Cancel Appointment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx global>{`
        .vendor-calendar .rbc-header {
          padding: 8px;
          font-weight: 600;
        }
        .vendor-calendar .rbc-today {
          background-color: #fef3c7;
        }
        .vendor-calendar .rbc-event {
          padding: 2px 5px;
          font-size: 0.875rem;
        }
        .vendor-calendar .rbc-agenda-view table.rbc-agenda-table {
          border: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  )
}