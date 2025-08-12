import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/lib/db/services/couple.service'
import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'
import { validateModelFields } from '@/lib/api/validation/field-validator'

// Validation schemas
const createChecklistItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  category: z.string().optional().default('Other'),
  timeframe: z.string().optional().default('1-3 months'),
  priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
  dueDate: z.string().datetime().optional(),
  isCompleted: z.boolean().optional().default(false),
  completedAt: z.string().datetime().optional(),
  notes: z.string().optional()
})

const updateChecklistItemSchema = createChecklistItemSchema.partial().extend({
  isCompleted: z.boolean().optional()
})

const bulkCreateSchema = z.object({
  items: z.array(createChecklistItemSchema),
  initializeDefaults: z.boolean().optional()
})

// Default checklist items by timeframe
const DEFAULT_CHECKLIST_ITEMS = [
  // 12+ months before
  { title: 'Set wedding date', category: 'Planning', timeframe: '12+ months', priority: 'high' },
  { title: 'Create wedding budget', category: 'Budget', timeframe: '12+ months', priority: 'high' },
  { title: 'Book ceremony venue', category: 'Venue', timeframe: '12+ months', priority: 'high' },
  { title: 'Book reception venue', category: 'Venue', timeframe: '12+ months', priority: 'high' },
  { title: 'Hire wedding photographer', category: 'Photography', timeframe: '12+ months', priority: 'high' },
  { title: 'Start guest list', category: 'Guests', timeframe: '12+ months', priority: 'medium' },
  
  // 6-12 months before
  { title: 'Book caterer or wedding cake', category: 'Catering', timeframe: '6-12 months', priority: 'high' },
  { title: 'Hire band or DJ', category: 'Music', timeframe: '6-12 months', priority: 'high' },
  { title: 'Order wedding dress', category: 'Attire', timeframe: '6-12 months', priority: 'high' },
  { title: 'Book florist', category: 'Flowers', timeframe: '6-12 months', priority: 'medium' },
  { title: 'Send save the dates', category: 'Invitations', timeframe: '6-12 months', priority: 'medium' },
  { title: 'Book honeymoon', category: 'Honeymoon', timeframe: '6-12 months', priority: 'medium' },
  
  // 3-6 months before
  { title: 'Order wedding invitations', category: 'Invitations', timeframe: '3-6 months', priority: 'high' },
  { title: 'Plan wedding menu tasting', category: 'Catering', timeframe: '3-6 months', priority: 'medium' },
  { title: 'Shop for wedding rings', category: 'Rings', timeframe: '3-6 months', priority: 'high' },
  { title: 'Book wedding transportation', category: 'Transportation', timeframe: '3-6 months', priority: 'medium' },
  { title: 'Register for gifts', category: 'Gifts', timeframe: '3-6 months', priority: 'low' },
  
  // 1-3 months before
  { title: 'Send wedding invitations', category: 'Invitations', timeframe: '1-3 months', priority: 'high' },
  { title: 'Finalize guest count', category: 'Guests', timeframe: '1-3 months', priority: 'high' },
  { title: 'Plan rehearsal dinner', category: 'Events', timeframe: '1-3 months', priority: 'medium' },
  { title: 'Write wedding vows', category: 'Ceremony', timeframe: '1-3 months', priority: 'medium' },
  { title: 'Apply for marriage license', category: 'Legal', timeframe: '1-3 months', priority: 'high' },
  
  // 1-4 weeks before
  { title: 'Confirm all vendors', category: 'Vendors', timeframe: '1-4 weeks', priority: 'high' },
  { title: 'Final dress fitting', category: 'Attire', timeframe: '1-4 weeks', priority: 'high' },
  { title: 'Pack for honeymoon', category: 'Honeymoon', timeframe: '1-4 weeks', priority: 'medium' },
  { title: 'Prepare welcome bags', category: 'Guests', timeframe: '1-4 weeks', priority: 'low' }
]

export class ChecklistHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Parse filters
    const category = searchParams.get('category') || undefined
    const timeframe = searchParams.get('timeframe') || undefined
    const priority = searchParams.get('priority') || undefined
    const isCompleted = searchParams.get('isCompleted')

    // Build where clause
    const where: any = {
      coupleId: couple.id
    }

    if (category) where.category = category
    if (timeframe) where.timeframe = timeframe
    if (priority) where.priority = priority
    if (isCompleted !== null) where.isCompleted = isCompleted === 'true'

    // Get checklist items
    const checklistItems = await prisma.checklistItem.findMany({
      where,
      orderBy: [
        { timeframe: 'desc' },
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    // Calculate progress statistics
    const stats = {
      total: checklistItems.length,
      completed: checklistItems.filter(item => item.isCompleted).length,
      pending: checklistItems.filter(item => !item.isCompleted).length,
      completionRate: checklistItems.length > 0 
        ? Math.round((checklistItems.filter(item => item.isCompleted).length / checklistItems.length) * 100)
        : 0,
      byCategory: this.groupByField(checklistItems, 'category'),
      byTimeframe: this.groupByField(checklistItems, 'timeframe'),
      byPriority: this.groupByField(checklistItems, 'priority')
    }

    return this.successResponse({
      items: checklistItems,
      stats
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Handle bulk operations
    if (body.items && Array.isArray(body.items)) {
      return this.handleBulkCreate(couple.id, body)
    }

    // Handle initialize defaults
    if (body.initializeDefaults) {
      return this.handleInitializeDefaults(couple.id)
    }

    // Validate single item
    const validatedData = createChecklistItemSchema.parse(body)

    // Create checklist item
    const checklistItem = await prisma.checklistItem.create({
      data: {
        coupleId: couple.id,
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined
      }
    })

    return this.successResponse(checklistItem, { action: 'created' })
  }

  private async handleBulkCreate(coupleId: string, body: any): Promise<NextResponse> {
    const validatedData = bulkCreateSchema.parse(body)

    const items = await Promise.all(
      validatedData.items.map(item =>
        prisma.checklistItem.create({
          data: {
            coupleId,
            ...item,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined
          }
        })
      )
    )

    return this.successResponse({ items }, { 
      action: 'bulk_created',
      count: items.length 
    })
  }

  private async handleInitializeDefaults(coupleId: string): Promise<NextResponse> {
    // Check if already has items
    const existingCount = await prisma.checklistItem.count({
      where: { coupleId }
    })

    if (existingCount > 0) {
      return this.errorResponse(
        'ALREADY_INITIALIZED', 
        'Checklist already has items. Cannot initialize defaults.', 
        400
      )
    }

    // Create default items
    const items = await Promise.all(
      DEFAULT_CHECKLIST_ITEMS.map(item =>
        prisma.checklistItem.create({
          data: {
            coupleId,
            title: item.title,
            category: item.category,
            timeframe: item.timeframe,
            priority: item.priority as 'high' | 'medium' | 'low'
          }
        })
      )
    )

    return this.successResponse({ items }, { 
      action: 'initialized',
      count: items.length 
    })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const itemId = context?.params?.id

    if (!itemId) {
      return this.errorResponse('INVALID_REQUEST', 'Item ID required', 400)
    }

    const validatedData = updateChecklistItemSchema.parse(await this.parseBody(request))

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify ownership
    const item = await prisma.checklistItem.findFirst({
      where: {
        id: itemId,
        coupleId: couple.id
      }
    })

    if (!item) {
      return this.errorResponse('NOT_FOUND', 'Checklist item not found', 404)
    }

    // Handle completion status change
    const updateData: any = { ...validatedData }
    
    if (validatedData.isCompleted !== undefined) {
      updateData.isCompleted = validatedData.isCompleted
      updateData.completedAt = validatedData.isCompleted ? new Date() : null
    }

    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }

    // Update item
    const updatedItem = await prisma.checklistItem.update({
      where: { id: itemId },
      data: updateData
    })

    return this.successResponse(updatedItem, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const itemId = context?.params?.id

    if (!itemId) {
      return this.errorResponse('INVALID_REQUEST', 'Item ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify ownership and delete
    const deleted = await prisma.checklistItem.deleteMany({
      where: {
        id: itemId,
        coupleId: couple.id
      }
    })

    if (deleted.count === 0) {
      return this.errorResponse('NOT_FOUND', 'Checklist item not found', 404)
    }

    return this.successResponse({ id: itemId }, { action: 'deleted' })
  }

  private groupByField(items: any[], field: string): Record<string, { total: number, completed: number }> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'Uncategorized'
      if (!acc[key]) {
        acc[key] = { total: 0, completed: 0 }
      }
      acc[key].total++
      if (item.isCompleted) {
        acc[key].completed++
      }
      return acc
    }, {} as Record<string, { total: number, completed: number }>)
  }
}