import { BaseService, PaginationOptions, PaginatedResult } from './base.service'
import { ChecklistItem, Prisma } from '@prisma/client'

export interface CreateChecklistItemDto {
  title: string
  description?: string
  category?: string
  dueDate?: Date
  priority?: 'low' | 'medium' | 'high'
  assignedTo?: string
  notes?: string
}

export interface UpdateChecklistItemDto extends Partial<CreateChecklistItemDto> {
  completed?: boolean
  completedAt?: Date
  completedBy?: string
}

export interface ChecklistStats {
  total: number
  completed: number
  pending: number
  overdue: number
  byCategory: Record<string, number>
  byPriority: {
    high: number
    medium: number
    low: number
  }
}

export class ChecklistService extends BaseService<ChecklistItem> {
  protected entityName = 'checklistItem'
  protected cachePrefix = 'checklist'

  async getChecklistForCouple(
    coupleId: string,
    options?: PaginationOptions & { 
      completed?: boolean
      category?: string
      priority?: string
      overdue?: boolean
    }
  ): Promise<PaginatedResult<ChecklistItem>> {
    const { skip, take, page, pageSize } = this.getPaginationParams(options)

    // Build where clause
    const where: Prisma.ChecklistItemWhereInput = {
      coupleId
    }
    
    if (options?.completed !== undefined) where.completed = options.completed
    if (options?.category) where.category = options.category
    if (options?.priority) where.priority = options.priority
    if (options?.overdue) {
      where.dueDate = {
        lt: new Date()
      }
      where.completed = false
    }

    // Check cache
    const cacheKey = `${this.cachePrefix}:${coupleId}:list:${JSON.stringify(where)}:${page}:${pageSize}`
    const cached = await this.getCached<PaginatedResult<ChecklistItem>>(cacheKey)
    if (cached) {
      return cached
    }

    // Query with pagination
    const [items, total] = await Promise.all([
      this.prisma.checklistItem.findMany({
        where,
        orderBy: options?.orderBy || [
          { completed: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take
      }),
      this.prisma.checklistItem.count({ where })
    ])

    const result = this.createPaginatedResult(items, total, page, pageSize)
    
    // Cache the result
    await this.setCached(cacheKey, result)

    return result
  }

  async getChecklistStats(coupleId: string): Promise<ChecklistStats> {
    const cacheKey = `${this.cachePrefix}:${coupleId}:stats`
    const cached = await this.getCached<ChecklistStats>(cacheKey)
    if (cached) {
      return cached
    }

    // Get all items for stats
    const items = await this.prisma.checklistItem.findMany({
      where: { coupleId }
    })

    const now = new Date()
    const stats: ChecklistStats = {
      total: items.length,
      completed: 0,
      pending: 0,
      overdue: 0,
      byCategory: {},
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      }
    }

    items.forEach(item => {
      // Status counts
      if (item.completed) {
        stats.completed++
      } else {
        stats.pending++
        if (item.dueDate && item.dueDate < now) {
          stats.overdue++
        }
      }

      // Category counts
      const category = item.category || 'uncategorized'
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

      // Priority counts
      const priority = item.priority || 'medium'
      if (priority in stats.byPriority) {
        stats.byPriority[priority as keyof typeof stats.byPriority]++
      }
    })

    await this.setCached(cacheKey, stats)

    return stats
  }

  async createChecklistItem(coupleId: string, data: CreateChecklistItemDto): Promise<ChecklistItem> {
    const item = await this.prisma.checklistItem.create({
      data: {
        coupleId,
        title: data.title,
        description: data.description,
        category: data.category || 'general',
        dueDate: data.dueDate,
        priority: data.priority || 'medium',
        assignedTo: data.assignedTo,
        notes: data.notes,
        completed: false
      }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return item
  }

  async updateChecklistItem(
    itemId: string,
    coupleId: string,
    data: UpdateChecklistItemDto
  ): Promise<ChecklistItem> {
    // Handle completion
    const updateData: Prisma.ChecklistItemUpdateInput = { ...data }
    
    if (data.completed === true && !data.completedAt) {
      updateData.completedAt = new Date()
    } else if (data.completed === false) {
      updateData.completedAt = null
      updateData.completedBy = null
    }

    const item = await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: updateData
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return item
  }

  async deleteChecklistItem(itemId: string, coupleId: string): Promise<void> {
    await this.prisma.checklistItem.delete({
      where: { id: itemId }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)
  }

  async toggleChecklistItem(itemId: string, coupleId: string, userId: string): Promise<ChecklistItem> {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      throw new Error('Checklist item not found')
    }

    return this.updateChecklistItem(itemId, coupleId, {
      completed: !item.completed,
      completedAt: !item.completed ? new Date() : undefined,
      completedBy: !item.completed ? userId : undefined
    })
  }

  async getDefaultChecklistTemplate(): Promise<CreateChecklistItemDto[]> {
    // This could be loaded from a config file or database
    return [
      // 12+ months before
      { title: 'Set wedding date', category: 'planning', priority: 'high' },
      { title: 'Determine budget', category: 'planning', priority: 'high' },
      { title: 'Create guest list', category: 'planning', priority: 'high' },
      { title: 'Choose wedding style/theme', category: 'planning', priority: 'medium' },
      
      // 10-12 months before
      { title: 'Book venue', category: 'venue', priority: 'high' },
      { title: 'Hire wedding planner (optional)', category: 'vendors', priority: 'medium' },
      { title: 'Book photographer', category: 'vendors', priority: 'high' },
      { title: 'Book videographer', category: 'vendors', priority: 'medium' },
      
      // 8-10 months before
      { title: 'Send save-the-dates', category: 'invitations', priority: 'high' },
      { title: 'Book caterer', category: 'vendors', priority: 'high' },
      { title: 'Book band/DJ', category: 'vendors', priority: 'high' },
      { title: 'Shop for wedding dress', category: 'attire', priority: 'high' },
      
      // 6-8 months before
      { title: 'Register for gifts', category: 'planning', priority: 'medium' },
      { title: 'Book florist', category: 'vendors', priority: 'medium' },
      { title: 'Order invitations', category: 'invitations', priority: 'high' },
      { title: 'Book transportation', category: 'vendors', priority: 'medium' },
      
      // 4-6 months before
      { title: 'Send invitations', category: 'invitations', priority: 'high' },
      { title: 'Order wedding cake', category: 'vendors', priority: 'medium' },
      { title: 'Schedule dress fittings', category: 'attire', priority: 'high' },
      { title: 'Book rehearsal dinner venue', category: 'venue', priority: 'medium' },
      
      // 2-4 months before
      { title: 'Finalize menu', category: 'catering', priority: 'high' },
      { title: 'Purchase wedding rings', category: 'attire', priority: 'high' },
      { title: 'Write vows', category: 'ceremony', priority: 'medium' },
      { title: 'Plan honeymoon', category: 'planning', priority: 'medium' },
      
      // 1-2 months before
      { title: 'Obtain marriage license', category: 'legal', priority: 'high' },
      { title: 'Final dress fitting', category: 'attire', priority: 'high' },
      { title: 'Confirm vendor details', category: 'vendors', priority: 'high' },
      { title: 'Create seating chart', category: 'planning', priority: 'high' },
      
      // 2-4 weeks before
      { title: 'Final headcount to caterer', category: 'catering', priority: 'high' },
      { title: 'Break in wedding shoes', category: 'attire', priority: 'low' },
      { title: 'Rehearsal', category: 'ceremony', priority: 'high' },
      { title: 'Pack for honeymoon', category: 'planning', priority: 'medium' }
    ]
  }

  async initializeDefaultChecklist(coupleId: string, weddingDate?: Date): Promise<ChecklistItem[]> {
    const templates = await this.getDefaultChecklistTemplate()
    const items: ChecklistItem[] = []

    // Calculate due dates based on wedding date
    const baseDate = weddingDate || new Date(new Date().setMonth(new Date().getMonth() + 12))

    for (const template of templates) {
      // Calculate due date based on category and typical timeline
      let monthsBefore = 12 // default
      
      if (template.category === 'planning' && template.title.includes('Set wedding date')) {
        monthsBefore = 13
      } else if (template.category === 'venue') {
        monthsBefore = 11
      } else if (template.category === 'vendors' && template.priority === 'high') {
        monthsBefore = 10
      } else if (template.category === 'invitations' && template.title.includes('save-the-dates')) {
        monthsBefore = 9
      } else if (template.category === 'invitations' && template.title.includes('Send invitations')) {
        monthsBefore = 5
      } else if (template.category === 'attire') {
        monthsBefore = 8
      } else if (template.category === 'legal') {
        monthsBefore = 2
      } else if (template.title.includes('Final') || template.title.includes('Confirm')) {
        monthsBefore = 1
      }

      const dueDate = new Date(baseDate)
      dueDate.setMonth(dueDate.getMonth() - monthsBefore)

      const item = await this.createChecklistItem(coupleId, {
        ...template,
        dueDate
      })
      
      items.push(item)
    }

    return items
  }
}

// Export singleton instance
export const checklistService = new ChecklistService()