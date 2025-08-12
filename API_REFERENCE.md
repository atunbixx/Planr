# Wedding Planner v2 - API Reference

## Overview

This document provides comprehensive documentation for the Wedding Planner v2 API. All endpoints follow RESTful conventions and return consistent JSON responses.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:4000/api
```

## Authentication

All API endpoints require authentication via Clerk. Include the session token in the Authorization header:

```http
Authorization: Bearer <clerk_session_token>
```

## Response Format

All API responses follow this consistent structure:

### Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `BUSINESS_LOGIC_ERROR` | Business rule violation |
| `EXTERNAL_SERVICE_ERROR` | External service failure |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Guests API

### List Guests

Retrieve a paginated list of guests for the authenticated user's couple.

```http
GET /api/guests?page=1&pageSize=20&orderBy=firstName
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)
- `orderBy` (optional): Sort field (firstName, lastName, createdAt)
- `order` (optional): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "guest_123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "side": "bride",
        "relationship": "friend",
        "plusOneAllowed": true,
        "plusOneName": "Jane Doe",
        "dietaryRestrictions": "Vegetarian",
        "notes": "Close family friend",
        "address": "123 Main St, City, State",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z",
        "invitations": [
          {
            "id": "inv_456",
            "status": "confirmed",
            "sentAt": "2024-01-10T10:00:00Z",
            "respondedAt": "2024-01-12T15:30:00Z"
          }
        ]
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

### Get Guest Statistics

Retrieve RSVP and guest statistics.

```http
GET /api/guests/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "confirmed": 120,
    "declined": 10,
    "pending": 20,
    "withPlusOne": 80
  }
}
```

### Create Guest

Create a new guest for the couple.

```http
POST /api/guests
Content-Type: application/json

{
  "name": "John Doe Smith",
  "email": "john@example.com",
  "phone": "+1234567890",
  "side": "bride",
  "relationship": "friend",
  "plusOneAllowed": true,
  "plusOneName": "Jane Smith",
  "dietaryRestrictions": "Gluten-free",
  "notes": "College roommate",
  "address": "123 Main St, Anytown, ST 12345"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "guest_789",
    "firstName": "John",
    "lastName": "Doe Smith",
    "email": "john@example.com",
    // ... other fields
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Guest

Update an existing guest.

```http
PUT /api/guests/{guestId}
Content-Type: application/json

{
  "name": "John Updated Name",
  "email": "newemail@example.com",
  "plusOneAllowed": false
}
```

### Delete Guest

Delete a guest.

```http
DELETE /api/guests/{guestId}
```

### Bulk Import Guests

Import multiple guests at once.

```http
POST /api/guests/bulk-import
Content-Type: application/json

{
  "guests": [
    {
      "name": "Guest One",
      "email": "guest1@example.com",
      "side": "bride"
    },
    {
      "name": "Guest Two",
      "email": "guest2@example.com",
      "side": "groom"
    }
  ]
}
```

### Update RSVP

Update a guest's RSVP status.

```http
PUT /api/guests/{guestId}/rsvp
Content-Type: application/json

{
  "status": "confirmed"
}
```

**Valid Statuses:** `confirmed`, `declined`, `pending`

---

## Vendors API

### List Vendors

Retrieve vendors for the couple.

```http
GET /api/vendors?category=photographer&status=booked
```

**Query Parameters:**
- `category` (optional): Filter by category ID
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority

### Create Vendor

```http
POST /api/vendors
Content-Type: application/json

{
  "name": "Amazing Photography",
  "contactName": "Jane Photographer",
  "email": "jane@amazingphoto.com",
  "phone": "+1234567890",
  "website": "https://amazingphoto.com",
  "address": "456 Photo St, City, ST 12345",
  "categoryId": "cat_photo_123",
  "status": "contacted",
  "priority": "high",
  "estimatedCost": 2500.00,
  "notes": "Highly recommended by venue"
}
```

### Vendor Categories

Get available vendor categories.

```http
GET /api/vendors/categories
```

---

## Budget API

### Get Budget Overview

```http
GET /api/budget
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBudget": 50000,
    "totalSpent": 25000,
    "totalRemaining": 25000,
    "categories": [
      {
        "id": "cat_venue",
        "name": "Venue",
        "budgetAmount": 20000,
        "actualAmount": 18000,
        "remaining": 2000,
        "color": "#3B82F6"
      }
    ],
    "recentExpenses": []
  }
}
```

### Budget Categories

```http
GET /api/budget/categories
POST /api/budget/categories
PUT /api/budget/categories/{categoryId}
DELETE /api/budget/categories/{categoryId}
```

### Budget Expenses

```http
GET /api/budget/expenses
POST /api/budget/expenses
PUT /api/budget/expenses/{expenseId}
DELETE /api/budget/expenses/{expenseId}
```

---

## Photos API

### Upload Photos

```http
POST /api/photos/upload
Content-Type: multipart/form-data

files: [File, File, ...]
albumId: "album_123" (optional)
eventType: "ceremony"
photoDate: "2024-06-15"
location: "Beach Resort"
photographer: "John Photo"
```

### List Photos

```http
GET /api/photos?albumId=album_123&eventType=reception&limit=50&offset=0
```

### Get Photo

```http
GET /api/photos/{photoId}
```

### Update Photo

```http
PUT /api/photos/{photoId}
Content-Type: application/json

{
  "title": "Beautiful sunset shot",
  "description": "Taken during golden hour",
  "altText": "Couple walking on beach at sunset",
  "isFavorite": true,
  "albumId": "album_456",
  "tags": ["sunset", "beach", "golden hour"]
}
```

### Delete Photo

```http
DELETE /api/photos/{photoId}
```

### Bulk Photo Operations

```http
POST /api/photos/bulk
Content-Type: application/json

{
  "operation": "favorite",
  "photo_ids": ["photo_1", "photo_2", "photo_3"],
  "data": {
    "isFavorite": true
  }
}
```

**Available Operations:**
- `delete`: Delete multiple photos
- `favorite`: Mark/unmark as favorite
- `move_to_album`: Move photos to album
- `add_tags`: Add tags to photos

---

## Albums API

### List Albums

```http
GET /api/albums
```

### Create Album

```http
POST /api/albums
Content-Type: application/json

{
  "name": "Ceremony Photos",
  "description": "Photos from the wedding ceremony",
  "coverPhotoId": "photo_123",
  "eventType": "ceremony",
  "eventDate": "2024-06-15",
  "location": "Beach Resort Chapel"
}
```

---

## Checklist API

### List Checklist Items

```http
GET /api/checklist?category=venue&status=pending
```

### Create Checklist Item

```http
POST /api/checklist
Content-Type: application/json

{
  "title": "Book wedding venue",
  "description": "Research and book the perfect venue",
  "category": "venue",
  "dueDate": "2024-03-01",
  "priority": "high",
  "estimatedHours": 8,
  "assignedTo": "bride"
}
```

### Update Checklist Item

```http
PUT /api/checklist/{itemId}
Content-Type: application/json

{
  "status": "completed",
  "completedAt": "2024-01-15T10:30:00Z",
  "notes": "Venue booked for June 15th"
}
```

---

## Settings API

### Get Wedding Settings

```http
GET /api/settings/wedding
```

### Update Wedding Settings

```http
PUT /api/settings/wedding
Content-Type: application/json

{
  "partner1Name": "John",
  "partner2Name": "Jane",
  "weddingDate": "2024-06-15",
  "venue": "Beach Resort",
  "ceremony_start_time": "16:00",
  "reception_start_time": "18:00",
  "guestCount": 150,
  "budgetAmount": 50000,
  "weddingWebsite": "https://johnandjane.wedding",
  "theme": "beach",
  "colors": ["#3B82F6", "#10B981"]
}
```

### User Preferences

```http
GET /api/settings/preferences
PUT /api/settings/preferences
```

---

## Dashboard API

### Dashboard Statistics

Get comprehensive dashboard data.

```http
GET /api/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "daysUntilWedding": 150,
      "completedTasks": 25,
      "totalTasks": 100,
      "guestResponses": 80,
      "totalGuests": 150,
      "budgetSpent": 25000,
      "totalBudget": 50000
    },
    "recentActivity": [],
    "upcomingDeadlines": [],
    "budgetSummary": {},
    "guestSummary": {},
    "vendorSummary": {}
  }
}
```

---

## RSVP API (Public)

### Get Guest by Invitation Code

```http
GET /api/guests/rsvp/{invitationCode}
```

### Submit RSVP Response

```http
POST /api/guests/rsvp/{invitationCode}
Content-Type: application/json

{
  "status": "confirmed",
  "plusOneAttending": true,
  "dietaryRestrictions": "Vegetarian",
  "notes": "Looking forward to celebrating with you!"
}
```

---

## Error Examples

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Invalid email format",
      "phone": "Phone number is required"
    }
  }
}
```

### Authentication Error

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

### Not Found Error

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Guest not found",
    "details": {
      "guestId": "guest_nonexistent"
    }
  }
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated requests**: 1000 requests per hour
- **Photo uploads**: 100 requests per hour  
- **Bulk operations**: 50 requests per hour
- **Public RSVP**: 10 requests per minute per IP

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642272000
```

---

## Webhooks

### Resend Email Webhooks

Handle email delivery status updates.

```http
POST /api/webhooks/resend
```

### Twilio SMS Webhooks

Handle SMS delivery status updates.

```http
POST /api/webhooks/twilio
```

---

## Development

### Health Check

```http
GET /api/health
```

### Database Schema Check

```http
GET /api/check-schema
```

---

## SDKs and Libraries

### JavaScript/TypeScript

```javascript
import { WeddingPlannerAPI } from '@wedding-planner/sdk'

const client = new WeddingPlannerAPI({
  baseURL: 'https://api.example.com',
  apiKey: 'your-api-key'
})

// List guests
const guests = await client.guests.list({
  page: 1,
  pageSize: 20
})

// Create guest
const newGuest = await client.guests.create({
  name: 'John Doe',
  email: 'john@example.com'
})
```

For more detailed examples and implementation guides, see the [Integration Guide](./INTEGRATION_GUIDE.md).