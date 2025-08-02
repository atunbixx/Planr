-- RSVP Security Audit Tables
-- Comprehensive tracking for security events and suspicious activities

-- Security audit log for RSVP system
CREATE TABLE IF NOT EXISTS rsvp_security_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES wedding_guests(id) ON DELETE SET NULL,
    session_id UUID REFERENCES rsvp_sessions(id) ON DELETE SET NULL,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
        'invalid_code_attempt', 'multiple_failed_attempts', 'rate_limit_exceeded',
        'suspicious_pattern', 'blocked_ip', 'session_hijack_attempt',
        'data_tampering', 'sql_injection_attempt', 'xss_attempt',
        'unauthorized_access', 'brute_force_attempt', 'geo_anomaly',
        'time_anomaly', 'device_anomaly', 'successful_access'
    )),
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    request_params JSONB,
    request_headers JSONB,
    
    -- Security context
    threat_score DECIMAL(3,2) CHECK (threat_score >= 0 AND threat_score <= 1),
    risk_factors TEXT[],
    detection_method VARCHAR(50), -- rule-based, ml-based, manual
    
    -- Response actions
    action_taken VARCHAR(50) CHECK (action_taken IN (
        'none', 'logged', 'rate_limited', 'blocked', 'captcha_required',
        'admin_notified', 'ip_banned', 'session_terminated'
    )),
    block_duration_minutes INTEGER,
    
    -- Geographic and device info
    geo_location JSONB, -- country, region, city
    device_fingerprint TEXT,
    is_vpn_detected BOOLEAN DEFAULT false,
    is_tor_detected BOOLEAN DEFAULT false,
    
    -- Additional context
    error_message TEXT,
    stack_trace TEXT,
    related_events UUID[], -- Array of related security event IDs
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT
);

-- IP blocklist table
CREATE TABLE IF NOT EXISTS rsvp_ip_blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    ip_range_start INET,
    ip_range_end INET,
    
    -- Block details
    block_type VARCHAR(50) NOT NULL CHECK (block_type IN ('temporary', 'permanent', 'rate_limit')),
    block_reason TEXT NOT NULL,
    threat_level VARCHAR(20) CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Related events
    related_security_events UUID[],
    failed_attempts_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    
    -- Block duration
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    added_by VARCHAR(50) DEFAULT 'system', -- system, admin, manual
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rsvp_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
    identifier_type VARCHAR(50) NOT NULL CHECK (identifier_type IN ('ip', 'session', 'invite_code', 'user_agent')),
    identifier_value TEXT NOT NULL,
    
    -- Rate limit tracking
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    window_duration_seconds INTEGER DEFAULT 3600, -- 1 hour default
    request_count INTEGER DEFAULT 1,
    max_requests INTEGER DEFAULT 100,
    
    -- Actions when exceeded
    exceeded_count INTEGER DEFAULT 0,
    last_exceeded_at TIMESTAMP WITH TIME ZONE,
    is_blocked BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint for identifier
    UNIQUE(couple_id, identifier_type, identifier_value, window_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_couple ON rsvp_security_audit(couple_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_event ON rsvp_security_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_severity ON rsvp_security_audit(severity_level);
CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_ip ON rsvp_security_audit(ip_address);
CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_created ON rsvp_security_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvp_ip_blocklist_ip ON rsvp_ip_blocklist(ip_address);
CREATE INDEX IF NOT EXISTS idx_rsvp_ip_blocklist_active ON rsvp_ip_blocklist(is_active);
CREATE INDEX IF NOT EXISTS idx_rsvp_rate_limits_identifier ON rsvp_rate_limits(identifier_type, identifier_value);

-- Enable RLS
ALTER TABLE rsvp_security_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_ip_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own security audit"
    ON rsvp_security_audit FOR SELECT
    USING (couple_id IN (
        SELECT id FROM couples 
        WHERE partner1_user_id = auth.uid() 
        OR partner2_user_id = auth.uid()
    ));

CREATE POLICY "System can create security audit entries"
    ON rsvp_security_audit FOR INSERT
    WITH CHECK (true);

-- Function to log security event
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(100),
    p_severity VARCHAR(20),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_couple_id UUID DEFAULT NULL,
    p_guest_id UUID DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_risk_factors TEXT[] DEFAULT NULL,
    p_action VARCHAR(50) DEFAULT 'logged'
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
    v_threat_score DECIMAL(3,2);
BEGIN
    -- Calculate threat score based on severity and risk factors
    v_threat_score := CASE p_severity
        WHEN 'critical' THEN 0.9
        WHEN 'high' THEN 0.7
        WHEN 'medium' THEN 0.4
        WHEN 'low' THEN 0.2
        ELSE 0.1
    END;
    
    -- Adjust score based on risk factors
    IF p_risk_factors IS NOT NULL THEN
        v_threat_score := LEAST(1.0, v_threat_score + (array_length(p_risk_factors, 1) * 0.1));
    END IF;
    
    -- Insert security event
    INSERT INTO rsvp_security_audit (
        couple_id,
        guest_id,
        session_id,
        event_type,
        severity_level,
        ip_address,
        user_agent,
        threat_score,
        risk_factors,
        action_taken
    ) VALUES (
        p_couple_id,
        p_guest_id,
        p_session_id,
        p_event_type,
        p_severity,
        p_ip_address,
        p_user_agent,
        v_threat_score,
        p_risk_factors,
        p_action
    ) RETURNING id INTO v_event_id;
    
    -- Check if IP should be blocked
    IF p_severity IN ('high', 'critical') AND p_ip_address IS NOT NULL THEN
        PERFORM check_and_block_ip(p_ip_address, p_couple_id, p_event_type);
    END IF;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and potentially block IP
CREATE OR REPLACE FUNCTION check_and_block_ip(
    p_ip_address INET,
    p_couple_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_recent_events_count INTEGER;
    v_is_blocked BOOLEAN := false;
BEGIN
    -- Count recent security events from this IP
    SELECT COUNT(*) INTO v_recent_events_count
    FROM rsvp_security_audit
    WHERE ip_address = p_ip_address
    AND created_at > NOW() - INTERVAL '1 hour'
    AND severity_level IN ('high', 'critical');
    
    -- Block if too many high-severity events
    IF v_recent_events_count >= 3 THEN
        -- Check if already blocked
        SELECT EXISTS(
            SELECT 1 FROM rsvp_ip_blocklist
            WHERE ip_address = p_ip_address
            AND is_active = true
        ) INTO v_is_blocked;
        
        IF NOT v_is_blocked THEN
            INSERT INTO rsvp_ip_blocklist (
                couple_id,
                ip_address,
                block_type,
                block_reason,
                threat_level,
                expires_at
            ) VALUES (
                p_couple_id,
                p_ip_address,
                'temporary',
                p_reason || ' - Multiple security events detected',
                'high',
                NOW() + INTERVAL '24 hours'
            );
            
            v_is_blocked := true;
        END IF;
    END IF;
    
    RETURN v_is_blocked;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier_type VARCHAR(50),
    p_identifier_value TEXT,
    p_couple_id UUID DEFAULT NULL,
    p_max_requests INTEGER DEFAULT 100
)
RETURNS TABLE (
    is_allowed BOOLEAN,
    current_count INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_current_count INTEGER;
    v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Define window start (current hour)
    v_window_start := date_trunc('hour', NOW());
    
    -- Get or create rate limit record
    INSERT INTO rsvp_rate_limits (
        couple_id,
        identifier_type,
        identifier_value,
        window_start,
        request_count,
        max_requests
    ) VALUES (
        p_couple_id,
        p_identifier_type,
        p_identifier_value,
        v_window_start,
        1,
        p_max_requests
    )
    ON CONFLICT (couple_id, identifier_type, identifier_value, window_start)
    DO UPDATE SET 
        request_count = rsvp_rate_limits.request_count + 1,
        updated_at = CURRENT_TIMESTAMP
    RETURNING request_count INTO v_current_count;
    
    -- Check if exceeded
    IF v_current_count > p_max_requests THEN
        -- Log rate limit exceeded
        PERFORM log_security_event(
            'rate_limit_exceeded',
            'medium',
            p_identifier_value::INET,
            NULL,
            p_couple_id,
            NULL,
            NULL,
            ARRAY['rate_limit_exceeded', p_identifier_type],
            'rate_limited'
        );
    END IF;
    
    RETURN QUERY SELECT 
        v_current_count <= p_max_requests,
        v_current_count,
        v_window_start + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to get security dashboard data
CREATE OR REPLACE FUNCTION get_security_dashboard(p_couple_id UUID)
RETURNS TABLE (
    metric_name VARCHAR(100),
    metric_value BIGINT,
    metric_detail JSONB
) AS $$
BEGIN
    RETURN QUERY
    -- Total security events
    SELECT 
        'total_security_events'::VARCHAR(100),
        COUNT(*)::BIGINT,
        jsonb_build_object(
            'last_24h', COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END),
            'last_7d', COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END)
        )
    FROM rsvp_security_audit
    WHERE couple_id = p_couple_id
    
    UNION ALL
    
    -- Blocked IPs
    SELECT 
        'blocked_ips'::VARCHAR(100),
        COUNT(*)::BIGINT,
        jsonb_build_object(
            'active', COUNT(CASE WHEN is_active THEN 1 END),
            'permanent', COUNT(CASE WHEN block_type = 'permanent' THEN 1 END)
        )
    FROM rsvp_ip_blocklist
    WHERE couple_id = p_couple_id
    
    UNION ALL
    
    -- High severity events
    SELECT 
        'high_severity_events'::VARCHAR(100),
        COUNT(*)::BIGINT,
        jsonb_build_object(
            'critical', COUNT(CASE WHEN severity_level = 'critical' THEN 1 END),
            'high', COUNT(CASE WHEN severity_level = 'high' THEN 1 END)
        )
    FROM rsvp_security_audit
    WHERE couple_id = p_couple_id
    AND severity_level IN ('high', 'critical')
    AND created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;