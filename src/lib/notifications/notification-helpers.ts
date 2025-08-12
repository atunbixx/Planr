import { notificationService } from './notification-service'
import { NotificationType, NotificationPriority, NotificationCategory, NotificationData } from './types'

// Helper functions to create common notifications

export class NotificationHelpers {
  // RSVP Notifications
  static async rsvpReceived(userId: string, coupleId: string, guestName: string, response: string) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.RSVP_RECEIVED,
      title: 'RSVP Received',
      message: `${guestName} has ${response === 'accepted' ? 'accepted' : 'declined'} your wedding invitation`,
      priority: NotificationPriority.HIGH,
      category: NotificationCategory.RSVP,
      data: { guestName, response },
      actionUrl: '/dashboard/guests',
      actionLabel: 'View Guest List'
    })
  }

  static async rsvpDeadlineApproaching(userId: string, coupleId: string, days: number) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.RSVP_DEADLINE_APPROACHING,
      title: 'RSVP Deadline Approaching',
      message: `Your RSVP deadline is in ${days} day${days !== 1 ? 's' : ''}`,
      priority: days <= 3 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      category: NotificationCategory.RSVP,
      data: { days },
      actionUrl: '/dashboard/guests',
      actionLabel: 'Send Reminders'
    })
  }

  // Budget Notifications
  static async budgetExceeded(userId: string, coupleId: string, categoryName: string, amount: number, budgetAmount: number) {
    const overAmount = amount - budgetAmount
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.BUDGET_EXCEEDED,
      title: 'Budget Exceeded',
      message: `Your ${categoryName} budget is over by $${overAmount.toFixed(2)}`,
      priority: NotificationPriority.URGENT,
      category: NotificationCategory.BUDGET,
      data: { categoryName, amount, budgetAmount, overAmount },
      actionUrl: '/dashboard/budget',
      actionLabel: 'Review Budget'
    })
  }

  static async budgetWarning(userId: string, coupleId: string, categoryName: string, percentage: number) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.BUDGET_WARNING,
      title: 'Budget Warning',
      message: `Your ${categoryName} budget is ${percentage}% used`,
      priority: percentage >= 90 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      category: NotificationCategory.BUDGET,
      data: { categoryName, percentage },
      actionUrl: '/dashboard/budget',
      actionLabel: 'View Details'
    })
  }

  static async expenseAdded(userId: string, coupleId: string, expenseName: string, amount: number) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.EXPENSE_ADDED,
      title: 'New Expense Added',
      message: `${expenseName}: $${amount.toFixed(2)}`,
      priority: NotificationPriority.LOW,
      category: NotificationCategory.BUDGET,
      data: { expenseName, amount },
      actionUrl: '/dashboard/budget/expenses',
      actionLabel: 'View Expenses'
    })
  }

  // Guest Notifications
  static async guestAdded(userId: string, coupleId: string, guestName: string, guestCount: number) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.GUEST_ADDED,
      title: 'Guest Added',
      message: `${guestName} added to your guest list`,
      priority: NotificationPriority.LOW,
      category: NotificationCategory.GUESTS,
      data: { guestName, guestCount },
      actionUrl: '/dashboard/guests',
      actionLabel: 'View Guest List'
    })
  }

  static async dietaryRestrictionAdded(userId: string, coupleId: string, guestName: string, restrictions: string[]) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.GUEST_DIETARY_RESTRICTION,
      title: 'Dietary Restrictions Updated',
      message: `${guestName} has dietary restrictions: ${restrictions.join(', ')}`,
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.GUESTS,
      data: { guestName, restrictions },
      actionUrl: '/dashboard/guests',
      actionLabel: 'View Details'
    })
  }

  // Vendor Notifications
  static async vendorMessage(userId: string, coupleId: string, vendorName: string, subject: string) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.VENDOR_MESSAGE,
      title: 'Message from Vendor',
      message: `${vendorName}: ${subject}`,
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.VENDORS,
      data: { vendorName, subject },
      actionUrl: '/dashboard/vendors',
      actionLabel: 'View Message'
    })
  }

  static async vendorPaymentDue(userId: string, coupleId: string, vendorName: string, amount: number, dueDate: Date) {
    const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.VENDOR_PAYMENT_DUE,
      title: 'Payment Due',
      message: `Payment to ${vendorName} ($${amount.toFixed(2)}) due in ${daysUntilDue} days`,
      priority: daysUntilDue <= 3 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
      category: NotificationCategory.VENDORS,
      data: { vendorName, amount, dueDate, daysUntilDue },
      actionUrl: '/dashboard/vendors',
      actionLabel: 'Make Payment'
    })
  }

  // Timeline Notifications
  static async taskDue(userId: string, coupleId: string, taskName: string, dueDate: Date) {
    const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.TASK_DUE,
      title: 'Task Due Soon',
      message: `"${taskName}" is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
      priority: daysUntilDue <= 1 ? NotificationPriority.URGENT : NotificationPriority.HIGH,
      category: NotificationCategory.TIMELINE,
      data: { taskName, dueDate, daysUntilDue },
      actionUrl: '/dashboard/checklist',
      actionLabel: 'View Task'
    })
  }

  static async taskOverdue(userId: string, coupleId: string, taskName: string, daysPastDue: number) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.TASK_OVERDUE,
      title: 'Task Overdue',
      message: `"${taskName}" is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} overdue`,
      priority: NotificationPriority.URGENT,
      category: NotificationCategory.TIMELINE,
      data: { taskName, daysPastDue },
      actionUrl: '/dashboard/checklist',
      actionLabel: 'Complete Task'
    })
  }

  static async countdownMilestone(userId: string, coupleId: string, daysUntilWedding: number) {
    const milestones = {
      365: 'One year until your wedding!',
      180: 'Six months until your wedding!',
      90: 'Three months until your wedding!',
      30: 'One month until your wedding!',
      14: 'Two weeks until your wedding!',
      7: 'One week until your wedding!',
      3: 'Three days until your wedding!',
      1: 'Tomorrow is your wedding day!',
      0: 'Today is your wedding day!'
    }

    const message = milestones[daysUntilWedding as keyof typeof milestones]
    if (!message) return null

    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.COUNTDOWN_MILESTONE,
      title: 'Wedding Countdown',
      message,
      priority: daysUntilWedding <= 7 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      category: NotificationCategory.TIMELINE,
      data: { daysUntilWedding },
      actionUrl: '/dashboard',
      actionLabel: 'View Dashboard'
    })
  }

  // Photo Notifications
  static async photoShared(userId: string, coupleId: string, sharerName: string, photoCount: number, albumName?: string) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.PHOTO_SHARED,
      title: 'Photos Shared',
      message: `${sharerName} shared ${photoCount} photo${photoCount !== 1 ? 's' : ''}${albumName ? ` in ${albumName}` : ''}`,
      priority: NotificationPriority.LOW,
      category: NotificationCategory.PHOTOS,
      data: { sharerName, photoCount, albumName },
      actionUrl: '/dashboard/photos',
      actionLabel: 'View Photos'
    })
  }

  static async albumCreated(userId: string, coupleId: string, albumName: string, creatorName: string) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.ALBUM_CREATED,
      title: 'New Album Created',
      message: `${creatorName} created the album "${albumName}"`,
      priority: NotificationPriority.LOW,
      category: NotificationCategory.PHOTOS,
      data: { albumName, creatorName },
      actionUrl: '/dashboard/photos',
      actionLabel: 'View Album'
    })
  }

  // System Notifications
  static async systemUpdate(userId: string, coupleId: string, version: string, features: string[]) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.SYSTEM_UPDATE,
      title: 'App Updated',
      message: `New features available in version ${version}`,
      priority: NotificationPriority.LOW,
      category: NotificationCategory.SYSTEM,
      data: { version, features },
      actionUrl: '/dashboard/settings',
      actionLabel: 'See What\'s New',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    })
  }

  static async dataExportReady(userId: string, coupleId: string, exportType: string, downloadUrl: string) {
    return notificationService.createNotification({
      userId,
      coupleId,
      type: NotificationType.DATA_EXPORT_READY,
      title: 'Export Ready',
      message: `Your ${exportType} export is ready for download`,
      priority: NotificationPriority.MEDIUM,
      category: NotificationCategory.SYSTEM,
      data: { exportType, downloadUrl },
      actionUrl: downloadUrl,
      actionLabel: 'Download',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Expires in 3 days
    })
  }
}

// Batch notification helpers
export class BatchNotificationHelpers {
  // Send reminder to all guests who haven't RSVP'd
  static async sendRsvpReminders(coupleId: string, userId: string, guestIds: string[]) {
    const promises = guestIds.map(guestId =>
      notificationService.createNotification({
        userId,
        coupleId,
        type: NotificationType.RSVP_REMINDER_SENT,
        title: 'RSVP Reminder Sent',
        message: `Reminder sent to guest about RSVP deadline`,
        priority: NotificationPriority.LOW,
        category: NotificationCategory.RSVP,
        data: { guestId }
      })
    )

    return Promise.allSettled(promises)
  }

  // Create notifications for multiple overdue tasks
  static async notifyOverdueTasks(userId: string, coupleId: string, overdueTasks: Array<{ name: string; daysPastDue: number }>) {
    const promises = overdueTasks.map(task =>
      NotificationHelpers.taskOverdue(userId, coupleId, task.name, task.daysPastDue)
    )

    return Promise.allSettled(promises)
  }
}