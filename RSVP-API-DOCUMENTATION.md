# RSVP Backend API Documentation

## Overview
The RSVP backend provides secure, public-facing APIs for wedding guests to submit their RSVP responses without requiring authentication. The system includes rate limiting, CSRF protection, session management, and comprehensive tracking.

## API Endpoints

### 1. POST /api/rsvp/validate
Validates an invitation code and creates an RSVP session.

**Request Body:**
```json
{
  "inviteCode": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invite code validated successfully",
  "data": {
    "guest": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "plusOneAllowed": true,
      "mealChoice": null,
      "dietaryRestrictions": null,
      "rsvpStatus": "pending",
      "plusOneName": null,
      "plusOneMealChoice": null,
      "plusOneDietaryRestrictions": null
    },
    "mealOptions": [
      {
        "id": "uuid",
        "name": "Chicken",
        "description": "Grilled chicken breast",
        "category": "main"
      }
    ],
    "sessionId": "uuid"
  }
}
```

**Features:**
- Rate limiting: 20 requests per minute per IP
- Session cookie created (2-hour expiry)
- Tracks access attempts for analytics

### 2. POST /api/rsvp/track-access
Tracks RSVP access attempts for analytics purposes.

**Request Body:**
```json
{
  "inviteCode": "ABC123",
  "referrer": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access tracked successfully",
  "data": {
    "sessionId": "uuid",
    "guestId": "uuid",
    "accessGranted": true
  }
}
```

**Features:**
- Rate limiting: 50 requests per minute per IP
- Device type detection
- IP tracking for analytics

### 3. POST /api/rsvp/submit
Submits an RSVP response.

**Request Body:**
```json
{
  "guestId": "uuid",
  "attending": true,
  "email": "john@example.com",
  "phone": "+1234567890",
  "mealChoice": "chicken",
  "dietaryRestrictions": "No nuts",
  "plusOneAttending": true,
  "plusOneName": "Jane Doe",
  "plusOneMealChoice": "vegetarian",
  "plusOneDietaryRestrictions": "Vegan",
  "notes": "Looking forward to celebrating with you!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "RSVP submitted successfully",
  "data": {
    "responseId": "uuid",
    "guest": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "rsvp_status": "attending",
      "rsvp_date": "2024-01-15T10:30:00Z"
    },
    "message": "Thank you for confirming your attendance!"
  }
}
```

**Features:**
- Rate limiting: 10 submissions per minute per IP
- Session validation required
- Version history maintained
- Updates guest record with latest response

### 4. GET /api/rsvp/[code]
Retrieves guest information by invite code.

**Response:**
```json
{
  "success": true,
  "message": "Guest information retrieved successfully",
  "data": {
    "guest": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "plusOneAllowed": true,
      "mealChoice": "chicken",
      "dietaryRestrictions": "No nuts",
      "rsvpStatus": "attending",
      "rsvpDate": "2024-01-15T10:30:00Z",
      "plusOneName": "Jane Doe",
      "plusOneMealChoice": "vegetarian",
      "plusOneDietaryRestrictions": "Vegan"
    },
    "mealOptions": [...],
    "rsvpHistory": [
      {
        "id": "uuid",
        "response_version": 2,
        "attendance_status": "attending",
        "response_date": "2024-01-15T10:30:00Z",
        "meal_preference": "chicken",
        "plus_one_attending": true,
        "plus_one_name": "Jane Doe"
      }
    ]
  }
}
```

**Features:**
- Rate limiting: 30 requests per minute per IP
- Returns full guest details and RSVP history
- Includes available meal options

### 5. PUT /api/rsvp/[code]
Updates an existing RSVP response.

**Request Body:** Same as submit endpoint

**Response:** Same as submit endpoint

**Features:**
- Rate limiting: 10 updates per minute per IP
- Session validation required
- Creates new version in history

### 6. GET /api/rsvp/session/[sessionId]
Verifies and retrieves session information.

**Response:**
```json
{
  "success": true,
  "message": "Session verified successfully",
  "data": {
    "sessionId": "uuid",
    "guestId": "uuid",
    "inviteCode": "ABC123",
    "status": "success",
    "guest": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "rsvp_status": "attending"
    },
    "isValid": true,
    "isCompleted": false,
    "expiresIn": 115
  }
}
```

**Features:**
- Rate limiting: 30 requests per minute per IP
- Checks session expiry (2-hour limit)
- Updates last accessed time

## Security Features

### 1. Rate Limiting
- In-memory rate limiting (Redis recommended for production)
- Different limits per endpoint based on usage patterns
- Returns 429 status with Retry-After header when exceeded

### 2. CSRF Protection
- Automatic CSRF token generation for GET requests
- Token validation for state-changing requests (POST, PUT)
- Tokens stored in httpOnly cookies

### 3. Session Management
- 2-hour session expiry
- Session tokens generated using nanoid
- Sessions tracked in database with IP and device info

### 4. Input Validation
- Invite code format validation
- Required field validation
- SQL injection protection via parameterized queries

### 5. Error Handling
- Consistent error response format
- No sensitive information in error messages
- Proper HTTP status codes

## Database Tables Used

### rsvp_sessions
- Tracks all RSVP access attempts
- Stores session tokens and metadata
- Used for analytics and security

### rsvp_responses
- Stores all RSVP response versions
- Maintains history of changes
- Supports response analytics

### wedding_guests
- Main guest information table
- Updated with latest RSVP response
- Contains invite codes and preferences

## Helper Utilities

### /src/lib/rsvp-utils.ts
- Rate limiting implementation
- IP and user agent detection
- Session token generation
- CSRF helpers
- Response formatting

### /src/lib/csrf-client.ts
- Client-side CSRF token handling
- Automatic header injection
- Cookie parsing

### /src/hooks/useRSVPApi.ts
- React hook for RSVP API calls
- Automatic CSRF token inclusion
- Loading and error state management

## Usage Example

```javascript
import { useRSVPApi } from '@/hooks/useRSVPApi'

function RSVPForm() {
  const { validateInviteCode, submitRSVP, loading, error } = useRSVPApi()

  const handleSubmit = async (inviteCode) => {
    const result = await validateInviteCode(inviteCode)
    if (result?.success) {
      // Process guest data
      const guest = result.data.guest
      // Show RSVP form
    }
  }
}
```

## Testing

Run the test script to verify endpoints:
```bash
node test-rsvp-apis.js
```

## Production Considerations

1. **Rate Limiting**: Replace in-memory store with Redis
2. **Session Storage**: Consider Redis for session management
3. **CORS**: Configure allowed origins
4. **Monitoring**: Add application monitoring (e.g., Sentry)
5. **Logging**: Implement structured logging
6. **CDN**: Put behind CDN for static assets
7. **Database Indexes**: Ensure proper indexing on invite_code, session_token
8. **Backup**: Regular database backups
9. **SSL**: Ensure HTTPS in production
10. **Load Testing**: Test with expected guest count