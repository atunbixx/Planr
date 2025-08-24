# Messaging Service

The messaging service provides a unified interface for sending messages across multiple channels (email, SMS, WhatsApp) with country-aware pricing, provider abstraction, and credit management.

## Architecture

```
MessagingService
├── PricebookService (pricing & provider selection)
├── AdapterRegistry (provider management)
├── MessageAdapters (provider implementations)
└── CreditRepository (credit management)
```

## Features

- **Multi-channel messaging**: Email, SMS, WhatsApp
- **Country-aware pricing**: Different costs per country/channel
- **Provider abstraction**: Pluggable adapters for different providers
- **Credit management**: Automatic credit reservation/deduction/refund
- **Bulk messaging**: Efficient bulk message sending
- **Rate limiting**: Built-in rate limiting per provider
- **Delivery tracking**: Status tracking where supported
- **Template support**: Pre-defined message templates
- **Retry logic**: Configurable retry policies

## Quick Start

```typescript
import { MessagingService } from './messaging.service'
import { CreditRepository } from '../repo/credit.repository'

// Initialize service
const creditRepo = new CreditRepository(prisma)
const messagingService = new MessagingService(creditRepo)
await messagingService.initialize()

// Send a message
const result = await messagingService.sendMessage({
  userId: 'user_123',
  to: 'user@example.com',
  channel: 'email',
  country: 'NG',
  subject: 'Welcome!',
  content: 'Welcome to Planr!',
  templateId: 'wedding_invite',
  variables: {
    couple_names: 'John & Jane',
    wedding_date: '2024-06-15'
  }
})

if (result.success) {
  console.log('Message sent:', result.data.messageId)
} else {
  console.error('Send failed:', result.error.message)
}
```

## Pricing

The service uses a JSON-based pricebook that defines:

- **Channel costs** per country (email: 1 credit, SMS: 5-12 credits, WhatsApp: 1-4 credits)
- **Provider mapping** (Resend for email, Twilio for SMS/WhatsApp)
- **Rate limits** (daily, monthly, burst)
- **Templates** with required variables

### Example Pricing

| Channel | Nigeria | US | UK | Notes |
|---------|---------|----|----|-------|
| Email | 1 credit | 1 credit | 1 credit | Via Resend |
| SMS | 5 credits | 10 credits | 8 credits | Via Twilio |
| WhatsApp | 2 credits | 3 credits | 3 credits | Via Twilio |

## Providers

### Resend (Email)
- **Features**: HTML/text email, templates, delivery tracking
- **Configuration**: API key, from email/name
- **Rate limit**: 100 requests/minute

### Twilio (SMS/WhatsApp)
- **Features**: SMS, WhatsApp, delivery status, media messages
- **Configuration**: Account SID, auth token, from numbers
- **Rate limit**: 100 requests/minute

### Amazon SES (Email - Stub)
- **Status**: Placeholder implementation
- **Features**: Will support bounce/complaint handling
- **Rate limit**: 200 requests/second

## Message Flow

1. **Validation**: Validate request parameters
2. **Pricing**: Get cost from pricebook based on channel/country
3. **Credit Check**: Reserve credits from user account
4. **Provider Selection**: Get adapter based on pricing rules
5. **Send**: Send via appropriate adapter
6. **Credit Management**: Deduct on success, refund on failure
7. **Logging**: Log attempt with masked recipient info

## Bulk Messaging

```typescript
const bulkResult = await messagingService.sendBulkMessages({
  userId: 'user_123',
  messages: [
    {
      to: 'guest1@example.com',
      channel: 'email',
      country: 'NG',
      content: 'Your invitation...'
    },
    {
      to: '+1234567890',
      channel: 'sms',
      country: 'US',
      content: 'RSVP reminder...'
    }
  ]
})

console.log(`Sent ${bulkResult.data.successCount}/${bulkResult.data.totalMessages}`)
```

## Templates

Templates are defined in the pricebook and include:

- **wedding_invite**: Initial invitation with RSVP link
- **rsvp_reminder**: Reminder for non-responders
- **rsvp_confirmation**: Confirmation after RSVP
- **wedding_update**: Updates about wedding details

### Template Variables

```typescript
// Wedding invitation template variables
{
  couple_names: 'John & Jane Smith',
  wedding_date: 'June 15, 2024',
  venue_name: 'Grand Ballroom',
  rsvp_link: 'https://planr.app/rsvp/abc123',
  guest_name: 'Alice Johnson'
}
```

## Error Handling

The service returns structured results with success/error information:

```typescript
interface RepositoryResult<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    statusCode?: number
  }
}
```

### Common Error Codes

- `USER_ID_REQUIRED`: Missing user ID
- `RECIPIENT_REQUIRED`: Missing recipient
- `CHANNEL_UNSUPPORTED`: Invalid channel
- `INSUFFICIENT_CREDITS`: Not enough credits
- `ADAPTER_NOT_AVAILABLE`: No provider for channel
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `PROVIDER_ERROR`: Provider API error

## Configuration

### Environment Variables

```bash
# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@planr.app
RESEND_FROM_NAME=Planr

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1234567890
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
TWILIO_STATUS_CALLBACK_URL=https://api.planr.app/webhooks/twilio

# Amazon SES (future)
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Pricebook
PRICEBOOK_JSON_URL=https://config.planr.app/pricebook.json
```

## Testing

```bash
# Run all messaging service tests
cd src/features/messaging/service/__tests__
node test-runner.js

# Run specific test
npx vitest messaging.service.test.ts
npx vitest pricebook.service.test.ts
```

## Monitoring

The service logs structured events for monitoring:

```typescript
// Message sent successfully
{
  messageId: 'msg_123',
  channel: 'email',
  provider: 'resend',
  cost: 1,
  userId: 'user_123',
  operation: 'message_sent'
}

// Bulk send completed
{
  userId: 'user_123',
  totalMessages: 100,
  successCount: 98,
  failureCount: 2,
  totalCost: 150,
  operation: 'bulk_send_completed'
}
```

## Rate Limits

Default limits per channel:

- **Daily**: Email (1000), SMS (500), WhatsApp (200)
- **Monthly**: Email (25000), SMS (10000), WhatsApp (5000)
- **Burst**: Email (50), SMS (20), WhatsApp (10)

## Security

- **Content sanitization**: HTML/script tag removal
- **Recipient masking**: PII protection in logs
- **Input validation**: Strict parameter validation
- **Rate limiting**: Prevent abuse
- **Credit checks**: Prevent overspending

## Future Enhancements

1. **Message scheduling**: Delayed message sending
2. **A/B testing**: Template variant testing
3. **Analytics**: Delivery rate tracking
4. **Webhooks**: Real-time delivery notifications
5. **Message queuing**: Redis-based queue for high volume
6. **Geographic routing**: Region-specific providers
7. **Compliance**: GDPR, CAN-SPAM compliance features