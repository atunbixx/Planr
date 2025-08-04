# Messaging System Setup Guide

## Overview
The wedding planner messaging system enables couples to communicate with guests and vendors via email (Resend), SMS, and WhatsApp (Twilio).

## Features Implemented ✅

### Core Messaging
- ✅ Email sending via Resend
- ✅ SMS sending via Twilio  
- ✅ WhatsApp messaging via Twilio
- ✅ Bulk messaging to multiple recipients
- ✅ Message templates (system and custom)
- ✅ Scheduled messages for future delivery
- ✅ Message history and delivery tracking
- ✅ Webhook integration for status updates
- ✅ Guest and vendor messaging

### UI Components
- ✅ Message composer page (`/dashboard/messages`)
- ✅ Message history page (`/dashboard/messages/history`)
- ✅ Template management
- ✅ Recipient selection (guests/vendors)
- ✅ Delivery statistics

## Setup Instructions

### 1. Database Setup

Run the message logs schema in Supabase SQL Editor:

```bash
# File: message-logs-schema.sql
# This creates:
# - message_logs table (tracks all sent messages)
# - message_templates table (email/SMS templates)
# - scheduled_messages table (future messages)
# - message_preferences table (opt-in/opt-out)
```

### 2. Environment Variables

Add the following to your `.env.local`:

```env
# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@yourdomain.com
RESEND_FROM_NAME=Your Wedding Planner
```

### 3. Service Configuration

#### Twilio Setup
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from Console
3. Purchase a phone number with SMS/WhatsApp capabilities
4. Configure webhook URL: `https://your-domain.com/api/webhooks/twilio`

#### Resend Setup
1. Sign up at https://resend.com
2. Verify your domain
3. Get your API key
4. Configure webhook URL: `https://your-domain.com/api/webhooks/resend`

### 4. Testing

Test the messaging system:

```javascript
// Test email
POST /api/messages/test
{
  "messageType": "email",
  "testRecipient": "test@example.com",
  "subject": "Test Email",
  "body": "This is a test email"
}

// Test SMS
POST /api/messages/test
{
  "messageType": "sms",
  "testRecipient": "+1234567890",
  "body": "This is a test SMS"
}
```

## API Endpoints

### Send Messages
`POST /api/messages/send`
- Send messages to multiple recipients
- Support for email, SMS, WhatsApp
- Template support
- Scheduling capability

### Message Templates
`GET /api/messages/templates` - List all templates
`POST /api/messages/templates` - Create custom template
`PUT /api/messages/templates` - Update template
`DELETE /api/messages/templates?id=xxx` - Delete template

### Message Logs
`GET /api/messages/logs` - Get message history
- Query params: limit, offset, type, status

### Webhooks
`POST /api/webhooks/twilio` - Twilio status updates
`POST /api/webhooks/resend` - Resend delivery events

## Available Templates

System templates are pre-installed:
- Guest Invitation (Email/SMS)
- RSVP Reminder (Email/SMS)
- Vendor Booking Confirmation
- Thank You Message
- Wedding Day Reminder

## Usage Examples

### Send Guest Invitations
```javascript
// From the UI: /dashboard/messages
1. Select "Guests" tab
2. Choose recipients
3. Select "Guest Invitation" template
4. Customize message with variables
5. Send immediately or schedule
```

### Send Vendor Confirmations
```javascript
// Via API
POST /api/messages/send
{
  "recipientIds": ["vendor-id-1", "vendor-id-2"],
  "recipientType": "vendor",
  "messageType": "email",
  "templateId": "vendor_confirmation_email",
  "variables": {
    "weddingDate": "June 15, 2024",
    "serviceTime": "2:00 PM"
  }
}
```

## Message Variables

Templates support dynamic variables:
- `{{guestName}}` - Guest's name
- `{{partner1Name}}` - Partner 1's name
- `{{partner2Name}}` - Partner 2's name
- `{{weddingDate}}` - Wedding date
- `{{weddingTime}}` - Wedding time
- `{{venueName}}` - Venue name
- `{{venueAddress}}` - Venue address
- `{{rsvpLink}}` - RSVP link
- `{{rsvpDeadline}}` - RSVP deadline

## Monitoring & Analytics

### Delivery Metrics
- Total messages sent
- Delivery rate
- Open rate (emails)
- Click rate (emails)
- Failed messages

### Message Status
- `pending` - Queued for sending
- `sent` - Successfully sent
- `delivered` - Confirmed delivery
- `failed` - Delivery failed
- `bounced` - Email bounced
- `complained` - Marked as spam

## Troubleshooting

### Common Issues

1. **Messages not sending**
   - Check environment variables
   - Verify Twilio/Resend credentials
   - Check recipient format (email/phone)

2. **Webhook not updating status**
   - Verify webhook URLs in Twilio/Resend
   - Check webhook signature validation
   - Ensure public URL accessibility

3. **Template variables not replacing**
   - Use correct variable format: `{{variableName}}`
   - Ensure variables are passed in request
   - Check variable names match template

## Security Considerations

1. **Rate Limiting**: Implement rate limits to prevent abuse
2. **Validation**: Validate all recipient emails/phones
3. **Opt-out**: Respect unsubscribe preferences
4. **Webhooks**: Verify webhook signatures
5. **Logs**: Don't log sensitive message content

## Future Enhancements

- [ ] Rich media support (images, attachments)
- [ ] A/B testing for templates
- [ ] Advanced scheduling (recurring messages)
- [ ] Message analytics dashboard
- [ ] Import/export recipient lists
- [ ] Automated RSVP follow-ups
- [ ] Multi-language support
- [ ] SMS keyword responses