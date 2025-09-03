import { z } from 'zod'

export const CreateNotificationDto = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  entityRef: z.string().optional(),
})

export const NotificationResponseDto = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable().optional(),
  entityRef: z.string().nullable().optional(),
  status: z.enum(['unread','read']),
  readAt: z.union([z.string(), z.date()]).nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
})

export const NotificationListResponseDto = z.object({
  notifications: z.array(NotificationResponseDto),
  total: z.number(),
  unread: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export type CreateNotificationInput = z.infer<typeof CreateNotificationDto>
export type NotificationResponse = z.infer<typeof NotificationResponseDto>
export type NotificationListResponse = z.infer<typeof NotificationListResponseDto>

