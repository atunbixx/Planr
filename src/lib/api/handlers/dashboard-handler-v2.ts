import { NextRequest } from 'next/server'
import { BaseApiHandler } from '../base-handler'
import { prisma } from '@/lib/prisma'
import { getOnboardingState } from '@/lib/onboarding'

export class DashboardHandlerV2 extends BaseApiHandler {
  
  async getStats(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const userId = this.requireUserId()
      
      // Get couple information using repository - don't require couple to exist yet
      const couple = await this.coupleRepo.findByUserId(userId)
      
      if (!couple) {
        // Check for saved onboarding data if no couple exists yet
        const onboardingData = await getOnboardingState(userId)
        if (onboardingData.stepData && Object.keys(onboardingData.stepData).length > 0) {
          return this.getStatsFromOnboarding(onboardingData.stepData)
        }
        // Return empty stats if no onboarding data either
        return this.getEmptyStats()
      }
      
      const coupleId = couple.id
      
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
      const userId = this.requireUserId()
      
      // Get couple information - return empty if no couple yet
      const couple = await this.coupleRepo.findByUserId(userId)
      if (!couple) {
        return []
      }
      
      const coupleId = couple.id
      
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
            // attendingCount: true, // Temporarily disabled - column missing in database
            invitations: {
              select: {
                status: true,
                attendingCount: true // Get from invitation instead
              },
              take: 1
            }
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
            caption: true,
            createdAt: true,
            photoAlbums: {
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
          description: `RSVP: ${guest.invitations?.[0]?.status || 'pending'} (${guest.invitations?.[0]?.attendingCount || 0} attending)`,
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
          description: photo.photoAlbums?.name || 'No album',
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

  /**
   * Returns stats based on saved onboarding data
   */
  private getStatsFromOnboarding(onboardingStepData: any) {
    const eventData = onboardingStepData.event || {}
    const budgetData = onboardingStepData.budget || {}
    const vendorsData = onboardingStepData.vendors || {}
    const guestsData = onboardingStepData.guests || {}

    // Calculate days until wedding if we have a date
    let daysUntilWedding = null
    if (eventData.weddingDate) {
      const today = new Date()
      const weddingDate = new Date(eventData.weddingDate)
      daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Get vendor categories count
    const vendorCategoriesCount = vendorsData.categories ? vendorsData.categories.length : 0

    return {
      wedding: {
        date: eventData.weddingDate ? new Date(eventData.weddingDate).toISOString() : null,
        daysUntil: daysUntilWedding,
        venue: {
          name: eventData.venueName || null,
          location: eventData.venueLocation || null
        },
        guestCount: eventData.estimatedGuestCount || 0
      },
      guests: {
        total: eventData.estimatedGuestCount || 0,
        confirmed: 0,
        pending: guestsData.skipped ? 0 : eventData.estimatedGuestCount || 0,
        declined: 0,
        totalAttending: eventData.estimatedGuestCount || 0
      },
      budget: {
        totalBudget: budgetData.totalBudget || 0,
        totalAllocated: budgetData.totalBudget || 0,
        totalSpent: 0,
        remaining: budgetData.totalBudget || 0,
        percentageSpent: 0,
        categoryCount: Object.keys(budgetData).filter(key => key !== 'totalBudget').length,
        expenseCount: 0
      },
      vendors: {
        total: vendorCategoriesCount,
        booked: 0,
        pending: vendorCategoriesCount,
        contacted: 0
      },
      checklist: {
        total: 10, // Default checklist items
        completed: 3, // Basic onboarding steps completed
        pending: 7,
        completionPercentage: 30,
        dueSoon: 2
      },
      photos: {
        totalPhotos: 0,
        totalAlbums: 0,
        favoriteCount: 0
      },
      messages: {
        total: 0,
        sent: 0,
        scheduled: 0,
        draft: 0,
        failed: 0
      }
    }
  }

  /**
   * Returns empty stats for users who haven't completed onboarding
   */
  private getEmptyStats() {
    return {
      wedding: {
        daysUntil: null,
        date: null,
        venue: null
      },
      budget: {
        totalBudget: 0,
        totalSpent: 0,
        remaining: 0,
        percentageSpent: 0
      },
      guests: {
        total: 0,
        confirmed: 0,
        pending: 0,
        declined: 0
      },
      vendors: {
        total: 0,
        booked: 0,
        pending: 0,
        contacted: 0
      },
      checklist: {
        total: 0,
        completed: 0,
        dueSoon: 0
      },
      photos: {
        totalPhotos: 0,
        totalAlbums: 0
      }
    }
  }
}