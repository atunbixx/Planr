import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler, NotFoundException } from '../base-handler'
import { prisma } from '@/lib/prisma'
import { toApiFormat, toDbFormat } from '@/lib/db/transformations'

// Validation schemas
const createChecklistItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().default('other'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  completed: z.boolean().default(false)
})

const updateChecklistItemSchema = createChecklistItemSchema.partial()

export class ChecklistHandlerV2 extends BaseApiHandler {
  protected model = 'ChecklistItem' as const
  
  async list(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const completed = url.searchParams.get('completed')
      const priority = url.searchParams.get('priority')
      
      let whereClause: any = { couple_id: coupleId }
      
      if (category) whereClause.category = category
      if (completed !== null) whereClause.completed = completed === 'true'
      if (priority) whereClause.priority = priority
      
      const items = await prisma.checklist_items.findMany({
        where: whereClause,
        orderBy: [
          { completed: 'asc' },
          { due_date: 'asc' },
          { priority: 'desc' },
          { created_at: 'desc' }
        ]
      })
      
      // Get category statistics
      const stats = await prisma.checklist_items.groupBy({
        by: ['category', 'completed'],
        where: { couple_id: coupleId },
        _count: true
      })
      
      // Calculate completion percentage
      const totalItems = items.length
      const completedItems = items.filter(item => item.completed).length
      const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
      
      return {
        items: items.map(item => toApiFormat(item, 'ChecklistItem')),
        stats: {
          total: totalItems,
          completed: completedItems,
          pending: totalItems - completedItems,
          completionPercentage,
          byCategory: stats.reduce((acc, stat) => {
            const category = stat.category || 'other'
            if (!acc[category]) {
              acc[category] = { total: 0, completed: 0 }
            }
            acc[category].total += stat._count
            if (stat.completed) {
              acc[category].completed += stat._count
            }
            return acc
          }, {} as Record<string, { total: number; completed: number }>)
        }
      }
    })
  }
  
  async create(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createChecklistItemSchema)
      
      // Transform to database format
      const dbData = toDbFormat({
        ...data,
        coupleId
      }, 'ChecklistItem')
      
      const item = await prisma.checklist_items.create({
        data: {
          couple_id: coupleId,
          title: dbData.title,
          description: dbData.description,
          category: dbData.category,
          priority: dbData.priority,
          due_date: dbData.dueDate ? new Date(dbData.dueDate) : null,
          assigned_to: dbData.assignedTo,
          notes: dbData.notes,
          completed: dbData.completed || false,
          created_at: new Date(),
          updated_at: new Date()
        }
      })
      
      return toApiFormat(item, 'ChecklistItem')
    })
  }
  
  async update(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateChecklistItemSchema)
      
      // Check if item belongs to this couple
      const existingItem = await prisma.checklist_items.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingItem) {
        throw new NotFoundException('Checklist item not found')
      }
      
      // Transform to database format
      const dbData = toDbFormat(data, 'ChecklistItem')
      
      // If marking as completed, set completed date
      let completedAt = existingItem.completed_at
      if (data.completed && !existingItem.completed) {
        completedAt = new Date()
      } else if (!data.completed && existingItem.completed) {
        completedAt = null
      }
      
      const updatedItem = await prisma.checklist_items.update({
        where: { id },
        data: {
          title: dbData.title,
          description: dbData.description,
          category: dbData.category,
          priority: dbData.priority,
          due_date: dbData.dueDate ? new Date(dbData.dueDate) : undefined,
          assigned_to: dbData.assignedTo,
          notes: dbData.notes,
          completed: dbData.completed,
          completed_at: completedAt,
          updated_at: new Date()
        }
      })
      
      return toApiFormat(updatedItem, 'ChecklistItem')
    })
  }
  
  async delete(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Check if item belongs to this couple
      const existingItem = await prisma.checklist_items.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingItem) {
        throw new NotFoundException('Checklist item not found')
      }
      
      await prisma.checklist_items.delete({
        where: { id }
      })
      
      return { success: true }
    })
  }
  
  // Toggle completion status
  async toggleComplete(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      const existingItem = await prisma.checklist_items.findFirst({
        where: {
          id: id,
          couple_id: coupleId
        }
      })
      
      if (!existingItem) {
        throw new NotFoundException('Checklist item not found')
      }
      
      const updatedItem = await prisma.checklist_items.update({
        where: { id },
        data: {
          completed: !existingItem.completed,
          completed_at: existingItem.completed ? null : new Date(),
          updated_at: new Date()
        }
      })
      
      return toApiFormat(updatedItem, 'ChecklistItem')
    })
  }
  
  // Bulk operations
  async bulkComplete(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const { itemIds } = await request.json()
      
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new Error('Invalid item IDs')
      }
      
      // Verify all items belong to this couple
      const items = await prisma.checklist_items.findMany({
        where: {
          id: { in: itemIds },
          couple_id: coupleId
        }
      })
      
      if (items.length !== itemIds.length) {
        throw new NotFoundException('One or more checklist items not found')
      }
      
      // Update all items
      await prisma.checklist_items.updateMany({
        where: {
          id: { in: itemIds },
          couple_id: coupleId
        },
        data: {
          completed: true,
          completed_at: new Date(),
          updated_at: new Date()
        }
      })
      
      return { success: true, count: itemIds.length }
    })
  }
}