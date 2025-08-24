# RSVP API Handlers

This directory contains the API handlers for RSVP functionality, providing HTTP endpoints for RSVP submissions, statistics, and invite validation.

## Architecture

```
RSVPHandler
├── submitRSVP() - Handle RSVP submissions
├── getStats() - Get RSVP statistics (authenticated)
├── checkRSVP() - Check existing RSVP responses
├── validateInvite() - Validate invite tokens
└── healthCheck() - Service health monitoring
```

## API Endpoints

### POST /api/rsvp
Submit an RSVP response.

**Request Body:**
```json
{
  "inviteId": "123e4567-e89b-12d3-a456-426614174000",
  "guestName": "John Doe",
  "attending": true,
  "partySize": 2,
  "dietaryRestrictions": "Vegetarian",
  "notes": "Looking forward to it!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "rsvp_123",
    "inviteId": "123e4567-e89b-12d3-a456-426614174000",
    "guestName": "John Doe",
    "attending": true,
    "partySize": 2,
    "submittedAt": "2024-08-24T10:30:00Z"
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### GET /api/rsvp?inviteId=xxx
Check existing RSVP for an invite.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "rsvp_123",
    "inviteId": "123e4567-e89b-12d3-a456-426614174000",
    "guestName": "John Doe",
    "attending": true,
    "partySize": 2,
    "dietaryRestrictions": "Vegetarian",
    "notes": "Looking forward to it!",
    "submittedAt": "2024-08-24T10:30:00Z",
    "updatedAt": "2024-08-24T10:30:00Z"
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

**Response when no RSVP exists (200):**
```json
{
  "success": true,
  "data": null,
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### GET /api/rsvp/stats?inviteId=xxx
Get RSVP statistics (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalInvited": 100,
    "totalResponded": 75,
    "totalAttending": 60,
    "totalNotAttending": 15,
    "responseRate": 0.75,
    "attendanceRate": 0.8
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### GET /api/rsvp/validate?token=xxx
Validate an invite token.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "invite": {
      "id": "invite_123",
      "token": "abc123def456",
      "guestName": "John Doe",
      "guestEmail": "john@example.com",
      "guestPhone": "+1234567890",
      "maxPartySize": 4,
      "vendorId": "vendor_123",
      "createdAt": "2024-08-24T09:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  },
  "timestamp": "2024-08-24T10:30:00Z"
}
```

### GET /api/rsvp/health
Service health check.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-08-24T10:30:00Z",
    "service": "rsvp-api"
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

- `VALIDATION_ERROR` (400) - Invalid request data
- `INVITE_ID_REQUIRED` (400) - Missing invite ID parameter
- `INVALID_INVITE_ID` (400) - Invalid UUID format
- `TOKEN_REQUIRED` (400) - Missing invite token
- `INVALID_TOKEN` (400) - Invalid or expired token
- `INVITE_NOT_FOUND` (404) - Invite does not exist
- `RSVP_NOT_FOUND` (404) - RSVP does not exist
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Access denied
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNHEALTHY` (503) - Service unavailable

## Validation

All inputs are validated using Zod schemas:

### RSVP Submission Validation
- `inviteId`: Required UUID
- `guestName`: Required string (1-100 characters)
- `attending`: Required boolean
- `partySize`: Optional positive integer (1-20)
- `dietaryRestrictions`: Optional string (max 500 characters)
- `notes`: Optional string (max 1000 characters)

### Invite ID Validation
- Must be valid UUID v4 format
- Required for stats and check operations

### Token Validation
- Must be non-empty string
- Format validation handled by service layer

## Security Features

### Input Sanitization
- All string inputs are trimmed and validated
- HTML/script content is rejected
- SQL injection protection via Prisma ORM

### Rate Limiting
- TODO: Implement rate limiting per IP for RSVP submissions
- TODO: Implement rate limiting per user for authenticated endpoints

### Authentication
- Stats endpoint requires authentication (TODO: implement)
- Ownership verification for invite access (TODO: implement)

### Data Privacy
- Sensitive information masked in logs
- Guest contact information protected
- RSVP responses only accessible to invite owners

## Error Handling

### Graceful Degradation
- Database connection failures return 503
- Invalid JSON returns 400 with clear message
- Missing parameters return 400 with specific error

### Logging
- All operations logged with structured context
- Errors logged with full stack traces
- Sensitive data masked in logs

### Retry Logic
- Database operations use Prisma's built-in retry
- Transient failures handled gracefully
- Circuit breaker pattern for external dependencies

## Testing

```bash
# Run all handler tests
cd src/features/rsvp/handlers/__tests__
node test-runner.js

# Run specific test
npx vitest rsvp.handler.test.ts
```

### Test Coverage
- ✅ RSVP submission with valid data
- ✅ RSVP submission with invalid data
- ✅ RSVP submission with service errors
- ✅ Stats retrieval with authentication
- ✅ RSVP checking for existing responses
- ✅ Invite token validation
- ✅ Health check functionality
- ✅ Error handling for all scenarios

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields
- Efficient queries via Prisma ORM
- Connection pooling for concurrent requests

### Caching Strategy
- TODO: Implement Redis caching for invite validation
- TODO: Cache RSVP stats for frequently accessed events
- TODO: Implement ETag headers for conditional requests

### Monitoring
- Health check endpoint for uptime monitoring
- Structured logging for observability
- TODO: Metrics collection for response times

## Future Enhancements

### Authentication & Authorization
1. **JWT-based authentication** for protected endpoints
2. **Role-based access control** (vendor, admin, guest)
3. **API key authentication** for external integrations

### Advanced Features
1. **Bulk RSVP operations** for event management
2. **RSVP reminders** via messaging system integration
3. **Real-time updates** via WebSocket connections
4. **Export functionality** for guest lists

### Security Improvements
1. **Rate limiting** implementation
2. **CSRF protection** for form submissions
3. **Input validation** enhancement
4. **Audit logging** for compliance

### Performance Optimization
1. **Response caching** with Redis
2. **Database query optimization**
3. **CDN integration** for static assets
4. **Load balancing** for high availability

## Integration Points

### RSVP Service Layer
- Delegates business logic to RSVPService
- Handles data transformation and validation
- Manages database transactions

### Messaging System
- TODO: Integration for RSVP confirmations
- TODO: Reminder notifications
- TODO: Status update notifications

### Authentication System
- TODO: Integration with NextAuth.js
- TODO: Session management
- TODO: Permission checking

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication (future)
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="..."

# Rate Limiting (future)
REDIS_URL="redis://..."
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window
```

### Feature Flags
```bash
# Enable/disable features
ENABLE_RSVP_RATE_LIMITING=false
ENABLE_RSVP_CACHING=false
ENABLE_RSVP_ANALYTICS=true
```