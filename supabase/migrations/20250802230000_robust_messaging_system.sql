-- Robust Messaging System for Vendor Communication
-- Implements error handling, message delivery confirmation, offline queue, and status tracking

-- Message status enum
CREATE TYPE message_status AS ENUM (
    'queued',     -- Message is queued for sending
    'sending',    -- Message is being sent
    'sent',       -- Message sent to server
    'delivered',  -- Message delivered to recipient
    'read',       -- Message read by recipient
    'failed',     -- Message failed to send
    'retrying'    -- Message is being retried
);

-- Message type enum
CREATE TYPE message_type AS ENUM (
    'text',
    'image',
    'file',
    'template',
    'meeting_request',
    'quick_reply'
);

-- Create message threads table
CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Thread metadata
    subject VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    is_archived BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    
    -- Unread counts
    couple_unread_count INTEGER DEFAULT 0,
    vendor_unread_count INTEGER DEFAULT 0,
    
    -- Last activity
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    
    -- Typing indicators
    couple_typing BOOLEAN DEFAULT false,
    couple_typing_at TIMESTAMP WITH TIME ZONE,
    vendor_typing BOOLEAN DEFAULT false,
    vendor_typing_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(couple_id, vendor_id)
);

-- Create vendor messages table with enhanced tracking
CREATE TABLE IF NOT EXISTS vendor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'text',
    
    -- Sender information
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('couple', 'vendor', 'system')),
    sender_user_id UUID REFERENCES auth.users(id),
    sender_name VARCHAR(100),
    
    -- Status tracking
    status message_status DEFAULT 'queued',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Error handling
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- External message tracking
    external_message_id VARCHAR(255),
    external_provider VARCHAR(50),
    
    -- Reply tracking
    reply_to_message_id UUID REFERENCES vendor_messages(id),
    
    -- Edit tracking
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    edit_history JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    
    -- Thumbnail for images
    thumbnail_path VARCHAR(500),
    width INTEGER,
    height INTEGER,
    
    -- Upload tracking
    upload_status VARCHAR(50) DEFAULT 'pending',
    upload_progress INTEGER DEFAULT 0,
    upload_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    reaction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(message_id, user_id, reaction)
);

-- Message read receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(message_id, user_id)
);

-- Quick reply templates
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Template content
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Scope (null couple_id means global vendor template)
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message notification preferences
CREATE TABLE IF NOT EXISTS message_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- In-app notifications
    browser_notifications BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    desktop_notifications BOOLEAN DEFAULT true,
    
    -- Email notifications
    email_notifications BOOLEAN DEFAULT true,
    email_frequency VARCHAR(20) DEFAULT 'instant', -- instant, hourly, daily
    
    -- SMS notifications
    sms_notifications BOOLEAN DEFAULT false,
    sms_quiet_hours_start TIME,
    sms_quiet_hours_end TIME,
    
    -- Do not disturb
    dnd_enabled BOOLEAN DEFAULT false,
    dnd_start TIME,
    dnd_end TIME,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Offline message queue for sync
CREATE TABLE IF NOT EXISTS offline_message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    thread_id UUID NOT NULL REFERENCES message_threads(id),
    
    -- Message data
    temp_id VARCHAR(100) NOT NULL, -- Client-side temporary ID
    message_data JSONB NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Sync status
    sync_status VARCHAR(20) DEFAULT 'pending',
    sync_attempts INTEGER DEFAULT 0,
    last_sync_attempt TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, temp_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_threads_couple ON message_threads(couple_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_vendor ON message_threads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_activity ON message_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_thread ON vendor_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_status ON vendor_messages(status) WHERE status IN ('queued', 'failed', 'retrying');
CREATE INDEX IF NOT EXISTS idx_vendor_messages_created ON vendor_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_offline_queue_user ON offline_message_queue(user_id, sync_status);

-- Enable RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_message_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Message threads
CREATE POLICY "Users can view their message threads"
    ON message_threads FOR SELECT
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
        OR
        vendor_id IN (
            SELECT id FROM vendors 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create message threads"
    ON message_threads FOR INSERT
    WITH CHECK (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their message threads"
    ON message_threads FOR UPDATE
    USING (
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
        OR
        vendor_id IN (
            SELECT id FROM vendors 
            WHERE user_id = auth.uid()
        )
    );

-- Vendor messages
CREATE POLICY "Users can view messages in their threads"
    ON vendor_messages FOR SELECT
    USING (
        thread_id IN (
            SELECT id FROM message_threads
            WHERE couple_id IN (
                SELECT id FROM couples 
                WHERE partner1_user_id = auth.uid() 
                OR partner2_user_id = auth.uid()
            )
            OR vendor_id IN (
                SELECT id FROM vendors 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can send messages"
    ON vendor_messages FOR INSERT
    WITH CHECK (
        thread_id IN (
            SELECT id FROM message_threads
            WHERE couple_id IN (
                SELECT id FROM couples 
                WHERE partner1_user_id = auth.uid() 
                OR partner2_user_id = auth.uid()
            )
            OR vendor_id IN (
                SELECT id FROM vendors 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Message attachments
CREATE POLICY "Users can view attachments in their messages"
    ON message_attachments FOR SELECT
    USING (
        message_id IN (
            SELECT id FROM vendor_messages
            WHERE thread_id IN (
                SELECT id FROM message_threads
                WHERE couple_id IN (
                    SELECT id FROM couples 
                    WHERE partner1_user_id = auth.uid() 
                    OR partner2_user_id = auth.uid()
                )
                OR vendor_id IN (
                    SELECT id FROM vendors 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Notification preferences
CREATE POLICY "Users can manage their notification preferences"
    ON message_notification_preferences FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Offline queue
CREATE POLICY "Users can manage their offline queue"
    ON offline_message_queue FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Functions
-- Function to update thread on new message
CREATE OR REPLACE FUNCTION update_thread_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update thread metadata
    UPDATE message_threads
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        couple_unread_count = CASE 
            WHEN NEW.sender_type = 'vendor' THEN couple_unread_count + 1
            ELSE couple_unread_count
        END,
        vendor_unread_count = CASE 
            WHEN NEW.sender_type = 'couple' THEN vendor_unread_count + 1
            ELSE vendor_unread_count
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.thread_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_thread_id UUID,
    p_user_id UUID
)
RETURNS void AS $$
DECLARE
    v_is_couple BOOLEAN;
    v_is_vendor BOOLEAN;
BEGIN
    -- Check if user is couple or vendor
    SELECT EXISTS (
        SELECT 1 FROM couples 
        WHERE id IN (
            SELECT couple_id FROM message_threads WHERE id = p_thread_id
        )
        AND (partner1_user_id = p_user_id OR partner2_user_id = p_user_id)
    ) INTO v_is_couple;
    
    SELECT EXISTS (
        SELECT 1 FROM vendors 
        WHERE id IN (
            SELECT vendor_id FROM message_threads WHERE id = p_thread_id
        )
        AND user_id = p_user_id
    ) INTO v_is_vendor;
    
    -- Update message status
    UPDATE vendor_messages
    SET 
        status = 'read',
        read_at = CURRENT_TIMESTAMP
    WHERE 
        thread_id = p_thread_id
        AND status IN ('sent', 'delivered')
        AND (
            (v_is_couple AND sender_type = 'vendor')
            OR
            (v_is_vendor AND sender_type = 'couple')
        );
    
    -- Reset unread count
    UPDATE message_threads
    SET
        couple_unread_count = CASE WHEN v_is_couple THEN 0 ELSE couple_unread_count END,
        vendor_unread_count = CASE WHEN v_is_vendor THEN 0 ELSE vendor_unread_count END
    WHERE id = p_thread_id;
    
    -- Insert read receipts
    INSERT INTO message_read_receipts (message_id, user_id)
    SELECT id, p_user_id
    FROM vendor_messages
    WHERE 
        thread_id = p_thread_id
        AND (
            (v_is_couple AND sender_type = 'vendor')
            OR
            (v_is_vendor AND sender_type = 'couple')
        )
    ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed messages
CREATE OR REPLACE FUNCTION retry_failed_messages()
RETURNS void AS $$
BEGIN
    UPDATE vendor_messages
    SET 
        status = 'retrying',
        next_retry_at = CURRENT_TIMESTAMP + (error_count * INTERVAL '1 minute')
    WHERE 
        status = 'failed'
        AND error_count < 5
        AND (next_retry_at IS NULL OR next_retry_at < CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_thread_on_new_message
    AFTER INSERT ON vendor_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_on_message();

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_threads_updated_at
    BEFORE UPDATE ON message_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_messages_updated_at
    BEFORE UPDATE ON vendor_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_notification_preferences_updated_at
    BEFORE UPDATE ON message_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample templates for vendors
INSERT INTO message_templates (vendor_id, title, content, category) VALUES
(NULL, 'Thank you for inquiry', 'Thank you for reaching out! I''d love to help make your special day perfect. When would be a good time to discuss your vision?', 'greeting'),
(NULL, 'Availability confirmation', 'Good news! I''m available for your wedding date. Let''s schedule a consultation to discuss the details.', 'booking'),
(NULL, 'Meeting reminder', 'Just a friendly reminder about our meeting tomorrow at [TIME]. Looking forward to seeing you!', 'reminder'),
(NULL, 'Quote follow-up', 'Hi! I wanted to follow up on the quote I sent last week. Do you have any questions or need any adjustments?', 'follow_up'),
(NULL, 'Contract ready', 'Great news! Your contract is ready for review. Please let me know if you have any questions.', 'contract')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON message_threads TO authenticated;
GRANT INSERT, UPDATE ON message_threads TO authenticated;
GRANT SELECT ON vendor_messages TO authenticated;
GRANT INSERT ON vendor_messages TO authenticated;
GRANT SELECT ON message_attachments TO authenticated;
GRANT INSERT ON message_attachments TO authenticated;
GRANT ALL ON message_reactions TO authenticated;
GRANT ALL ON message_read_receipts TO authenticated;
GRANT ALL ON message_templates TO authenticated;
GRANT ALL ON message_notification_preferences TO authenticated;
GRANT ALL ON offline_message_queue TO authenticated;