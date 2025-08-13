import { NextRequest } from 'next/server'
import { BaseApiHandler } from '../base-handler'
import { prisma } from '@/lib/prisma'

export class DashboardHandlerV2 extends BaseApiHandler {
  
  async getStats(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Get couple information using repository
      const couple = await this.coupleRepo.findById(coupleId)
      
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
    return await this.guestRepo.getStats(coupleId)
  }
  
  private async getBudgetStats(coupleId: string) {
    const summary = await this.budgetRepo.getBudgetSummary(coupleId)
    
    return {
      totalBudget: summary.totalBudget,
      totalAllocated: summary.totalAllocated,
      totalSpent: summary.totalSpent,
      remaining: summary.totalRemaining,
      percentageSpent: summary.spentPercentage,
      categoryCount: summary.categories.length,
      expenseCount: summary.recentExpenses.length
    }
  }
  
  private async getVendorStats(coupleId: string) {
    return await this.vendorRepo.getStats(coupleId)
  }
  
  private async getChecklistStats(coupleId: string) {
    const [total, completed] = await Promise.all([
      prisma.tasks.count({
        where: { couple_id: coupleId }
      }),
      prisma.tasks.count({
        where: {
          couple_id: coupleId,
          completed: true
        }
      })
    ])
    
    const pending = total - completed
    const completionPercentage = total > 0 ? (completed / total) * 100 : 0
    
    // Get items due soon (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const dueSoon = await prisma.tasks.count({
      where: {
        couple_id: coupleId,
        completed: false,
        due_date: {
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
        where: { coupleId }
      }),
      prisma.photoAlbum.count({
        where: { coupleId }
      }),
      prisma.photo.count({
        where: {
          coupleId,
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
      where: { coupleId },
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
        prisma.guest.findMany({
          where: { coupleId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            rsvpStatus: true
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
        prisma.message.findMany({
          where: { coupleId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            subject: true,
            messageType: true,
            status: true,
            createdAt: true
          }
        }),
        // Recent photos
        prisma.photo.findMany({
          where: { coupleId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          select: {
            id: true,
            imageUrl: true,
            thumbnailUrl: true,
            caption: true,
            createdAt: true,
            photoAlbum: {
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
          title: `${guest.firstName} ${guest.lastName}`,
          description: `RSVP: ${guest.rsvpStatus}`,
          timestamp: guest.createdAt,
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
          title: message.subject || 'Message',
          description: `${message.messageType} - ${message.status}`,
          timestamp: message.createdAt,
          icon: '✉️',
          data: message
        })),
        ...recentPhotos.map(photo => ({
          id: photo.id,
          type: 'photo' as const,
          title: photo.caption || 'New photo',
          description: photo.photoAlbum?.name || 'No album',
          timestamp: photo.createdAt,
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