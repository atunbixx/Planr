import { prisma } from '@/lib/db/prisma'
import type { CreateNotificationInput } from '../dto/notification.dto'

export class NotificationRepository {
  async list(userId: string, opts?: { limit?: number; offset?: number; unreadOnly?: boolean }) {
    const limit = opts?.limit ?? 20
    const offset = opts?.offset ?? 0
    const where: any = { userId }
    if (opts?.unreadOnly) where.status = 'unread'
    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, status: 'unread' } }),
    ])
    return { notifications, total, unread, limit, offset }
  }

  async create(userId: string, data: CreateNotificationInput) {
    return prisma.notification.create({ data: { ...data, userId } })
  }

  /**
   * Create a notification if one with the same (userId, type, entityRef, title) doesn't already exist.
   * Returns existing if found, otherwise creates a new record.
   */
  async createOnce(userId: string, data: CreateNotificationInput) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: data.type,
        title: data.title,
        entityRef: data.entityRef || null,
      },
    })
    if (existing) return existing
    return prisma.notification.create({ data: { ...data, userId } })
  }

  async markRead(userId: string, id: string) {
    const updated = await prisma.notification.updateMany({ where: { id, userId, status: 'unread' }, data: { status: 'read', readAt: new Date() } })
    return updated.count > 0
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, status: 'unread' }, data: { status: 'read', readAt: new Date() } })
    return true
  }
}
