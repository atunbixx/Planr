# Smart Notifications System Guide

## Overview

The Smart Notifications System provides context-aware reminders and notifications to help couples stay on track with their wedding planning without being overwhelmed. The system intelligently schedules and delivers notifications based on user preferences, location, and wedding timeline.

## Features

### 1. **Context-Aware Reminders**
- **Task Reminders**: Get notified about upcoming tasks (1 week before, 1 day before)
- **Vendor Appointments**: Never miss a meeting (1 day before, 1 hour before)
- **Payment Due Dates**: Stay on top of vendor payments (1 week before, 3 days before)
- **RSVP Deadlines**: Track guest responses (2 weeks before, 1 week before)
- **Wedding Countdown**: Important milestones (3 months, 1 month, 1 week, day before)

### 2. **Smart Delivery Channels**
- **Push Notifications**: Instant browser/mobile notifications
- **Email**: Important updates via email (instant, hourly, or daily digest)
- **SMS**: Critical alerts via text message (optional)

### 3. **Intelligent Timing**
- **Quiet Hours**: No notifications during sleep hours (customizable)
- **Smart Scheduling**: Notifications sent at optimal times
- **Batch Processing**: Similar notifications grouped to avoid fatigue
- **Priority-Based**: Urgent notifications bypass quiet hours

### 4. **Location-Based Reminders**
- **Venue Proximity**: Get reminders when near your wedding venue
- **Vendor Locations**: Notifications when approaching vendor appointments
- **Custom Locations**: Set up triggers for any location

### 5. **User Preferences**
- **Category Control**: Enable/disable by notification type
- **Channel Selection**: Choose how you receive each type
- **Timing Preferences**: Morning person? Get your digest at 7 AM
- **Frequency Settings**: Real-time, hourly, or daily digests

## Implementation Details

### Database Schema

#### Core Tables:
1. **notification_templates**: Pre-defined notification templates
2. **user_notification_preferences**: User-specific settings
3. **scheduled_notifications**: Queue of pending notifications
4. **notification_history**: Sent notifications and analytics
5. **location_triggers**: Location-based notification rules
6. **notification_rules**: Automated scheduling rules

### Key Components

#### 1. **SmartNotificationService** (`/lib/services/smart-notification.service.ts`)
Core service handling notification logic:
- Preference management
- Notification scheduling
- Location tracking
- Template rendering
- Quiet hours enforcement

#### 2. **NotificationScheduler** (`/lib/notification-scheduler.ts`)
Automated scheduling for different entities:
- Task reminders
- Vendor appointments
- Payment reminders
- RSVP deadlines
- Wedding countdown

#### 3. **UI Components**
- **SmartNotificationSettings**: Comprehensive settings interface
- **NotificationCenter**: In-app notification center
- **NotificationToast**: Toast notifications
- **LocationTriggers**: Location-based reminder management

#### 4. **API Endpoints**
- **POST /api/notifications/process**: Process scheduled notifications (for cron)
- **PUT /api/settings/notifications**: Update user preferences

### Notification Flow

1. **Creation**: 
   - Automatic: When tasks/appointments are created
   - Manual: User-triggered reminders
   - Rule-based: System-generated based on timeline

2. **Scheduling**:
   - Check user preferences
   - Apply quiet hours
   - Determine optimal delivery time
   - Queue in scheduled_notifications

3. **Processing**:
   - Cron job or webhook triggers processing
   - Render templates with data
   - Check delivery channels
   - Send via enabled channels

4. **Delivery**:
   - Push: Browser/mobile notifications
   - Email: Formatted HTML emails
   - SMS: Text messages (if enabled)

5. **Tracking**:
   - Record in notification_history
   - Track delivery/read status
   - Analytics for optimization

## Usage Examples

### Setting Up Task Reminders
```typescript
const scheduler = getNotificationScheduler();
await scheduler.scheduleTaskReminders({
  id: 'task-123',
  title: 'Book wedding photographer',
  description: 'Research and book photographer',
  due_date: '2024-06-15',
  user_id: 'user-123'
});
```

### Configuring User Preferences
```typescript
const notificationService = getSmartNotificationService();
await notificationService.updatePreferences(userId, {
  categories: {
    tasks: true,
    vendors: true,
    budget: true,
    rsvp: false,
    wedding: true,
    location: true
  },
  channels: {
    push: true,
    email: true,
    sms: false
  },
  timing: {
    preference: 'morning',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  },
  frequency: 'each'
});
```

### Creating Location Trigger
```typescript
// Trigger notification when near wedding venue
await supabase.from('location_triggers').insert({
  user_id: userId,
  name: 'Wedding Venue Reminder',
  location_type: 'venue',
  latitude: 37.7749,
  longitude: -122.4194,
  radius_meters: 500,
  trigger_template_id: venueTemplateId,
  enabled: true
});
```

## Best Practices

### 1. **Avoid Notification Fatigue**
- Group similar notifications
- Respect user preferences
- Use appropriate priorities
- Implement smart batching

### 2. **Timing Optimization**
- Tasks: Morning reminders (9 AM)
- Appointments: Evening before (6 PM)
- Payments: Business hours (10 AM)
- Urgent: Immediate delivery

### 3. **Content Guidelines**
- Clear, actionable titles
- Concise body text
- Include relevant context
- Provide quick actions

### 4. **Privacy & Security**
- No sensitive data in notifications
- Secure SMS/email delivery
- User consent for channels
- Easy unsubscribe options

## Configuration

### Environment Variables
```env
# Email notifications
RESEND_API_KEY=your_resend_key

# SMS notifications (optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Cron job security
CRON_SECRET=your_cron_secret

# App URL for links
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Cron Job Setup
Set up a cron job to process notifications every 5 minutes:
```bash
*/5 * * * * curl -X POST https://yourapp.com/api/notifications/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Future Enhancements

1. **Machine Learning**
   - Optimal timing prediction
   - Personalized frequency
   - Smart grouping algorithms

2. **Advanced Channels**
   - WhatsApp integration
   - Slack notifications
   - Calendar integration

3. **Rich Notifications**
   - Images and attachments
   - Interactive actions
   - Quick replies

4. **Analytics Dashboard**
   - Delivery rates
   - Engagement metrics
   - User preferences trends

5. **Templates Marketplace**
   - Custom notification templates
   - Industry best practices
   - Multilingual support