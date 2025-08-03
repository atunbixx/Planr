-- Smart Notifications System Schema
-- Handles context-aware notifications, preferences, and delivery

-- Notification templates for different event types
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    default_timing VARCHAR(50), -- immediately, morning, evening, x_days_before
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User notification preferences by category
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    channel_push BOOLEAN DEFAULT true,
    channel_email BOOLEAN DEFAULT true,
    channel_sms BOOLEAN DEFAULT false,
    timing_preference VARCHAR(50) DEFAULT 'immediately', -- immediately, morning, evening, custom
    custom_time TIME,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    frequency VARCHAR(50) DEFAULT 'each', -- each, hourly, daily_digest, weekly_digest
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category)
);

-- Scheduled notifications queue
CREATE TABLE scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB DEFAULT '{}', -- Template variables
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    channels VARCHAR[] DEFAULT ARRAY['push'],
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification history for analytics and deduplication
CREATE TABLE notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id),
    scheduled_notification_id UUID REFERENCES scheduled_notifications(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL, -- push, email, sms
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    data JSONB DEFAULT '{}'
);

-- Location-based notification triggers
CREATE TABLE location_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) NOT NULL, -- venue, vendor, custom
    reference_id UUID, -- venue_id or vendor_id
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_meters INTEGER DEFAULT 100,
    trigger_template_id UUID REFERENCES notification_templates(id),
    trigger_data JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Smart notification rules for automated scheduling
CREATE TABLE notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- date_based, event_based, threshold_based
    trigger_config JSONB NOT NULL, -- Configuration for the trigger
    template_id UUID REFERENCES notification_templates(id),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default notification templates
INSERT INTO notification_templates (template_key, title_template, body_template, category, priority, default_timing) VALUES
-- Task reminders
('task_due_tomorrow', 'Task Due Tomorrow: {{task_name}}', 'Don''t forget! "{{task_name}}" is due tomorrow. {{task_description}}', 'tasks', 'high', 'evening'),
('task_overdue', 'Overdue Task: {{task_name}}', 'Your task "{{task_name}}" is now overdue. Please complete it as soon as possible.', 'tasks', 'urgent', 'immediately'),
('task_due_week', 'Upcoming Task: {{task_name}}', 'Reminder: "{{task_name}}" is due in {{days}} days.', 'tasks', 'medium', 'morning'),

-- Vendor appointments
('vendor_appointment_tomorrow', 'Appointment Tomorrow: {{vendor_name}}', 'You have an appointment with {{vendor_name}} tomorrow at {{time}}. Location: {{location}}', 'vendors', 'high', 'evening'),
('vendor_appointment_hour', 'Appointment in 1 Hour', 'Your appointment with {{vendor_name}} is in 1 hour at {{location}}.', 'vendors', 'urgent', 'immediately'),

-- Payment reminders
('payment_due_week', 'Payment Due Soon: {{vendor_name}}', 'Payment of {{amount}} to {{vendor_name}} is due in {{days}} days.', 'budget', 'high', 'morning'),
('payment_overdue', 'Overdue Payment: {{vendor_name}}', 'Your payment of {{amount}} to {{vendor_name}} is overdue. Please pay as soon as possible.', 'budget', 'urgent', 'immediately'),

-- RSVP reminders
('rsvp_deadline_week', 'RSVP Deadline Approaching', 'Please remind your guests that the RSVP deadline is in {{days}} days. {{pending_count}} guests haven''t responded yet.', 'rsvp', 'medium', 'morning'),
('rsvp_new_response', 'New RSVP: {{guest_name}}', '{{guest_name}} has responded {{response}} to your wedding invitation.', 'rsvp', 'medium', 'immediately'),

-- Wedding countdown
('wedding_month_away', '1 Month Until Your Wedding!', 'Your big day is just 1 month away! Here''s what you should focus on: {{checklist}}', 'wedding', 'high', 'morning'),
('wedding_week_away', '1 Week Until Your Wedding!', 'Just 7 days to go! Final checklist: {{checklist}}', 'wedding', 'urgent', 'morning'),
('wedding_tomorrow', 'Tomorrow is Your Big Day!', 'Congratulations! Tomorrow you''re getting married! Get some rest and enjoy every moment. ❤️', 'wedding', 'urgent', 'evening'),

-- Location-based
('near_venue', 'You''re Near Your Venue', 'You''re close to {{venue_name}}. Would you like to check your venue checklist?', 'location', 'low', 'immediately'),
('near_vendor', 'You''re Near {{vendor_name}}', 'You''re close to {{vendor_name}}. You have an upcoming appointment on {{date}}.', 'location', 'low', 'immediately');

-- Insert default notification rules
INSERT INTO notification_rules (rule_key, description, category, trigger_type, trigger_config, template_id, enabled) VALUES
-- Task-based rules
('task_due_tomorrow_rule', 'Notify users about tasks due tomorrow', 'tasks', 'date_based', 
 '{"days_before": 1, "time": "18:00", "check_field": "due_date"}', 
 (SELECT id FROM notification_templates WHERE template_key = 'task_due_tomorrow'), true),

('task_due_week_rule', 'Notify users about tasks due in a week', 'tasks', 'date_based',
 '{"days_before": 7, "time": "09:00", "check_field": "due_date"}',
 (SELECT id FROM notification_templates WHERE template_key = 'task_due_week'), true),

-- Vendor appointment rules
('vendor_appointment_tomorrow_rule', 'Notify about tomorrow appointments', 'vendors', 'date_based',
 '{"days_before": 1, "time": "18:00", "check_field": "appointment_date"}',
 (SELECT id FROM notification_templates WHERE template_key = 'vendor_appointment_tomorrow'), true),

-- Payment rules
('payment_due_week_rule', 'Notify about payments due in a week', 'budget', 'date_based',
 '{"days_before": 7, "time": "09:00", "check_field": "due_date"}',
 (SELECT id FROM notification_templates WHERE template_key = 'payment_due_week'), true),

-- Wedding countdown rules
('wedding_month_away_rule', 'One month wedding reminder', 'wedding', 'date_based',
 '{"days_before": 30, "time": "09:00", "check_field": "wedding_date"}',
 (SELECT id FROM notification_templates WHERE template_key = 'wedding_month_away'), true),

('wedding_week_away_rule', 'One week wedding reminder', 'wedding', 'date_based',
 '{"days_before": 7, "time": "09:00", "check_field": "wedding_date"}',
 (SELECT id FROM notification_templates WHERE template_key = 'wedding_week_away'), true);

-- Functions for smart notification scheduling
CREATE OR REPLACE FUNCTION schedule_smart_notification(
    p_user_id UUID,
    p_template_key VARCHAR,
    p_scheduled_for TIMESTAMP WITH TIME ZONE,
    p_data JSONB DEFAULT '{}',
    p_priority VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_template notification_templates;
    v_preferences user_notification_preferences;
    v_channels VARCHAR[];
BEGIN
    -- Get template
    SELECT * INTO v_template FROM notification_templates WHERE template_key = p_template_key;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found: %', p_template_key;
    END IF;

    -- Get user preferences for this category
    SELECT * INTO v_preferences 
    FROM user_notification_preferences 
    WHERE user_id = p_user_id AND category = v_template.category;

    -- Determine channels based on preferences
    v_channels := ARRAY[]::VARCHAR[];
    IF v_preferences.channel_push THEN
        v_channels := array_append(v_channels, 'push');
    END IF;
    IF v_preferences.channel_email THEN
        v_channels := array_append(v_channels, 'email');
    END IF;
    IF v_preferences.channel_sms THEN
        v_channels := array_append(v_channels, 'sms');
    END IF;

    -- If no preferences, use defaults
    IF v_channels = ARRAY[]::VARCHAR[] THEN
        v_channels := ARRAY['push'];
    END IF;

    -- Create scheduled notification
    INSERT INTO scheduled_notifications (
        user_id,
        template_id,
        scheduled_for,
        data,
        category,
        priority,
        channels
    ) VALUES (
        p_user_id,
        v_template.id,
        p_scheduled_for,
        p_data,
        v_template.category,
        COALESCE(p_priority, v_template.priority),
        v_channels
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and schedule notifications based on rules
CREATE OR REPLACE FUNCTION process_notification_rules() RETURNS void AS $$
DECLARE
    v_rule notification_rules;
    v_user auth.users;
    v_scheduled_for TIMESTAMP WITH TIME ZONE;
    v_data JSONB;
BEGIN
    -- Process each enabled rule
    FOR v_rule IN SELECT * FROM notification_rules WHERE enabled = true LOOP
        -- Process based on trigger type
        IF v_rule.trigger_type = 'date_based' THEN
            -- Example: Process task due reminders
            IF v_rule.category = 'tasks' THEN
                FOR v_user IN SELECT DISTINCT u.* FROM auth.users u
                    JOIN user_tasks ut ON ut.user_id = u.id
                    WHERE ut.status != 'completed'
                    AND ut.due_date IS NOT NULL
                    AND ut.due_date::date = CURRENT_DATE + ((v_rule.trigger_config->>'days_before')::int || ' days')::interval
                LOOP
                    -- Schedule notification for each user with tasks due
                    PERFORM schedule_smart_notification(
                        v_user.id,
                        (SELECT template_key FROM notification_templates WHERE id = v_rule.template_id),
                        (CURRENT_DATE + ((v_rule.trigger_config->>'time')::time))::timestamp with time zone,
                        jsonb_build_object('task_name', 'Task Name', 'days', v_rule.trigger_config->>'days_before')
                    );
                END LOOP;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_scheduled_notifications_user_status ON scheduled_notifications(user_id, status);
CREATE INDEX idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_notification_history_user_category ON notification_history(user_id, category);
CREATE INDEX idx_location_triggers_user_enabled ON location_triggers(user_id, enabled);
CREATE INDEX idx_user_notification_preferences_user_category ON user_notification_preferences(user_id, category);

-- Triggers
CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_notifications_updated_at
    BEFORE UPDATE ON scheduled_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_rules_updated_at
    BEFORE UPDATE ON notification_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notification_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON scheduled_notifications TO authenticated;
GRANT SELECT, INSERT ON notification_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON location_triggers TO authenticated;
GRANT SELECT ON notification_rules TO authenticated;

-- Row Level Security
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own notification preferences"
    ON user_notification_preferences FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own scheduled notifications"
    ON scheduled_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification history"
    ON notification_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own location triggers"
    ON location_triggers FOR ALL
    USING (auth.uid() = user_id);