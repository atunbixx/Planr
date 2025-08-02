# Messaging API Documentation

## Overview
The messaging API provides endpoints for vendor communication with real-time support through Supabase.

## Authentication
All endpoints require authentication via Supabase Auth. The authenticated user must be part of a couple.

## Endpoints

### 1. List Conversations
```
GET /api/messages/conversations
```

Returns all vendor conversations for the authenticated couple with the latest message and unread count.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "vendorId": "uuid",
        "vendorName": "string",
        "lastMessage": {
          "id": "uuid",
          "content": "string",
          "type": "text|image|document",
          "timestamp": "ISO 8601"
        },
        "unreadCount": 0,
        "hasAttachments": false
      }
    ],
    "totalUnread": 0
  }
}
```

### 2. Get Vendor Messages
```
GET /api/messages/[vendorId]?limit=50&before=[messageId]
```

Returns messages for a specific vendor conversation.

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50)
- `before` (optional): Load messages before this message ID (for pagination)

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "uuid",
      "name": "string",
      "category": "string"
    },
    "messages": [
      {
        "id": "uuid",
        "threadId": "uuid",
        "senderType": "couple|vendor|system",
        "senderId": "uuid",
        "senderName": "string",
        "type": "text|image|document",
        "content": "string",
        "attachments": [],
        "isRead": true,
        "readAt": "ISO 8601",
        "createdAt": "ISO 8601",
        "mediaCount": 0,
        "reactions": []
      }
    ],
    "hasMore": false
  }
}
```

### 3. Send Message
```
POST /api/messages
```

Send a new message to a vendor.

**Request Body:**
```json
{
  "vendorId": "uuid",
  "content": "string",
  "messageType": "text|image|document",
  "threadId": "uuid (optional)",
  "attachments": [
    {
      "url": "string",
      "name": "string",
      "size": 0,
      "type": "string"
    }
  ],
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": "uuid",
      "vendorId": "uuid",
      "threadId": "uuid",
      "senderType": "couple",
      "senderId": "uuid",
      "senderName": "string",
      "type": "text",
      "content": "string",
      "attachments": [],
      "metadata": {},
      "isRead": false,
      "createdAt": "ISO 8601"
    }
  }
}
```

### 4. Update Message
```
PUT /api/messages/[id]
```

Update/edit an existing message (only your own messages).

**Request Body:**
```json
{
  "content": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message updated successfully",
  "data": {
    "message": {
      "id": "uuid",
      "content": "string",
      "isEdited": true,
      "editedAt": "ISO 8601"
    }
  }
}
```

### 5. Delete Message
```
DELETE /api/messages/[id]
```

Delete a message (only your own messages).

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### 6. Mark as Read
```
POST /api/messages/[id]/read
```

Mark a message (and all previous messages in the conversation) as read.

**Response:**
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "messageId": "uuid",
    "readAt": "ISO 8601"
  }
}
```

### 7. Update Typing Status
```
POST /api/messages/typing
```

Update typing indicator status.

**Request Body:**
```json
{
  "vendorId": "uuid",
  "isTyping": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Typing status updated",
  "data": {
    "vendorId": "uuid",
    "isTyping": true,
    "timestamp": "ISO 8601"
  }
}
```

### 8. Upload File
```
POST /api/messages/upload
```

Upload a file attachment for messages.

**Request:** `multipart/form-data`
- `file`: File to upload (max 10MB)
- `vendorId`: UUID of the vendor
- `messageId` (optional): UUID of the message to attach to

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, XLS, XLSX

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "string",
    "fileName": "string",
    "fileSize": 0,
    "fileType": "string",
    "storagePath": "string",
    "isImage": true,
    "isDocument": false
  }
}
```

## Real-time Subscriptions

The messaging system supports real-time updates through Supabase Realtime:

1. **New Messages**: Subscribe to `vendor_messages` INSERT events
2. **Message Updates**: Subscribe to `vendor_messages` UPDATE events
3. **Message Deletions**: Subscribe to `vendor_messages` DELETE events
4. **Typing Indicators**: Subscribe to `typing_indicators` changes

Use the provided `MessagingRealtimeManager` class in `messaging-helpers.ts` for easy subscription management.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

**Common HTTP Status Codes:**
- `401`: Unauthorized - User not authenticated
- `404`: Not found - Resource doesn't exist or doesn't belong to user
- `400`: Bad request - Invalid input data
- `500`: Internal server error

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended to:
- Batch message reads when possible
- Implement typing indicator debouncing (3 second intervals)
- Limit file uploads to reasonable sizes (10MB max)

## Security

- All endpoints use Row Level Security (RLS) policies
- Users can only access their own couple's messages
- Vendors access messages through separate access tokens
- File uploads are validated for type and size
- Message content is sanitized before storage