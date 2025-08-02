-- User settings and preferences
-- Comprehensive settings system for personalization and localization

-- Create settings table for user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
    
    -- Localization settings
    country_code VARCHAR(2) DEFAULT 'US',
    region VARCHAR(100),
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(10) DEFAULT '12h',
    
    -- Display preferences
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto', 'rose', 'sage', 'lavender', 'coral')),
    accent_color VARCHAR(7) DEFAULT '#E94B6D',
    font_size VARCHAR(10) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large', 'extra-large')),
    compact_mode BOOLEAN DEFAULT false,
    animations_enabled BOOLEAN DEFAULT true,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    email_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_frequency IN ('realtime', 'daily', 'weekly', 'never')),
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- Notification types
    notify_rsvp_updates BOOLEAN DEFAULT true,
    notify_payment_reminders BOOLEAN DEFAULT true,
    notify_task_deadlines BOOLEAN DEFAULT true,
    notify_vendor_messages BOOLEAN DEFAULT true,
    notify_guest_messages BOOLEAN DEFAULT true,
    notify_milestone_reminders BOOLEAN DEFAULT true,
    
    -- Privacy settings
    profile_visibility VARCHAR(20) DEFAULT 'private' CHECK (profile_visibility IN ('public', 'guests', 'private')),
    show_budget_to_vendors BOOLEAN DEFAULT false,
    allow_guest_photos BOOLEAN DEFAULT true,
    allow_vendor_contact BOOLEAN DEFAULT true,
    
    -- Wedding preferences
    wedding_style VARCHAR(50),
    wedding_season VARCHAR(20),
    guest_count_estimate INTEGER,
    budget_visibility VARCHAR(20) DEFAULT 'couple' CHECK (budget_visibility IN ('couple', 'planners', 'hidden')),
    
    -- Data and export preferences
    auto_backup BOOLEAN DEFAULT true,
    backup_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
    export_format VARCHAR(10) DEFAULT 'pdf' CHECK (export_format IN ('pdf', 'csv', 'excel')),
    
    -- Accessibility settings
    high_contrast BOOLEAN DEFAULT false,
    reduce_motion BOOLEAN DEFAULT false,
    screen_reader_optimized BOOLEAN DEFAULT false,
    keyboard_shortcuts BOOLEAN DEFAULT true,
    
    -- Advanced settings
    developer_mode BOOLEAN DEFAULT false,
    beta_features BOOLEAN DEFAULT false,
    analytics_enabled BOOLEAN DEFAULT true,
    crash_reporting BOOLEAN DEFAULT true,
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- Create region settings table for defaults
CREATE TABLE IF NOT EXISTS region_defaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    date_format VARCHAR(20) NOT NULL,
    time_format VARCHAR(10) NOT NULL,
    week_starts_on VARCHAR(10) DEFAULT 'sunday',
    default_timezone VARCHAR(100),
    phone_format VARCHAR(50),
    address_format JSONB,
    common_languages TEXT[],
    wedding_seasons TEXT[],
    popular_traditions TEXT[],
    vendor_categories TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create theme definitions table
CREATE TABLE IF NOT EXISTS theme_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_premium BOOLEAN DEFAULT false,
    colors JSONB NOT NULL, -- Primary, secondary, accent, background colors
    fonts JSONB, -- Heading and body fonts
    preview_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(50) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
    subject_template TEXT,
    body_template TEXT,
    variables JSONB, -- List of available variables for template
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notification_type, language, channel)
);

-- Insert default region settings
INSERT INTO region_defaults (country_code, country_name, currency, date_format, time_format, default_timezone, week_starts_on) VALUES
('US', 'United States', 'USD', 'MM/DD/YYYY', '12h', 'America/New_York', 'sunday'),
('GB', 'United Kingdom', 'GBP', 'DD/MM/YYYY', '24h', 'Europe/London', 'monday'),
('CA', 'Canada', 'CAD', 'DD/MM/YYYY', '12h', 'America/Toronto', 'sunday'),
('AU', 'Australia', 'AUD', 'DD/MM/YYYY', '12h', 'Australia/Sydney', 'monday'),
('FR', 'France', 'EUR', 'DD/MM/YYYY', '24h', 'Europe/Paris', 'monday'),
('DE', 'Germany', 'EUR', 'DD.MM.YYYY', '24h', 'Europe/Berlin', 'monday'),
('ES', 'Spain', 'EUR', 'DD/MM/YYYY', '24h', 'Europe/Madrid', 'monday'),
('IT', 'Italy', 'EUR', 'DD/MM/YYYY', '24h', 'Europe/Rome', 'monday'),
('JP', 'Japan', 'JPY', 'YYYY/MM/DD', '24h', 'Asia/Tokyo', 'sunday'),
('CN', 'China', 'CNY', 'YYYY-MM-DD', '24h', 'Asia/Shanghai', 'monday'),
('IN', 'India', 'INR', 'DD/MM/YYYY', '12h', 'Asia/Kolkata', 'sunday'),
('BR', 'Brazil', 'BRL', 'DD/MM/YYYY', '24h', 'America/Sao_Paulo', 'sunday'),
('MX', 'Mexico', 'MXN', 'DD/MM/YYYY', '12h', 'America/Mexico_City', 'sunday'),
('ZA', 'South Africa', 'ZAR', 'YYYY/MM/DD', '24h', 'Africa/Johannesburg', 'monday'),
('NG', 'Nigeria', 'NGN', 'DD/MM/YYYY', '12h', 'Africa/Lagos', 'monday'),
('KE', 'Kenya', 'KES', 'DD/MM/YYYY', '12h', 'Africa/Nairobi', 'sunday'),
('AE', 'United Arab Emirates', 'AED', 'DD/MM/YYYY', '12h', 'Asia/Dubai', 'sunday'),
('SG', 'Singapore', 'SGD', 'DD/MM/YYYY', '24h', 'Asia/Singapore', 'sunday'),
('NZ', 'New Zealand', 'NZD', 'DD/MM/YYYY', '12h', 'Pacific/Auckland', 'monday'),
('IE', 'Ireland', 'EUR', 'DD/MM/YYYY', '24h', 'Europe/Dublin', 'monday')
ON CONFLICT (country_code) DO NOTHING;

-- Insert default themes
INSERT INTO theme_definitions (theme_name, display_name, description, colors) VALUES
('light', 'Classic Light', 'Clean and bright theme perfect for any wedding', 
 '{"primary": "#1a1a1a", "secondary": "#6b7280", "accent": "#E94B6D", "background": "#ffffff", "surface": "#f9fafb"}'),
('dark', 'Elegant Dark', 'Sophisticated dark theme for modern couples', 
 '{"primary": "#ffffff", "secondary": "#9ca3af", "accent": "#E94B6D", "background": "#111827", "surface": "#1f2937"}'),
('rose', 'Rose Garden', 'Romantic rose-themed design', 
 '{"primary": "#881337", "secondary": "#be123c", "accent": "#fda4af", "background": "#fff1f2", "surface": "#ffe4e6"}'),
('sage', 'Sage Green', 'Natural and calming sage palette', 
 '{"primary": "#14532d", "secondary": "#16a34a", "accent": "#86efac", "background": "#f0fdf4", "surface": "#dcfce7"}'),
('lavender', 'Lavender Dreams', 'Soft and dreamy lavender theme', 
 '{"primary": "#581c87", "secondary": "#7c3aed", "accent": "#c4b5fd", "background": "#faf5ff", "surface": "#f3e8ff"}'),
('coral', 'Coral Sunset', 'Warm and vibrant coral theme', 
 '{"primary": "#7c2d12", "secondary": "#ea580c", "accent": "#fdba74", "background": "#fff7ed", "surface": "#fed7aa"}')
ON CONFLICT (theme_name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_couple ON user_settings(couple_id);
CREATE INDEX IF NOT EXISTS idx_region_defaults_country ON region_defaults(country_code);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS policies for region_defaults (read-only for all authenticated users)
CREATE POLICY "All users can view region defaults"
    ON region_defaults FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- RLS policies for theme_definitions (read-only for all authenticated users)
CREATE POLICY "All users can view theme definitions"
    ON theme_definitions FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- RLS policies for notification_templates (read-only for all authenticated users)
CREATE POLICY "All users can view notification templates"
    ON notification_templates FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Function to get user's complete settings with defaults
CREATE OR REPLACE FUNCTION get_user_settings(p_user_id UUID)
RETURNS TABLE (
    user_settings JSONB,
    region_defaults JSONB,
    theme_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(row_to_json(us.*)::jsonb, '{}'::jsonb) as user_settings,
        COALESCE(row_to_json(rd.*)::jsonb, '{}'::jsonb) as region_defaults,
        COALESCE(row_to_json(td.*)::jsonb, '{}'::jsonb) as theme_info
    FROM 
        (SELECT * FROM user_settings WHERE user_id = p_user_id) us
        FULL OUTER JOIN region_defaults rd ON us.country_code = rd.country_code
        LEFT JOIN theme_definitions td ON us.theme = td.theme_name;
END;
$$ LANGUAGE plpgsql;

-- Function to detect user's region based on IP (placeholder - actual implementation would use IP geolocation)
CREATE OR REPLACE FUNCTION detect_user_region(p_ip_address INET)
RETURNS VARCHAR(2) AS $$
BEGIN
    -- This is a placeholder. In production, you would use an IP geolocation service
    -- For now, return 'US' as default
    RETURN 'US';
END;
$$ LANGUAGE plpgsql;

-- Function to initialize user settings with detected region
CREATE OR REPLACE FUNCTION initialize_user_settings(
    p_user_id UUID,
    p_country_code VARCHAR(2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_country_code VARCHAR(2);
    v_settings_id UUID;
BEGIN
    -- Use provided country code or default to US
    v_country_code := COALESCE(p_country_code, 'US');
    
    -- Insert user settings with region defaults
    INSERT INTO user_settings (
        user_id,
        country_code,
        timezone,
        currency,
        date_format,
        time_format
    )
    SELECT 
        p_user_id,
        v_country_code,
        rd.default_timezone,
        rd.currency,
        rd.date_format,
        rd.time_format
    FROM region_defaults rd
    WHERE rd.country_code = v_country_code
    ON CONFLICT (user_id) DO UPDATE
    SET 
        country_code = EXCLUDED.country_code,
        timezone = EXCLUDED.timezone,
        currency = EXCLUDED.currency,
        date_format = EXCLUDED.date_format,
        time_format = EXCLUDED.time_format,
        last_updated = CURRENT_TIMESTAMP
    RETURNING id INTO v_settings_id;
    
    RETURN v_settings_id;
END;
$$ LANGUAGE plpgsql;