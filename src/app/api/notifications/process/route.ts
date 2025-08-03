import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { Resend } from 'resend';
import { Twilio } from 'twilio';
import { format, isWithinInterval } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);
const twilio = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// This endpoint processes scheduled notifications
// Can be called by a cron job or webhook
export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (e.g., from a cron service)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const now = new Date();

    // Get pending notifications that should be sent
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select(`
        *,
        notification_templates!inner(
          title_template,
          body_template,
          category,
          priority
        ),
        auth.users!inner(email)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .limit(50);

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({ message: 'No pending notifications' });
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0
    };

    // Process each notification
    for (const notification of pendingNotifications) {
      try {
        results.processed++;

        // Check user preferences
        const { data: preferences } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', notification.user_id)
          .eq('category', notification.notification_templates.category)
          .single();

        // Skip if category is disabled
        if (preferences && !preferences.enabled) {
          await supabase
            .from('scheduled_notifications')
            .update({ 
              status: 'skipped',
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id);
          continue;
        }

        // Check quiet hours
        if (preferences && !isOutsideQuietHours(preferences)) {
          // Reschedule for end of quiet hours
          const rescheduledTime = getNextAvailableTime(preferences);
          await supabase
            .from('scheduled_notifications')
            .update({ 
              scheduled_for: rescheduledTime.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id);
          continue;
        }

        // Render notification content
        const title = renderTemplate(
          notification.notification_templates.title_template,
          notification.data
        );
        const body = renderTemplate(
          notification.notification_templates.body_template,
          notification.data
        );

        // Send via enabled channels
        const sentChannels: string[] = [];

        // Email notification
        if (notification.channels.includes('email') && preferences?.channel_email) {
          try {
            await sendEmailNotification(
              notification.auth.users.email,
              title,
              body,
              notification.notification_templates.category
            );
            sentChannels.push('email');
          } catch (error) {
            console.error('Email send error:', error);
          }
        }

        // SMS notification
        if (notification.channels.includes('sms') && preferences?.channel_sms && twilio) {
          try {
            // Get user's phone number
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('phone_number')
              .eq('user_id', notification.user_id)
              .single();

            if (profile?.phone_number) {
              await sendSMSNotification(profile.phone_number, `${title}\n\n${body}`);
              sentChannels.push('sms');
            }
          } catch (error) {
            console.error('SMS send error:', error);
          }
        }

        // Update notification status
        if (sentChannels.length > 0) {
          await supabase
            .from('scheduled_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id);

          // Record in history
          for (const channel of sentChannels) {
            await supabase
              .from('notification_history')
              .insert({
                user_id: notification.user_id,
                template_id: notification.template_id,
                scheduled_notification_id: notification.id,
                title,
                body,
                category: notification.notification_templates.category,
                channel,
                data: notification.data
              });
          }

          results.sent++;
        } else {
          throw new Error('No channels available for sending');
        }
      } catch (error) {
        console.error('Error processing notification:', error);
        results.failed++;

        // Mark as failed
        await supabase
          .from('scheduled_notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id);
      }
    }

    // Process notification rules for future scheduling
    await processNotificationRules();

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Notification processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}

function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key]?.toString() || match;
  });
}

function isOutsideQuietHours(preferences: any): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = preferences.quiet_hours_start.split(':').map(Number);
  const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
  
  const quietStart = startHour * 60 + startMinute;
  const quietEnd = endHour * 60 + endMinute;

  // Handle overnight quiet hours
  if (quietStart > quietEnd) {
    // Quiet hours span midnight
    return currentTime < quietEnd || currentTime >= quietStart;
  } else {
    // Normal quiet hours
    return currentTime < quietStart || currentTime >= quietEnd;
  }
}

function getNextAvailableTime(preferences: any): Date {
  const now = new Date();
  const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
  
  const nextAvailable = new Date(now);
  nextAvailable.setHours(endHour, endMinute, 0, 0);
  
  // If the quiet end time has already passed today, schedule for tomorrow
  if (nextAvailable <= now) {
    nextAvailable.setDate(nextAvailable.getDate() + 1);
  }
  
  return nextAvailable;
}

async function sendEmailNotification(
  email: string,
  subject: string,
  content: string,
  category: string
) {
  if (!resend) {
    throw new Error('Email service not configured');
  }

  const categoryEmojis = {
    tasks: '📋',
    vendors: '👥',
    budget: '💰',
    rsvp: '✉️',
    wedding: '💒',
    location: '📍'
  };

  const emoji = categoryEmojis[category as keyof typeof categoryEmojis] || '🔔';

  await resend.emails.send({
    from: 'Wedding Planner <notifications@yourweddingplanner.com>',
    to: email,
    subject: `${emoji} ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f0f0; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #e8b4b4; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .category { display: inline-block; padding: 4px 12px; background-color: #f0f0f0; border-radius: 12px; font-size: 12px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #4a2020;">${emoji} ${subject}</h1>
            </div>
            <div class="content">
              <span class="category">${category}</span>
              <p>${content}</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View in App</a>
            </div>
            <div class="footer">
              <p>You're receiving this because you have email notifications enabled for ${category}.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings">Manage notification preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  });
}

async function sendSMSNotification(phoneNumber: string, message: string) {
  if (!twilio) {
    throw new Error('SMS service not configured');
  }

  // Truncate message if too long
  const truncatedMessage = message.length > 160 
    ? message.substring(0, 157) + '...' 
    : message;

  await twilio.messages.create({
    body: truncatedMessage,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER
  });
}

async function processNotificationRules() {
  const supabase = createServerClient();
  
  // Get enabled rules
  const { data: rules } = await supabase
    .from('notification_rules')
    .select('*, notification_templates(*)')
    .eq('enabled', true);

  if (!rules) return;

  for (const rule of rules) {
    if (rule.trigger_type === 'date_based') {
      // Process date-based rules
      const daysBeforeValue = rule.trigger_config.days_before;
      const timeValue = rule.trigger_config.time;
      const checkField = rule.trigger_config.check_field;

      // Example: Process task reminders
      if (rule.category === 'tasks') {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBeforeValue);
        targetDate.setHours(0, 0, 0, 0);

        // Get tasks due on target date
        const { data: tasks } = await supabase
          .from('user_tasks')
          .select('*')
          .eq('status', 'pending')
          .gte(checkField, targetDate.toISOString())
          .lt(checkField, new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString());

        if (tasks) {
          for (const task of tasks) {
            // Check if notification already scheduled
            const { data: existing } = await supabase
              .from('scheduled_notifications')
              .select('id')
              .eq('user_id', task.user_id)
              .eq('template_id', rule.template_id)
              .eq('data->task_id', task.id)
              .eq('status', 'pending')
              .single();

            if (!existing) {
              // Schedule notification
              const scheduledFor = new Date(targetDate);
              const [hour, minute] = timeValue.split(':').map(Number);
              scheduledFor.setHours(hour, minute, 0, 0);

              await supabase
                .from('scheduled_notifications')
                .insert({
                  user_id: task.user_id,
                  template_id: rule.template_id,
                  scheduled_for: scheduledFor.toISOString(),
                  data: {
                    task_id: task.id,
                    task_name: task.title,
                    task_description: task.description,
                    days: daysBeforeValue,
                    due_date: format(new Date(task.due_date), 'MMMM d, yyyy')
                  },
                  category: rule.category,
                  priority: rule.notification_templates.priority,
                  channels: ['push', 'email']
                });
            }
          }
        }
      }
      // Add similar logic for other categories (vendors, budget, etc.)
    }
  }
}