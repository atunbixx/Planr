-- Create couple_settings table for storing couple-specific configuration
CREATE TABLE IF NOT EXISTS couple_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    
    -- External messaging configuration
    external_messaging_config JSONB DEFAULT '{}'::jsonb,
    
    -- Other settings can be added here
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one settings record per couple
    CONSTRAINT unique_couple_settings UNIQUE (couple_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_couple_settings_couple ON couple_settings(couple_id);

-- Enable RLS
ALTER TABLE couple_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Couples can view their own settings"
    ON couple_settings FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Couples can update their own settings"
    ON couple_settings FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Couples can insert their own settings"
    ON couple_settings FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_couple_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_couple_settings_timestamp
    BEFORE UPDATE ON couple_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_couple_settings_updated_at();

-- Grant permissions
GRANT ALL ON couple_settings TO authenticated;