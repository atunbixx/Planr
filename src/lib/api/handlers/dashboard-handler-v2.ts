import { NextRequest } from 'next/server'
import { BaseApiHandler } from '../base-handler'
import { prisma } from '@/lib/prisma'

export class DashboardHandlerV2 extends BaseApiHandler {
  
  async getStats(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Get couple information
      const couple = await prisma.couple.findUnique({
        where: { id: coupleId }
      })
      
      if (!couple) {
        throw new Error('Couple not found')
      }
      
      // Calculate days until wedding
      const today = new Date()
      const weddingDate = couple.weddingDate
      const daysUntilWedding = weddingDate 
        ? Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      // Get statistics in parallel
      const [
        guestStats,
        budgetStats,
        vendorStats,
        checklistStats,
        photoStats,
        messageStats
      ] = await Promise.all([
        // Guest statistics
        this.getGuestStats(coupleId),
        // Budget statistics
        this.getBudgetStats(coupleId),
        // Vendor statistics
        this.getVendorStats(coupleId),
        // Checklist statistics
        this.getChecklistStats(coupleId),
        // Photo statistics
        this.getPhotoStats(coupleId),
        // Message statistics
        this.getMessageStats(coupleId)
      ])
      
      return {
        wedding: {
          date: weddingDate?.toISOString(),
          daysUntil: daysUntilWedding,
          venue: {
            name: couple.venueName,
            location: couple.venueLocation
          },
          guestCount: couple.guestCountEstimate || 0
        },
        guests: guestStats,
        budget: budgetStats,
        vendors: vendorStats,
        checklist: checklistStats,
        photos: photoStats,
        messages: messageStats
      }
    })
  }
  
  private async getGuestStats(coupleId: string) {
    const [total, invitations] = await Promise.all([
      prisma.guest.count({
        where: { coupleId: coupleId }
      }),
      prisma.invitation.groupBy({
        by: ['status'],
        where: { couple_id: coupleId },
        _count: true
      })
    ])
    
    const stats = {
      total,
      confirmed: 0,
      declined: 0,
      pending: 0,
      notInvited: 0
    }
    
    invitations.forEach(stat => {
      switch (stat.status) {
        case 'confirmed':
        case 'accepted':
          stats.confirmed = stat._count
          break
        case 'declined':
          stats.declined = stat._count
          break
        case 'pending':
          stats.pending = stat._count
          break
      }
    })
    
    return stats
  }
  
  private async getBudgetStats(coupleId: string) {
    // Get couple for total budget
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: { totalBudget: true }
    })
    
    // Get category statistics
    const categories = await prisma.budgetCategory.findMany({
      where: { coupleId },
      include: {
        _count: {
          select: { budgetExpenses: true }
        }
      }
    })
    
    // Get expense totals
    const expenses = await prisma.budgetExpense.aggregate({
      where: { coupleId },
      _sum: { amount: true },
      _count: true
    })
    
    const totalBudget = Number(couple?.totalBudget || 0)
    const totalAllocated = categories.reduce((sum, cat) => sum + Number(cat.allocatedAmount || 0), 0)
    const totalSpent = Number(expenses._sum.amount || 0)
    
    return {
      totalBudget,
      totalAllocated,
      totalSpent,
      remaining: totalBudget - totalSpent,
      percentageSpent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      categoryCount: categories.length,
      expenseCount: expenses._count
    }
  }
  
  private async getVendorStats(coupleId: string) {
    const statusStats = await prisma.vendor.groupBy({
      by: ['status'],
      where: { coupleId: coupleId },
      _count: true,
      _sum: {
        estimatedCost: true,
        actualCost: true
      }
    })
    
    const stats = {
      total: 0,
      booked: 0,
      contacted: 0,
      pending: 0,
      totalEstimatedCost: 0,
      totalActualCost: 0
    }
    
    statusStats.forEach(stat => {
      stats.total += stat._count
      stats.totalEstimatedCost += Number(stat._sum.estimatedCost || 0)
      stats.totalActualCost += Number(stat._sum.actualCost || 0)
      
      switch (stat.status) {
        case 'booked':
          stats.booked = stat._count
          break
        case 'contacted':
        case 'in_discussion':
          stats.contacted += stat._count
          break
        case 'potential':
        case 'quote_requested':
          stats.pending += stat._count
          break
      }
    })
    
    return stats
  }
  
  private async getChecklistStats(coupleId: string) {
    const [total, completed] = await Promise.all([
      prisma.checklistItem.count({
        where: { coupleId: coupleId }
      }),
      prisma.checklistItem.count({
        where: {
          coupleId: coupleId,
          completed: true
        }
      })
    ])
    
    const pending = total - completed
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0
    
    // Get items due soon (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const dueSoon = await prisma.checklistItem.count({
      where: {
        coupleId: coupleId,
        completed: false,
        dueDate: {
          lte: nextWeek,
          gte: new Date()
        }
      }
    })
    
    return {
      total,
      completed,
      pending,
      completionPercentage,
      dueSoon
    }
  }
  
  private async getPhotoStats(coupleId: string) {
    const [totalPhotos, totalAlbums, favoriteCount] = await Promise.all([
      prisma.photo.count({
        where: { coupleId: coupleId }
      }),
      prisma.photoAlbum.count({
        where: { coupleId: coupleId }
      }),
      prisma.photo.count({
        where: {
          coupleId: coupleId,
          isFavorite: true
        }
      })
    ])
    
    return {
      totalPhotos,
      totalAlbums,
      favoriteCount
    }
  }
  
  private async getMessageStats(coupleId: string) {
    const statusStats = await prisma.message.groupBy({
      by: ['status'],
      where: { coupleId: coupleId },
      _count: true
    })
    
    const stats = {
      total: 0,
      sent: 0,
      scheduled: 0,
      draft: 0,
      failed: 0
    }
    
    statusStats.forEach(stat => {
      stats.total += stat._count
      switch (stat.status) {
        case 'sent':
          stats.sent = stat._count
          break
        case 'scheduled':
          stats.scheduled = stat._count
          break
        case 'draft':
          stats.draft = stat._count
          break
        case 'failed':
          stats.failed = stat._count
          break
      }
    })
    
    return stats
  }
  
  // Get recent activity
  async getRecentActivity(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const limit = parseInt(url.searchParams.get('limit') || '10')
      
      // Get recent activities from different sources
      const [
        recentGuests,
        recentExpenses,
        recentMessages,
        recentPhotos
      ] = await Promise.all([
        // Recent guests
        prisma.guests.findMany({
          where: { couple_id: coupleId },
          orderBy: { created_at: 'desc' },
          take: limit,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            created_at: true,
            rsvp_status: true
          }
        }),
        // Recent expenses
        prisma.budgetExpense.findMany({
          where: { coupleId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            description: true,
            amount: true,
            createdAt: true,
            budgetCategory: {
              select: {
                name: true,
                icon: true
              }
            }
          }
        }),
        // Recent messages
        prisma.messages.findMany({
          where: { couple_id: coupleId },
          orderBy: { created_at: 'desc' },
          take: limit,
          select: {
            id: true,
            subject: true,
            type: true,
            status: true,
            created_at: true,
            guests: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }),
        // Recent photos
        prisma.photos.findMany({
          where: { couple_id: coupleId },
          orderBy: { created_at: 'desc' },
          take: limit,
          select: {
            id: true,
            url: true,
            thumbnail_url: true,
            caption: true,
            created_at: true,
            albums: {
              select: {
                name: true
              }
            }
          }
        })
      ])
      
      // Combine and sort activities
      const activities = [
        ...recentGuests.map(guest => ({
          id: guest.id,
          type: 'guest' as const,
          title: `${guest.first_name} ${guest.last_name}`,
          description: `RSVP: ${guest.rsvp_status}`,
          timestamp: guest.created_at,
          icon: '👤',
          data: guest
        })),
        ...recentExpenses.map(expense => ({
          id: expense.id,
          type: 'expense' as const,
          title: expense.description,
          description: `$${expense.amount.toLocaleString()}`,
          timestamp: expense.createdAt,
          icon: expense.budgetCategory?.icon || '💰',
          data: expense
        })),
        ...recentMessages.map(message => ({
          id: message.id,
          type: 'message' as const,
          title: message.subject,
          description: `${message.type} - ${message.status}`,
          timestamp: message.created_at,
          icon: '✉️',
          data: message
        })),
        ...recentPhotos.map(photo => ({
          id: photo.id,
          type: 'photo' as const,
          title: photo.caption || 'New photo',
          description: photo.albums?.name || 'No album',
          timestamp: photo.created_at,
          icon: '📸',
          data: photo
        }))
      ]
      
      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      
      return activities.slice(0, limit)
    })
  }
}