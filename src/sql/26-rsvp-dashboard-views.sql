-- RSVP Dashboard Views and Helper Functions
-- Comprehensive views for RSVP tracking and analytics

-- Main RSVP dashboard view
CREATE OR REPLACE VIEW rsvp_dashboard AS
WITH response_stats AS (
    SELECT 
        couple_id,
        COUNT(DISTINCT guest_id) as total_guests,
        COUNT(DISTINCT CASE WHEN rsvp_status = 'attending' THEN guest_id END) as attending,
        COUNT(DISTINCT CASE WHEN rsvp_status = 'not_attending' THEN guest_id END) as not_attending,
        COUNT(DISTINCT CASE WHEN rsvp_status = 'maybe' THEN guest_id END) as maybe,
        COUNT(DISTINCT CASE WHEN rsvp_status = 'pending' THEN guest_id END) as pending,
        COUNT(DISTINCT CASE WHEN plus_one_name IS NOT NULL AND rsvp_status = 'attending' THEN guest_id END) as plus_ones_attending
    FROM wedding_guests
    GROUP BY couple_id
),
meal_stats AS (
    SELECT 
        couple_id,
        COUNT(*) as total_meal_selections,
        COUNT(CASE WHEN is_vegetarian THEN 1 END) as vegetarian_meals,
        COUNT(CASE WHEN is_vegan THEN 1 END) as vegan_meals,
        COUNT(CASE WHEN is_gluten_free THEN 1 END) as gluten_free_meals
    FROM rsvp_meal_selections
    WHERE selections_confirmed = true
    GROUP BY couple_id
),
session_stats AS (
    SELECT 
        couple_id,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT guest_id) as unique_visitors,
        COUNT(CASE WHEN access_status = 'success' THEN 1 END) as successful_accesses,
        COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_accesses
    FROM rsvp_sessions
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY couple_id
)
SELECT 
    rs.couple_id,
    rs.total_guests,
    rs.attending,
    rs.not_attending,
    rs.maybe,
    rs.pending,
    rs.plus_ones_attending,
    rs.attending + rs.plus_ones_attending as total_expected_attendees,
    CASE 
        WHEN rs.total_guests > 0 THEN 
            ((rs.attending + rs.not_attending + rs.maybe)::DECIMAL / rs.total_guests * 100)::DECIMAL(5,2)
        ELSE 0
    END as response_rate,
    ms.total_meal_selections,
    ms.vegetarian_meals,
    ms.vegan_meals,
    ms.gluten_free_meals,
    ss.total_sessions,
    ss.unique_visitors,
    ss.successful_accesses,
    ss.mobile_accesses
FROM response_stats rs
LEFT JOIN meal_stats ms ON rs.couple_id = ms.couple_id
LEFT JOIN session_stats ss ON rs.couple_id = ss.couple_id;

-- Guest response timeline view
CREATE OR REPLACE VIEW rsvp_response_timeline AS
SELECT 
    couple_id,
    DATE(response_date) as response_day,
    COUNT(*) as responses_count,
    COUNT(CASE WHEN attendance_status = 'attending' THEN 1 END) as attending_count,
    COUNT(CASE WHEN attendance_status = 'not_attending' THEN 1 END) as not_attending_count,
    COUNT(CASE WHEN attendance_status = 'maybe' THEN 1 END) as maybe_count,
    SUM(COUNT(*)) OVER (PARTITION BY couple_id ORDER BY DATE(response_date)) as cumulative_responses
FROM rsvp_responses
WHERE is_final_response = true
GROUP BY couple_id, DATE(response_date)
ORDER BY couple_id, response_day;

-- Table assignment summary view
CREATE OR REPLACE VIEW rsvp_table_summary AS
SELECT 
    couple_id,
    table_assignment,
    COUNT(DISTINCT guest_id) as guest_count,
    COUNT(DISTINCT CASE WHEN plus_one_name IS NOT NULL THEN guest_id END) as plus_one_count,
    COUNT(DISTINCT guest_id) + COUNT(DISTINCT CASE WHEN plus_one_name IS NOT NULL THEN guest_id END) as total_at_table,
    STRING_AGG(DISTINCT meal_preference, ', ') as meal_preferences_at_table,
    COUNT(CASE WHEN dietary_restrictions IS NOT NULL OR dietary_allergies IS NOT NULL THEN 1 END) as special_dietary_count
FROM wedding_guests
WHERE rsvp_status = 'attending'
AND table_assignment IS NOT NULL
GROUP BY couple_id, table_assignment
ORDER BY table_assignment;

-- Outstanding RSVP reminders view
CREATE OR REPLACE VIEW rsvp_pending_reminders AS
SELECT 
    wg.couple_id,
    wg.id as guest_id,
    wg.first_name || ' ' || wg.last_name as guest_name,
    wg.email,
    wg.phone,
    wg.guest_category,
    wg.guest_side,
    wg.invite_sent_date,
    CURRENT_DATE - wg.invite_sent_date::DATE as days_since_invite,
    rr.reminder_count,
    rr.last_reminder_sent,
    CASE 
        WHEN rr.last_reminder_sent IS NULL THEN CURRENT_DATE - wg.invite_sent_date::DATE
        ELSE CURRENT_DATE - rr.last_reminder_sent::DATE
    END as days_since_last_contact
FROM wedding_guests wg
LEFT JOIN (
    SELECT 
        guest_id,
        MAX(reminder_count) as reminder_count,
        MAX(last_reminder_sent) as last_reminder_sent
    FROM rsvp_responses
    WHERE is_final_response = true
    GROUP BY guest_id
) rr ON wg.id = rr.guest_id
WHERE wg.rsvp_status = 'pending'
AND wg.invite_sent_date IS NOT NULL
ORDER BY days_since_invite DESC;

-- Meal selection summary by course
CREATE OR REPLACE VIEW rsvp_meal_course_summary AS
WITH meal_data AS (
    SELECT 
        rms.couple_id,
        'Main Course' as course_type,
        mo.name as selection,
        COUNT(*) as count
    FROM rsvp_meal_selections rms
    JOIN meal_options mo ON rms.main_course_selection = mo.id
    WHERE rms.selections_confirmed = true
    GROUP BY rms.couple_id, mo.name
    
    UNION ALL
    
    SELECT 
        rms.couple_id,
        'Appetizer' as course_type,
        mo.name as selection,
        COUNT(*) as count
    FROM rsvp_meal_selections rms
    JOIN meal_options mo ON rms.appetizer_selection = mo.id
    WHERE rms.selections_confirmed = true
    GROUP BY rms.couple_id, mo.name
    
    UNION ALL
    
    SELECT 
        rms.couple_id,
        'Dessert' as course_type,
        mo.name as selection,
        COUNT(*) as count
    FROM rsvp_meal_selections rms
    JOIN meal_options mo ON rms.dessert_selection = mo.id
    WHERE rms.selections_confirmed = true
    GROUP BY rms.couple_id, mo.name
)
SELECT 
    couple_id,
    course_type,
    selection,
    count,
    ROUND((count::DECIMAL / SUM(count) OVER (PARTITION BY couple_id, course_type) * 100), 2) as percentage
FROM meal_data
ORDER BY couple_id, course_type, count DESC;

-- Function to get RSVP analytics by time period
CREATE OR REPLACE FUNCTION get_rsvp_analytics_by_period(
    p_couple_id UUID,
    p_period VARCHAR(20) DEFAULT 'week' -- day, week, month
)
RETURNS TABLE (
    period_label TEXT,
    total_responses INTEGER,
    attending INTEGER,
    not_attending INTEGER,
    response_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH period_data AS (
        SELECT 
            CASE p_period
                WHEN 'day' THEN TO_CHAR(response_date, 'YYYY-MM-DD')
                WHEN 'week' THEN TO_CHAR(response_date, 'YYYY-WW')
                WHEN 'month' THEN TO_CHAR(response_date, 'YYYY-MM')
            END as period,
            COUNT(*) as responses,
            COUNT(CASE WHEN attendance_status = 'attending' THEN 1 END) as attending_count,
            COUNT(CASE WHEN attendance_status = 'not_attending' THEN 1 END) as not_attending_count
        FROM rsvp_responses
        WHERE couple_id = p_couple_id
        AND is_final_response = true
        GROUP BY period
    ),
    total_guests AS (
        SELECT COUNT(*) as total FROM wedding_guests WHERE couple_id = p_couple_id
    )
    SELECT 
        pd.period as period_label,
        pd.responses::INTEGER as total_responses,
        pd.attending_count::INTEGER as attending,
        pd.not_attending_count::INTEGER as not_attending,
        CASE 
            WHEN tg.total > 0 THEN (pd.responses::DECIMAL / tg.total * 100)::DECIMAL(5,2)
            ELSE 0
        END as response_rate
    FROM period_data pd, total_guests tg
    ORDER BY pd.period;
END;
$$ LANGUAGE plpgsql;

-- Function to get guest communication preferences
CREATE OR REPLACE FUNCTION get_guest_communication_summary(p_couple_id UUID)
RETURNS TABLE (
    communication_method VARCHAR(50),
    guest_count INTEGER,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH comm_prefs AS (
        SELECT 
            COALESCE(preferred_contact_method, 
                CASE 
                    WHEN email IS NOT NULL THEN 'email'
                    WHEN phone IS NOT NULL THEN 'phone'
                    ELSE 'none'
                END
            ) as method,
            COUNT(*) as count
        FROM wedding_guests wg
        LEFT JOIN (
            SELECT DISTINCT ON (guest_id) 
                guest_id,
                preferred_contact_method
            FROM rsvp_responses
            WHERE is_final_response = true
            ORDER BY guest_id, response_date DESC
        ) rr ON wg.id = rr.guest_id
        WHERE wg.couple_id = p_couple_id
        GROUP BY method
    ),
    total AS (
        SELECT SUM(count) as total_count FROM comm_prefs
    )
    SELECT 
        cp.method as communication_method,
        cp.count::INTEGER as guest_count,
        CASE 
            WHEN t.total_count > 0 THEN (cp.count::DECIMAL / t.total_count * 100)::DECIMAL(5,2)
            ELSE 0
        END as percentage
    FROM comm_prefs cp, total t
    ORDER BY cp.count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to generate RSVP reminder list
CREATE OR REPLACE FUNCTION get_rsvp_reminder_list(
    p_couple_id UUID,
    p_days_threshold INTEGER DEFAULT 7
)
RETURNS TABLE (
    guest_id UUID,
    guest_name TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    days_pending INTEGER,
    reminder_count INTEGER,
    priority VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wg.id as guest_id,
        wg.first_name || ' ' || wg.last_name as guest_name,
        wg.email,
        wg.phone,
        (CURRENT_DATE - COALESCE(rr.last_reminder_sent, wg.invite_sent_date)::DATE)::INTEGER as days_pending,
        COALESCE(rr.reminder_count, 0)::INTEGER as reminder_count,
        CASE 
            WHEN (CURRENT_DATE - COALESCE(rr.last_reminder_sent, wg.invite_sent_date)::DATE) > 14 THEN 'high'
            WHEN (CURRENT_DATE - COALESCE(rr.last_reminder_sent, wg.invite_sent_date)::DATE) > 7 THEN 'medium'
            ELSE 'low'
        END::VARCHAR(20) as priority
    FROM wedding_guests wg
    LEFT JOIN (
        SELECT 
            guest_id,
            MAX(reminder_count) as reminder_count,
            MAX(last_reminder_sent) as last_reminder_sent
        FROM rsvp_responses
        WHERE is_final_response = true
        GROUP BY guest_id
    ) rr ON wg.id = rr.guest_id
    WHERE wg.couple_id = p_couple_id
    AND wg.rsvp_status = 'pending'
    AND (CURRENT_DATE - COALESCE(rr.last_reminder_sent, wg.invite_sent_date)::DATE) >= p_days_threshold
    ORDER BY days_pending DESC;
END;
$$ LANGUAGE plpgsql;

-- Create composite indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_wedding_guests_dashboard ON wedding_guests(couple_id, rsvp_status);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_dashboard ON rsvp_responses(couple_id, is_final_response, response_date);
CREATE INDEX IF NOT EXISTS idx_rsvp_meal_selections_dashboard ON rsvp_meal_selections(couple_id, selections_confirmed);