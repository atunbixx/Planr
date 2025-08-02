# Vendor Communication System Architecture

## Overview

The vendor communication system provides secure, real-time messaging between couples and their wedding vendors. It integrates with the existing vendor management system to provide a complete communication and collaboration platform.

## Core Features

### 1. In-App Messaging
- **Thread-based conversations**: Each vendor has a dedicated message thread
- **Real-time updates**: Using Supabase Realtime subscriptions
- **Message types**: Text, images, documents, and system notifications
- **Read receipts**: Track when messages are read
- **Typing indicators**: Show when someone is typing
- **Message reactions**: Quick emoji reactions to messages

### 2. Document Sharing
- **Version control**: Track document versions and changes
- **Secure storage**: Integration with vendor_documents table
- **Preview support**: In-app preview for common file types
- **Batch upload**: Upload multiple files at once
- **Metadata tracking**: File size, type, upload date, and uploader

### 3. Payment Milestone Integration
- **Milestone notifications**: Automatic messages for upcoming payments
- **Payment confirmations**: Send/receive payment receipts
- **Contract updates**: Notify about contract status changes
- **Automated reminders**: Configurable reminder messages

### 4. Security & Access Control
- **End-to-end encryption**: Messages encrypted at rest
- **Authentication**: Vendor-specific access codes
- **Rate limiting**: Prevent spam and abuse
- **Content moderation**: Flag inappropriate content
- **Data retention**: Configurable message retention policies

## URL Structure

### Couple Side (Main App)
- `/dashboard/messages` - All conversations overview
- `/dashboard/messages/[vendor_id]` - Individual vendor chat
- `/dashboard/vendors/[id]/messages` - Messages from vendor detail page

### Vendor Portal
- `/vendor-portal/[access_code]` - Vendor login
- `/vendor-portal/[access_code]/messages` - Vendor message interface
- `/vendor-portal/[access_code]/documents` - Shared documents
- `/vendor-portal/[access_code]/milestones` - Payment milestones

## Database Schema

### Core Tables

```sql
-- Messages table
CREATE TABLE vendor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('couple', 'vendor', 'system')),
    sender_id UUID REFERENCES auth.users(id),
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' 
        CHECK (message_type IN ('text', 'image', 'document', 'system', 'milestone')),
    content TEXT,
    attachments JSONB, -- Array of attachment objects
    metadata JSONB, -- Additional message metadata
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    parent_message_id UUID REFERENCES vendor_messages(id), -- For replies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message reactions
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    reaction VARCHAR(10) NOT NULL, -- Emoji or reaction type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, reaction)
);

-- Typing indicators
CREATE TABLE typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    is_typing BOOLEAN DEFAULT true,
    last_typed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, couple_id, user_id)
);

-- Message attachments (extends vendor_documents)
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES vendor_documents(id) ON DELETE CASCADE,
    attachment_type VARCHAR(20) DEFAULT 'document',
    thumbnail_url TEXT, -- For image previews
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor access tokens
CREATE TABLE vendor_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    access_code VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);
```

### Indexes
```sql
CREATE INDEX idx_vendor_messages_vendor ON vendor_messages(vendor_id);
CREATE INDEX idx_vendor_messages_couple ON vendor_messages(couple_id);
CREATE INDEX idx_vendor_messages_created ON vendor_messages(created_at DESC);
CREATE INDEX idx_vendor_messages_unread ON vendor_messages(is_read) WHERE is_read = false;
CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_typing_indicators_active ON typing_indicators(vendor_id, couple_id) WHERE is_typing = true;
CREATE INDEX idx_vendor_access_tokens_code ON vendor_access_tokens(access_code) WHERE is_active = true;
```

### Row Level Security
```sql
-- RLS for vendor_messages
ALTER TABLE vendor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couples can view their vendor messages"
    ON vendor_messages FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Couples can send messages to their vendors"
    ON vendor_messages FOR INSERT
    WITH CHECK (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
        AND sender_type = 'couple'
        AND sender_id = auth.uid()
    );

-- Similar policies for other tables...
```

## Data Flow

### Message Sending Flow
1. **Client validates** message content and attachments
2. **Upload attachments** to Supabase Storage if needed
3. **Create message record** in vendor_messages table
4. **Create attachment records** in message_attachments if applicable
5. **Broadcast via Realtime** to all connected clients
6. **Send push notification** to offline recipients
7. **Update conversation list** with latest message

### Message Receiving Flow
1. **Subscribe to Realtime** channel for vendor conversations
2. **Receive new message** event
3. **Update local state** with new message
4. **Show notification** if app is in background
5. **Mark as read** when user views message
6. **Update read receipt** in real-time

### File Sharing Flow
1. **Select files** from device or camera
2. **Validate file types** and sizes
3. **Upload to Storage** with progress tracking
4. **Create document record** in vendor_documents
5. **Attach to message** via message_attachments
6. **Generate thumbnails** for images
7. **Send message** with attachment metadata

## API Endpoints

### REST API
- `GET /api/messages/vendors` - List all vendor conversations
- `GET /api/messages/vendors/:vendor_id` - Get messages for specific vendor
- `POST /api/messages/vendors/:vendor_id` - Send message to vendor
- `PUT /api/messages/:message_id/read` - Mark message as read
- `DELETE /api/messages/:message_id` - Delete message (soft delete)
- `POST /api/messages/:message_id/reactions` - Add reaction to message

### Realtime Subscriptions
```javascript
// Subscribe to vendor messages
const channel = supabase
  .channel('vendor-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'vendor_messages',
    filter: `vendor_id=eq.${vendorId}`
  }, handleNewMessage)
  .on('presence', { event: 'sync' }, handleTypingIndicators)
  .subscribe()
```

## Security Considerations

### Authentication & Authorization
- **Couples**: Authenticated via Supabase Auth
- **Vendors**: Access via unique, time-limited access codes
- **Rate limiting**: Max 100 messages per hour per user
- **File size limits**: 10MB per file, 50MB total per message

### Data Protection
- **Encryption**: AES-256 for messages at rest
- **TLS**: All communications over HTTPS
- **Backup**: Daily backups with 30-day retention
- **GDPR compliance**: Data export and deletion capabilities

### Content Moderation
- **Automated scanning**: Check for spam and inappropriate content
- **Reporting system**: Users can report problematic messages
- **Admin tools**: Review and moderate reported content
- **Vendor blocking**: Ability to block communication with specific vendors

## Performance Optimization

### Caching Strategy
- **Message pagination**: Load 50 messages at a time
- **Lazy loading**: Load attachments on demand
- **Local storage**: Cache recent messages offline
- **CDN**: Serve attachments via Supabase CDN

### Real-time Optimization
- **Debounce typing indicators**: Update every 3 seconds
- **Batch read receipts**: Update in 5-second intervals
- **Connection pooling**: Reuse WebSocket connections
- **Presence cleanup**: Remove stale typing indicators

## Implementation Phases

### Phase 1: Core Messaging (Week 1-2)
- Basic text messaging
- Message history and pagination
- Read receipts
- Database schema and RLS

### Phase 2: Rich Media (Week 3)
- File attachments
- Image previews
- Document sharing
- Storage integration

### Phase 3: Real-time Features (Week 4)
- Typing indicators
- Online presence
- Push notifications
- Message reactions

### Phase 4: Vendor Portal (Week 5)
- Vendor authentication
- Vendor message interface
- Access code generation
- Vendor-specific features

### Phase 5: Advanced Features (Week 6)
- Message search
- Conversation archives
- Automated notifications
- Analytics and reporting

## Monitoring & Analytics

### Key Metrics
- **Message volume**: Messages sent/received per day
- **Response time**: Average time to first response
- **Engagement rate**: Active conversations percentage
- **File sharing**: Documents shared per conversation
- **Error rate**: Failed message delivery percentage

### Logging
- **Message events**: Send, receive, read, delete
- **Authentication**: Login attempts, access code usage
- **Errors**: Failed uploads, delivery failures
- **Performance**: API response times, query performance