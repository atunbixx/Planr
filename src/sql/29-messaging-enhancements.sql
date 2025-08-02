-- Enhanced messaging system for vendor communication
-- Adds conversation threads, better tracking, and performance improvements

-- Add messaging fields to couple_vendors table
ALTER TABLE couple_vendors ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE couple_vendors ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE couple_vendors ADD COLUMN IF NOT EXISTS unread_message_count INTEGER DEFAULT 0;
ALTER TABLE couple_vendors ADD COLUMN IF NOT EXISTS messaging_enabled BOOLEAN DEFAULT true;
ALTER TABLE couple_vendors ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'in_app' 
    CHECK (preferred_contact_method IN ('in_app', 'email', 'phone', 'none'));

-- Create indexes for messaging performance
CREATE INDEX IF NOT EXISTS idx_couple_vendors_last_message ON couple_vendors(couple_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_couple_vendors_unread ON couple_vendors(couple_id, unread_message_count) WHERE unread_message_count > 0;

-- Message threads table for conversation organization
CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES couple_vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    thread_type VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (thread_type IN ('general', 'contract', 'payment', 'schedule', 'details', 'emergency')),
    priority VARCHAR(20) DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('open', 'waiting', 'resolved', 'archived')),
    first_message_id UUID REFERENCES vendor_messages(id),
    last_message_id UUID REFERENCES vendor_messages(id),
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Add thread reference to vendor_messages
ALTER TABLE vendor_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES message_threads(id);

-- Enhanced attachments with better categorization
CREATE TABLE IF NOT EXISTS message_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL 
        CHECK (media_type IN ('image', 'video', 'audio', 'document', 'pdf', 'spreadsheet')),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- For video/audio in seconds
    metadata JSONB DEFAULT '{}'::jsonb,
    is_inline BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Message labels for better organization
CREATE TABLE IF NOT EXISTS message_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7), -- Hex color
    icon VARCHAR(50),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(couple_id, name)
);

-- Message label assignments
CREATE TABLE IF NOT EXISTS message_label_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES message_labels(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES auth.users(id),
    UNIQUE(message_id, label_id)
);

-- Scheduled messages for reminders and follow-ups
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES couple_vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES message_threads(id),
    template_id UUID REFERENCES message_templates(id),
    content TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Quick replies for common responses
CREATE TABLE IF NOT EXISTS quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message search index
CREATE TABLE IF NOT EXISTS message_search_index (
    message_id UUID PRIMARY KEY REFERENCES vendor_messages(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES couple_vendors(id),
    couple_id UUID NOT NULL REFERENCES couples(id),
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_message_threads_vendor ON message_threads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_couple ON message_threads(couple_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_status ON message_threads(status) WHERE status != 'archived';
CREATE INDEX IF NOT EXISTS idx_message_threads_updated ON message_threads(couple_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_thread ON vendor_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_message_media_message ON message_media(message_id);
CREATE INDEX IF NOT EXISTS idx_message_label_assignments_message ON message_label_assignments(message_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_message_search_vector ON message_search_index USING gin(search_vector);

-- Enable RLS on new tables
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_search_index ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_threads
CREATE POLICY "Couples can view their message threads"
    ON message_threads FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Couples can manage their message threads"
    ON message_threads FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for message_media
CREATE POLICY "Users can view media for their messages"
    ON message_media FOR SELECT
    USING (message_id IN (
        SELECT id FROM vendor_messages vm
        WHERE vm.couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can upload media to their messages"
    ON message_media FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND message_id IN (
            SELECT id FROM vendor_messages vm
            WHERE vm.couple_id IN (
                SELECT id FROM couples 
                WHERE partner1_user_id = auth.uid() 
                OR partner2_user_id = auth.uid()
            )
        )
    );

-- RLS policies for message_labels
CREATE POLICY "Couples can manage their message labels"
    ON message_labels FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for message_label_assignments
CREATE POLICY "Users can view label assignments for their messages"
    ON message_label_assignments FOR SELECT
    USING (message_id IN (
        SELECT id FROM vendor_messages vm
        WHERE vm.couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage label assignments for their messages"
    ON message_label_assignments FOR ALL
    USING (
        assigned_by = auth.uid()
        AND message_id IN (
            SELECT id FROM vendor_messages vm
            WHERE vm.couple_id IN (
                SELECT id FROM couples 
                WHERE partner1_user_id = auth.uid() 
                OR partner2_user_id = auth.uid()
            )
        )
    );

-- RLS policies for scheduled_messages
CREATE POLICY "Couples can manage their scheduled messages"
    ON scheduled_messages FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for quick_replies
CREATE POLICY "Couples can manage their quick replies"
    ON quick_replies FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for message_search_index
CREATE POLICY "Users can search their messages"
    ON message_search_index FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to update vendor last message info
CREATE OR REPLACE FUNCTION update_vendor_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE couple_vendors
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        unread_message_count = CASE 
            WHEN NEW.sender_type != 'couple' 
            THEN unread_message_count + 1 
            ELSE unread_message_count 
        END
    WHERE id = NEW.vendor_id;
    
    -- Update thread info if applicable
    IF NEW.thread_id IS NOT NULL THEN
        UPDATE message_threads
        SET 
            last_message_id = NEW.id,
            last_message_at = NEW.created_at,
            message_count = message_count + 1,
            unread_count = CASE 
                WHEN NEW.sender_type != 'couple' 
                THEN unread_count + 1 
                ELSE unread_count 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.thread_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating vendor last message
CREATE TRIGGER update_vendor_last_message_trigger
    AFTER INSERT ON vendor_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_last_message();

-- Function to update message search index
CREATE OR REPLACE FUNCTION update_message_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO message_search_index (message_id, vendor_id, couple_id, search_vector, created_at)
    VALUES (
        NEW.id,
        NEW.vendor_id,
        NEW.couple_id,
        to_tsvector('english', COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.sender_name, '')),
        NEW.created_at
    )
    ON CONFLICT (message_id) DO UPDATE
    SET search_vector = EXCLUDED.search_vector;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search index
CREATE TRIGGER update_message_search_index_trigger
    AFTER INSERT OR UPDATE OF content ON vendor_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_search_index();

-- Function to reset vendor unread count
CREATE OR REPLACE FUNCTION reset_vendor_unread_count(
    p_vendor_id UUID,
    p_couple_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Reset vendor unread count
    UPDATE couple_vendors
    SET unread_message_count = 0
    WHERE id = p_vendor_id
    AND couple_id = p_couple_id;
    
    -- Reset thread unread counts
    UPDATE message_threads
    SET unread_count = 0
    WHERE vendor_id = p_vendor_id
    AND couple_id = p_couple_id;
    
    -- Mark messages as read
    UPDATE vendor_messages
    SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP
    WHERE vendor_id = p_vendor_id
    AND couple_id = p_couple_id
    AND sender_type != 'couple'
    AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Default system labels
INSERT INTO message_labels (couple_id, name, color, icon, is_system)
SELECT 
    id as couple_id,
    label.name,
    label.color,
    label.icon,
    true
FROM couples,
LATERAL (VALUES 
    ('Important', '#ef4444', 'star'),
    ('Follow-up', '#f59e0b', 'clock'),
    ('Contract', '#3b82f6', 'document'),
    ('Payment', '#10b981', 'dollar'),
    ('Question', '#8b5cf6', 'question')
) AS label(name, color, icon)
ON CONFLICT DO NOTHING;