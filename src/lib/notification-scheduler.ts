import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getSmartNotificationService } from '@/lib/services/smart-notification.service';
import { addDays, format } from 'date-fns';

export interface NotificationSchedulerOptions {
  userId: string;
  type: 'task' | 'vendor' | 'payment' | 'rsvp' | 'wedding';
  entityId: string;
  entityName: string;
  dueDate: Date;
  additionalData?: Record<string, any>;
}

export class NotificationScheduler {
  private supabase = createClientComponentClient();
  private notificationService = getSmartNotificationService();

  async scheduleTaskReminders(task: {
    id: string;
    title: string;
    description?: string;
    due_date: string;
    user_id: string;
  }) {
    const dueDate = new Date(task.due_date);
    
    // Schedule reminders based on task due date
    const reminders = [
      {
        daysBeforeValue: 7,
        templateKey: 'task_due_week',
        priority: 'medium' as const
      },
      {
        daysBeforeValue: 1,
        templateKey: 'task_due_tomorrow',
        priority: 'high' as const
      }
    ];

    for (const reminder of reminders) {
      const reminderDate = addDays(dueDate, -reminder.daysBeforeValue);
      
      // Only schedule if reminder date is in the future
      if (reminderDate > new Date()) {
        // Set reminder time to 9 AM for week reminder, 6 PM for day before
        const reminderTime = reminder.daysBeforeValue === 7 ? 9 : 18;
        reminderDate.setHours(reminderTime, 0, 0, 0);

        await this.notificationService.scheduleNotification(task.user_id, {
          title: '',
          body: '',
          category: 'tasks',
          priority: reminder.priority,
          templateKey: reminder.templateKey,
          data: {
            task_id: task.id,
            task_name: task.title,
            task_description: task.description || '',
            days: reminder.daysBeforeValue,
            due_date: format(dueDate, 'MMMM d, yyyy')
          },
          scheduledFor: reminderDate
        });
      }
    }
  }

  async scheduleVendorAppointmentReminders(appointment: {
    id: string;
    vendor_name: string;
    appointment_date: string;
    location?: string;
    user_id: string;
  }) {
    const appointmentDate = new Date(appointment.appointment_date);
    
    // Day before reminder at 6 PM
    const dayBefore = addDays(appointmentDate, -1);
    dayBefore.setHours(18, 0, 0, 0);
    
    if (dayBefore > new Date()) {
      await this.notificationService.scheduleNotification(appointment.user_id, {
        title: '',
        body: '',
        category: 'vendors',
        priority: 'high',
        templateKey: 'vendor_appointment_tomorrow',
        data: {
          vendor_name: appointment.vendor_name,
          time: format(appointmentDate, 'h:mm a'),
          location: appointment.location || 'TBD',
          appointment_date: format(appointmentDate, 'MMMM d, yyyy')
        },
        scheduledFor: dayBefore
      });
    }

    // 1 hour before reminder
    const hourBefore = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
    
    if (hourBefore > new Date()) {
      await this.notificationService.scheduleNotification(appointment.user_id, {
        title: '',
        body: '',
        category: 'vendors',
        priority: 'urgent',
        templateKey: 'vendor_appointment_hour',
        data: {
          vendor_name: appointment.vendor_name,
          location: appointment.location || 'TBD'
        },
        scheduledFor: hourBefore
      });
    }
  }

  async schedulePaymentReminders(payment: {
    id: string;
    vendor_name?: string;
    name: string;
    amount: number;
    due_date: string;
    user_id: string;
  }) {
    const dueDate = new Date(payment.due_date);
    
    // Week before reminder at 9 AM
    const weekBefore = addDays(dueDate, -7);
    weekBefore.setHours(9, 0, 0, 0);
    
    if (weekBefore > new Date()) {
      await this.notificationService.scheduleNotification(payment.user_id, {
        title: '',
        body: '',
        category: 'budget',
        priority: 'high',
        templateKey: 'payment_due_week',
        data: {
          payment_id: payment.id,
          vendor_name: payment.vendor_name || payment.name,
          amount: `$${payment.amount.toLocaleString()}`,
          days: 7,
          due_date: format(dueDate, 'MMMM d, yyyy')
        },
        scheduledFor: weekBefore
      });
    }

    // 3 days before reminder
    const threeDaysBefore = addDays(dueDate, -3);
    threeDaysBefore.setHours(9, 0, 0, 0);
    
    if (threeDaysBefore > new Date()) {
      await this.notificationService.scheduleNotification(payment.user_id, {
        title: '',
        body: '',
        category: 'budget',
        priority: 'urgent',
        templateKey: 'payment_due_week',
        data: {
          payment_id: payment.id,
          vendor_name: payment.vendor_name || payment.name,
          amount: `$${payment.amount.toLocaleString()}`,
          days: 3,
          due_date: format(dueDate, 'MMMM d, yyyy')
        },
        scheduledFor: threeDaysBefore
      });
    }
  }

  async scheduleRSVPDeadlineReminders(deadline: {
    deadline_date: string;
    pending_count: number;
    user_id: string;
  }) {
    const deadlineDate = new Date(deadline.deadline_date);
    
    // Two weeks before
    const twoWeeksBefore = addDays(deadlineDate, -14);
    twoWeeksBefore.setHours(10, 0, 0, 0);
    
    if (twoWeeksBefore > new Date()) {
      await this.notificationService.scheduleNotification(deadline.user_id, {
        title: '',
        body: '',
        category: 'rsvp',
        priority: 'medium',
        templateKey: 'rsvp_deadline_week',
        data: {
          days: 14,
          pending_count: deadline.pending_count,
          deadline_date: format(deadlineDate, 'MMMM d, yyyy')
        },
        scheduledFor: twoWeeksBefore
      });
    }

    // One week before
    const weekBefore = addDays(deadlineDate, -7);
    weekBefore.setHours(10, 0, 0, 0);
    
    if (weekBefore > new Date()) {
      await this.notificationService.scheduleNotification(deadline.user_id, {
        title: '',
        body: '',
        category: 'rsvp',
        priority: 'high',
        templateKey: 'rsvp_deadline_week',
        data: {
          days: 7,
          pending_count: deadline.pending_count,
          deadline_date: format(deadlineDate, 'MMMM d, yyyy')
        },
        scheduledFor: weekBefore
      });
    }
  }

  async scheduleWeddingCountdownReminders(wedding: {
    wedding_date: string;
    user_id: string;
  }) {
    const weddingDate = new Date(wedding.wedding_date);
    
    // Key milestones
    const milestones = [
      { days: 90, templateKey: 'wedding_month_away', text: '3 months' },
      { days: 60, templateKey: 'wedding_month_away', text: '2 months' },
      { days: 30, templateKey: 'wedding_month_away', text: '1 month' },
      { days: 14, templateKey: 'wedding_week_away', text: '2 weeks' },
      { days: 7, templateKey: 'wedding_week_away', text: '1 week' },
      { days: 1, templateKey: 'wedding_tomorrow', text: 'tomorrow' }
    ];

    for (const milestone of milestones) {
      const reminderDate = addDays(weddingDate, -milestone.days);
      reminderDate.setHours(9, 0, 0, 0); // 9 AM for most reminders
      
      // Special time for day before
      if (milestone.days === 1) {
        reminderDate.setHours(20, 0, 0, 0); // 8 PM evening before
      }

      if (reminderDate > new Date()) {
        const checklist = await this.getChecklistForMilestone(milestone.days);
        
        await this.notificationService.scheduleNotification(wedding.user_id, {
          title: '',
          body: '',
          category: 'wedding',
          priority: milestone.days <= 7 ? 'urgent' : 'high',
          templateKey: milestone.templateKey,
          data: {
            days: milestone.days,
            time_text: milestone.text,
            checklist,
            wedding_date: format(weddingDate, 'MMMM d, yyyy')
          },
          scheduledFor: reminderDate
        });
      }
    }
  }

  private async getChecklistForMilestone(daysUntilWedding: number): Promise<string> {
    // Return appropriate checklist based on timeline
    if (daysUntilWedding === 30) {
      return 'Final dress fitting, Send final guest count to caterer, Finalize seating chart';
    } else if (daysUntilWedding === 7) {
      return 'Pack for honeymoon, Confirm vendor arrival times, Prepare payments & tips';
    } else if (daysUntilWedding === 1) {
      return 'Rehearsal dinner, Get a good night\'s sleep, Enjoy every moment!';
    }
    
    return 'Check your task list for important items';
  }

  async cancelNotificationsForEntity(entityType: string, entityId: string, userId: string) {
    // Cancel all pending notifications for a specific entity
    const { error } = await this.supabase
      .from('scheduled_notifications')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('data->>entity_type', entityType)
      .eq('data->>entity_id', entityId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cancelling notifications:', error);
    }
  }
}

// Singleton instance
let notificationScheduler: NotificationScheduler | null = null;

export function getNotificationScheduler(): NotificationScheduler {
  if (!notificationScheduler) {
    notificationScheduler = new NotificationScheduler();
  }
  return notificationScheduler;
}