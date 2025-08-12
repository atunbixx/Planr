-- @metadata {
--   "author": "Enterprise Migration System",
--   "description": "Add support tables for zero-downtime migration strategies",
--   "breakingChange": false,
--   "estimatedDuration": 1000,
--   "dataVolume": "small",
--   "risk": "low",
--   "tags": ["infrastructure", "zero-downtime"],
--   "dependencies": ["007", "008"]
-- }

-- UP

-- Table for tracking deprecated columns (expand-contract pattern)
CREATE TABLE IF NOT EXISTS _migration_deprecations (
  deprecation_id SERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  deprecated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removal_date TIMESTAMPTZ NOT NULL,
  deprecation_reason TEXT,
  alternative TEXT,
  created_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  
  CONSTRAINT uq_table_column_deprecation UNIQUE (table_name, column_name)
);

CREATE INDEX idx_deprecations_removal_date ON _migration_deprecations(removal_date);
CREATE INDEX idx_deprecations_table ON _migration_deprecations(table_name);

-- Table for tracking progressive migration progress
CREATE TABLE IF NOT EXISTS _migration_progress (
  migration_id VARCHAR(255) PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  batches_completed INTEGER DEFAULT 0,
  rows_affected BIGINT DEFAULT 0,
  current_batch_size INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  error_message TEXT,
  metadata JSONB,
  
  CONSTRAINT chk_progress_status CHECK (
    status IN ('running', 'paused', 'completed', 'failed', 'cancelled')
  )
);

CREATE INDEX idx_progress_status ON _migration_progress(status);
CREATE INDEX idx_progress_started ON _migration_progress(started_at DESC);

-- Table for feature flags to control migration rollout
CREATE TABLE IF NOT EXISTS _migration_feature_flags (
  flag_name VARCHAR(255) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  conditions JSONB,
  metadata JSONB,
  
  CONSTRAINT chk_rollout_percentage CHECK (
    rollout_percentage >= 0 AND rollout_percentage <= 100
  )
);

CREATE INDEX idx_feature_flags_enabled ON _migration_feature_flags(enabled);

-- Table for tracking blue-green deployments
CREATE TABLE IF NOT EXISTS _migration_blue_green (
  deployment_id SERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL,
  blue_table VARCHAR(255) NOT NULL,
  green_table VARCHAR(255) NOT NULL,
  current_active VARCHAR(10) NOT NULL DEFAULT 'blue',
  sync_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sync_started_at TIMESTAMPTZ,
  sync_completed_at TIMESTAMPTZ,
  switch_scheduled_at TIMESTAMPTZ,
  switched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  
  CONSTRAINT chk_active_table CHECK (current_active IN ('blue', 'green')),
  CONSTRAINT chk_sync_status CHECK (
    sync_status IN ('pending', 'syncing', 'synced', 'failed')
  )
);

CREATE INDEX idx_blue_green_table ON _migration_blue_green(table_name);
CREATE INDEX idx_blue_green_status ON _migration_blue_green(sync_status);

-- Table for tracking circuit breaker states
CREATE TABLE IF NOT EXISTS _migration_circuit_breakers (
  breaker_name VARCHAR(255) PRIMARY KEY,
  state VARCHAR(50) NOT NULL DEFAULT 'closed',
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  half_open_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  threshold INTEGER DEFAULT 5,
  timeout_seconds INTEGER DEFAULT 60,
  metadata JSONB,
  
  CONSTRAINT chk_breaker_state CHECK (
    state IN ('closed', 'open', 'half_open')
  )
);

CREATE INDEX idx_circuit_breakers_state ON _migration_circuit_breakers(state);

-- Function to check if a column is safe to drop
CREATE OR REPLACE FUNCTION is_column_safe_to_drop(
  p_table_name VARCHAR,
  p_column_name VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  v_deprecation_date TIMESTAMPTZ;
  v_days_deprecated INTEGER;
BEGIN
  -- Check if column is marked as deprecated
  SELECT deprecated_at INTO v_deprecation_date
  FROM _migration_deprecations
  WHERE table_name = p_table_name
  AND column_name = p_column_name;
  
  IF v_deprecation_date IS NULL THEN
    RETURN FALSE; -- Not deprecated, not safe to drop
  END IF;
  
  -- Calculate days since deprecation
  v_days_deprecated := EXTRACT(DAY FROM NOW() - v_deprecation_date);
  
  -- Safe to drop after 30 days
  RETURN v_days_deprecated >= 30;
END;
$$ LANGUAGE plpgsql;

-- Function to manage feature flag rollout
CREATE OR REPLACE FUNCTION check_feature_flag(
  p_flag_name VARCHAR,
  p_user_id VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
  v_percentage INTEGER;
  v_hash INTEGER;
BEGIN
  -- Get flag configuration
  SELECT enabled, rollout_percentage 
  INTO v_enabled, v_percentage
  FROM _migration_feature_flags
  WHERE flag_name = p_flag_name;
  
  -- Flag doesn't exist or is disabled
  IF NOT FOUND OR NOT v_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- 100% rollout
  IF v_percentage >= 100 THEN
    RETURN TRUE;
  END IF;
  
  -- 0% rollout
  IF v_percentage <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Percentage-based rollout using consistent hashing
  IF p_user_id IS NOT NULL THEN
    v_hash := abs(hashtext(p_flag_name || ':' || p_user_id)) % 100;
    RETURN v_hash < v_percentage;
  ELSE
    -- Random rollout if no user ID
    RETURN random() * 100 < v_percentage;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to manage circuit breaker
CREATE OR REPLACE FUNCTION update_circuit_breaker(
  p_breaker_name VARCHAR,
  p_success BOOLEAN
) RETURNS VARCHAR AS $$
DECLARE
  v_current_state VARCHAR;
  v_failure_count INTEGER;
  v_threshold INTEGER;
  v_timeout_seconds INTEGER;
  v_opened_at TIMESTAMPTZ;
BEGIN
  -- Get current breaker state
  SELECT state, failure_count, threshold, timeout_seconds, opened_at
  INTO v_current_state, v_failure_count, v_threshold, v_timeout_seconds, v_opened_at
  FROM _migration_circuit_breakers
  WHERE breaker_name = p_breaker_name;
  
  -- Initialize if not exists
  IF NOT FOUND THEN
    INSERT INTO _migration_circuit_breakers (breaker_name)
    VALUES (p_breaker_name)
    RETURNING state INTO v_current_state;
    
    v_failure_count := 0;
    v_threshold := 5;
    v_timeout_seconds := 60;
  END IF;
  
  -- Handle based on current state
  CASE v_current_state
    WHEN 'closed' THEN
      IF p_success THEN
        -- Reset failure count on success
        UPDATE _migration_circuit_breakers
        SET failure_count = 0
        WHERE breaker_name = p_breaker_name;
      ELSE
        -- Increment failure count
        v_failure_count := v_failure_count + 1;
        
        -- Open breaker if threshold reached
        IF v_failure_count >= v_threshold THEN
          UPDATE _migration_circuit_breakers
          SET 
            state = 'open',
            failure_count = v_failure_count,
            last_failure_at = NOW(),
            opened_at = NOW(),
            half_open_at = NOW() + (v_timeout_seconds || ' seconds')::INTERVAL
          WHERE breaker_name = p_breaker_name;
          
          RETURN 'open';
        ELSE
          UPDATE _migration_circuit_breakers
          SET 
            failure_count = v_failure_count,
            last_failure_at = NOW()
          WHERE breaker_name = p_breaker_name;
        END IF;
      END IF;
      
    WHEN 'open' THEN
      -- Check if timeout expired
      IF NOW() >= v_opened_at + (v_timeout_seconds || ' seconds')::INTERVAL THEN
        UPDATE _migration_circuit_breakers
        SET state = 'half_open'
        WHERE breaker_name = p_breaker_name;
        
        RETURN 'half_open';
      END IF;
      
    WHEN 'half_open' THEN
      IF p_success THEN
        -- Close breaker on success
        UPDATE _migration_circuit_breakers
        SET 
          state = 'closed',
          failure_count = 0,
          closed_at = NOW()
        WHERE breaker_name = p_breaker_name;
        
        RETURN 'closed';
      ELSE
        -- Re-open on failure
        UPDATE _migration_circuit_breakers
        SET 
          state = 'open',
          failure_count = v_failure_count + 1,
          last_failure_at = NOW(),
          opened_at = NOW(),
          half_open_at = NOW() + (v_timeout_seconds || ' seconds')::INTERVAL
        WHERE breaker_name = p_breaker_name;
        
        RETURN 'open';
      END IF;
  END CASE;
  
  RETURN v_current_state;
END;
$$ LANGUAGE plpgsql;

-- View for monitoring zero-downtime migrations
CREATE OR REPLACE VIEW v_zero_downtime_status AS
SELECT 
  'Deprecations' as category,
  COUNT(*) as total,
  COUNT(CASE WHEN removal_date < NOW() + INTERVAL '7 days' THEN 1 END) as urgent,
  COUNT(CASE WHEN removal_date < NOW() THEN 1 END) as overdue
FROM _migration_deprecations
UNION ALL
SELECT 
  'Progressive Migrations',
  COUNT(*),
  COUNT(CASE WHEN status = 'running' AND last_updated < NOW() - INTERVAL '1 hour' THEN 1 END),
  COUNT(CASE WHEN status = 'failed' THEN 1 END)
FROM _migration_progress
UNION ALL
SELECT 
  'Feature Flags',
  COUNT(*),
  COUNT(CASE WHEN enabled = true AND rollout_percentage < 100 THEN 1 END),
  COUNT(CASE WHEN enabled = false THEN 1 END)
FROM _migration_feature_flags
UNION ALL
SELECT 
  'Blue-Green Deployments',
  COUNT(*),
  COUNT(CASE WHEN sync_status = 'syncing' THEN 1 END),
  COUNT(CASE WHEN sync_status = 'failed' THEN 1 END)
FROM _migration_blue_green
UNION ALL
SELECT 
  'Circuit Breakers',
  COUNT(*),
  COUNT(CASE WHEN state = 'half_open' THEN 1 END),
  COUNT(CASE WHEN state = 'open' THEN 1 END)
FROM _migration_circuit_breakers;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON _migration_deprecations TO service_role;
GRANT SELECT, INSERT, UPDATE ON _migration_progress TO service_role;
GRANT SELECT, INSERT, UPDATE ON _migration_feature_flags TO service_role;
GRANT SELECT, INSERT, UPDATE ON _migration_blue_green TO service_role;
GRANT SELECT, INSERT, UPDATE ON _migration_circuit_breakers TO service_role;
GRANT EXECUTE ON FUNCTION is_column_safe_to_drop(VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION check_feature_flag(VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION update_circuit_breaker(VARCHAR, BOOLEAN) TO service_role;

-- DOWN

-- Drop views
DROP VIEW IF EXISTS v_zero_downtime_status;

-- Drop functions
DROP FUNCTION IF EXISTS is_column_safe_to_drop(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS check_feature_flag(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS update_circuit_breaker(VARCHAR, BOOLEAN);

-- Drop tables
DROP TABLE IF EXISTS _migration_circuit_breakers;
DROP TABLE IF EXISTS _migration_blue_green;
DROP TABLE IF EXISTS _migration_feature_flags;
DROP TABLE IF EXISTS _migration_progress;
DROP TABLE IF EXISTS _migration_deprecations;