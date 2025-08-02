-- Vendor messaging and communication system
-- Enables secure messaging between couples and vendors with real-time updates

-- Messages table
CREATE TABLE IF NOT EXISTS vendor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('couple', 'vendor', 'system')),
    sender_id UUID REFERENCES auth.users(id),
    sender_name VARCHAR(255), -- For vendor messages when not authenticated
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' 
        CHECK (message_type IN ('text', 'image', 'document', 'system', 'milestone', 'payment')),
    content TEXT,
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment objects
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional message metadata
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    parent_message_id UUID REFERENCES vendor_messages(id), -- For replies/threads
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('couple', 'vendor')),
    reaction VARCHAR(10) NOT NULL, -- Emoji or reaction type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, reaction)
);

-- Typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('couple', 'vendor')),
    is_typing BOOLEAN DEFAULT true,
    last_typed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, couple_id, user_id)
);

-- Message attachments table (links messages to documents)
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES vendor_messages(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES vendor_documents(id) ON DELETE CASCADE,
    attachment_type VARCHAR(20) DEFAULT 'document' 
        CHECK (attachment_type IN ('document', 'image', 'contract', 'invoice')),
    thumbnail_url TEXT, -- For image previews
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vendor access tokens for portal access
CREATE TABLE IF NOT EXISTS vendor_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    access_code VARCHAR(20) NOT NULL UNIQUE,
    vendor_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '90 days'),
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Message templates for automated messages
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN (
        'welcome', 'payment_reminder', 'milestone_reminder', 'contract_update',
        'meeting_request', 'thank_you', 'review_request', 'custom'
    )),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_messages_vendor ON vendor_messages(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_couple ON vendor_messages(couple_id);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_created ON vendor_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_messages_unread ON vendor_messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_vendor_messages_sender ON vendor_messages(sender_id) WHERE sender_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_active ON typing_indicators(vendor_id, couple_id) WHERE is_typing = true;
CREATE INDEX IF NOT EXISTS idx_vendor_access_tokens_code ON vendor_access_tokens(access_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_access_tokens_vendor ON vendor_access_tokens(vendor_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_couple ON message_templates(couple_id);

-- Enable RLS for all tables
ALTER TABLE vendor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_messages
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

CREATE POLICY "Couples can update their own messages"
    ON vendor_messages FOR UPDATE
    USING (
        sender_id = auth.uid() 
        AND sender_type = 'couple'
        AND couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
    );

-- RLS policies for message_reactions
CREATE POLICY "Users can view message reactions"
    ON message_reactions FOR SELECT
    USING (message_id IN (
        SELECT id FROM vendor_messages vm
        WHERE vm.couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can add reactions to messages"
    ON message_reactions FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND user_type = 'couple'
        AND message_id IN (
            SELECT id FROM vendor_messages vm
            WHERE vm.couple_id IN (
                SELECT id FROM couples 
                WHERE partner1_user_id = auth.uid() 
                OR partner2_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can remove their own reactions"
    ON message_reactions FOR DELETE
    USING (user_id = auth.uid());

-- RLS policies for typing_indicators
CREATE POLICY "Users can view typing indicators"
    ON typing_indicators FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their typing status"
    ON typing_indicators FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND user_type = 'couple'
        AND couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their typing indicators"
    ON typing_indicators FOR UPDATE
    USING (user_id = auth.uid());

-- RLS policies for message_attachments
CREATE POLICY "Users can view message attachments"
    ON message_attachments FOR SELECT
    USING (message_id IN (
        SELECT id FROM vendor_messages vm
        WHERE vm.couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can add attachments to their messages"
    ON message_attachments FOR INSERT
    WITH CHECK (message_id IN (
        SELECT id FROM vendor_messages vm
        WHERE vm.sender_id = auth.uid()
        AND vm.couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
    ));

-- RLS policies for vendor_access_tokens
CREATE POLICY "Couples can manage their vendor access tokens"
    ON vendor_access_tokens FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for message_templates
CREATE POLICY "Couples can manage their message templates"
    ON message_templates FOR ALL
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to generate unique vendor access code
CREATE OR REPLACE FUNCTION generate_vendor_access_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(20) := '';
    i INTEGER;
BEGIN
    -- Generate a 20-character code
    FOR i IN 1..20 LOOP
        result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
        -- Add dashes for readability every 5 characters
        IF i % 5 = 0 AND i < 20 THEN
            result := result || '-';
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_couple_id UUID)
RETURNS TABLE (
    vendor_id UUID,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vm.vendor_id,
        COUNT(*) as unread_count
    FROM vendor_messages vm
    WHERE vm.couple_id = p_couple_id
    AND vm.is_read = false
    AND vm.sender_type != 'couple'
    GROUP BY vm.vendor_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest message per vendor
CREATE OR REPLACE FUNCTION get_latest_vendor_messages(p_couple_id UUID)
RETURNS TABLE (
    vendor_id UUID,
    vendor_name VARCHAR(255),
    latest_message_id UUID,
    latest_message_content TEXT,
    latest_message_type VARCHAR(20),
    latest_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (vm.vendor_id)
            vm.vendor_id,
            vm.id as message_id,
            vm.content,
            vm.message_type,
            vm.created_at
        FROM vendor_messages vm
        WHERE vm.couple_id = p_couple_id
        ORDER BY vm.vendor_id, vm.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            vendor_id,
            COUNT(*) as unread_count
        FROM vendor_messages
        WHERE couple_id = p_couple_id
        AND is_read = false
        AND sender_type != 'couple'
        GROUP BY vendor_id
    )
    SELECT 
        lm.vendor_id,
        v.business_name as vendor_name,
        lm.message_id as latest_message_id,
        lm.content as latest_message_content,
        lm.message_type as latest_message_type,
        lm.created_at as latest_message_time,
        COALESCE(uc.unread_count, 0) as unread_count
    FROM latest_messages lm
    JOIN vendors v ON v.id = lm.vendor_id
    LEFT JOIN unread_counts uc ON uc.vendor_id = lm.vendor_id
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_vendor_id UUID,
    p_couple_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE vendor_messages
    SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE vendor_id = p_vendor_id
    AND couple_id = p_couple_id
    AND sender_type != 'couple'
    AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS VOID AS $$
BEGIN
    UPDATE typing_indicators
    SET is_typing = false
    WHERE is_typing = true
    AND last_typed_at < CURRENT_TIMESTAMP - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_messages_updated_at BEFORE UPDATE ON vendor_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample message templates
INSERT INTO message_templates (couple_id, template_type, title, content, variables) 
VALUES 
    (
        (SELECT id FROM couples LIMIT 1), 
        'welcome', 
        'Welcome Message',
        'Hi {{vendor_name}}, We''re excited to work with you for our wedding on {{wedding_date}}. Looking forward to discussing the details!',
        '["vendor_name", "wedding_date"]'::jsonb
    ),
    (
        (SELECT id FROM couples LIMIT 1), 
        'payment_reminder', 
        'Payment Reminder',
        'Hi {{vendor_name}}, This is a friendly reminder that payment of {{amount}} is due on {{due_date}}. Please let us know if you have any questions.',
        '["vendor_name", "amount", "due_date"]'::jsonb
    )
ON CONFLICT DO NOTHING;