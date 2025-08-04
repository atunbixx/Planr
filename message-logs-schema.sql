-- Message Logs Schema for External Messaging System
-- Tracks all messages sent through Twilio and Resend

-- Create message_logs table
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES wedding_couples(id) ON DELETE CASCADE,
    recipient_id VARCHAR(255), -- Can be guest_id, vendor_id, etc.
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('email', 'sms', 'whatsapp')),
    template_id VARCHAR(100), -- Reference to template used
    subject TEXT, -- For emails
    body TEXT NOT NULL, -- Message content
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'complained')),
    error_message TEXT, -- Error details if failed
    external_id VARCHAR(255), -- Twilio SID or Resend message ID
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ, -- For emails
    clicked_at TIMESTAMPTZ, -- For emails
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_message_logs_couple_id ON message_logs(couple_id);
CREATE INDEX idx_message_logs_recipient_email ON message_logs(recipient_email);
CREATE INDEX idx_message_logs_recipient_phone ON message_logs(recipient_phone);
CREATE INDEX idx_message_logs_status ON message_logs(status);
CREATE INDEX idx_message_logs_message_type ON message_logs(message_type);
CREATE INDEX idx_message_logs_external_id ON message_logs(external_id);
CREATE INDEX idx_message_logs_created_at ON message_logs(created_at);

-- Create message_templates table for reusable templates
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES wedding_couples(id) ON DELETE CASCADE, -- NULL for system templates
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
    subject TEXT, -- For emails
    body TEXT NOT NULL,
    variables TEXT[], -- List of variable names that can be replaced
    is_system BOOLEAN DEFAULT FALSE, -- System templates vs custom templates
    category VARCHAR(50), -- guest_invitation, rsvp_reminder, vendor, thank_you, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for templates
CREATE INDEX idx_message_templates_couple_id ON message_templates(couple_id);
CREATE INDEX idx_message_templates_is_system ON message_templates(is_system);
CREATE INDEX idx_message_templates_category ON message_templates(category);

-- Create scheduled_messages table for future messages
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES wedding_couples(id) ON DELETE CASCADE,
    recipient_id VARCHAR(255),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('email', 'sms', 'whatsapp')),
    template_id UUID REFERENCES message_templates(id),
    subject TEXT,
    body TEXT NOT NULL,
    variables JSONB, -- Variables to replace in template
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    message_log_id UUID REFERENCES message_logs(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for scheduled messages
CREATE INDEX idx_scheduled_messages_couple_id ON scheduled_messages(couple_id);
CREATE INDEX idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for);
CREATE INDEX idx_scheduled_messages_sent ON scheduled_messages(sent);

-- Create message_preferences table for guest/vendor communication preferences
CREATE TABLE IF NOT EXISTS message_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES wedding_couples(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('guest', 'vendor')),
    entity_id UUID NOT NULL, -- guest_id or vendor_id
    preferred_channel VARCHAR(20) DEFAULT 'email' CHECK (preferred_channel IN ('email', 'sms', 'whatsapp')),
    email_opt_in BOOLEAN DEFAULT TRUE,
    sms_opt_in BOOLEAN DEFAULT TRUE,
    whatsapp_opt_in BOOLEAN DEFAULT FALSE,
    unsubscribed BOOLEAN DEFAULT FALSE,
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(couple_id, entity_type, entity_id)
);

-- Create indexes for preferences
CREATE INDEX idx_message_preferences_couple_id ON message_preferences(couple_id);
CREATE INDEX idx_message_preferences_entity ON message_preferences(entity_type, entity_id);

-- RLS Policies
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_preferences ENABLE ROW LEVEL SECURITY;

-- Message logs policies
CREATE POLICY "Couples can view their own message logs"
    ON message_logs FOR SELECT
    USING (couple_id IN (
        SELECT id FROM wedding_couples 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Couples can create their own message logs"
    ON message_logs FOR INSERT
    WITH CHECK (couple_id IN (
        SELECT id FROM wedding_couples 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Couples can update their own message logs"
    ON message_logs FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM wedding_couples 
        WHERE user_id = auth.uid()
    ));

-- Message templates policies
CREATE POLICY "Users can view system templates and their own templates"
    ON message_templates FOR SELECT
    USING (
        is_system = TRUE OR
        couple_id IN (
            SELECT id FROM wedding_couples 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Couples can create their own templates"
    ON message_templates FOR INSERT
    WITH CHECK (
        is_system = FALSE AND
        couple_id IN (
            SELECT id FROM wedding_couples 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Couples can update their own templates"
    ON message_templates FOR UPDATE
    USING (
        is_system = FALSE AND
        couple_id IN (
            SELECT id FROM wedding_couples 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Couples can delete their own templates"
    ON message_templates FOR DELETE
    USING (
        is_system = FALSE AND
        couple_id IN (
            SELECT id FROM wedding_couples 
            WHERE user_id = auth.uid()
        )
    );

-- Scheduled messages policies
CREATE POLICY "Couples can manage their own scheduled messages"
    ON scheduled_messages FOR ALL
    USING (couple_id IN (
        SELECT id FROM wedding_couples 
        WHERE user_id = auth.uid()
    ));

-- Message preferences policies
CREATE POLICY "Couples can manage their own message preferences"
    ON message_preferences FOR ALL
    USING (couple_id IN (
        SELECT id FROM wedding_couples 
        WHERE user_id = auth.uid()
    ));

-- Insert default system templates
INSERT INTO message_templates (name, description, type, subject, body, variables, is_system, category) VALUES
-- Guest invitation templates
('Guest Invitation Email', 'Default email template for inviting guests', 'email', 
 'You''re Invited to {{coupleName}}''s Wedding!',
 '<h2>You''re Invited!</h2><p>Dear {{guestName}},</p><p>{{partner1Name}} and {{partner2Name}} request the pleasure of your company at their wedding celebration.</p><p><strong>Date:</strong> {{weddingDate}}</p><p><strong>Time:</strong> {{weddingTime}}</p><p><strong>Venue:</strong> {{venueName}}</p><p><strong>Address:</strong> {{venueAddress}}</p><p>Please RSVP by {{rsvpDeadline}} at: {{rsvpLink}}</p><p>We look forward to celebrating with you!</p><p>With love,<br>{{partner1Name}} & {{partner2Name}}</p>',
 ARRAY['guestName', 'coupleName', 'partner1Name', 'partner2Name', 'weddingDate', 'weddingTime', 'venueName', 'venueAddress', 'rsvpDeadline', 'rsvpLink'],
 TRUE, 'guest_invitation'),

('Guest Invitation SMS', 'Default SMS template for inviting guests', 'sms',
 NULL,
 'Hi {{guestName}}! You''re invited to {{partner1Name}} & {{partner2Name}}''s wedding on {{weddingDate}}. RSVP: {{rsvpLink}}',
 ARRAY['guestName', 'partner1Name', 'partner2Name', 'weddingDate', 'rsvpLink'],
 TRUE, 'guest_invitation'),

-- RSVP reminder templates
('RSVP Reminder Email', 'Email reminder for guests to RSVP', 'email',
 'Reminder: Please RSVP for {{coupleName}}''s Wedding',
 '<p>Hi {{guestName}},</p><p>This is a friendly reminder to RSVP for {{partner1Name}} and {{partner2Name}}''s wedding.</p><p>The deadline is {{rsvpDeadline}} - just {{daysLeft}} days away!</p><p>Please confirm your attendance at: {{rsvpLink}}</p><p>Thank you!</p>',
 ARRAY['guestName', 'coupleName', 'partner1Name', 'partner2Name', 'rsvpDeadline', 'daysLeft', 'rsvpLink'],
 TRUE, 'rsvp_reminder'),

('RSVP Reminder SMS', 'SMS reminder for guests to RSVP', 'sms',
 NULL,
 'Hi {{guestName}}! Please RSVP for {{partner1Name}} & {{partner2Name}}''s wedding by {{rsvpDeadline}}: {{rsvpLink}}',
 ARRAY['guestName', 'partner1Name', 'partner2Name', 'rsvpDeadline', 'rsvpLink'],
 TRUE, 'rsvp_reminder'),

-- Vendor templates
('Vendor Booking Confirmation', 'Email confirmation for vendor bookings', 'email',
 'Booking Confirmation - {{coupleName}} Wedding',
 '<p>Dear {{vendorName}},</p><p>This email confirms your booking for {{partner1Name}} and {{partner2Name}}''s wedding.</p><p><strong>Event Details:</strong></p><ul><li>Date: {{weddingDate}}</li><li>Time: {{serviceTime}}</li><li>Venue: {{venueName}}</li><li>Service: {{serviceType}}</li></ul><p>Please confirm receipt of this email.</p><p>Best regards,<br>{{partner1Name}} & {{partner2Name}}</p>',
 ARRAY['vendorName', 'coupleName', 'partner1Name', 'partner2Name', 'weddingDate', 'serviceTime', 'venueName', 'serviceType'],
 TRUE, 'vendor'),

('Thank You Email', 'Thank you message for guests after the wedding', 'email',
 'Thank You from {{partner1Name}} & {{partner2Name}}',
 '<p>Dear {{guestName}},</p><p>Thank you so much for celebrating our special day with us!</p><p>Your presence made our wedding even more memorable, and we are grateful for your love and support.</p><p>With love and gratitude,<br>{{partner1Name}} & {{partner2Name}}</p>',
 ARRAY['guestName', 'partner1Name', 'partner2Name'],
 TRUE, 'thank_you')

ON CONFLICT DO NOTHING;