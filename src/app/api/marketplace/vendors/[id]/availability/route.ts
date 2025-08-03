import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET /api/marketplace/vendors/[id]/availability - Get vendor availability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get vendor's regular availability
    const regularAvailability = await prisma.vendor_availability.findMany({
      where: { vendor_id: vendorId },
      orderBy: { day_of_week: 'asc' }
    })

    // Get date overrides
    const dateOverrides = await prisma.vendor_date_overrides.findMany({
      where: { 
        vendor_id: vendorId,
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      },
      orderBy: { date: 'asc' }
    })

    // Get existing appointments
    const appointments = await prisma.vendor_appointments.findMany({
      where: { 
        vendor_id: vendorId,
        appointment_date: {
          ...(startDate && endDate && {
            gte: new Date(startDate),
            lte: new Date(endDate)
          })
        }
      },
      orderBy: { appointment_date: 'asc' }
    })

    // Transform to calendar format
    const availability = {
      regular: regularAvailability.map(availability => ({
        day: availability.day_of_week,
        startTime: availability.start_time,
        endTime: availability.end_time,
        available: availability.is_available
      })),
      
      overrides: dateOverrides.map(override => ({
        date: override.date.toISOString().split('T')[0],
        available: override.is_available,
        startTime: override.start_time,
        endTime: override.end_time,
        note: override.note
      })),
      
      appointments: appointments.map(appointment => ({
        id: appointment.id,
        date: appointment.appointment_date.toISOString().split('T')[0],
        startTime: appointment.start_time,
        endTime: appointment.end_time,
        title: appointment.title,
        description: appointment.description,
        status: appointment.status
      })),
      
      next_available: calculateNextAvailable(regularAvailability, dateOverrides, appointments)
    }

    return createSuccessResponse(availability)
  } catch (error) {
    console.error('Availability error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST /api/marketplace/vendors/[id]/availability - Check availability for specific date/time
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    const body = await request.json()
    const { date, start_time, end_time, duration_minutes } = body

    if (!date || !start_time || !duration_minutes) {
      return createErrorResponse('Date, start time, and duration are required', 400)
    }

    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.getDay()

    // Check regular availability
    const regularAvailability = await prisma.vendor_availability.findFirst({
      where: { 
        vendor_id: vendorId, 
        day_of_week: dayOfWeek,
        is_available: true
      }
    })

    if (!regularAvailability) {
      return createSuccessResponse({ 
        available: false, 
        reason: 'Vendor not available on this day of the week' 
      })
    }

    // Check date overrides
    const dateOverride = await prisma.vendor_date_overrides.findFirst({
      where: { 
        vendor_id: vendorId, 
        date: requestedDate
      }
    })

    if (dateOverride) {
      if (!dateOverride.is_available) {
        return createSuccessResponse({ 
          available: false, 
          reason: 'Vendor not available on this date' 
        })
      }
    }

    // Check for conflicting appointments
    const requestedStart = new Date(`${date}T${start_time}`)
    const requestedEnd = new Date(requestedStart.getTime() + duration_minutes * 60000)

    const conflictingAppointments = await prisma.vendor_appointments.findMany({
      where: {
        vendor_id: vendorId,
        appointment_date: requestedDate,
        status: {
          not: 'cancelled'
        },
        OR: [
          {
            AND: [
              { start_time: { lte: start_time } },
              { end_time: { gte: start_time } }
            ]
          },
          {
            AND: [
              { start_time: { lte: end_time } },
              { end_time: { gte: end_time } }
            ]
          }
        ]
      }
    })

    if (conflictingAppointments.length > 0) {
      return createSuccessResponse({ 
        available: false, 
        reason: 'Time slot conflicts with existing appointment',
        conflicting_appointments: conflictingAppointments
      })
    }

    return createSuccessResponse({ 
      available: true,
      slot: {
        date: date,
        start_time: start_time,
        end_time: new Date(requestedEnd).toTimeString().slice(0, 5),
        duration_minutes: duration_minutes
      }
    })
  } catch (error) {
    console.error('Check availability error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

function calculateNextAvailable(
  regularAvailability: any[],
  dateOverrides: any[],
  appointments: any[]
): string {
  // Simple calculation - find next available day based on regular availability
  const today = new Date()
  let nextDate = new Date(today)
  
  for (let i = 0; i < 90; i++) {
    nextDate.setDate(today.getDate() + i)
    const dayOfWeek = nextDate.getDay()
    
    const regularDay = regularAvailability.find(a => a.day_of_week === dayOfWeek && a.is_available)
    if (regularDay) {
      const dateStr = nextDate.toISOString().split('T')[0]
      const override = dateOverrides.find(o => o.date.toISOString().split('T')[0] === dateStr)
      
      if (!override || override.is_available) {
        const hasAppointment = appointments.some(a => 
          a.appointment_date.toISOString().split('T')[0] === dateStr
        )
        if (!hasAppointment) {
          return nextDate.toISOString()
        }
      }
    }
  }
  
  return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
}