# SMS Integration Setup (Twilio)

## Environment Variables

Add the following to your `.env.local` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# Optional: Messaging Service SID (recommended for production)
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid_here

# Webhook Configuration (optional)
TWILIO_WEBHOOK_URL=https://yourdomain.com/api/webhooks/twilio
WEBHOOK_SECRET=your_webhook_secret_here
```

## Setup Steps

1. **Create Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **Get Account SID & Auth Token**: Find these in your Twilio Console Dashboard
3. **Purchase Phone Number**: Buy a phone number for SMS sending
4. **Configure Webhooks** (Optional): Set up webhook URLs for delivery status

## Features Available

✅ **SMS Messaging**: Send text messages to guests and vendors  
✅ **WhatsApp Integration**: Send WhatsApp messages (requires WhatsApp Business)  
✅ **Bulk Messaging**: Send messages to multiple recipients  
✅ **Template Support**: Pre-built templates for invitations, reminders, etc.  
✅ **Delivery Tracking**: Track message delivery status  
✅ **RSVP Automation**: Handle incoming RSVP responses  

## Usage Examples

The SMS service is already integrated into the messaging system. You can:

- Send guest invitations via SMS
- Send RSVP reminders
- Communicate with vendors
- Send wedding day reminders
- Handle automated responses

The system will automatically fallback gracefully if Twilio credentials are not configured.