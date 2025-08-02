-- RSVP Sessions Table
-- Tracks all RSVP access attempts and sessions for security and analytics
CREATE TABLE IF NOT EXISTS rsvp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES wedding_guests(id) ON DELETE SET NULL,
    invite_code VARCHAR(20) NOT NULL,
    session_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    browser_info JSONB,
    device_type VARCHAR(50) CHECK (device_type IN ('desktop', 'tablet', 'mobile', 'unknown')),
    access_status VARCHAR(50) NOT NULL CHECK (access_status IN ('success', 'invalid_code', 'expired', 'blocked', 'pending')),
    access_attempts INTEGER DEFAULT 1,
    first_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    location_data JSONB, -- City, country based on IP if available
    referrer_url TEXT,
    is_suspicious BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rsvp_sessions_couple ON rsvp_sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_sessions_guest ON rsvp_sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_sessions_invite_code ON rsvp_sessions(invite_code);
CREATE INDEX IF NOT EXISTS idx_rsvp_sessions_session_token ON rsvp_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_rsvp_sessions_access_status ON rsvp_sessions(access_status);
CREATE INDEX IF NOT EXISTS idx_rsvp_sessions_created_at ON rsvp_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvp_sessions_ip_address ON rsvp_sessions(ip_address);

-- Enable RLS
ALTER TABLE rsvp_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for rsvp_sessions
CREATE POLICY "Users can view their own RSVP sessions"
    ON rsvp_sessions FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "System can create RSVP sessions"
    ON rsvp_sessions FOR INSERT
    WITH CHECK (true); -- Allow public access for RSVP tracking

CREATE POLICY "System can update RSVP sessions"
    ON rsvp_sessions FOR UPDATE
    USING (true); -- Allow updates for session management

-- Function to track RSVP access
CREATE OR REPLACE FUNCTION track_rsvp_access(
    p_invite_code VARCHAR(20),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_browser_info JSONB DEFAULT NULL,
    p_device_type VARCHAR(50) DEFAULT 'unknown',
    p_referrer_url TEXT DEFAULT NULL
)
RETURNS TABLE (
    session_id UUID,
    guest_id UUID,
    access_granted BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_guest wedding_guests%ROWTYPE;
    v_session_id UUID;
    v_existing_session rsvp_sessions%ROWTYPE;
BEGIN
    -- Find guest by invite code
    SELECT * INTO v_guest 
    FROM wedding_guests 
    WHERE invite_code = p_invite_code
    LIMIT 1;
    
    -- Check if guest exists
    IF v_guest.id IS NULL THEN
        -- Track failed attempt
        INSERT INTO rsvp_sessions (
            couple_id,
            invite_code,
            ip_address,
            user_agent,
            browser_info,
            device_type,
            access_status,
            referrer_url
        ) VALUES (
            (SELECT id FROM couples LIMIT 1), -- Fallback couple_id
            p_invite_code,
            p_ip_address,
            p_user_agent,
            p_browser_info,
            p_device_type,
            'invalid_code',
            p_referrer_url
        ) RETURNING id INTO v_session_id;
        
        RETURN QUERY SELECT v_session_id, NULL::UUID, false, 'Invalid invitation code';
        RETURN;
    END IF;
    
    -- Check for existing session from same IP in last hour
    SELECT * INTO v_existing_session
    FROM rsvp_sessions
    WHERE ip_address = p_ip_address
    AND invite_code = p_invite_code
    AND last_accessed_at > NOW() - INTERVAL '1 hour'
    AND access_status = 'success'
    ORDER BY last_accessed_at DESC
    LIMIT 1;
    
    IF v_existing_session.id IS NOT NULL THEN
        -- Update existing session
        UPDATE rsvp_sessions
        SET 
            last_accessed_at = CURRENT_TIMESTAMP,
            access_attempts = access_attempts + 1
        WHERE id = v_existing_session.id;
        
        RETURN QUERY SELECT v_existing_session.id, v_guest.id, true, NULL::TEXT;
    ELSE
        -- Create new session
        INSERT INTO rsvp_sessions (
            couple_id,
            guest_id,
            invite_code,
            session_token,
            ip_address,
            user_agent,
            browser_info,
            device_type,
            access_status,
            referrer_url
        ) VALUES (
            v_guest.couple_id,
            v_guest.id,
            p_invite_code,
            gen_random_uuid()::TEXT,
            p_ip_address,
            p_user_agent,
            p_browser_info,
            p_device_type,
            'success',
            p_referrer_url
        ) RETURNING id INTO v_session_id;
        
        RETURN QUERY SELECT v_session_id, v_guest.id, true, NULL::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get RSVP session analytics
CREATE OR REPLACE FUNCTION get_rsvp_session_analytics(p_couple_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    unique_guests BIGINT,
    successful_sessions BIGINT,
    failed_attempts BIGINT,
    device_breakdown JSONB,
    hourly_activity JSONB,
    geographic_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_sessions,
        COUNT(DISTINCT guest_id)::BIGINT as unique_guests,
        COUNT(CASE WHEN access_status = 'success' THEN 1 END)::BIGINT as successful_sessions,
        COUNT(CASE WHEN access_status != 'success' THEN 1 END)::BIGINT as failed_attempts,
        jsonb_build_object(
            'desktop', COUNT(CASE WHEN device_type = 'desktop' THEN 1 END),
            'mobile', COUNT(CASE WHEN device_type = 'mobile' THEN 1 END),
            'tablet', COUNT(CASE WHEN device_type = 'tablet' THEN 1 END)
        ) as device_breakdown,
        jsonb_agg(DISTINCT 
            jsonb_build_object(
                'hour', EXTRACT(HOUR FROM created_at),
                'count', COUNT(*) OVER (PARTITION BY EXTRACT(HOUR FROM created_at))
            )
        ) as hourly_activity,
        jsonb_agg(DISTINCT location_data) FILTER (WHERE location_data IS NOT NULL) as geographic_data
    FROM rsvp_sessions
    WHERE couple_id = p_couple_id
    AND created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;