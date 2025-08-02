-- RSVP Responses Table
-- Tracks detailed RSVP response history with versioning
CREATE TABLE IF NOT EXISTS rsvp_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES wedding_guests(id) ON DELETE CASCADE,
    session_id UUID REFERENCES rsvp_sessions(id) ON DELETE SET NULL,
    response_version INTEGER DEFAULT 1,
    attendance_status VARCHAR(50) NOT NULL CHECK (attendance_status IN ('attending', 'not_attending', 'maybe', 'pending')),
    previous_status VARCHAR(50),
    response_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    response_method VARCHAR(50) DEFAULT 'online' CHECK (response_method IN ('online', 'phone', 'mail', 'in_person', 'admin')),
    responded_by VARCHAR(255), -- Name if someone else responded on behalf
    
    -- Meal selections
    meal_preference VARCHAR(100),
    dietary_restrictions TEXT,
    dietary_allergies TEXT[],
    meal_notes TEXT,
    
    -- Plus one details (duplicated for history tracking)
    plus_one_attending BOOLEAN DEFAULT false,
    plus_one_name VARCHAR(255),
    plus_one_relationship VARCHAR(100),
    plus_one_meal_preference VARCHAR(100),
    plus_one_dietary_restrictions TEXT,
    plus_one_dietary_allergies TEXT[],
    
    -- Additional response data
    special_requests TEXT,
    transportation_needed BOOLEAN DEFAULT false,
    accommodation_needed BOOLEAN DEFAULT false,
    will_attend_ceremony BOOLEAN,
    will_attend_reception BOOLEAN,
    will_attend_rehearsal BOOLEAN,
    
    -- Communication preferences
    preferred_contact_method VARCHAR(50) CHECK (preferred_contact_method IN ('email', 'phone', 'text', 'mail')),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    
    -- Metadata
    response_notes TEXT,
    admin_notes TEXT,
    ip_address INET,
    is_final_response BOOLEAN DEFAULT true,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_couple ON rsvp_responses(couple_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_guest ON rsvp_responses(guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_session ON rsvp_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_attendance ON rsvp_responses(attendance_status);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_date ON rsvp_responses(response_date DESC);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_version ON rsvp_responses(guest_id, response_version DESC);

-- Enable RLS
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for rsvp_responses
CREATE POLICY "Users can view their own RSVP responses"
    ON rsvp_responses FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "Guests can create RSVP responses"
    ON rsvp_responses FOR INSERT
    WITH CHECK (
        -- Either authenticated couple or valid guest
        couple_id IN (
            SELECT id FROM couples 
            WHERE partner1_user_id = auth.uid() 
            OR partner2_user_id = auth.uid()
        )
        OR 
        guest_id IN (
            SELECT id FROM wedding_guests 
            WHERE invite_code IS NOT NULL
        )
    );

CREATE POLICY "Users can update their own RSVP responses"
    ON rsvp_responses FOR UPDATE
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

-- Function to submit RSVP response
CREATE OR REPLACE FUNCTION submit_rsvp_response(
    p_guest_id UUID,
    p_session_id UUID,
    p_attendance_status VARCHAR(50),
    p_meal_preference VARCHAR(100) DEFAULT NULL,
    p_dietary_restrictions TEXT DEFAULT NULL,
    p_dietary_allergies TEXT[] DEFAULT NULL,
    p_plus_one_attending BOOLEAN DEFAULT false,
    p_plus_one_name VARCHAR(255) DEFAULT NULL,
    p_plus_one_meal VARCHAR(100) DEFAULT NULL,
    p_plus_one_dietary TEXT DEFAULT NULL,
    p_special_requests TEXT DEFAULT NULL,
    p_contact_email VARCHAR(255) DEFAULT NULL,
    p_contact_phone VARCHAR(50) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_response_id UUID;
    v_couple_id UUID;
    v_previous_status VARCHAR(50);
    v_version INTEGER;
BEGIN
    -- Get couple_id and previous status
    SELECT couple_id, rsvp_status INTO v_couple_id, v_previous_status
    FROM wedding_guests
    WHERE id = p_guest_id;
    
    -- Calculate version number
    SELECT COALESCE(MAX(response_version), 0) + 1 INTO v_version
    FROM rsvp_responses
    WHERE guest_id = p_guest_id;
    
    -- Mark previous responses as not final
    UPDATE rsvp_responses
    SET is_final_response = false
    WHERE guest_id = p_guest_id
    AND is_final_response = true;
    
    -- Insert new response
    INSERT INTO rsvp_responses (
        couple_id,
        guest_id,
        session_id,
        response_version,
        attendance_status,
        previous_status,
        meal_preference,
        dietary_restrictions,
        dietary_allergies,
        plus_one_attending,
        plus_one_name,
        plus_one_meal_preference,
        plus_one_dietary_restrictions,
        special_requests,
        contact_email,
        contact_phone,
        will_attend_ceremony,
        will_attend_reception
    ) VALUES (
        v_couple_id,
        p_guest_id,
        p_session_id,
        v_version,
        p_attendance_status,
        v_previous_status,
        p_meal_preference,
        p_dietary_restrictions,
        p_dietary_allergies,
        p_plus_one_attending,
        p_plus_one_name,
        p_plus_one_meal,
        p_plus_one_dietary,
        p_special_requests,
        p_contact_email,
        p_contact_phone,
        CASE WHEN p_attendance_status = 'attending' THEN true ELSE false END,
        CASE WHEN p_attendance_status = 'attending' THEN true ELSE false END
    ) RETURNING id INTO v_response_id;
    
    -- Update wedding_guests table with latest response
    UPDATE wedding_guests
    SET 
        rsvp_status = p_attendance_status,
        rsvp_date = CURRENT_TIMESTAMP,
        meal_preference = p_meal_preference,
        dietary_restrictions = p_dietary_restrictions,
        dietary_allergies = p_dietary_allergies,
        plus_one_name = p_plus_one_name,
        plus_one_meal_preference = p_plus_one_meal,
        email = COALESCE(p_contact_email, email),
        phone = COALESCE(p_contact_phone, phone),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_guest_id;
    
    -- Update session as completed
    UPDATE rsvp_sessions
    SET completed_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
    
    RETURN v_response_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get RSVP response history
CREATE OR REPLACE FUNCTION get_rsvp_history(p_guest_id UUID)
RETURNS TABLE (
    response_id UUID,
    version INTEGER,
    status VARCHAR(50),
    previous_status VARCHAR(50),
    response_date TIMESTAMP WITH TIME ZONE,
    meal_preference VARCHAR(100),
    plus_one_attending BOOLEAN,
    plus_one_name VARCHAR(255),
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id as response_id,
        response_version as version,
        attendance_status as status,
        previous_status,
        response_date,
        meal_preference,
        plus_one_attending,
        plus_one_name,
        is_final_response as is_current
    FROM rsvp_responses
    WHERE guest_id = p_guest_id
    ORDER BY response_version DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get RSVP summary statistics
CREATE OR REPLACE FUNCTION get_rsvp_summary(p_couple_id UUID)
RETURNS TABLE (
    total_invited INTEGER,
    total_responded INTEGER,
    attending_count INTEGER,
    not_attending_count INTEGER,
    maybe_count INTEGER,
    pending_count INTEGER,
    plus_ones_count INTEGER,
    total_expected_guests INTEGER,
    response_rate DECIMAL(5,2),
    last_response_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH guest_stats AS (
        SELECT 
            COUNT(*) as total_invited,
            COUNT(CASE WHEN rsvp_status != 'pending' THEN 1 END) as total_responded,
            COUNT(CASE WHEN rsvp_status = 'attending' THEN 1 END) as attending_count,
            COUNT(CASE WHEN rsvp_status = 'not_attending' THEN 1 END) as not_attending_count,
            COUNT(CASE WHEN rsvp_status = 'maybe' THEN 1 END) as maybe_count,
            COUNT(CASE WHEN rsvp_status = 'pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN rsvp_status = 'attending' AND plus_one_name IS NOT NULL THEN 1 END) as plus_ones_count,
            COUNT(CASE WHEN rsvp_status = 'attending' THEN 1 END) + 
                COUNT(CASE WHEN rsvp_status = 'attending' AND plus_one_name IS NOT NULL THEN 1 END) as total_expected,
            MAX(rsvp_date) as last_response
        FROM wedding_guests
        WHERE couple_id = p_couple_id
    )
    SELECT 
        total_invited::INTEGER,
        total_responded::INTEGER,
        attending_count::INTEGER,
        not_attending_count::INTEGER,
        maybe_count::INTEGER,
        pending_count::INTEGER,
        plus_ones_count::INTEGER,
        total_expected::INTEGER as total_expected_guests,
        CASE 
            WHEN total_invited > 0 THEN 
                (total_responded::DECIMAL / total_invited * 100)::DECIMAL(5,2)
            ELSE 0
        END as response_rate,
        last_response as last_response_date
    FROM guest_stats;
END;
$$ LANGUAGE plpgsql;