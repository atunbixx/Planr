'use server'

import { NextRequest, NextResponse } from 'next/server'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { TimelineEventRepository } from '@/features/timeline/repo'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const coupleRepository = new CoupleRepository()
const timelineEventRepository = new TimelineEventRepository()

// Validation schema
const timelineEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  location: z.string().optional(),
  category: z.string().default('ceremony'),
  vendorIds: z.array(z.string()).default([]),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().optional()
})

async function getCoupleId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Find couple by user ID using repository
  const couple = await coupleRepository.findByUserId(user.id)

  if (!couple) {
    throw new Error('No couple found for user')
  }

  return couple.id
}

export async function GET(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    const vendorId = url.searchParams.get('vendorId')

    const whereClause: any = {
      couple_id: coupleId
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      whereClause.start_time = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    // Fetch timeline items using repository
    let timelineItems = await timelineEventRepository.findByCoupleId(coupleId)
    
    // Apply date filter if provided
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      timelineItems = timelineItems.filter(item => {
        const itemDate = new Date(item.startTime)
        return itemDate >= startOfDay && itemDate <= endOfDay
      })
    }

    // Transform data to match frontend interface
    const transformedEvents = timelineItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startTime: item.startTime instanceof Date ? item.startTime.toISOString() : item.startTime,
      endTime: item.endTime ? (item.endTime instanceof Date ? item.endTime.toISOString() : item.endTime) : undefined,
      duration: item.duration,
      location: item.location,
      category: item.category,
      vendorIds: item.vendorIds || [],
      status: item.status || 'scheduled',
      priority: item.priority || 'medium',
      notes: item.notes,
      createdAt: item.createdAt ? (item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt) : new Date().toISOString(),
      updatedAt: item.updatedAt ? (item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt) : new Date().toISOString()
    }))

    // Filter by vendor if specified
    let filteredEvents = transformedEvents
    if (vendorId) {
      filteredEvents = transformedEvents.filter(event => 
        event.vendorIds.includes(vendorId)
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredEvents
    })
  } catch (error) {
    console.error('Error fetching timeline events:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch timeline events'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    const body = await request.json()
    
    const validatedData = timelineEventSchema.parse(body)

    // Calculate duration if not provided
    let duration = validatedData.duration
    if (!duration && validatedData.endTime && validatedData.startTime) {
      const start = new Date(validatedData.startTime)
      const end = new Date(validatedData.endTime)
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
    }

    // Create timeline item using repository
    const timelineItem = await timelineEventRepository.create({
      coupleId: coupleId,
      title: validatedData.title,
      description: validatedData.description,
      startTime: new Date(validatedData.startTime),
      endTime: validatedData.endTime ? new Date(validatedData.endTime) : new Date(validatedData.startTime),
      duration: duration,
      location: validatedData.location,
      category: validatedData.category,
      vendorIds: validatedData.vendorIds,
      status: validatedData.status,
      priority: validatedData.priority,
      notes: validatedData.notes
    })

    // Transform response
    const transformedEvent = {
      id: timelineItem.id,
      title: timelineItem.title,
      description: timelineItem.description,
      startTime: timelineItem.start_time.toISOString(),
      endTime: timelineItem.end_time?.toISOString(),
      duration: timelineItem.duration,
      location: timelineItem.location,
      category: timelineItem.category,
      vendorIds: timelineItem.vendor_ids || [],
      status: timelineItem.status || 'scheduled',
      priority: timelineItem.priority || 'medium',
      notes: timelineItem.notes,
      createdAt: timelineItem.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: timelineItem.updated_at?.toISOString() || new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: transformedEvent
    })
  } catch (error) {
    console.error('Error creating timeline event:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data provided',
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create timeline event'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 })
    }

    const validatedData = timelineEventSchema.parse(updateData)

    // Check if timeline item belongs to this couple using repository
    const existingItem = await timelineEventRepository.findById(id)

    if (!existingItem || existingItem.coupleId !== coupleId) {
      return NextResponse.json({
        success: false,
        error: 'Timeline event not found'
      }, { status: 404 })
    }

    // Calculate duration if not provided
    let duration = validatedData.duration
    if (!duration && validatedData.endTime && validatedData.startTime) {
      const start = new Date(validatedData.startTime)
      const end = new Date(validatedData.endTime)
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
    }

    // Update timeline item using repository
    const updatedItem = await timelineEventRepository.update(id, {
      title: validatedData.title,
      description: validatedData.description,
      startTime: new Date(validatedData.startTime),
      endTime: validatedData.endTime ? new Date(validatedData.endTime) : new Date(validatedData.startTime),
      duration: duration,
      location: validatedData.location,
      category: validatedData.category,
      vendorIds: validatedData.vendorIds,
      status: validatedData.status,
      priority: validatedData.priority,
      notes: validatedData.notes
    })

    // Transform response
    const transformedEvent = {
      id: updatedItem.id,
      title: updatedItem.title,
      description: updatedItem.description,
      startTime: updatedItem.start_time.toISOString(),
      endTime: updatedItem.end_time?.toISOString(),
      duration: updatedItem.duration,
      location: updatedItem.location,
      category: updatedItem.category,
      vendorIds: updatedItem.vendor_ids || [],
      status: updatedItem.status || 'scheduled',
      priority: updatedItem.priority || 'medium',
      notes: updatedItem.notes,
      createdAt: updatedItem.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: updatedItem.updated_at?.toISOString() || new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: transformedEvent
    })
  } catch (error) {
    console.error('Error updating timeline event:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data provided',
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update timeline event'
    }, { status: 500 })
  }
}