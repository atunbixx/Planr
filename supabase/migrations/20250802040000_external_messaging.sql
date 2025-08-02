-- External messaging enhancements for vendor communication
-- Adds support for SMS, WhatsApp, and Email integration

-- Create outbound message log table
CREATE TABLE IF NOT EXISTS outbound_message_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES message_threads(id),
    message_content TEXT NOT NULL,
    sms_sent BOOLEAN DEFAULT false,
    whatsapp_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    errors JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add external messaging fields to vendors table if not exists
DO $$ 
BEGIN
    -- Add sms_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        AND column_name = 'sms_enabled'
    ) THEN
        ALTER TABLE vendors 
        ADD COLUMN sms_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Add whatsapp_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        AND column_name = 'whatsapp_enabled'
    ) THEN
        ALTER TABLE vendors 
        ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Add email_notifications_enabled column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        AND column_name = 'email_notifications_enabled'
    ) THEN
        ALTER TABLE vendors 
        ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Add verified_phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        AND column_name = 'verified_phone'
    ) THEN
        ALTER TABLE vendors 
        ADD COLUMN verified_phone BOOLEAN DEFAULT false;
    END IF;

    -- Add verified_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendors' 
        AND column_name = 'verified_email'
    ) THEN
        ALTER TABLE vendors 
        ADD COLUMN verified_email BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create webhook events table for tracking
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_type VARCHAR(50) NOT NULL CHECK (webhook_type IN ('twilio', 'resend', 'other')),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    vendor_id UUID REFERENCES vendors(id),
    message_id UUID REFERENCES vendor_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create storage bucket for message attachments if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'attachments',
    'attachments',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
          'video/mp4', 'video/quicktime',
          'application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_outbound_message_log_vendor ON outbound_message_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_outbound_message_log_couple ON outbound_message_log(couple_id);
CREATE INDEX IF NOT EXISTS idx_outbound_message_log_created ON outbound_message_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, created_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_webhook_events_vendor ON webhook_events(vendor_id);

-- Enable RLS
ALTER TABLE outbound_message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for outbound_message_log
CREATE POLICY "Couples can view their outbound message logs"
    ON outbound_message_log FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- RLS policies for webhook_events (admin only)
CREATE POLICY "Only service role can access webhook events"
    ON webhook_events FOR ALL
    USING (auth.uid() IS NULL); -- Only service role has no uid

-- Function to process webhook events
CREATE OR REPLACE FUNCTION process_webhook_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark as processed
    NEW.processed := true;
    NEW.processed_at := CURRENT_TIMESTAMP;
    
    -- Additional processing logic can be added here
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate vendor contact methods
CREATE OR REPLACE FUNCTION validate_vendor_contact_methods()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure at least one contact method is available
    IF NEW.phone IS NULL AND NEW.email IS NULL THEN
        RAISE EXCEPTION 'Vendor must have at least phone or email';
    END IF;
    
    -- Validate phone format if provided
    IF NEW.phone IS NOT NULL THEN
        -- Remove non-numeric characters for validation
        IF LENGTH(REGEXP_REPLACE(NEW.phone, '[^0-9]', '', 'g')) < 10 THEN
            RAISE EXCEPTION 'Phone number must be at least 10 digits';
        END IF;
    END IF;
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL THEN
        IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RAISE EXCEPTION 'Invalid email format';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vendor contact validation
CREATE TRIGGER validate_vendor_contacts
    BEFORE INSERT OR UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION validate_vendor_contact_methods();

-- Add external_message_id to vendor_messages for tracking
ALTER TABLE vendor_messages 
ADD COLUMN IF NOT EXISTS external_message_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS external_provider VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_vendor_messages_external_id ON vendor_messages(external_message_id);

-- Create view for vendor message stats
CREATE OR REPLACE VIEW vendor_message_stats AS
SELECT 
    v.id as vendor_id,
    v.name as vendor_name,
    v.phone,
    v.email,
    cv.couple_id,
    COUNT(DISTINCT vm.id) as total_messages,
    COUNT(DISTINCT vm.id) FILTER (WHERE vm.sender_type = 'vendor') as vendor_messages,
    COUNT(DISTINCT vm.id) FILTER (WHERE vm.sender_type = 'couple') as couple_messages,
    COUNT(DISTINCT vm.id) FILTER (WHERE vm.metadata->>'source' = 'sms') as sms_messages,
    COUNT(DISTINCT vm.id) FILTER (WHERE vm.metadata->>'source' = 'whatsapp') as whatsapp_messages,
    COUNT(DISTINCT vm.id) FILTER (WHERE vm.metadata->>'source' = 'email') as email_messages,
    MAX(vm.created_at) as last_message_at,
    cv.preferred_contact_method
FROM vendors v
JOIN couple_vendors cv ON v.id = cv.vendor_id
LEFT JOIN vendor_messages vm ON v.id = vm.vendor_id AND cv.couple_id = vm.couple_id
GROUP BY v.id, v.name, v.phone, v.email, cv.couple_id, cv.preferred_contact_method;

-- Grant access to the view
GRANT SELECT ON vendor_message_stats TO authenticated;