-- Wedding Guests Table RSVP Enhancements
-- Additional columns and modifications for comprehensive RSVP tracking

-- Add RSVP-specific columns to wedding_guests table
ALTER TABLE wedding_guests 
ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50) CHECK (preferred_contact_method IN ('email', 'phone', 'text', 'mail')),
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS requires_transportation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_accommodation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accommodation_notes TEXT,
ADD COLUMN IF NOT EXISTS arrival_date DATE,
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS will_attend_rehearsal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS will_attend_ceremony BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS will_attend_reception BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rsvp_reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rsvp_method VARCHAR(50) CHECK (rsvp_method IN ('online', 'phone', 'mail', 'in_person', 'admin')),
ADD COLUMN IF NOT EXISTS rsvp_ip_address INET,
ADD COLUMN IF NOT EXISTS rsvp_user_agent TEXT,
ADD COLUMN IF NOT EXISTS special_needs TEXT,
ADD COLUMN IF NOT EXISTS seating_preferences TEXT,
ADD COLUMN IF NOT EXISTS guest_priority VARCHAR(20) DEFAULT 'normal' CHECK (guest_priority IN ('vip', 'high', 'normal', 'low'));

-- Create index for new columns
CREATE INDEX IF NOT EXISTS idx_wedding_guests_priority ON wedding_guests(guest_priority);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_rehearsal ON wedding_guests(will_attend_rehearsal);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_contact_method ON wedding_guests(preferred_contact_method);

-- Function to update guest RSVP details
CREATE OR REPLACE FUNCTION update_guest_rsvp_details(
    p_guest_id UUID,
    p_updates JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE wedding_guests
    SET 
        preferred_contact_method = COALESCE((p_updates->>'preferred_contact_method')::VARCHAR(50), preferred_contact_method),
        preferred_language = COALESCE(p_updates->>'preferred_language', preferred_language),
        requires_transportation = COALESCE((p_updates->>'requires_transportation')::BOOLEAN, requires_transportation),
        requires_accommodation = COALESCE((p_updates->>'requires_accommodation')::BOOLEAN, requires_accommodation),
        accommodation_notes = COALESCE(p_updates->>'accommodation_notes', accommodation_notes),
        arrival_date = COALESCE((p_updates->>'arrival_date')::DATE, arrival_date),
        departure_date = COALESCE((p_updates->>'departure_date')::DATE, departure_date),
        will_attend_rehearsal = COALESCE((p_updates->>'will_attend_rehearsal')::BOOLEAN, will_attend_rehearsal),
        will_attend_ceremony = COALESCE((p_updates->>'will_attend_ceremony')::BOOLEAN, will_attend_ceremony),
        will_attend_reception = COALESCE((p_updates->>'will_attend_reception')::BOOLEAN, will_attend_reception),
        special_needs = COALESCE(p_updates->>'special_needs', special_needs),
        seating_preferences = COALESCE(p_updates->>'seating_preferences', seating_preferences),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_guest_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to increment reminder count
CREATE OR REPLACE FUNCTION increment_rsvp_reminder(p_guest_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_new_count INTEGER;
BEGIN
    UPDATE wedding_guests
    SET 
        rsvp_reminder_count = COALESCE(rsvp_reminder_count, 0) + 1,
        last_reminder_sent = CURRENT_TIMESTAMP
    WHERE id = p_guest_id
    RETURNING rsvp_reminder_count INTO v_new_count;
    
    -- Also update in responses table
    UPDATE rsvp_responses
    SET 
        reminder_count = v_new_count,
        last_reminder_sent = CURRENT_TIMESTAMP
    WHERE guest_id = p_guest_id
    AND is_final_response = true;
    
    RETURN v_new_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get guests by event attendance
CREATE OR REPLACE FUNCTION get_guests_by_event_attendance(
    p_couple_id UUID,
    p_event_type VARCHAR(50) DEFAULT 'all' -- all, ceremony, reception, rehearsal
)
RETURNS TABLE (
    guest_id UUID,
    guest_name TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    plus_one_name VARCHAR(255),
    table_assignment VARCHAR(100),
    meal_preference VARCHAR(100),
    special_needs TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id as guest_id,
        first_name || ' ' || last_name as guest_name,
        email,
        phone,
        plus_one_name,
        table_assignment,
        meal_preference,
        special_needs
    FROM wedding_guests
    WHERE couple_id = p_couple_id
    AND rsvp_status = 'attending'
    AND (
        p_event_type = 'all' OR
        (p_event_type = 'ceremony' AND will_attend_ceremony = true) OR
        (p_event_type = 'reception' AND will_attend_reception = true) OR
        (p_event_type = 'rehearsal' AND will_attend_rehearsal = true)
    )
    ORDER BY last_name, first_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get accommodation summary
CREATE OR REPLACE FUNCTION get_accommodation_summary(p_couple_id UUID)
RETURNS TABLE (
    total_requiring_accommodation INTEGER,
    arrival_dates JSONB,
    departure_dates JSONB,
    average_nights DECIMAL(5,2),
    special_requirements TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH accommodation_data AS (
        SELECT 
            *,
            CASE 
                WHEN arrival_date IS NOT NULL AND departure_date IS NOT NULL 
                THEN departure_date - arrival_date 
                ELSE 0 
            END as nights
        FROM wedding_guests
        WHERE couple_id = p_couple_id
        AND requires_accommodation = true
        AND rsvp_status = 'attending'
    )
    SELECT 
        COUNT(*)::INTEGER as total_requiring_accommodation,
        jsonb_object_agg(
            arrival_date::TEXT, 
            arrival_count
        ) FILTER (WHERE arrival_date IS NOT NULL) as arrival_dates,
        jsonb_object_agg(
            departure_date::TEXT, 
            departure_count
        ) FILTER (WHERE departure_date IS NOT NULL) as departure_dates,
        AVG(nights)::DECIMAL(5,2) as average_nights,
        array_agg(DISTINCT accommodation_notes) FILTER (WHERE accommodation_notes IS NOT NULL) as special_requirements
    FROM (
        SELECT 
            arrival_date,
            departure_date,
            nights,
            accommodation_notes,
            COUNT(*) OVER (PARTITION BY arrival_date) as arrival_count,
            COUNT(*) OVER (PARTITION BY departure_date) as departure_count
        FROM accommodation_data
    ) grouped_data;
END;
$$ LANGUAGE plpgsql;

-- Function to get transportation summary
CREATE OR REPLACE FUNCTION get_transportation_summary(p_couple_id UUID)
RETURNS TABLE (
    total_requiring_transportation INTEGER,
    by_guest_category JSONB,
    special_requirements TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_requiring_transportation,
        jsonb_object_agg(
            guest_category,
            category_count
        ) as by_guest_category,
        array_agg(DISTINCT special_needs) FILTER (WHERE special_needs IS NOT NULL) as special_requirements
    FROM (
        SELECT 
            guest_category,
            special_needs,
            COUNT(*) OVER (PARTITION BY guest_category) as category_count
        FROM wedding_guests
        WHERE couple_id = p_couple_id
        AND requires_transportation = true
        AND rsvp_status = 'attending'
    ) transportation_data;
END;
$$ LANGUAGE plpgsql;