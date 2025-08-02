-- Add reminder tracking columns to wedding_guests table
-- Track when reminders were sent and how many times

-- Add reminder tracking columns
ALTER TABLE wedding_guests 
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Create index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_wedding_guests_reminder_tracking 
ON wedding_guests(couple_id, rsvp_status, last_reminder_sent) 
WHERE email IS NOT NULL;

-- Create a view for guests needing reminders
CREATE OR REPLACE VIEW guests_needing_reminders AS
SELECT 
    g.id,
    g.couple_id,
    g.first_name,
    g.last_name,
    g.email,
    g.invite_code,
    g.invitation_sent_date,
    g.last_reminder_sent,
    g.reminder_count,
    c.partner1_name,
    c.partner2_name,
    c.wedding_date,
    CASE 
        WHEN g.last_reminder_sent IS NULL THEN 'never_reminded'
        WHEN g.last_reminder_sent < CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'eligible'
        ELSE 'recently_reminded'
    END as reminder_status
FROM wedding_guests g
JOIN couples c ON g.couple_id = c.id
WHERE g.rsvp_status = 'pending'
AND g.email IS NOT NULL
AND g.invitation_sent_date IS NOT NULL
ORDER BY g.last_reminder_sent ASC NULLS FIRST, g.last_name, g.first_name;

-- Function to get reminder statistics
CREATE OR REPLACE FUNCTION get_reminder_statistics(p_couple_id UUID)
RETURNS TABLE (
    total_pending BIGINT,
    never_reminded BIGINT,
    reminded_once BIGINT,
    reminded_multiple BIGINT,
    eligible_for_reminder BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE rsvp_status = 'pending') as total_pending,
        COUNT(*) FILTER (WHERE rsvp_status = 'pending' AND last_reminder_sent IS NULL) as never_reminded,
        COUNT(*) FILTER (WHERE rsvp_status = 'pending' AND reminder_count = 1) as reminded_once,
        COUNT(*) FILTER (WHERE rsvp_status = 'pending' AND reminder_count > 1) as reminded_multiple,
        COUNT(*) FILTER (
            WHERE rsvp_status = 'pending' 
            AND email IS NOT NULL
            AND (last_reminder_sent IS NULL OR last_reminder_sent < CURRENT_TIMESTAMP - INTERVAL '7 days')
        ) as eligible_for_reminder
    FROM wedding_guests
    WHERE couple_id = p_couple_id
    AND invitation_sent_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to record reminder sent
CREATE OR REPLACE FUNCTION record_reminder_sent(
    p_guest_id UUID,
    p_couple_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE wedding_guests
    SET 
        last_reminder_sent = CURRENT_TIMESTAMP,
        reminder_count = COALESCE(reminder_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_guest_id 
    AND couple_id = p_couple_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON guests_needing_reminders TO authenticated;
GRANT EXECUTE ON FUNCTION get_reminder_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_reminder_sent(UUID, UUID) TO authenticated;