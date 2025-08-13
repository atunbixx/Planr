import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class ChecklistRepository extends BaseRepository<any> {
  async findById(id: string): Promise<any | null> {
    return this.executeQuery(() =>
      prisma.tasks.findUnique({ where: { id } })
    )
  }

  async findByCoupleId(coupleId: string, filters?: {
    category?: string
    priority?: string
    isCompleted?: boolean
    dueInDays?: number
  }): Promise<any[]> {
    return this.executeQuery(() => {
      const where: any = { couple_id: coupleId }
      
      if (filters?.category) where.category = filters.category
      if (filters?.priority) where.priority = filters.priority
      if (filters?.isCompleted !== undefined) where.is_completed = filters.isCompleted
      if (filters?.dueInDays) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + filters.dueInDays)
        where.due_date = { lte: futureDate }
      }

      return prisma.tasks.findMany({ 
        where,
        orderBy: [
          { priority: 'desc' },
          { due_date: 'asc' },
          { created_at: 'desc' }
        ]
      })
    })
  }

  async create(data: any): Promise<any> {
    return this.executeQuery(() =>
      prisma.tasks.create({ data })
    )
  }

  async createDefaults(coupleId: string, weddingDate: Date): Promise<any[]> {
    const defaultItems = [
      // 12 months before
      { title: 'Set wedding budget', category: 'Planning', priority: 'high', monthsBefore: 12 },
      { title: 'Create guest list', category: 'Planning', priority: 'high', monthsBefore: 12 },
      { title: 'Book venue', category: 'Venue', priority: 'high', monthsBefore: 12 },
      { title: 'Hire wedding planner', category: 'Planning', priority: 'medium', monthsBefore: 12 },
      
      // 10 months before
      { title: 'Book photographer', category: 'Vendors', priority: 'high', monthsBefore: 10 },
      { title: 'Book caterer', category: 'Vendors', priority: 'high', monthsBefore: 10 },
      { title: 'Shop for wedding dress', category: 'Attire', priority: 'high', monthsBefore: 10 },
      
      // 8 months before
      { title: 'Send save-the-dates', category: 'Invitations', priority: 'high', monthsBefore: 8 },
      { title: 'Book florist', category: 'Vendors', priority: 'medium', monthsBefore: 8 },
      { title: 'Book musicians/DJ', category: 'Vendors', priority: 'medium', monthsBefore: 8 },
      
      // 6 months before
      { title: 'Order invitations', category: 'Invitations', priority: 'high', monthsBefore: 6 },
      { title: 'Register for gifts', category: 'Planning', priority: 'low', monthsBefore: 6 },
      { title: 'Book officiant', category: 'Ceremony', priority: 'high', monthsBefore: 6 },
      
      // 4 months before
      { title: 'Plan honeymoon', category: 'Travel', priority: 'medium', monthsBefore: 4 },
      { title: 'Order wedding cake', category: 'Vendors', priority: 'medium', monthsBefore: 4 },
      { title: 'Buy wedding rings', category: 'Attire', priority: 'high', monthsBefore: 4 },
      
      // 2 months before
      { title: 'Send invitations', category: 'Invitations', priority: 'high', monthsBefore: 2 },
      { title: 'Finalize menu', category: 'Catering', priority: 'high', monthsBefore: 2 },
      { title: 'Hair and makeup trial', category: 'Beauty', priority: 'medium', monthsBefore: 2 },
      
      // 1 month before
      { title: 'Create seating chart', category: 'Planning', priority: 'high', monthsBefore: 1 },
      { title: 'Final dress fitting', category: 'Attire', priority: 'high', monthsBefore: 1 },
      { title: 'Confirm vendor details', category: 'Vendors', priority: 'high', monthsBefore: 1 },
      
      // 2 weeks before
      { title: 'Pack for honeymoon', category: 'Travel', priority: 'low', weeksBefore: 2 },
      { title: 'Rehearsal dinner planning', category: 'Events', priority: 'medium', weeksBefore: 2 },
      { title: 'Final headcount to venue', category: 'Planning', priority: 'high', weeksBefore: 2 }
    ]

    return this.withTransaction(async (tx) => {
      const items = await Promise.all(
        defaultItems.map((item, index) => {
          const dueDate = new Date(weddingDate)
          
          if ('monthsBefore' in item) {
            dueDate.setMonth(dueDate.getMonth() - item.monthsBefore)
          } else if ('weeksBefore' in item) {
            dueDate.setDate(dueDate.getDate() - (item.weeksBefore * 7))
          }

          return tx.tasks.create({
            data: {
              couple_id: coupleId,
              title: item.title,
              category: item.category,
              priority: item.priority,
              due_date: dueDate,
              display_order: index,
              is_default: true
            }
          })
        })
      )
      return items
    })
  }

  async update(id: string, data: any): Promise<any> {
    return this.executeQuery(() =>
      prisma.tasks.update({ 
        where: { id },
        data 
      })
    )
  }

  async toggleComplete(id: string): Promise<any> {
    return this.executeQuery(async () => {
      const item = await prisma.tasks.findUnique({ where: { id } })
      if (!item) throw new Error('Checklist item not found')

      return prisma.tasks.update({
        where: { id },
        data: { 
          is_completed: !item.is_completed,
          completed_at: !item.is_completed ? new Date() : null
        }
      })
    })
  }

  async bulkComplete(ids: string[], isCompleted: boolean): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.tasks.updateMany({
        where: { id: { in: ids } },
        data: { 
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date() : null
        }
      })
    )
  }

  async delete(id: string): Promise<any> {
    return this.executeQuery(() =>
      prisma.tasks.delete({ where: { id } })
    )
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.tasks.deleteMany({ 
        where: { 
          id: { in: ids } 
        } 
      })
    )
  }

  async getStatsByCoupleId(coupleId: string): Promise<{
    total: number
    completed: number
    pending: number
    overdue: number
    byCategory: Array<{
      category: string
      total: number
      completed: number
    }>
    byPriority: Array<{
      priority: string
      total: number
      completed: number
    }>
  }> {
    return this.executeQuery(async () => {
      const items = await prisma.tasks.findMany({
        where: { couple_id: coupleId }
      })

      const now = new Date()
      const total = items.length
      const completed = items.filter(i => i.is_completed).length
      const pending = items.filter(i => !i.is_completed).length
      const overdue = items.filter(i => !i.is_completed && i.due_date && i.due_date < now).length

      // Group by category
      const byCategory = items.reduce((acc, item) => {
        const category = item.category || 'Uncategorized'
        if (!acc[category]) {
          acc[category] = { category, total: 0, completed: 0 }
        }
        acc[category].total++
        if (item.is_completed) acc[category].completed++
        return acc
      }, {} as Record<string, any>)

      // Group by priority
      const byPriority = items.reduce((acc, item) => {
        const priority = item.priority || 'medium'
        if (!acc[priority]) {
          acc[priority] = { priority, total: 0, completed: 0 }
        }
        acc[priority].total++
        if (item.is_completed) acc[priority].completed++
        return acc
      }, {} as Record<string, any>)

      return {
        total,
        completed,
        pending,
        overdue,
        byCategory: Object.values(byCategory),
        byPriority: Object.values(byPriority)
      }
    })
  }

  async updateDisplayOrder(updates: { id: string; displayOrder: number }[]): Promise<void> {
    return this.withTransaction(async (tx) => {
      await Promise.all(
        updates.map(({ id, displayOrder }) =>
          tx.tasks.update({
            where: { id },
            data: { display_order: displayOrder }
          })
        )
      )
    })
  }
}