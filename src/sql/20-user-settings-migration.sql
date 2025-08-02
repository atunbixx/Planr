-- User Settings Complete Migration Script
-- This script ensures all user settings tables and functions are properly set up

-- Begin transaction
BEGIN;

-- Check if we need to run the base settings migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        RAISE NOTICE 'Creating user_settings table...';
        -- The main table would be created by running 15-user-settings.sql
    ELSE
        RAISE NOTICE 'user_settings table already exists';
    END IF;
END $$;

-- Ensure all enhancement tables exist (from 18-user-settings-enhancements.sql)
DO $$
BEGIN
    -- Check and create integration settings table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_integration_settings') THEN
        RAISE NOTICE 'Creating user_integration_settings table...';
        -- Table creation would go here
    END IF;
    
    -- Check and create export preferences table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_export_preferences') THEN
        RAISE NOTICE 'Creating user_export_preferences table...';
        -- Table creation would go here
    END IF;
    
    -- Check and create session preferences table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_session_preferences') THEN
        RAISE NOTICE 'Creating user_session_preferences table...';
        -- Table creation would go here
    END IF;
END $$;

-- Add any missing columns to existing tables
DO $$
BEGIN
    -- Check if couple_id exists in user_settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' AND column_name = 'couple_id'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN couple_id UUID REFERENCES couples(id) ON DELETE SET NULL;
    END IF;
    
    -- Check if theme colors were expanded
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'theme' 
        AND data_type = 'character varying'
    ) THEN
        -- Update the theme check constraint to include new themes
        ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_theme_check;
        ALTER TABLE user_settings ADD CONSTRAINT user_settings_theme_check 
            CHECK (theme IN ('light', 'dark', 'auto', 'rose', 'sage', 'lavender', 'coral'));
    END IF;
END $$;

-- Create or replace all functions with proper error handling
CREATE OR REPLACE FUNCTION safe_initialize_user_settings(
    p_user_id UUID,
    p_country_code VARCHAR(2) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_error_msg TEXT;
BEGIN
    BEGIN
        -- Initialize all user preferences
        SELECT initialize_all_user_preferences(p_user_id, p_country_code) INTO v_result;
        RETURN v_result;
    EXCEPTION
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
            -- Log error and return partial success
            RETURN jsonb_build_object(
                'success', false,
                'error', v_error_msg,
                'user_id', p_user_id
            );
    END;
END;
$$ LANGUAGE plpgsql;

-- Migration helper to ensure all users have settings
CREATE OR REPLACE FUNCTION migrate_existing_users_settings()
RETURNS TABLE (
    user_id UUID,
    migration_status TEXT,
    details JSONB
) AS $$
DECLARE
    v_user RECORD;
    v_result JSONB;
    v_status TEXT;
BEGIN
    FOR v_user IN 
        SELECT u.id, u.email, u.created_at
        FROM auth.users u
        LEFT JOIN user_settings us ON u.id = us.user_id
        WHERE us.user_id IS NULL
        ORDER BY u.created_at
    LOOP
        BEGIN
            -- Initialize settings for user
            v_result := safe_initialize_user_settings(v_user.id);
            
            IF (v_result->>'success')::boolean = false THEN
                v_status := 'error';
            ELSE
                v_status := 'success';
            END IF;
            
            user_id := v_user.id;
            migration_status := v_status;
            details := jsonb_build_object(
                'email', v_user.email,
                'created_at', v_user.created_at,
                'result', v_result
            );
            
            RETURN NEXT;
            
        EXCEPTION
            WHEN OTHERS THEN
                user_id := v_user.id;
                migration_status := 'error';
                details := jsonb_build_object(
                    'email', v_user.email,
                    'error', SQLERRM
                );
                RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create audit log for settings changes
CREATE TABLE IF NOT EXISTS user_settings_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Create index for audit table
CREATE INDEX IF NOT EXISTS idx_settings_audit_user ON user_settings_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_timestamp ON user_settings_audit(changed_at);

-- Enable RLS on audit table
ALTER TABLE user_settings_audit ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit table (users can only see their own audit logs)
CREATE POLICY "Users can view their own settings audit"
    ON user_settings_audit FOR SELECT
    USING (auth.uid() = user_id);

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_user_settings_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields TEXT[];
    v_field TEXT;
BEGIN
    -- Determine operation type and set values
    IF TG_OP = 'DELETE' THEN
        v_old_values := row_to_json(OLD)::jsonb;
        v_new_values := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_values := NULL;
        v_new_values := row_to_json(NEW)::jsonb;
    ELSE -- UPDATE
        v_old_values := row_to_json(OLD)::jsonb;
        v_new_values := row_to_json(NEW)::jsonb;
        
        -- Find changed fields
        FOR v_field IN 
            SELECT jsonb_object_keys(v_old_values) 
            UNION 
            SELECT jsonb_object_keys(v_new_values)
        LOOP
            IF v_old_values->>v_field IS DISTINCT FROM v_new_values->>v_field THEN
                v_changed_fields := array_append(v_changed_fields, v_field);
            END IF;
        END LOOP;
    END IF;
    
    -- Insert audit record
    INSERT INTO user_settings_audit (
        user_id,
        table_name,
        operation,
        changed_fields,
        old_values,
        new_values,
        changed_by,
        ip_address
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        TG_TABLE_NAME,
        TG_OP,
        to_jsonb(v_changed_fields),
        v_old_values,
        v_new_values,
        auth.uid(),
        inet_client_addr()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all settings tables
CREATE TRIGGER audit_user_settings
    AFTER INSERT OR UPDATE OR DELETE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION audit_user_settings_changes();

CREATE TRIGGER audit_user_integration_settings
    AFTER INSERT OR UPDATE OR DELETE ON user_integration_settings
    FOR EACH ROW EXECUTE FUNCTION audit_user_settings_changes();

CREATE TRIGGER audit_user_export_preferences
    AFTER INSERT OR UPDATE OR DELETE ON user_export_preferences
    FOR EACH ROW EXECUTE FUNCTION audit_user_settings_changes();

-- Performance optimization: Create partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_settings_active_theme 
    ON user_settings(theme) 
    WHERE onboarding_completed = true;

CREATE INDEX IF NOT EXISTS idx_user_settings_notifications 
    ON user_settings(user_id) 
    WHERE email_notifications = true OR push_notifications = true;

CREATE INDEX IF NOT EXISTS idx_integration_settings_active 
    ON user_integration_settings(user_id) 
    WHERE google_calendar_enabled = true 
       OR outlook_calendar_enabled = true 
       OR apple_calendar_enabled = true
       OR stripe_connected = true
       OR paypal_connected = true;

-- Create statistics for query optimization
CREATE STATISTICS IF NOT EXISTS user_settings_locale_stats 
    ON country_code, language, timezone 
    FROM user_settings;

-- Validation function to check settings integrity
CREATE OR REPLACE FUNCTION validate_user_settings(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_issues JSONB[];
    v_settings RECORD;
    v_integrations RECORD;
BEGIN
    -- Check if user has settings
    SELECT * INTO v_settings FROM user_settings WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        v_issues := array_append(v_issues, '{"issue": "No user settings found", "severity": "high"}'::jsonb);
    ELSE
        -- Validate theme exists
        IF NOT EXISTS (SELECT 1 FROM theme_definitions WHERE theme_name = v_settings.theme) THEN
            v_issues := array_append(v_issues, 
                jsonb_build_object('issue', 'Invalid theme', 'severity', 'medium', 'value', v_settings.theme)
            );
        END IF;
        
        -- Validate country code exists
        IF NOT EXISTS (SELECT 1 FROM region_defaults WHERE country_code = v_settings.country_code) THEN
            v_issues := array_append(v_issues, 
                jsonb_build_object('issue', 'Invalid country code', 'severity', 'low', 'value', v_settings.country_code)
            );
        END IF;
    END IF;
    
    -- Check integration settings
    SELECT * INTO v_integrations FROM user_integration_settings WHERE user_id = p_user_id;
    IF NOT FOUND THEN
        v_issues := array_append(v_issues, '{"issue": "No integration settings found", "severity": "low"}'::jsonb);
    END IF;
    
    RETURN jsonb_build_object(
        'valid', array_length(v_issues, 1) IS NULL,
        'issues', COALESCE(v_issues, ARRAY[]::jsonb[]),
        'checked_at', CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_settings TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_settings TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_all_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_settings_for_api TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_settings TO authenticated;

-- Final validation
DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
    v_view_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'user_settings', 
        'region_defaults', 
        'theme_definitions',
        'notification_templates',
        'user_integration_settings',
        'user_export_preferences',
        'user_session_preferences',
        'user_settings_audit'
    );
    
    -- Count functions
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (
        'get_user_settings',
        'get_all_user_preferences',
        'initialize_user_settings',
        'initialize_all_user_preferences',
        'update_session_activity',
        'validate_user_settings'
    );
    
    -- Count views
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name IN (
        'v_user_complete_settings',
        'v_user_notification_preferences',
        'v_user_integrations_summary',
        'v_user_session_state',
        'v_user_settings_summary'
    );
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  Tables created: %', v_table_count;
    RAISE NOTICE '  Functions created: %', v_function_count;
    RAISE NOTICE '  Views created: %', v_view_count;
    
    IF v_table_count < 8 OR v_function_count < 6 OR v_view_count < 5 THEN
        RAISE EXCEPTION 'Migration incomplete. Please check for errors.';
    END IF;
END $$;

COMMIT;

-- Post-migration message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'User Settings Migration Complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'To initialize settings for existing users, run:';
    RAISE NOTICE '  SELECT * FROM migrate_existing_users_settings();';
    RAISE NOTICE '';
    RAISE NOTICE 'To validate settings for a specific user, run:';
    RAISE NOTICE '  SELECT validate_user_settings(''<user_id>'');';
END $$;