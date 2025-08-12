import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler, NotFoundException, BadRequestException } from '../base-handler'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Validation schemas
const createTimelineEventSchema = z.object({
  title: z.string().min(1),
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

const updateTimelineEventSchema = createTimelineEventSchema.partial()

export class TimelineHandlerV2 extends BaseApiHandler {
  protected model = 'TimelineItem' as const
  
  async list(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const date = url.searchParams.get('date')
      const vendorId = url.searchParams.get('vendorId')
      
      let whereClause: any = { couple_id: coupleId }
      
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
      
      // Fetch timeline items
      const items = await prisma.timeline_items.findMany({
        where: whereClause,
        orderBy: { start_time: 'asc' }
      })
      
      // Filter by vendor if specified
      let filteredItems = items
      if (vendorId) {
        filteredItems = items.filter(item => 
          item.vendor_ids?.includes(vendorId)
        )
      }
      
      return filteredItems
    })
  }
  
  async create(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createTimelineEventSchema)
      
      // Calculate duration if not provided
      let duration = data.duration
      if (!duration && data.endTime && data.startTime) {
        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
      }
      
      // Transform to database format
      const dbData = this.transformInput({
        ...data,
        coupleId,
        duration
      })
      
      // Create timeline item
      const item = await prisma.timeline_items.create({
        data: {
          couple_id: coupleId,
          title: dbData.title,
          description: dbData.description,
          start_time: new Date(dbData.startTime),
          end_time: dbData.endTime ? new Date(dbData.endTime) : null,
          duration: dbData.duration,
          location: dbData.location,
          category: dbData.category,
          vendor_ids: dbData.vendorIds,
          status: dbData.status,
          priority: dbData.priority,
          notes: dbData.notes,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      
      return item
    })
  }
  
  async update(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateTimelineEventSchema)
      
      // Check if timeline item belongs to this couple
      const existingItem = await prisma.timeline_items.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingItem) {
        throw new NotFoundException('Timeline event not found')
      }
      
      // Calculate duration if times are updated
      let duration = data.duration
      if (!duration && data.endTime && data.startTime) {
        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
      }
      
      // Transform to database format
      const dbData = this.transformInput({ ...data, duration })
      
      // Update timeline item
      const updatedItem = await prisma.timeline_items.update({
        where: { id },
        data: {
          title: dbData.title,
          description: dbData.description,
          start_time: dbData.startTime ? new Date(dbData.startTime) : undefined,
          end_time: dbData.endTime ? new Date(dbData.endTime) : undefined,
          duration: dbData.duration,
          location: dbData.location,
          category: dbData.category,
          vendor_ids: dbData.vendorIds,
          status: dbData.status,
          priority: dbData.priority,
          notes: dbData.notes,
          updated_at: new Date()
        }
      })
      
      return updatedItem
    })
  }
  
  async delete(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if timeline item belongs to this couple
      const existingItem = await prisma.timeline_items.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingItem) {
        throw new NotFoundException('Timeline event not found')
      }
      
      await prisma.timeline_items.delete({
        where: { id }
      })
      
      return { success: true }
    })
  }
  
  // Share timeline for a specific date
  async shareTimeline(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const body = await request.json()
      const { date } = body
      
      if (!date) {
        throw new BadRequestException('Date is required')
      }
      
      // Generate a unique share token
      const shareToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // Expires in 30 days
      
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/timeline/shared/${shareToken}?date=${date}`
      
      // In a real implementation, you'd store this in a share_links table
      
      return {
        shareUrl,
        shareToken,
        expiresAt: expiresAt.toISOString()
      }
    })
  }
}