import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/features/couples'
import { cache } from '@/lib/cache'
import { getAdminClient } from '@/lib/supabase-admin-transformed'

export class DashboardStatsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get couple using Supabase ID
    const coupleData = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!coupleData) {
      // Return minimal stats if no couple exists yet
      return this.successResponse({
        data: this.getEmptyStats(authContext.email)
      })
    }
    const couple = coupleData

    // Check cache
    const cacheKey = `dashboard-stats:couple:${couple.id}`
    const cachedData = await cache.get<any>(cacheKey)
    
    if (cachedData) {
      return this.successResponse({ data: cachedData })
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: authContext.userId },
      select: {
        firstName: true,
        lastName: true
      }
    })

    // Calculate wedding date info
    let daysUntilWedding: number | null = null
    let weddingDate: string | null = null
    let venue: string | null = null

    // With field transformation, we can use camelCase consistently
    if (couple.weddingDate) {
      weddingDate = new Date(couple.weddingDate).toISOString().split('T')[0]
      const today = new Date()
      const weddingDateObj = new Date(couple.weddingDate)
      daysUntilWedding = Math.ceil((weddingDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilWedding < 0) daysUntilWedding = null
    }

    if (couple.venueName) {
      venue = couple.venueName
    }

    // Fetch all stats in parallel for performance
    const [
      guestStats,
      vendorStats,
      taskStats,
      photoStats,
      budgetStats,
      upcomingPayments,
      recentActivity
    ] = await Promise.all([
      this.getGuestStats(couple.id),
      this.getVendorStats(couple.id),
      this.getTaskStats(couple.id),
      this.getPhotoStats(couple.id),
      this.getBudgetStats(couple.id),
      this.getUpcomingPayments(couple.id),
      this.getRecentActivity(couple.id)
    ])

    // Calculate budget info - now we can use camelCase consistently
    const totalBudget = couple.totalBudget ? Number(couple.totalBudget) : 0
    const totalSpent = budgetStats?.totalSpent || 0
    const budgetRemaining = totalBudget - totalSpent
    const budgetUsedPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

    const stats = {
      daysUntilWedding,
      weddingDate,
      venue,
      totalBudget,
      totalSpent,
      budgetRemaining,
      budgetUsedPercentage,
      userInfo: {
        firstName: user?.firstName || 'User',
        lastName: user?.lastName || '',
        partner1Name: couple.partner1Name || 'Partner 1',
        partner2Name: couple.partner2Name || 'Partner 2'
      },
      guestStats,
      vendorStats,
      taskStats,
      photoStats,
      upcomingPayments,
      recentActivity
    }

    // Cache for 2 minutes
    await cache.set(cacheKey, stats, 120000)

    // Return with no-cache headers for real-time updates
    const response = this.successResponse({ data: stats })
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  }

  private async getGuestStats(coupleId: string) {
    const total = await prisma.guest.count({ where: { coupleId } })
    
    // Get RSVP stats from invitations table since that's where status is stored
    const invitationStats = await prisma.invitation.groupBy({
      by: ['status'],
      where: { 
        couple_id: coupleId,
        guest: { coupleId }
      },
      _count: true
    })

    const statsByStatus = invitationStats.reduce((acc, stat) => {
      acc[stat.status || 'pending'] = stat._count
      return acc
    }, {} as Record<string, number>)

    const confirmed = statsByStatus.confirmed || statsByStatus.attending || 0
    const declined = statsByStatus.declined || 0
    const pending = total - confirmed - declined

    return {
      total,
      confirmed,
      pending,
      declined,
      needsRsvp: pending
    }
  }

  private async getVendorStats(coupleId: string) {
    const [total, statusStats] = await Promise.all([
      prisma.vendor.count({ where: { coupleId } }),
      prisma.vendor.groupBy({
        by: ['status'],
        where: { coupleId },
        _count: true
      })
    ])

    const statsByStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status || 'potential'] = stat._count
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      booked: statsByStatus.booked || 0,
      pending: statsByStatus.quoted || 0,
      contacted: statsByStatus.contacted || 0,
      potential: statsByStatus.potential || 0
    }
  }

  private async getTaskStats(coupleId: string) {
    const today = new Date()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [total, completed, overdue, thisWeek] = await Promise.all([
      prisma.tasks.count({ where: { couple_id: coupleId } }),
      prisma.tasks.count({ where: { couple_id: coupleId, completed: true } }),
      prisma.tasks.count({ 
        where: { 
          couple_id: coupleId, 
          completed: false,
          due_date: { lt: today }
        } 
      }),
      prisma.tasks.count({ 
        where: { 
          couple_id: coupleId, 
          completed: false,
          due_date: { 
            gte: today,
            lte: weekFromNow
          }
        } 
      })
    ])

    return {
      total,
      completed,
      pending: total - completed,
      overdue,
      thisWeek
    }
  }

  private async getPhotoStats(coupleId: string) {
    const [total, albums, favoriteCount, recentCount] = await Promise.all([
      prisma.photo.count({ where: { coupleId } }),
      prisma.photoAlbum.count({ where: { coupleId } }),
      prisma.photo.count({ where: { coupleId, isFavorite: true } }),
      prisma.photo.count({ 
        where: { 
          coupleId,
          createdAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        } 
      })
    ])

    const withAlbums = await prisma.photo.count({ 
      where: { 
        coupleId,
        albumId: { not: null }
      } 
    })

    return {
      total,
      albums,
      withAlbums,
      recent: recentCount
    }
  }

  private async getBudgetStats(coupleId: string) {
    // Try BudgetExpense table first (newer schema)
    try {
      const budgetExpenses = await prisma.budgetExpense.aggregate({
        where: { coupleId: coupleId },
        _sum: { amount: true }
      })
      
      return {
        totalSpent: budgetExpenses._sum.amount?.toNumber() || 0
      }
    } catch (error) {
      // No fallback needed - unified schema only
      console.error('Budget calculation error:', error)
      return {
        totalSpent: 0
      }
    }
  }

  private async getUpcomingPayments(coupleId: string) {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const today = new Date()

    // Try BudgetExpense table first (newer schema)
    try {
      const upcomingBudgetExpenses = await prisma.budgetExpense.findMany({
        where: {
          coupleId: coupleId,
          paymentStatus: { in: ['pending', 'overdue'] },
          dueDate: { lte: thirtyDaysFromNow }
        },
        include: {
          vendor: true
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      })

      return upcomingBudgetExpenses.map(expense => {
        const dueDate = expense.dueDate
        const daysUntil = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
        
        return {
          id: expense.id,
          vendor: expense.vendor?.name || expense.description || 'Unknown Vendor',
          category: 'Other',
          amount: Number(expense.amount || 0),
          dueDate: expense.dueDate?.toISOString().split('T')[0] || null,
          daysUntil,
          status: expense.paymentStatus || 'pending',
          isOverdue: expense.dueDate ? expense.dueDate < today : false
        }
      })
    } catch (error) {
      // Fallback to expenses table (legacy schema) - note: no payment_status or due_date in this table
      const upcomingExpenses = await prisma.expenses.findMany({
        where: {
          couple_id: coupleId,
          expense_date: { lte: thirtyDaysFromNow }
        },
        orderBy: { expense_date: 'asc' },
        take: 5
      })

      return upcomingExpenses.map(expense => {
        const expenseDate = expense.expense_date
        const daysUntil = expenseDate ? Math.ceil((expenseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0
        
        return {
          id: expense.id,
          vendor: expense.description || 'Unknown Vendor',
          category: 'Other',
          amount: Number(expense.amount || 0),
          dueDate: expense.expense_date?.toISOString().split('T')[0] || null,
          daysUntil,
          status: 'pending',
          isOverdue: expense.expense_date ? expense.expense_date < today : false
        }
      })
    }
  }

  private async getRecentActivity(coupleId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get recent activities from different sources
    const [recentGuests, recentVendors, recentTasks, recentPhotos] = await Promise.all([
      prisma.guest.findMany({
        where: {
          coupleId,
          createdAt: { gte: sevenDaysAgo }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10
      }),
      prisma.vendor.findMany({
        where: {
          coupleId,
          createdAt: { gte: sevenDaysAgo }
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10
      }),
      prisma.tasks.findMany({
        where: {
          couple_id: coupleId,
          OR: [
            { created_at: { gte: sevenDaysAgo } },
            { updated_at: { gte: sevenDaysAgo } }
          ]
        },
        select: {
          id: true,
          title: true,
          completed: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { updated_at: 'desc' },
        take: 10
      }),
      prisma.photo.count({
        where: {
          coupleId,
          createdAt: { gte: sevenDaysAgo }
        }
      })
    ])

    // Combine and format activities
    const activities = []

    // Add guest activities
    recentGuests.forEach(guest => {
      activities.push({
        id: `guest-${guest.id}`,
        type: 'guest_added',
        description: `Added guest: ${guest.firstName} ${guest.lastName}`,
        timestamp: guest.createdAt,
        icon: '👤'
      })
    })

    // Add vendor activities
    recentVendors.forEach(vendor => {
      activities.push({
        id: `vendor-${vendor.id}`,
        type: 'vendor_added',
        description: `Added vendor: ${vendor.name}`,
        timestamp: vendor.createdAt,
        icon: '🏢'
      })
    })

    // Add task activities
    recentTasks.forEach(task => {
      if (task.completed && task.updated_at && task.updated_at >= sevenDaysAgo) {
        activities.push({
          id: `task-completed-${task.id}`,
          type: 'task_completed',
          description: `Completed task: ${task.title}`,
          timestamp: task.updated_at,
          icon: '✅'
        })
      } else {
        activities.push({
          id: `task-${task.id}`,
          type: 'task_added',
          description: `Added task: ${task.title}`,
          timestamp: task.created_at || new Date(),
          icon: '📋'
        })
      }
    })

    // Add photo activity summary if any
    if (recentPhotos > 0) {
      activities.push({
        id: `photos-${Date.now()}`,
        type: 'photos_uploaded',
        description: `Uploaded ${recentPhotos} new photo${recentPhotos > 1 ? 's' : ''}`,
        timestamp: new Date(),
        icon: '📸'
      })
    }

    // Sort by timestamp and take the most recent 10
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
      .map(activity => {
        // Extract the base type for the enum value
        let type: 'vendor' | 'guest' | 'budget' | 'photo' | 'task' = 'task'
        if (activity.type.includes('guest')) type = 'guest'
        else if (activity.type.includes('vendor')) type = 'vendor'
        else if (activity.type.includes('photo')) type = 'photo'
        else if (activity.type.includes('task')) type = 'task'
        else if (activity.type.includes('budget') || activity.type.includes('expense')) type = 'budget'
        
        return {
          type,
          action: activity.type.includes('completed') ? 'completed' : 'added',
          description: activity.description,
          timestamp: activity.timestamp.toISOString()
        }
      })
  }

  private getEmptyStats(email: string) {
    return {
      daysUntilWedding: null,
      weddingDate: null,
      venue: null,
      totalBudget: 0,
      totalSpent: 0,
      budgetRemaining: 0,
      budgetUsedPercentage: 0,
      userInfo: {
        firstName: email.split('@')[0],
        lastName: '',
        partner1Name: 'Partner 1',
        partner2Name: 'Partner 2'
      },
      guestStats: {
        total: 0,
        confirmed: 0,
        pending: 0,
        declined: 0,
        needsRsvp: 0
      },
      vendorStats: {
        total: 0,
        booked: 0,
        pending: 0,
        contacted: 0,
        potential: 0
      },
      taskStats: {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        thisWeek: 0
      },
      photoStats: {
        total: 0,
        albums: 0,
        withAlbums: 0,
        recent: 0
      },
      upcomingPayments: [],
      recentActivity: []
    }
  }
}