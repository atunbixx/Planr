import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getNotificationService } from './notification.service';
import { format, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export interface SmartNotificationPreferences {
  categories: {
    tasks: boolean;
    vendors: boolean;
    budget: boolean;
    rsvp: boolean;
    wedding: boolean;
    location: boolean;
  };
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  timing: {
    preference: 'immediately' | 'morning' | 'evening' | 'custom';
    customTime?: string;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  frequency: 'each' | 'hourly' | 'daily_digest' | 'weekly_digest';
}

export interface NotificationData {
  title: string;
  body: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, any>;
  scheduledFor?: Date;
  templateKey?: string;
}

export interface LocationTrigger {
  id: string;
  name: string;
  type: 'venue' | 'vendor' | 'custom';
  latitude: number;
  longitude: number;
  radius: number;
  templateKey: string;
  data: Record<string, any>;
  enabled: boolean;
}

export class SmartNotificationService {
  private supabase = createClientComponentClient();
  private notificationService = getNotificationService();
  private geolocationWatchId: number | null = null;
  private lastLocationCheck: Date | null = null;
  private locationCheckInterval = 5 * 60 * 1000; // 5 minutes

  async getPreferences(userId: string): Promise<SmartNotificationPreferences> {
    const { data: prefs } = await this.supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId);

    // Transform database format to frontend format
    const preferences: SmartNotificationPreferences = {
      categories: {
        tasks: true,
        vendors: true,
        budget: true,
        rsvp: true,
        wedding: true,
        location: false
      },
      channels: {
        push: true,
        email: true,
        sms: false
      },
      timing: {
        preference: 'immediately',
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      },
      frequency: 'each'
    };

    if (prefs) {
      prefs.forEach(pref => {
        preferences.categories[pref.category as keyof typeof preferences.categories] = pref.enabled;
        preferences.channels.push = pref.channel_push;
        preferences.channels.email = pref.channel_email;
        preferences.channels.sms = pref.channel_sms;
        preferences.timing.preference = pref.timing_preference;
        preferences.timing.customTime = pref.custom_time;
        preferences.timing.quietHoursStart = pref.quiet_hours_start;
        preferences.timing.quietHoursEnd = pref.quiet_hours_end;
        preferences.frequency = pref.frequency;
      });
    }

    return preferences;
  }

  async updatePreferences(
    userId: string, 
    preferences: SmartNotificationPreferences
  ): Promise<void> {
    // Update preferences for each category
    const updates = Object.entries(preferences.categories).map(([category, enabled]) => ({
      user_id: userId,
      category,
      enabled,
      channel_push: preferences.channels.push,
      channel_email: preferences.channels.email,
      channel_sms: preferences.channels.sms,
      timing_preference: preferences.timing.preference,
      custom_time: preferences.timing.customTime,
      quiet_hours_start: preferences.timing.quietHoursStart,
      quiet_hours_end: preferences.timing.quietHoursEnd,
      frequency: preferences.frequency
    }));

    for (const update of updates) {
      await this.supabase
        .from('user_notification_preferences')
        .upsert(update, { onConflict: 'user_id,category' });
    }
  }

  async scheduleNotification(
    userId: string,
    notification: NotificationData
  ): Promise<string> {
    const scheduledFor = notification.scheduledFor || new Date();
    
    // Check if within quiet hours
    const adjustedTime = await this.adjustForQuietHours(userId, scheduledFor);

    // Get template if specified
    let templateId = null;
    if (notification.templateKey) {
      const { data: template } = await this.supabase
        .from('notification_templates')
        .select('id')
        .eq('template_key', notification.templateKey)
        .single();
      
      templateId = template?.id;
    }

    // Schedule the notification
    const { data, error } = await this.supabase
      .from('scheduled_notifications')
      .insert({
        user_id: userId,
        template_id: templateId,
        scheduled_for: adjustedTime.toISOString(),
        data: notification.data || {},
        category: notification.category,
        priority: notification.priority,
        channels: ['push'] // Will be determined by preferences
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async sendNotification(notification: NotificationData): Promise<void> {
    // Check if notifications are enabled for this category
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    const preferences = await this.getPreferences(user.id);
    const categoryEnabled = preferences.categories[notification.category as keyof typeof preferences.categories];
    
    if (!categoryEnabled) return;

    // Check quiet hours
    if (!(await this.isOutsideQuietHours(user.id))) {
      // Schedule for later
      const nextAvailableTime = await this.getNextAvailableTime(user.id);
      await this.scheduleNotification(user.id, {
        ...notification,
        scheduledFor: nextAvailableTime
      });
      return;
    }

    // Send via enabled channels
    if (preferences.channels.push) {
      this.notificationService.show({
        title: notification.title,
        body: notification.body,
        data: {
          category: notification.category,
          ...notification.data
        },
        requireInteraction: notification.priority === 'urgent'
      });
    }

    // Record in history
    await this.recordNotification(user.id, notification, 'push');
  }

  async processPendingNotifications(): Promise<void> {
    const now = new Date();
    
    // Get pending notifications that should be sent
    const { data: pending } = await this.supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .limit(50);

    if (!pending || pending.length === 0) return;

    for (const notification of pending) {
      try {
        // Get template and render
        const { data: template } = await this.supabase
          .from('notification_templates')
          .select('*')
          .eq('id', notification.template_id)
          .single();

        if (template) {
          const title = this.renderTemplate(template.title_template, notification.data);
          const body = this.renderTemplate(template.body_template, notification.data);

          // Send notification
          await this.sendNotification({
            title,
            body,
            category: notification.category,
            priority: notification.priority,
            data: notification.data
          });

          // Mark as sent
          await this.supabase
            .from('scheduled_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', notification.id);
        }
      } catch (error) {
        console.error('Error processing notification:', error);
        
        // Mark as failed
        await this.supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', notification.id);
      }
    }
  }

  async setupLocationTracking(userId: string): Promise<void> {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    // Get location triggers for user
    const { data: triggers } = await this.supabase
      .from('location_triggers')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true);

    if (!triggers || triggers.length === 0) return;

    // Watch position
    this.geolocationWatchId = navigator.geolocation.watchPosition(
      async (position) => {
        // Throttle checks
        if (this.lastLocationCheck && 
            new Date().getTime() - this.lastLocationCheck.getTime() < this.locationCheckInterval) {
          return;
        }

        this.lastLocationCheck = new Date();

        // Check each trigger
        for (const trigger of triggers) {
          const distance = this.calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            trigger.latitude,
            trigger.longitude
          );

          if (distance <= trigger.radius_meters) {
            // Check if already triggered recently
            if (trigger.last_triggered_at) {
              const lastTriggered = new Date(trigger.last_triggered_at);
              const hoursSinceLastTrigger = (new Date().getTime() - lastTriggered.getTime()) / (1000 * 60 * 60);
              
              if (hoursSinceLastTrigger < 24) continue; // Don't trigger more than once per day
            }

            // Send location-based notification
            await this.sendLocationNotification(userId, trigger);

            // Update last triggered
            await this.supabase
              .from('location_triggers')
              .update({ last_triggered_at: new Date().toISOString() })
              .eq('id', trigger.id);
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }

  async stopLocationTracking(): Promise<void> {
    if (this.geolocationWatchId !== null) {
      navigator.geolocation.clearWatch(this.geolocationWatchId);
      this.geolocationWatchId = null;
    }
  }

  private async sendLocationNotification(userId: string, trigger: LocationTrigger): Promise<void> {
    // Get template
    const { data: template } = await this.supabase
      .from('notification_templates')
      .select('*')
      .eq('id', trigger.trigger_template_id)
      .single();

    if (!template) return;

    const title = this.renderTemplate(template.title_template, trigger.trigger_data);
    const body = this.renderTemplate(template.body_template, trigger.trigger_data);

    await this.sendNotification({
      title,
      body,
      category: 'location',
      priority: 'low',
      data: trigger.trigger_data
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private async adjustForQuietHours(userId: string, scheduledTime: Date): Promise<Date> {
    const preferences = await this.getPreferences(userId);
    const quietStart = preferences.timing.quietHoursStart.split(':');
    const quietEnd = preferences.timing.quietHoursEnd.split(':');

    const quietStartTime = new Date(scheduledTime);
    quietStartTime.setHours(parseInt(quietStart[0]), parseInt(quietStart[1]), 0, 0);

    const quietEndTime = new Date(scheduledTime);
    quietEndTime.setHours(parseInt(quietEnd[0]), parseInt(quietEnd[1]), 0, 0);

    // If quiet end is before quiet start, it spans midnight
    if (quietEndTime < quietStartTime) {
      quietEndTime.setDate(quietEndTime.getDate() + 1);
    }

    // Check if scheduled time is within quiet hours
    if (isWithinInterval(scheduledTime, { start: quietStartTime, end: quietEndTime })) {
      // Move to end of quiet hours
      return quietEndTime;
    }

    return scheduledTime;
  }

  private async isOutsideQuietHours(userId: string): Promise<boolean> {
    const now = new Date();
    const adjusted = await this.adjustForQuietHours(userId, now);
    return adjusted.getTime() === now.getTime();
  }

  private async getNextAvailableTime(userId: string): Promise<Date> {
    const now = new Date();
    return this.adjustForQuietHours(userId, now);
  }

  private async recordNotification(
    userId: string, 
    notification: NotificationData, 
    channel: string
  ): Promise<void> {
    await this.supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        title: notification.title,
        body: notification.body,
        category: notification.category,
        channel,
        data: notification.data || {}
      });
  }

  async getNotificationHistory(userId: string, limit = 50): Promise<any[]> {
    const { data } = await this.supabase
      .from('notification_history')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.supabase
      .from('notification_history')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  // Smart scheduling methods
  async scheduleTaskReminders(userId: string): Promise<void> {
    // Get user tasks
    const { data: tasks } = await this.supabase
      .from('user_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .not('due_date', 'is', null);

    if (!tasks) return;

    for (const task of tasks) {
      const dueDate = new Date(task.due_date);
      
      // Schedule reminders at different intervals
      const reminders = [
        { days: 7, templateKey: 'task_due_week' },
        { days: 1, templateKey: 'task_due_tomorrow' }
      ];

      for (const reminder of reminders) {
        const reminderDate = addDays(dueDate, -reminder.days);
        if (reminderDate > new Date()) {
          await this.scheduleNotification(userId, {
            title: '',
            body: '',
            category: 'tasks',
            priority: reminder.days === 1 ? 'high' : 'medium',
            templateKey: reminder.templateKey,
            data: {
              task_name: task.title,
              task_description: task.description,
              days: reminder.days
            },
            scheduledFor: reminderDate
          });
        }
      }
    }
  }

  async scheduleVendorAppointmentReminders(userId: string): Promise<void> {
    // Get vendor appointments
    const { data: appointments } = await this.supabase
      .from('vendor_appointments')
      .select('*, wedding_vendors(business_name)')
      .eq('user_id', userId)
      .gte('appointment_date', new Date().toISOString());

    if (!appointments) return;

    for (const appointment of appointments) {
      const appointmentDate = new Date(appointment.appointment_date);
      
      // Day before reminder
      const dayBefore = addDays(appointmentDate, -1);
      if (dayBefore > new Date()) {
        await this.scheduleNotification(userId, {
          title: '',
          body: '',
          category: 'vendors',
          priority: 'high',
          templateKey: 'vendor_appointment_tomorrow',
          data: {
            vendor_name: appointment.wedding_vendors.business_name,
            time: format(appointmentDate, 'h:mm a'),
            location: appointment.location
          },
          scheduledFor: dayBefore
        });
      }

      // 1 hour before reminder
      const hourBefore = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
      if (hourBefore > new Date()) {
        await this.scheduleNotification(userId, {
          title: '',
          body: '',
          category: 'vendors',
          priority: 'urgent',
          templateKey: 'vendor_appointment_hour',
          data: {
            vendor_name: appointment.wedding_vendors.business_name,
            location: appointment.location
          },
          scheduledFor: hourBefore
        });
      }
    }
  }

  async schedulePaymentReminders(userId: string): Promise<void> {
    // Get upcoming payments
    const { data: payments } = await this.supabase
      .from('budget_items')
      .select('*, wedding_vendors(business_name)')
      .eq('user_id', userId)
      .eq('payment_status', 'pending')
      .not('due_date', 'is', null);

    if (!payments) return;

    for (const payment of payments) {
      const dueDate = new Date(payment.due_date);
      
      // Week before reminder
      const weekBefore = addDays(dueDate, -7);
      if (weekBefore > new Date()) {
        await this.scheduleNotification(userId, {
          title: '',
          body: '',
          category: 'budget',
          priority: 'high',
          templateKey: 'payment_due_week',
          data: {
            vendor_name: payment.wedding_vendors?.business_name || payment.name,
            amount: `$${payment.amount.toLocaleString()}`,
            days: 7
          },
          scheduledFor: weekBefore
        });
      }
    }
  }
}

// Singleton instance
let smartNotificationService: SmartNotificationService | null = null;

export function getSmartNotificationService(): SmartNotificationService {
  if (!smartNotificationService) {
    smartNotificationService = new SmartNotificationService();
  }
  return smartNotificationService;
}