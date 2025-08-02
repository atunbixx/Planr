'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { Calendar, Clock, MapPin, FileText } from 'lucide-react'
import { format, addDays, setHours, setMinutes, isBefore, isAfter, isSameDay, getDay } from 'date-fns'

interface VendorAvailability {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

interface DateOverride {
  date: string
  is_available: boolean
  start_time?: string
  end_time?: string
}

interface ExistingAppointment {
  appointment_date: string
  start_time: string
  end_time: string
}

interface AppointmentBookingProps {
  vendorId: string
  vendorName: string
  coupleId: string
  onBookingComplete?: () => void
}

export function AppointmentBooking({ 
  vendorId, 
  vendorName, 
  coupleId,
  onBookingComplete 
}: AppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState('60') // minutes
  const [appointmentType, setAppointmentType] = useState('consultation')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [availability, setAvailability] = useState<VendorAvailability[]>([])
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([])
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  const supabase = createClientComponentClient()
  const { addToast } = useToast()

  // Load vendor availability
  useEffect(() => {
    loadAvailabilityData()
  }, [vendorId])

  // Update available time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      calculateAvailableSlots()
    }
  }, [selectedDate, availability, dateOverrides, existingAppointments])

  const loadAvailabilityData = async () => {
    try {
      // Load regular availability
      const { data: availData, error: availError } = await supabase
        .from('vendor_availability')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_available', true)

      if (availError) throw availError

      // Load date overrides
      const { data: overrideData, error: overrideError } = await supabase
        .from('vendor_date_overrides')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('date', format(new Date(), 'yyyy-MM-dd'))

      if (overrideError) throw overrideError

      // Load existing appointments
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('vendor_appointments')
        .select('appointment_date, start_time, end_time')
        .eq('vendor_id', vendorId)
        .eq('status', 'scheduled')
        .or('status.eq.confirmed')
        .gte('appointment_date', format(new Date(), 'yyyy-MM-dd'))

      if (appointmentError) throw appointmentError

      setAvailability(availData || [])
      setDateOverrides(overrideData || [])
      setExistingAppointments(appointmentData || [])
    } catch (error) {
      console.error('Error loading availability:', error)
      addToast({
        title: 'Error',
        description: 'Failed to load vendor availability',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateAvailableSlots = () => {
    if (!selectedDate) return

    const date = new Date(selectedDate)
    const dayOfWeek = getDay(date)
    const slots: string[] = []

    // Check date overrides first
    const override = dateOverrides.find(d => d.date === selectedDate)
    if (override) {
      if (!override.is_available) {
        setAvailableSlots([])
        return
      }
      // If available with specific times, use those
      if (override.start_time && override.end_time) {
        generateTimeSlots(override.start_time, override.end_time, slots)
        setAvailableSlots(filterAvailableSlots(slots))
        return
      }
    }

    // Check regular availability for this day
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek)
    if (dayAvailability.length === 0) {
      setAvailableSlots([])
      return
    }

    // Generate time slots for each availability period
    dayAvailability.forEach(avail => {
      generateTimeSlots(avail.start_time, avail.end_time, slots)
    })

    // Filter out booked slots
    setAvailableSlots(filterAvailableSlots(slots))
  }

  const generateTimeSlots = (startTime: string, endTime: string, slots: string[]) => {
    const start = new Date(`2000-01-01 ${startTime}`)
    const end = new Date(`2000-01-01 ${endTime}`)
    const slotDuration = 30 // 30-minute slots

    let current = new Date(start)
    while (current < end) {
      slots.push(format(current, 'HH:mm'))
      current = new Date(current.getTime() + slotDuration * 60000)
    }
  }

  const filterAvailableSlots = (slots: string[]): string[] => {
    return slots.filter(slot => {
      const slotStart = new Date(`${selectedDate} ${slot}`)
      const slotEnd = new Date(slotStart.getTime() + parseInt(duration) * 60000)

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        if (apt.appointment_date !== selectedDate) return false

        const aptStart = new Date(`${apt.appointment_date} ${apt.start_time}`)
        const aptEnd = new Date(`${apt.appointment_date} ${apt.end_time}`)

        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        )
      })

      return !hasConflict
    })
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      addToast({
        title: 'Missing information',
        description: 'Please select a date and time',
        type: 'error'
      })
      return
    }

    setBooking(true)

    try {
      const endTime = new Date(`${selectedDate} ${selectedTime}`)
      endTime.setMinutes(endTime.getMinutes() + parseInt(duration))

      const { error } = await supabase
        .from('vendor_appointments')
        .insert({
          vendor_id: vendorId,
          couple_id: coupleId,
          appointment_date: selectedDate,
          start_time: selectedTime,
          end_time: format(endTime, 'HH:mm'),
          appointment_type: appointmentType,
          status: 'scheduled',
          location,
          notes
        })

      if (error) throw error

      addToast({
        title: 'Appointment booked!',
        description: `Your appointment with ${vendorName} has been scheduled`,
        type: 'success'
      })

      if (onBookingComplete) {
        onBookingComplete()
      }

      // Reset form
      setSelectedDate('')
      setSelectedTime('')
      setLocation('')
      setNotes('')
    } catch (error) {
      console.error('Error booking appointment:', error)
      addToast({
        title: 'Booking failed',
        description: 'Failed to book appointment. Please try again.',
        type: 'error'
      })
    } finally {
      setBooking(false)
    }
  }

  const appointmentTypes = [
    { value: 'consultation', label: 'Initial Consultation' },
    { value: 'venue_tour', label: 'Venue Tour' },
    { value: 'tasting', label: 'Tasting Session' },
    { value: 'planning', label: 'Planning Meeting' },
    { value: 'rehearsal', label: 'Rehearsal' },
    { value: 'final_walkthrough', label: 'Final Walkthrough' },
    { value: 'other', label: 'Other' }
  ]

  // Get min date (tomorrow)
  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Appointment</CardTitle>
        <CardDescription>
          Schedule a meeting with {vendorName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Selection */}
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              className="pl-10"
            />
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="space-y-2">
            <Label htmlFor="time">Available Times</Label>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTime(slot)}
                  >
                    {format(new Date(`2000-01-01 ${slot}`), 'h:mm a')}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No available times for this date</p>
            )}
          </div>
        )}

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </Select>
        </div>

        {/* Appointment Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Appointment Type</Label>
          <Select
            id="type"
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value)}
          >
            {appointmentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Meeting location"
              className="pl-10"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Book Button */}
        <Button
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime || booking}
          className="w-full"
          loading={booking}
        >
          Book Appointment
        </Button>
      </CardContent>
    </Card>
  )
}