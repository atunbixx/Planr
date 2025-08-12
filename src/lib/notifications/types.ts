// Notification system types and interfaces

export interface NotificationData {
  id: string
  userId: string
  coupleId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  priority: NotificationPriority
  category: NotificationCategory
  actionUrl?: string
  actionLabel?: string
  createdAt: Date
  expiresAt?: Date
}

export enum NotificationType {
  // RSVP related
  RSVP_RECEIVED = 'rsvp_received',
  RSVP_DEADLINE_APPROACHING = 'rsvp_deadline_approaching',
  RSVP_REMINDER_SENT = 'rsvp_reminder_sent',
  
  // Guest management
  GUEST_ADDED = 'guest_added',
  GUEST_UPDATED = 'guest_updated',
  GUEST_DIETARY_RESTRICTION = 'guest_dietary_restriction',
  
  // Vendor related
  VENDOR_MESSAGE = 'vendor_message',
  VENDOR_CONTRACT_UPDATE = 'vendor_contract_update',
  VENDOR_PAYMENT_DUE = 'vendor_payment_due',
  
  // Budget related
  BUDGET_EXCEEDED = 'budget_exceeded',
  BUDGET_WARNING = 'budget_warning',
  EXPENSE_ADDED = 'expense_added',
  
  // Timeline & tasks
  TASK_DUE = 'task_due',
  TASK_OVERDUE = 'task_overdue',
  MILESTONE_REACHED = 'milestone_reached',
  COUNTDOWN_MILESTONE = 'countdown_milestone',
  
  // Photo related
  PHOTO_SHARED = 'photo_shared',
  ALBUM_CREATED = 'album_created',
  PHOTO_COMMENT = 'photo_comment',
  
  // System notifications
  SYSTEM_UPDATE = 'system_update',
  BACKUP_COMPLETE = 'backup_complete',
  DATA_EXPORT_READY = 'data_export_ready',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationCategory {
  RSVP = 'rsvp',
  GUESTS = 'guests',
  VENDORS = 'vendors',
  BUDGET = 'budget',
  TIMELINE = 'timeline',
  PHOTOS = 'photos',
  SYSTEM = 'system'
}

export interface NotificationPreferences {
  id: string
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  categories: {
    [key in NotificationCategory]: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
  quietHours: {
    enabled: boolean
    startTime: string // HH:mm format
    endTime: string   // HH:mm format
    timezone: string
  }
  frequency: {
    digest: 'immediate' | 'hourly' | 'daily' | 'weekly'
    reminders: boolean
  }
}

export interface NotificationTemplate {
  type: NotificationType
  title: string
  message: string
  emailTemplate?: string
  smsTemplate?: string
  pushTemplate?: string
  variables: string[]
}

export interface NotificationChannel {
  send(notification: NotificationData, preferences: NotificationPreferences): Promise<boolean>
  isAvailable(): boolean
  name: string
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<NotificationCategory, number>
  byPriority: Record<NotificationPriority, number>
  recentActivity: {
    today: number
    thisWeek: number
    thisMonth: number
  }
}

export interface RealtimeNotificationEvent {
  type: 'notification' | 'notification_read' | 'notification_deleted'
  data: NotificationData | { id: string; userId: string }
  timestamp: Date
}