-- User settings views and materialized views for performance

-- Create a comprehensive view for all user settings
CREATE OR REPLACE VIEW v_user_complete_settings AS
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    -- Main settings
    us.country_code,
    us.region,
    us.timezone,
    us.language,
    us.currency,
    us.date_format,
    us.time_format,
    us.theme,
    us.accent_color,
    us.font_size,
    us.compact_mode,
    us.animations_enabled,
    -- Notification settings
    us.email_notifications,
    us.email_frequency,
    us.push_notifications,
    us.sms_notifications,
    us.notify_rsvp_updates,
    us.notify_payment_reminders,
    us.notify_task_deadlines,
    us.notify_vendor_messages,
    us.notify_guest_messages,
    us.notify_milestone_reminders,
    -- Privacy settings
    us.profile_visibility,
    us.show_budget_to_vendors,
    us.allow_guest_photos,
    us.allow_vendor_contact,
    -- Wedding preferences
    us.wedding_style,
    us.wedding_season,
    us.guest_count_estimate,
    us.budget_visibility,
    -- Data preferences
    us.auto_backup,
    us.backup_frequency,
    us.export_format,
    -- Accessibility
    us.high_contrast,
    us.reduce_motion,
    us.screen_reader_optimized,
    us.keyboard_shortcuts,
    -- Advanced settings
    us.developer_mode,
    us.beta_features,
    us.analytics_enabled,
    us.crash_reporting,
    -- Onboarding
    us.onboarding_completed,
    us.onboarding_step,
    -- Region defaults
    rd.country_name,
    rd.week_starts_on,
    rd.phone_format,
    rd.address_format,
    rd.common_languages,
    rd.wedding_seasons,
    rd.popular_traditions,
    rd.vendor_categories,
    -- Theme info
    td.display_name as theme_display_name,
    td.description as theme_description,
    td.is_premium as theme_is_premium,
    td.colors as theme_colors,
    td.fonts as theme_fonts,
    -- Integration counts
    CASE 
        WHEN uis.google_calendar_enabled OR uis.outlook_calendar_enabled OR uis.apple_calendar_enabled THEN true
        ELSE false
    END as has_calendar_integration,
    CASE 
        WHEN uis.slack_enabled OR uis.discord_enabled THEN true
        ELSE false
    END as has_communication_integration,
    CASE 
        WHEN uis.stripe_connected OR uis.paypal_connected THEN true
        ELSE false
    END as has_payment_integration,
    -- Timestamps
    us.created_at,
    us.last_updated
FROM 
    auth.users u
    LEFT JOIN user_settings us ON u.id = us.user_id
    LEFT JOIN region_defaults rd ON us.country_code = rd.country_code
    LEFT JOIN theme_definitions td ON us.theme = td.theme_name
    LEFT JOIN user_integration_settings uis ON u.id = uis.user_id;

-- Create a view for notification preferences with template info
CREATE OR REPLACE VIEW v_user_notification_preferences AS
SELECT 
    us.user_id,
    us.email_notifications,
    us.email_frequency,
    us.push_notifications,
    us.sms_notifications,
    us.notify_rsvp_updates,
    us.notify_payment_reminders,
    us.notify_task_deadlines,
    us.notify_vendor_messages,
    us.notify_guest_messages,
    us.notify_milestone_reminders,
    us.language,
    -- Available notification templates for user's language
    ARRAY(
        SELECT jsonb_build_object(
            'type', nt.notification_type,
            'channel', nt.channel,
            'subject', nt.subject_template,
            'body', nt.body_template
        )
        FROM notification_templates nt
        WHERE nt.language = us.language
        AND nt.is_active = true
        ORDER BY nt.notification_type, nt.channel
    ) as available_templates
FROM 
    user_settings us;

-- Create a view for integration status
CREATE OR REPLACE VIEW v_user_integrations_summary AS
SELECT 
    uis.user_id,
    -- Calendar integrations
    jsonb_build_object(
        'google', jsonb_build_object(
            'enabled', uis.google_calendar_enabled,
            'sync_events', uis.google_calendar_sync_events,
            'sync_tasks', uis.google_calendar_sync_tasks
        ),
        'outlook', jsonb_build_object(
            'enabled', uis.outlook_calendar_enabled,
            'sync_events', uis.outlook_calendar_sync_events,
            'sync_tasks', uis.outlook_calendar_sync_tasks
        ),
        'apple', jsonb_build_object(
            'enabled', uis.apple_calendar_enabled,
            'sync_events', uis.apple_calendar_sync_events,
            'sync_tasks', uis.apple_calendar_sync_tasks
        )
    ) as calendar_integrations,
    -- Communication integrations
    jsonb_build_object(
        'slack', jsonb_build_object(
            'enabled', uis.slack_enabled,
            'notify_rsvp', uis.slack_notify_rsvp,
            'notify_payments', uis.slack_notify_payments
        ),
        'discord', jsonb_build_object(
            'enabled', uis.discord_enabled,
            'notify_rsvp', uis.discord_notify_rsvp,
            'notify_payments', uis.discord_notify_payments
        )
    ) as communication_integrations,
    -- Social media
    jsonb_build_object(
        'instagram', uis.instagram_connected,
        'pinterest', uis.pinterest_connected
    ) as social_integrations,
    -- Email services
    jsonb_build_object(
        'mailchimp', uis.mailchimp_enabled,
        'sendgrid', uis.sendgrid_enabled
    ) as email_integrations,
    -- Payment gateways
    jsonb_build_object(
        'stripe', uis.stripe_connected,
        'paypal', uis.paypal_connected
    ) as payment_integrations,
    -- File storage
    jsonb_build_object(
        'dropbox', uis.dropbox_enabled,
        'google_drive', uis.google_drive_enabled
    ) as storage_integrations,
    -- Summary counts
    (
        (uis.google_calendar_enabled::int + uis.outlook_calendar_enabled::int + uis.apple_calendar_enabled::int) +
        (uis.slack_enabled::int + uis.discord_enabled::int) +
        (uis.instagram_connected::int + uis.pinterest_connected::int) +
        (uis.mailchimp_enabled::int + uis.sendgrid_enabled::int) +
        (uis.stripe_connected::int + uis.paypal_connected::int) +
        (uis.dropbox_enabled::int + uis.google_drive_enabled::int)
    ) as total_integrations_count
FROM 
    user_integration_settings uis;

-- Create a view for session preferences with recent activity
CREATE OR REPLACE VIEW v_user_session_state AS
SELECT 
    usp.user_id,
    usp.dashboard_layout,
    usp.collapsed_sections,
    usp.favorite_vendors,
    usp.pinned_tasks,
    usp.guest_list_view,
    usp.vendor_list_view,
    usp.task_list_view,
    usp.budget_view,
    usp.guest_filters,
    usp.vendor_filters,
    usp.task_filters,
    usp.guest_sort,
    usp.vendor_sort,
    usp.task_sort,
    -- Recent items with limits
    usp.recent_vendors[1:5] as recent_vendors_top5,
    usp.recent_guests[1:5] as recent_guests_top5,
    usp.recent_tasks[1:5] as recent_tasks_top5,
    -- Activity status
    usp.last_active,
    CASE 
        WHEN usp.last_active > CURRENT_TIMESTAMP - INTERVAL '15 minutes' THEN 'active'
        WHEN usp.last_active > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'idle'
        ELSE 'inactive'
    END as activity_status,
    -- Session age
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - usp.created_at))/3600 as session_age_hours
FROM 
    user_session_preferences usp;

-- Create a settings summary view for quick checks
CREATE OR REPLACE VIEW v_user_settings_summary AS
SELECT 
    us.user_id,
    us.country_code,
    us.language,
    us.theme,
    us.email_notifications,
    us.onboarding_completed,
    -- Quick flags
    COALESCE(uis.google_calendar_enabled OR uis.outlook_calendar_enabled OR uis.apple_calendar_enabled, false) as has_calendar,
    COALESCE(uis.stripe_connected OR uis.paypal_connected, false) as has_payments,
    COALESCE(uep.include_guest_list, true) as export_guests_enabled,
    COALESCE(usp.last_active > CURRENT_TIMESTAMP - INTERVAL '7 days', false) as recently_active,
    -- Counts
    COALESCE(array_length(usp.favorite_vendors, 1), 0) as favorite_vendors_count,
    COALESCE(array_length(usp.pinned_tasks, 1), 0) as pinned_tasks_count
FROM 
    user_settings us
    LEFT JOIN user_integration_settings uis ON us.user_id = uis.user_id
    LEFT JOIN user_export_preferences uep ON us.user_id = uep.user_id
    LEFT JOIN user_session_preferences usp ON us.user_id = usp.user_id;

-- Create function to get settings for API response
CREATE OR REPLACE FUNCTION get_user_settings_for_api(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', jsonb_build_object(
            'country_code', country_code,
            'region', region,
            'timezone', timezone,
            'language', language,
            'currency', currency
        ),
        'display', jsonb_build_object(
            'theme', theme,
            'accent_color', accent_color,
            'font_size', font_size,
            'compact_mode', compact_mode,
            'animations_enabled', animations_enabled,
            'date_format', date_format,
            'time_format', time_format
        ),
        'notifications', jsonb_build_object(
            'email', jsonb_build_object(
                'enabled', email_notifications,
                'frequency', email_frequency
            ),
            'push', push_notifications,
            'sms', sms_notifications,
            'types', jsonb_build_object(
                'rsvp_updates', notify_rsvp_updates,
                'payment_reminders', notify_payment_reminders,
                'task_deadlines', notify_task_deadlines,
                'vendor_messages', notify_vendor_messages,
                'guest_messages', notify_guest_messages,
                'milestone_reminders', notify_milestone_reminders
            )
        ),
        'privacy', jsonb_build_object(
            'profile_visibility', profile_visibility,
            'show_budget_to_vendors', show_budget_to_vendors,
            'allow_guest_photos', allow_guest_photos,
            'allow_vendor_contact', allow_vendor_contact
        ),
        'accessibility', jsonb_build_object(
            'high_contrast', high_contrast,
            'reduce_motion', reduce_motion,
            'screen_reader_optimized', screen_reader_optimized,
            'keyboard_shortcuts', keyboard_shortcuts
        ),
        'advanced', jsonb_build_object(
            'developer_mode', developer_mode,
            'beta_features', beta_features,
            'analytics_enabled', analytics_enabled,
            'crash_reporting', crash_reporting
        ),
        'meta', jsonb_build_object(
            'onboarding_completed', onboarding_completed,
            'onboarding_step', onboarding_step,
            'created_at', created_at,
            'last_updated', last_updated
        )
    ) INTO v_result
    FROM user_settings
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for views
CREATE INDEX IF NOT EXISTS idx_user_settings_theme ON user_settings(theme);
CREATE INDEX IF NOT EXISTS idx_user_settings_language ON user_settings(language);
CREATE INDEX IF NOT EXISTS idx_user_settings_onboarding ON user_settings(onboarding_completed);

-- Grant permissions for views
GRANT SELECT ON v_user_complete_settings TO authenticated;
GRANT SELECT ON v_user_notification_preferences TO authenticated;
GRANT SELECT ON v_user_integrations_summary TO authenticated;
GRANT SELECT ON v_user_session_state TO authenticated;
GRANT SELECT ON v_user_settings_summary TO authenticated;

-- Add comments
COMMENT ON VIEW v_user_complete_settings IS 'Comprehensive view of all user settings with joined data';
COMMENT ON VIEW v_user_notification_preferences IS 'User notification preferences with available templates';
COMMENT ON VIEW v_user_integrations_summary IS 'Summary of all third-party integrations for a user';
COMMENT ON VIEW v_user_session_state IS 'Current session state and UI preferences';
COMMENT ON VIEW v_user_settings_summary IS 'Quick summary view for dashboard and checks';
COMMENT ON FUNCTION get_user_settings_for_api IS 'Returns user settings formatted for API responses';