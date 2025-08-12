-- Create RSVP security tables for rate limiting and IP blocking
-- Migration: 20240807_rsvp_security_tables

-- Table for tracking RSVP rate limits per IP address
CREATE TABLE IF NOT EXISTS rsvp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  invitation_code VARCHAR(50),
  attempt_count INTEGER DEFAULT 0,
  first_attempt_at TIMESTAMPTZ DEFAULT now(),
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for IP blocklist
CREATE TABLE IF NOT EXISTS rsvp_ip_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason VARCHAR(255) NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ, -- NULL for permanent blocks
  created_by VARCHAR(100), -- system, admin, or user ID
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for security audit logging
CREATE TABLE IF NOT EXISTS rsvp_security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  invitation_code VARCHAR(50),
  event_type VARCHAR(50) NOT NULL, -- rate_limit_exceeded, blocked_access, suspicious_activity
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  user_agent TEXT,
  request_headers JSONB,
  request_path VARCHAR(255),
  response_status INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rsvp_rate_limits_ip_address ON rsvp_rate_limits (ip_address);
CREATE INDEX IF NOT EXISTS idx_rsvp_rate_limits_invitation_code ON rsvp_rate_limits (invitation_code);
CREATE INDEX IF NOT EXISTS idx_rsvp_rate_limits_window_start ON rsvp_rate_limits (window_start);
CREATE INDEX IF NOT EXISTS idx_rsvp_rate_limits_last_attempt ON rsvp_rate_limits (last_attempt_at);

CREATE INDEX IF NOT EXISTS idx_rsvp_ip_blocklist_ip_address ON rsvp_ip_blocklist (ip_address);
CREATE INDEX IF NOT EXISTS idx_rsvp_ip_blocklist_blocked_until ON rsvp_ip_blocklist (blocked_until);

CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_ip_address ON rsvp_security_audit (ip_address);
CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_event_type ON rsvp_security_audit (event_type);
CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_created_at ON rsvp_security_audit (created_at);
CREATE INDEX IF NOT EXISTS idx_rsvp_security_audit_invitation_code ON rsvp_security_audit (invitation_code);

-- Row Level Security (RLS)
ALTER TABLE rsvp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_ip_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_security_audit ENABLE ROW LEVEL SECURITY;

-- Admin/system access policies
CREATE POLICY "Admin can access all rate limits" ON rsvp_rate_limits
  FOR ALL USING (true); -- Will be restricted to admin users in application layer

CREATE POLICY "Admin can access all IP blocklist" ON rsvp_ip_blocklist
  FOR ALL USING (true); -- Will be restricted to admin users in application layer

CREATE POLICY "Admin can access all security audit" ON rsvp_security_audit
  FOR ALL USING (true); -- Will be restricted to admin users in application layer

-- Functions for rate limiting
CREATE OR REPLACE FUNCTION check_rsvp_rate_limit(
  p_ip_address INET,
  p_invitation_code VARCHAR(50) DEFAULT NULL,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS JSONB AS $$
DECLARE
  current_time TIMESTAMPTZ := now();
  window_start TIMESTAMPTZ := current_time - INTERVAL '1 minute' * p_window_minutes;
  rate_limit_record RECORD;
  attempt_count INTEGER;
  is_blocked BOOLEAN := false;
  result JSONB;
BEGIN
  -- Check if IP is in blocklist
  SELECT EXISTS(
    SELECT 1 FROM rsvp_ip_blocklist 
    WHERE ip_address = p_ip_address 
    AND (blocked_until IS NULL OR blocked_until > current_time)
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_blocked',
      'retry_after', null,
      'attempts_remaining', 0
    );
  END IF;
  
  -- Get or create rate limit record
  SELECT * INTO rate_limit_record 
  FROM rsvp_rate_limits 
  WHERE ip_address = p_ip_address 
  AND (p_invitation_code IS NULL OR invitation_code = p_invitation_code)
  AND window_start >= window_start
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF rate_limit_record IS NULL THEN
    -- Create new rate limit record
    INSERT INTO rsvp_rate_limits (ip_address, invitation_code, attempt_count, window_start)
    VALUES (p_ip_address, p_invitation_code, 1, current_time)
    RETURNING * INTO rate_limit_record;
    
    attempt_count := 1;
  ELSE
    -- Update existing record
    attempt_count := rate_limit_record.attempt_count + 1;
    
    UPDATE rsvp_rate_limits 
    SET attempt_count = attempt_count,
        last_attempt_at = current_time,
        updated_at = current_time
    WHERE id = rate_limit_record.id;
  END IF;
  
  -- Check if limit exceeded
  IF attempt_count > p_max_attempts THEN
    -- Log security event
    INSERT INTO rsvp_security_audit (ip_address, invitation_code, event_type, severity, details)
    VALUES (p_ip_address, p_invitation_code, 'rate_limit_exceeded', 'high', 
            jsonb_build_object('attempt_count', attempt_count, 'max_attempts', p_max_attempts));
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'retry_after', window_start + INTERVAL '1 minute' * p_window_minutes,
      'attempts_remaining', 0
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', null,
    'retry_after', null,
    'attempts_remaining', p_max_attempts - attempt_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add IP to blocklist
CREATE OR REPLACE FUNCTION add_ip_to_blocklist(
  p_ip_address INET,
  p_reason VARCHAR(255),
  p_duration_hours INTEGER DEFAULT NULL,
  p_created_by VARCHAR(100) DEFAULT 'system'
) RETURNS UUID AS $$
DECLARE
  blocked_until TIMESTAMPTZ := NULL;
  new_id UUID;
BEGIN
  IF p_duration_hours IS NOT NULL THEN
    blocked_until := now() + INTERVAL '1 hour' * p_duration_hours;
  END IF;
  
  INSERT INTO rsvp_ip_blocklist (ip_address, reason, blocked_until, created_by)
  VALUES (p_ip_address, p_reason, blocked_until, p_created_by)
  ON CONFLICT (ip_address) DO UPDATE SET
    reason = EXCLUDED.reason,
    blocked_until = EXCLUDED.blocked_until,
    updated_at = now()
  RETURNING id INTO new_id;
  
  -- Log security event
  INSERT INTO rsvp_security_audit (ip_address, event_type, severity, details)
  VALUES (p_ip_address, 'ip_blocked', 'critical', 
          jsonb_build_object('reason', p_reason, 'duration_hours', p_duration_hours));
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rsvp_rate_limits(
  p_hours_old INTEGER DEFAULT 24
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rsvp_rate_limits 
  WHERE created_at < now() - INTERVAL '1 hour' * p_hours_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;