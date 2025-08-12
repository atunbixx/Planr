import { NotificationData, NotificationType, NotificationPriority, NotificationCategory, NotificationPreferences, NotificationChannel, RealtimeNotificationEvent } from './types'
import { prisma } from '@/lib/prisma'
import { cache, getCacheKey, getCacheTags, CACHE_TTL } from '@/lib/cache'

export class NotificationService {
  private channels: NotificationChannel[] = []
  private templates = new Map<NotificationType, any>()

  constructor() {
    this.initializeTemplates()
  }

  // Register notification channels (email, push, SMS)
  registerChannel(channel: NotificationChannel) {
    this.channels.push(channel)
  }

  // Create and send a notification
  async createNotification(data: Omit<NotificationData, 'id' | 'createdAt' | 'read'>): Promise<NotificationData> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          coupleId: data.coupleId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data as any,
          priority: data.priority,
          category: data.category,
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          expiresAt: data.expiresAt,
          read: false,
        },
      })

      const notificationData: NotificationData = {
        id: notification.id,
        userId: notification.userId,
        coupleId: notification.coupleId,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        data: notification.data as any,
        read: notification.read,
        priority: notification.priority as NotificationPriority,
        category: notification.category as NotificationCategory,
        actionUrl: notification.actionUrl || undefined,
        actionLabel: notification.actionLabel || undefined,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt || undefined,
      }

      // Clear user's notification cache
      cache.invalidateByTag(getCacheTags.notifications(data.userId))

      // Send via registered channels
      await this.deliverNotification(notificationData)

      // Emit real-time event
      await this.emitRealtimeEvent({
        type: 'notification',
        data: notificationData,
        timestamp: new Date(),
      })

      return notificationData
    } catch (error) {
      console.error('Error creating notification:', error)
      throw new Error('Failed to create notification')
    }
  }

  // Get notifications for a user
  async getUserNotifications(
    userId: string,
    options: {
      page?: number
      pageSize?: number
      unreadOnly?: boolean
      category?: NotificationCategory
      priority?: NotificationPriority
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 20,
      unreadOnly = false,
      category,
      priority
    } = options

    const cacheKey = `${getCacheKey.notifications(userId)}:${page}:${pageSize}:${unreadOnly}:${category}:${priority}`
    
    return cache.get(cacheKey) || await this.cacheQuery(
      cacheKey,
      async () => {
        const where: any = {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }

        if (unreadOnly) where.read = false
        if (category) where.category = category
        if (priority) where.priority = priority

        const [notifications, total] = await Promise.all([
          prisma.notification.findMany({
            where,
            orderBy: [
              { priority: 'desc' },
              { createdAt: 'desc' }
            ],
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          prisma.notification.count({ where }),
        ])

        return {
          notifications: notifications.map(this.mapPrismaNotification),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          hasNextPage: page * pageSize < total,
          hasPreviousPage: page > 1,
        }
      },
      userId,
      CACHE_TTL.SHORT
    )
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })

      // Clear cache
      cache.invalidateByTag(getCacheTags.notifications(userId))

      // Emit real-time event
      await this.emitRealtimeEvent({
        type: 'notification_read',
        data: { id: notificationId, userId },
        timestamp: new Date(),
      })

      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      })

      cache.invalidateByTag(getCacheTags.notifications(userId))
      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId,
        },
      })

      cache.invalidateByTag(getCacheTags.notifications(userId))

      await this.emitRealtimeEvent({
        type: 'notification_deleted',
        data: { id: notificationId, userId },
        timestamp: new Date(),
      })

      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  // Get notification preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const cacheKey = getCacheKey.notificationPreferences(userId)
    
    return cache.get(cacheKey) || await this.cacheQuery(
      cacheKey,
      async () => {
        const preferences = await prisma.notificationPreferences.findUnique({
          where: { userId },
        })

        return preferences ? {
          id: preferences.id,
          userId: preferences.userId,
          emailNotifications: preferences.emailNotifications,
          pushNotifications: preferences.pushNotifications,
          smsNotifications: preferences.smsNotifications,
          categories: preferences.categories as any,
          quietHours: preferences.quietHours as any,
          frequency: preferences.frequency as any,
        } : null
      },
      userId,
      CACHE_TTL.LONG
    )
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'userId'>>
  ): Promise<NotificationPreferences> {
    try {
      const updated = await prisma.notificationPreferences.upsert({
        where: { userId },
        update: preferences as any,
        create: {
          userId,
          ...preferences as any,
        },
      })

      cache.invalidateByTag(getCacheTags.notificationPreferences(userId))

      return {
        id: updated.id,
        userId: updated.userId,
        emailNotifications: updated.emailNotifications,
        pushNotifications: updated.pushNotifications,
        smsNotifications: updated.smsNotifications,
        categories: updated.categories as any,
        quietHours: updated.quietHours as any,
        frequency: updated.frequency as any,
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw new Error('Failed to update notification preferences')
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })

      console.log(`Cleaned up ${result.count} expired notifications`)
      return result.count
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error)
      return 0
    }
  }

  // Deliver notification via registered channels
  private async deliverNotification(notification: NotificationData) {
    try {
      const preferences = await this.getNotificationPreferences(notification.userId)
      if (!preferences) return

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        return
      }

      // Send via available channels
      const deliveryPromises = this.channels
        .filter(channel => channel.isAvailable())
        .map(channel => channel.send(notification, preferences))

      await Promise.allSettled(deliveryPromises)
    } catch (error) {
      console.error('Error delivering notification:', error)
    }
  }

  // Check if current time is in user's quiet hours
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false

    const now = new Date()
    const userTimezone = preferences.quietHours.timezone || 'UTC'
    
    // Simple quiet hours check - in production, use proper timezone handling
    const currentHour = now.getHours()
    const startHour = parseInt(preferences.quietHours.startTime.split(':')[0])
    const endHour = parseInt(preferences.quietHours.endTime.split(':')[0])

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour
    } else {
      return currentHour >= startHour || currentHour < endHour
    }
  }

  // Emit real-time notification event
  private async emitRealtimeEvent(event: RealtimeNotificationEvent) {
    // Send via Server-Sent Events
    try {
      if (typeof window === 'undefined') {
        // Server-side: import dynamically to avoid circular dependency
        const { sendUpdateToUser } = await import('@/app/api/notifications/stream/route')
        
        let userId: string
        if (event.type === 'notification' && 'userId' in event.data) {
          userId = (event.data as NotificationData).userId
        } else if ('userId' in event.data) {
          userId = (event.data as any).userId
        } else {
          return // No userId available
        }
        
        sendUpdateToUser(userId, event.type, event.data)
      }
    } catch (error) {
      console.error('Error emitting real-time event:', error)
    }
  }

  // Initialize notification templates
  private initializeTemplates() {
    // RSVP templates
    this.templates.set(NotificationType.RSVP_RECEIVED, {
      title: 'RSVP Received',
      message: '{guestName} has responded to your wedding invitation',
      variables: ['guestName', 'response']
    })

    this.templates.set(NotificationType.RSVP_DEADLINE_APPROACHING, {
      title: 'RSVP Deadline Approaching',
      message: 'Your RSVP deadline is in {days} days',
      variables: ['days', 'deadline']
    })

    // Add more templates as needed...
  }

  // Helper methods
  private async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    userId: string,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const result = await queryFn()
    cache.set(key, result, ttl, [getCacheTags.notifications(userId)])
    return result
  }

  private mapPrismaNotification = (notification: any): NotificationData => ({
    id: notification.id,
    userId: notification.userId,
    coupleId: notification.coupleId,
    type: notification.type as NotificationType,
    title: notification.title,
    message: notification.message,
    data: notification.data as any,
    read: notification.read,
    priority: notification.priority as NotificationPriority,
    category: notification.category as NotificationCategory,
    actionUrl: notification.actionUrl || undefined,
    actionLabel: notification.actionLabel || undefined,
    createdAt: notification.createdAt,
    expiresAt: notification.expiresAt || undefined,
  })
}

// Singleton instance
export const notificationService = new NotificationService()