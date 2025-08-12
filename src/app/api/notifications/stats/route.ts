import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '@/lib/api/base-handler'
import { notificationService } from '@/lib/notifications/notification-service'
import { prisma } from '@/lib/prisma'
import { cache, getCacheKey, getCacheTags, CACHE_TTL } from '@/lib/cache'
import { NotificationCategory, NotificationPriority } from '@/lib/notifications/types'

class NotificationStatsHandler extends BaseAPIHandler {
  // GET /api/notifications/stats - Get notification statistics
  async GET(request: NextRequest) {
    try {
      const auth = await this.requireAuth(request)
      
      const cacheKey = `${getCacheKey.notifications(auth.userId)}:stats`
      const cached = cache.get(cacheKey)
      if (cached) return this.successResponse(cached)

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const baseWhere = {
        userId: auth.userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      }

      const [
        totalNotifications,
        unreadNotifications,
        categoryStats,
        priorityStats,
        todayCount,
        weekCount,
        monthCount
      ] = await Promise.all([
        // Total notifications
        prisma.notification.count({ where: baseWhere }),
        
        // Unread notifications
        prisma.notification.count({ 
          where: { ...baseWhere, read: false } 
        }),
        
        // By category
        prisma.notification.groupBy({
          by: ['category'],
          where: baseWhere,
          _count: { category: true }
        }),
        
        // By priority
        prisma.notification.groupBy({
          by: ['priority'],
          where: baseWhere,
          _count: { priority: true }
        }),
        
        // Today's notifications
        prisma.notification.count({
          where: {
            ...baseWhere,
            createdAt: { gte: todayStart }
          }
        }),
        
        // This week's notifications
        prisma.notification.count({
          where: {
            ...baseWhere,
            createdAt: { gte: weekStart }
          }
        }),
        
        // This month's notifications
        prisma.notification.count({
          where: {
            ...baseWhere,
            createdAt: { gte: monthStart }
          }
        })
      ])

      // Process category stats
      const byCategory = Object.values(NotificationCategory).reduce((acc, category) => {
        const stat = categoryStats.find(s => s.category === category)
        acc[category] = stat ? stat._count.category : 0
        return acc
      }, {} as Record<NotificationCategory, number>)

      // Process priority stats
      const byPriority = Object.values(NotificationPriority).reduce((acc, priority) => {
        const stat = priorityStats.find(s => s.priority === priority)
        acc[priority] = stat ? stat._count.priority : 0
        return acc
      }, {} as Record<NotificationPriority, number>)

      const stats = {
        total: totalNotifications,
        unread: unreadNotifications,
        byCategory,
        byPriority,
        recentActivity: {
          today: todayCount,
          thisWeek: weekCount,
          thisMonth: monthCount
        }
      }

      // Cache for 2 minutes
      cache.set(cacheKey, stats, CACHE_TTL.SHORT, [getCacheTags.notifications(auth.userId)])
      
      return this.successResponse(stats)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

const handler = new NotificationStatsHandler()
export { handler as GET }