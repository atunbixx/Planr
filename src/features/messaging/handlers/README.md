# Messaging API Handlers

This directory contains the API handlers for messaging functionality, providing HTTP endpoints for message sending, pricing, delivery tracking, and credit management.

## Architecture

```
MessagingHandler
├── sendMessage() - Send single messages
├── sendBulkMessages() - Send multiple messages in batch
├── getPricing() - Get pricing for channels/countries
├── getBulkPricing() - Calculate bulk pricing
├── getDeliveryStatus() - Track message delivery
├── getCreditBalance() - Check user credits
└── healthCheck() - Service health monitoring
```

## API Endpoints

### POST /api/messages/send
Send a single message via email, SMS, or WhatsApp.

**Authentication:** Required (x-user-id header or Bearer token)

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "channel": "email",
  "country": "NG",
  "templateId": "wedding_invite",
  "subject": "You're Invited!",
  "content": "Join us for our special day...",
  "variables": {
    "couple_names": "John & Jane",
    "wedding_date": "2024-06-15",
    "venue_name": "Grand Hotel"
  },
  "metadata": {
    "campaign": "wedding_invitations"
  },
  "priority": "normal",
  "scheduledAt": "2024-08-25T10:00:00Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123456789",
    "providerMessageId": "resend_abc123",
    "status": "sent",
    "channel": "email",
    "provider": "resend",
    "cost": 1,
    "currency": "credits",
    "timestamp": "2024-08-24T10:30:00Z",
    "success": true
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### POST /api/messages/bulk
Send multiple messages in a single batch operation.

**Authentication:** Required

**Request Body:**
```json
{
  "messages": [
    {
      "to": "guest1@example.com",
      "channel": "email",
      "country": "NG",
      "templateId": "wedding_invite",
      "content": "You're invited to our wedding!",
      "variables": {
        "guest_name": "Alice Smith",
        "couple_names": "John & Jane"
      }
    },
    {
      "to": "+1234567890",
      "channel": "sms",
      "country": "US",
      "content": "RSVP reminder: Please respond by June 1st"
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "totalMessages": 2,
    "successCount": 2,
    "failureCount": 0,
    "totalCost": 11,
    "currency": "credits",
    "results": [
      {
        "messageId": "msg_123",
        "providerMessageId": "resend_abc",
        "status": "sent",
        "channel": "email",
        "provider": "resend",
        "cost": 1,
        "success": true
      },
      {
        "messageId": "msg_124",
        "providerMessageId": "twilio_def",
        "status": "sent",
        "channel": "sms",
        "provider": "twilio",
        "cost": 10,
        "success": true
      }
    ],
    "timestamp": "2024-08-24T10:30:00Z"
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### GET /api/messages/pricing?channel=email&country=NG
Get pricing information for a specific channel and country.

**Authentication:** Not required (public endpoint)

**Query Parameters:**
- `channel` (required): email, sms, or whatsapp
- `country` (optional): 2-letter ISO country code

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cost": 1,
    "currency": "credits",
    "provider": "resend",
    "country": "NG",
    "channel": "email",
    "notes": "Nigeria - Standard email delivery"
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### POST /api/messages/pricing/bulk
Calculate pricing for multiple messages.

**Authentication:** Not required (public endpoint)

**Request Body:**
```json
{
  "messages": [
    { "channel": "email", "country": "NG" },
    { "channel": "sms", "country": "US" },
    { "channel": "whatsapp", "country": "NG" }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCost": 13,
    "breakdown": [
      {
        "cost": 1,
        "currency": "credits",
        "provider": "resend",
        "country": "NG",
        "channel": "email",
        "index": 0
      },
      {
        "cost": 10,
        "currency": "credits",
        "provider": "twilio",
        "country": "US",
        "channel": "sms",
        "index": 1
      },
      {
        "cost": 2,
        "currency": "credits",
        "provider": "twilio",
        "country": "NG",
        "channel": "whatsapp",
        "index": 2
      }
    ],
    "currency": "credits"
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### GET /api/messages/status?messageId=xxx&providerMessageId=xxx&provider=xxx
Get delivery status for a sent message.

**Authentication:** Required (user must own the message)

**Query Parameters:**
- `messageId` (required): Internal message ID
- `providerMessageId` (required): Provider's message ID
- `provider` (required): Provider name (resend, twilio, etc.)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_123",
    "status": "delivered",
    "timestamp": "2024-08-24T10:35:00Z",
    "details": "Message delivered successfully",
    "attempts": 1
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### GET /api/messages/credits
Get user's current credit balance.

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "balance": 150,
    "currency": "credits",
    "lastUpdated": "2024-08-24T09:00:00Z"
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### GET /api/messages/health
Service health check and status.

**Authentication:** Not required (public endpoint)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-08-24T10:30:00Z",
    "service": "messaging-api",
    "details": {
      "initialized": true,
      "adapters": 3,
      "pricebook": "1.0"
    }
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Access denied
- `VALIDATION_ERROR` (400) - Invalid request data
- `CHANNEL_REQUIRED` (400) - Missing channel parameter
- `INVALID_CHANNEL` (400) - Invalid channel type
- `INVALID_COUNTRY` (400) - Invalid country code
- `INSUFFICIENT_CREDITS` (402) - Not enough credits
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `MESSAGE_SEND_FAILED` (500) - Message sending failed
- `BULK_SEND_FAILED` (500) - Bulk sending failed
- `PRICING_FAILED` (500) - Pricing calculation failed
- `STATUS_FAILED` (500) - Status retrieval failed
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNHEALTHY` (503) - Service unavailable

## Validation Rules

### Message Sending
- `to`: Required, non-empty string
- `channel`: Required, must be 'email', 'sms', or 'whatsapp'
- `country`: Optional, must be 2-letter ISO code
- `content`: Required, non-empty string
- `subject`: Optional for email, ignored for SMS/WhatsApp
- `variables`: Optional object with string values
- `priority`: Optional, 'low', 'normal', or 'high'
- `scheduledAt`: Optional ISO datetime string

### Bulk Messaging
- `messages`: Required array, 1-100 messages
- Each message follows single message validation rules

### Pricing Requests
- `channel`: Required, valid channel type
- `country`: Optional, 2-letter ISO code
- Bulk pricing: 1-1000 messages maximum

## Authentication

### Current Implementation
- **Header-based**: `x-user-id` header for testing
- **Bearer token**: `Authorization: Bearer <token>` (placeholder)

### Future Implementation
```typescript
// JWT token validation
const token = request.headers.get('authorization')?.replace('Bearer ', '')
const payload = jwt.verify(token, process.env.JWT_SECRET)
const userId = payload.sub
```

### Rate Limiting (Future)
```typescript
// Per-user rate limiting
const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: (req) => getUserId(req)
})
```

## Security Features

### Input Validation
- **Zod schema validation** for all inputs
- **Email/phone format validation** in service layer
- **Country code validation** (2-letter ISO)
- **Content length limits** per channel

### Data Privacy
- **IP address logging** for audit trails
- **User agent tracking** for security monitoring
- **Sensitive data masking** in logs
- **Credit balance protection** via authentication

### Error Handling
- **Sanitized error messages** to prevent information leakage
- **Proper HTTP status codes** for all scenarios
- **Structured error responses** for consistent client handling

## Performance Considerations

### Request Optimization
- **Bulk operations** for multiple messages
- **Efficient validation** with early returns
- **Minimal data transfer** with focused responses

### Database Optimization
- **Connection pooling** via Prisma
- **Efficient credit queries** with atomic operations
- **Health check monitoring** for uptime tracking

### Caching Strategy (Future)
- **Pricing cache** with Redis (5-minute TTL)
- **User credit cache** (30-second TTL)
- **Provider status cache** (1-minute TTL)

## Monitoring & Logging

### Structured Logging
```typescript
// Successful message send
{
  messageId: 'msg_123',
  userId: 'user_456',
  channel: 'email',
  provider: 'resend',
  cost: 1,
  operation: 'api_message_sent'
}

// Bulk send completion
{
  userId: 'user_456',
  totalMessages: 50,
  successCount: 48,
  failureCount: 2,
  totalCost: 75,
  operation: 'api_bulk_sent'
}
```

### Health Monitoring
- Database connectivity checks
- Service initialization status
- Adapter availability monitoring
- Error rate tracking

### Metrics Collection (Future)
- Message volume per channel
- Success/failure rates by provider
- Average response times
- Credit consumption patterns

## Testing

```bash
# Run all handler tests
cd src/features/messaging/handlers/__tests__
node test-runner.js

# Run specific test
npx vitest messaging.handler.test.ts
```

### Test Coverage
- ✅ Single message sending with authentication
- ✅ Bulk message sending with validation
- ✅ Pricing calculations for all channels
- ✅ Credit balance retrieval
- ✅ Delivery status tracking
- ✅ Health check functionality
- ✅ Error handling for all scenarios
- ✅ Input validation with edge cases

## Integration Examples

### Frontend Integration
```typescript
// Send wedding invitation
const response = await fetch('/api/messages/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    to: 'guest@example.com',
    channel: 'email',
    templateId: 'wedding_invite',
    variables: {
      couple_names: 'John & Jane',
      wedding_date: 'June 15, 2024',
      venue_name: 'Grand Hotel',
      rsvp_link: 'https://planr.app/rsvp/abc123'
    }
  })
})

const result = await response.json()
if (result.success) {
  console.log('Invitation sent:', result.data.messageId)
}
```

### RSVP Integration
```typescript
// Send RSVP confirmation
const confirmationResult = await messagingService.sendMessage({
  userId: 'vendor_123',
  to: rsvp.email,
  channel: 'email',
  templateId: 'rsvp_confirmation',
  variables: {
    guest_name: rsvp.guestName,
    couple_names: 'John & Jane',
    wedding_date: 'June 15, 2024',
    rsvp_status: rsvp.attending ? 'attending' : 'not attending',
    party_size: rsvp.partySize.toString()
  }
})
```

## Future Enhancements

### Advanced Features
1. **Message scheduling** with delayed delivery
2. **Template management** via API endpoints
3. **Webhook notifications** for delivery status
4. **A/B testing** for message variants
5. **Analytics dashboard** for message performance

### Performance Optimization
1. **Message queuing** with Redis/Bull
2. **Provider failover** for high availability
3. **Geographic routing** for optimal delivery
4. **Batch processing** for high-volume sends

### Security Improvements
1. **OAuth 2.0 integration** for authentication
2. **API key management** for external access
3. **Rate limiting** per user/IP
4. **Audit logging** for compliance

### Compliance Features
1. **Unsubscribe management** for email
2. **Opt-out handling** for SMS
3. **GDPR compliance** features
4. **Message retention policies**

## Configuration

### Environment Variables
```bash
# Authentication (future)
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"

# Rate Limiting (future)
REDIS_URL="redis://localhost:6379"
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window

# Messaging Providers
RESEND_API_KEY="re_..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."

# Feature Flags
ENABLE_MESSAGE_SCHEDULING=false
ENABLE_WEBHOOK_NOTIFICATIONS=false
ENABLE_ANALYTICS_TRACKING=true
```

### API Limits
```bash
# Request Limits
MAX_BULK_MESSAGES=100
MAX_PRICING_REQUESTS=1000
MAX_MESSAGE_SIZE=10000  # characters

# Rate Limits (per user)
MESSAGES_PER_MINUTE=60
BULK_REQUESTS_PER_HOUR=10
PRICING_REQUESTS_PER_MINUTE=100
```