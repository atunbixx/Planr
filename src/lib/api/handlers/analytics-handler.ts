import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/lib/db/services/couple.service'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

// Validation schemas
const taskFiltersSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'all']).optional().default('all'),
  priority: z.enum(['low', 'medium', 'high', 'all']).optional().default('all'),
  category: z.string().optional(),
  dueInDays: z.number().int().min(1).max(365).optional(),
  overdue: z.boolean().optional()
})

const messagesPreviewSchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(10),
  type: z.enum(['email', 'sms', 'all']).optional().default('all'),
  status: z.enum(['sent', 'failed', 'pending', 'all']).optional().default('all')
})

export class DashboardTasksHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'GET') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handleGet(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    
    // Parse filters
    const filters = taskFiltersSchema.parse({
      status: searchParams.get('status') || 'all',
      priority: searchParams.get('priority') || 'all',
      category: searchParams.get('category'),
      dueInDays: searchParams.get('dueInDays') ? Number(searchParams.get('dueInDays')) : undefined,
      overdue: searchParams.get('overdue') === 'true'
    })

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Build where clause for tasks
    const where: any = {
      couple_id: couple.id
    }

    if (filters.status !== 'all') {
      where.status = filters.status
    }

    if (filters.priority !== 'all') {
      where.priority = filters.priority
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.dueInDays) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + filters.dueInDays)
      where.due_date = {
        lte: endOfDay(futureDate)
      }
    }

    if (filters.overdue) {
      where.due_date = {
        lt: startOfDay(new Date())
      }
      where.is_completed = false
    }

    // Get tasks
    const tasks = await prisma.checklist_items.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { due_date: 'asc' },
        { created_at: 'desc' }
      ]
    })

    // Get task statistics
    const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
      prisma.checklist_items.count({
        where: { couple_id: couple.id }
      }),
      prisma.checklist_items.count({
        where: { couple_id: couple.id, is_completed: true }
      }),
      prisma.checklist_items.count({
        where: {
          couple_id: couple.id,
          is_completed: false,
          due_date: { lt: startOfDay(new Date()) }
        }
      })
    ])

    // Get tasks by category
    const tasksByCategory = await prisma.checklist_items.groupBy({
      by: ['category'],
      where: { couple_id: couple.id },
      _count: true
    })

    // Get upcoming tasks (next 7 days)
    const upcomingTasks = await prisma.checklist_items.findMany({
      where: {
        couple_id: couple.id,
        is_completed: false,
        due_date: {
          gte: startOfDay(new Date()),
          lte: endOfDay(subDays(new Date(), -7))
        }
      },
      orderBy: { due_date: 'asc' },
      take: 5
    })

    return this.successResponse({
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.is_completed ? 'completed' : 
               (task.due_date && task.due_date < new Date() ? 'overdue' : 'pending'),
        dueDate: task.due_date,
        isCompleted: task.is_completed,
        completedAt: task.completed_at,
        notes: task.notes,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      })),
      statistics: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      categories: tasksByCategory.map(cat => ({
        name: cat.category,
        count: cat._count
      })),
      upcoming: upcomingTasks.map(task => ({
        id: task.id,
        title: task.title,
        dueDate: task.due_date,
        priority: task.priority,
        category: task.category
      }))
    })
  }
}

export class DashboardMessagesPreviewHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'GET') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handleGet(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    
    // Parse options
    const options = messagesPreviewSchema.parse({
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
      type: searchParams.get('type') || 'all',
      status: searchParams.get('status') || 'all'
    })

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Build where clause
    const where: any = {
      couple_id: couple.id
    }

    if (options.type !== 'all') {
      where.message_type = options.type
    }

    if (options.status !== 'all') {
      where.status = options.status
    }

    // Get recent messages
    const messages = await prisma.message_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: options.limit
    })

    // Get message statistics
    const [totalMessages, sentMessages, failedMessages] = await Promise.all([
      prisma.message_logs.count({
        where: { couple_id: couple.id }
      }),
      prisma.message_logs.count({
        where: { couple_id: couple.id, status: 'sent' }
      }),
      prisma.message_logs.count({
        where: { couple_id: couple.id, status: 'failed' }
      })
    ])

    // Get messages by type
    const messagesByType = await prisma.message_logs.groupBy({
      by: ['message_type'],
      where: { couple_id: couple.id },
      _count: true
    })

    // Get recent activity (last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7)
    const recentActivity = await prisma.message_logs.groupBy({
      by: ['created_at'],
      where: {
        couple_id: couple.id,
        created_at: { gte: sevenDaysAgo }
      },
      _count: true,
      orderBy: { created_at: 'desc' }
    })

    // Group activity by day
    const activityByDay = new Map<string, number>()
    recentActivity.forEach(activity => {
      const day = format(activity.created_at, 'yyyy-MM-dd')
      activityByDay.set(day, (activityByDay.get(day) || 0) + activity._count)
    })

    return this.successResponse({
      messages: messages.map(msg => ({
        id: msg.id,
        recipientName: msg.recipient_name,
        recipientEmail: msg.recipient_email,
        recipientPhone: msg.recipient_phone,
        messageType: msg.message_type,
        subject: msg.subject,
        content: msg.content ? msg.content.substring(0, 100) + '...' : null,
        status: msg.status,
        error: msg.error,
        sentAt: msg.created_at
      })),
      statistics: {
        total: totalMessages,
        sent: sentMessages,
        failed: failedMessages,
        pending: totalMessages - sentMessages - failedMessages,
        successRate: totalMessages > 0 ? Math.round((sentMessages / totalMessages) * 100) : 0
      },
      byType: messagesByType.map(type => ({
        type: type.message_type,
        count: type._count
      })),
      activityTrend: Array.from(activityByDay.entries()).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date))
    })
  }
}