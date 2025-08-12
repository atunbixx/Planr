import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/lib/db/services/couple.service'
import { notificationService } from '@/lib/notifications/notification-service'
import { NotificationCategory, NotificationPriority, NotificationType } from '@/lib/notifications/types'

// Validation schemas
const createNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  priority: z.nativeEnum(NotificationPriority),
  category: z.nativeEnum(NotificationCategory),
  data: z.any().optional(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  expiresAt: z.string().datetime().optional()
})

const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  categories: z.record(z.boolean()).optional(),
  doNotDisturbStart: z.string().optional(),
  doNotDisturbEnd: z.string().optional()
})

export class NotificationsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const category = searchParams.get('category') as NotificationCategory
    const priority = searchParams.get('priority') as NotificationPriority

    // Get couple to check if user is a partner
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    // Get notifications for user (could be improved to show shared couple notifications)
    const result = await notificationService.getUserNotifications(authContext.userId, {
      page,
      pageSize,
      unreadOnly,
      category,
      priority
    })

    return this.successResponse(result)
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = createNotificationSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    // Create notification
    const notification = await notificationService.createNotification({
      userId: authContext.userId,
      coupleId: couple?.id,
      type: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      data: validatedData.data,
      priority: validatedData.priority,
      category: validatedData.category,
      actionUrl: validatedData.actionUrl,
      actionLabel: validatedData.actionLabel,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
    })

    return this.successResponse(notification, { action: 'created' })
  }
}

export class NotificationHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const notificationId = context?.params?.id

    if (!notificationId) {
      return this.errorResponse('INVALID_REQUEST', 'Notification ID required', 400)
    }

    // Mark notification as read (verify ownership)
    const success = await notificationService.markAsRead(notificationId, authContext.userId)

    if (!success) {
      return this.errorResponse('NOT_FOUND', 'Notification not found', 404)
    }

    return this.successResponse({ id: notificationId, read: true }, { action: 'marked_read' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const notificationId = context?.params?.id

    if (!notificationId) {
      return this.errorResponse('INVALID_REQUEST', 'Notification ID required', 400)
    }

    // Delete notification (verify ownership)
    const deleted = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: authContext.userId
      }
    })

    if (deleted.count === 0) {
      return this.errorResponse('NOT_FOUND', 'Notification not found', 404)
    }

    return this.successResponse({ id: notificationId }, { action: 'deleted' })
  }
}

export class NotificationPreferencesHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'PATCH':
          return await this.handlePatch(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get user preferences
    const preferences = await notificationService.getUserPreferences(authContext.userId)

    return this.successResponse(preferences)
  }

  private async handlePatch(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = updatePreferencesSchema.parse(body)

    // Update preferences
    const preferences = await notificationService.updateUserPreferences(
      authContext.userId,
      validatedData
    )

    return this.successResponse(preferences, { action: 'updated' })
  }
}

export class NotificationStreamHandler extends BaseAPIHandler {
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

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    // Create a stream
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue('data: {"type":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n')

        // Here you would set up real-time notification subscription
        // For now, we'll just send a ping every 30 seconds
        const interval = setInterval(() => {
          controller.enqueue('data: {"type":"ping","timestamp":"' + new Date().toISOString() + '"}\n\n')
        }, 30000)

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      }
    })

    return new NextResponse(stream, { headers })
  }
}

export class NotificationActionsHandler extends BaseAPIHandler {
  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handlePost(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    const { action, notificationIds } = body

    if (!action || !notificationIds || !Array.isArray(notificationIds)) {
      return this.errorResponse('INVALID_REQUEST', 'Action and notification IDs required', 400)
    }

    let result
    switch (action) {
      case 'mark_read':
        result = await notificationService.markMultipleAsRead(notificationIds, authContext.userId)
        break
      case 'mark_unread':
        result = await notificationService.markMultipleAsUnread(notificationIds, authContext.userId)
        break
      case 'delete':
        result = await notificationService.deleteMultiple(notificationIds, authContext.userId)
        break
      default:
        return this.errorResponse('INVALID_ACTION', 'Invalid action', 400)
    }

    return this.successResponse({
      action,
      affected: result.count,
      notificationIds
    })
  }
}