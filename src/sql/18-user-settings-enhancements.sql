-- User settings enhancements
-- Additional features for the existing user_settings table

-- Create updated_at trigger for user_settings
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_timestamp
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

-- Add integration settings table for third-party services
CREATE TABLE IF NOT EXISTS user_integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Calendar integrations
    google_calendar_enabled BOOLEAN DEFAULT false,
    google_calendar_id TEXT,
    google_calendar_sync_events BOOLEAN DEFAULT true,
    google_calendar_sync_tasks BOOLEAN DEFAULT true,
    
    outlook_calendar_enabled BOOLEAN DEFAULT false,
    outlook_calendar_id TEXT,
    outlook_calendar_sync_events BOOLEAN DEFAULT true,
    outlook_calendar_sync_tasks BOOLEAN DEFAULT true,
    
    apple_calendar_enabled BOOLEAN DEFAULT false,
    apple_calendar_id TEXT,
    apple_calendar_sync_events BOOLEAN DEFAULT true,
    apple_calendar_sync_tasks BOOLEAN DEFAULT true,
    
    -- Communication integrations
    slack_enabled BOOLEAN DEFAULT false,
    slack_webhook_url TEXT,
    slack_channel TEXT,
    slack_notify_rsvp BOOLEAN DEFAULT true,
    slack_notify_payments BOOLEAN DEFAULT true,
    
    discord_enabled BOOLEAN DEFAULT false,
    discord_webhook_url TEXT,
    discord_notify_rsvp BOOLEAN DEFAULT true,
    discord_notify_payments BOOLEAN DEFAULT true,
    
    -- Social media integrations
    instagram_connected BOOLEAN DEFAULT false,
    instagram_handle TEXT,
    pinterest_connected BOOLEAN DEFAULT false,
    pinterest_board_url TEXT,
    
    -- Email integrations
    mailchimp_enabled BOOLEAN DEFAULT false,
    mailchimp_api_key TEXT,
    mailchimp_list_id TEXT,
    
    sendgrid_enabled BOOLEAN DEFAULT false,
    sendgrid_api_key TEXT,
    
    -- Payment integrations
    stripe_connected BOOLEAN DEFAULT false,
    stripe_account_id TEXT,
    paypal_connected BOOLEAN DEFAULT false,
    paypal_merchant_id TEXT,
    
    -- File storage integrations
    dropbox_enabled BOOLEAN DEFAULT false,
    google_drive_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Create data export preferences table
CREATE TABLE IF NOT EXISTS user_export_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Export settings
    include_guest_list BOOLEAN DEFAULT true,
    include_vendor_list BOOLEAN DEFAULT true,
    include_budget BOOLEAN DEFAULT true,
    include_timeline BOOLEAN DEFAULT true,
    include_tasks BOOLEAN DEFAULT true,
    include_photos BOOLEAN DEFAULT false,
    include_contracts BOOLEAN DEFAULT false,
    
    -- Privacy settings for exports
    anonymize_guest_data BOOLEAN DEFAULT false,
    exclude_guest_contact_info BOOLEAN DEFAULT false,
    exclude_vendor_pricing BOOLEAN DEFAULT false,
    
    -- Export format preferences
    guest_list_format VARCHAR(10) DEFAULT 'csv' CHECK (guest_list_format IN ('csv', 'excel', 'pdf')),
    budget_format VARCHAR(10) DEFAULT 'excel' CHECK (budget_format IN ('csv', 'excel', 'pdf')),
    timeline_format VARCHAR(10) DEFAULT 'pdf' CHECK (timeline_format IN ('pdf', 'ical', 'csv')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Create session preferences table for temporary UI state
CREATE TABLE IF NOT EXISTS user_session_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dashboard preferences
    dashboard_layout JSONB DEFAULT '{"widgets": ["overview", "tasks", "timeline", "budget"]}',
    collapsed_sections JSONB DEFAULT '[]',
    favorite_vendors UUID[] DEFAULT '{}',
    pinned_tasks UUID[] DEFAULT '{}',
    
    -- View preferences
    guest_list_view VARCHAR(20) DEFAULT 'table' CHECK (guest_list_view IN ('table', 'cards', 'seating')),
    vendor_list_view VARCHAR(20) DEFAULT 'grid' CHECK (vendor_list_view IN ('grid', 'list', 'map')),
    task_list_view VARCHAR(20) DEFAULT 'list' CHECK (task_list_view IN ('list', 'kanban', 'calendar')),
    budget_view VARCHAR(20) DEFAULT 'categories' CHECK (budget_view IN ('categories', 'timeline', 'vendor')),
    
    -- Filter preferences (persisted filters)
    guest_filters JSONB DEFAULT '{}',
    vendor_filters JSONB DEFAULT '{}',
    task_filters JSONB DEFAULT '{}',
    
    -- Sort preferences
    guest_sort JSONB DEFAULT '{"field": "name", "direction": "asc"}',
    vendor_sort JSONB DEFAULT '{"field": "category", "direction": "asc"}',
    task_sort JSONB DEFAULT '{"field": "due_date", "direction": "asc"}',
    
    -- Recently viewed
    recent_vendors UUID[] DEFAULT '{}',
    recent_guests UUID[] DEFAULT '{}',
    recent_tasks UUID[] DEFAULT '{}',
    
    -- Metadata
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integration_settings_user ON user_integration_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_export_preferences_user ON user_export_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_session_preferences_user ON user_session_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_session_preferences_active ON user_session_preferences(last_active);

-- Enable RLS
ALTER TABLE user_integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_export_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration settings
CREATE POLICY "Users can view their own integration settings"
    ON user_integration_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integration settings"
    ON user_integration_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integration settings"
    ON user_integration_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS policies for export preferences
CREATE POLICY "Users can view their own export preferences"
    ON user_export_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export preferences"
    ON user_export_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own export preferences"
    ON user_export_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS policies for session preferences
CREATE POLICY "Users can view their own session preferences"
    ON user_session_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own session preferences"
    ON user_session_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session preferences"
    ON user_session_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own session preferences"
    ON user_session_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_integration_settings_timestamp
    BEFORE UPDATE ON user_integration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

CREATE TRIGGER update_export_preferences_timestamp
    BEFORE UPDATE ON user_export_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

CREATE TRIGGER update_session_preferences_timestamp
    BEFORE UPDATE ON user_session_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

-- Helper function to get all user preferences
CREATE OR REPLACE FUNCTION get_all_user_preferences(p_user_id UUID)
RETURNS TABLE (
    settings JSONB,
    integrations JSONB,
    export_prefs JSONB,
    session_prefs JSONB,
    region_info JSONB,
    theme_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(row_to_json(us.*)::jsonb, '{}'::jsonb) as settings,
        COALESCE(row_to_json(uis.*)::jsonb, '{}'::jsonb) as integrations,
        COALESCE(row_to_json(uep.*)::jsonb, '{}'::jsonb) as export_prefs,
        COALESCE(row_to_json(usp.*)::jsonb, '{}'::jsonb) as session_prefs,
        COALESCE(row_to_json(rd.*)::jsonb, '{}'::jsonb) as region_info,
        COALESCE(row_to_json(td.*)::jsonb, '{}'::jsonb) as theme_info
    FROM 
        (SELECT * FROM user_settings WHERE user_id = p_user_id) us
        LEFT JOIN user_integration_settings uis ON uis.user_id = p_user_id
        LEFT JOIN user_export_preferences uep ON uep.user_id = p_user_id
        LEFT JOIN user_session_preferences usp ON usp.user_id = p_user_id
        LEFT JOIN region_defaults rd ON us.country_code = rd.country_code
        LEFT JOIN theme_definitions td ON us.theme = td.theme_name;
END;
$$ LANGUAGE plpgsql;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_session_preferences
    SET last_active = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old session data (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_sessions(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM user_session_preferences
    WHERE last_active < CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days
    RETURNING COUNT(*) INTO v_count;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to safely update sensitive integration settings
CREATE OR REPLACE FUNCTION update_integration_setting(
    p_user_id UUID,
    p_integration TEXT,
    p_key TEXT,
    p_value TEXT,
    p_encrypt BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
DECLARE
    v_encrypted_value TEXT;
BEGIN
    -- In production, you would encrypt sensitive values like API keys
    -- This is a placeholder for the encryption logic
    IF p_encrypt AND p_key LIKE '%key%' OR p_key LIKE '%secret%' THEN
        -- In production: v_encrypted_value := encrypt_value(p_value);
        v_encrypted_value := p_value; -- Placeholder
    ELSE
        v_encrypted_value := p_value;
    END IF;
    
    -- Update the specific integration setting
    -- This would need to be expanded for each integration field
    -- This is a simplified example
    UPDATE user_integration_settings
    SET updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize all user preferences
CREATE OR REPLACE FUNCTION initialize_all_user_preferences(
    p_user_id UUID,
    p_country_code VARCHAR(2) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_settings_id UUID;
    v_integrations_id UUID;
    v_export_id UUID;
    v_session_id UUID;
BEGIN
    -- Initialize main settings
    v_settings_id := initialize_user_settings(p_user_id, p_country_code);
    
    -- Initialize integration settings
    INSERT INTO user_integration_settings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_integrations_id;
    
    -- Initialize export preferences
    INSERT INTO user_export_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_export_id;
    
    -- Initialize session preferences
    INSERT INTO user_session_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_session_id;
    
    RETURN jsonb_build_object(
        'settings_id', v_settings_id,
        'integrations_id', v_integrations_id,
        'export_id', v_export_id,
        'session_id', v_session_id
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment documentation
COMMENT ON TABLE user_integration_settings IS 'Stores third-party integration preferences and credentials for each user';
COMMENT ON TABLE user_export_preferences IS 'Stores data export preferences and privacy settings for exports';
COMMENT ON TABLE user_session_preferences IS 'Stores temporary UI state and view preferences that persist across sessions';
COMMENT ON FUNCTION get_all_user_preferences IS 'Retrieves all user preferences in a single query for efficient loading';
COMMENT ON FUNCTION update_session_activity IS 'Updates the last active timestamp for session preferences';
COMMENT ON FUNCTION cleanup_old_sessions IS 'Removes old session data to prevent table bloat';
COMMENT ON FUNCTION initialize_all_user_preferences IS 'Initializes all preference tables for a new user';