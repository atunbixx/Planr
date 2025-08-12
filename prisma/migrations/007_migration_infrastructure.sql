-- @metadata {
--   "author": "Enterprise Migration System",
--   "description": "Create infrastructure tables for enterprise-grade migration management",
--   "breakingChange": false,
--   "estimatedDuration": 1000,
--   "dataVolume": "small",
--   "risk": "low",
--   "tags": ["infrastructure", "migrations", "enterprise"]
-- }

-- UP

-- Migration history table with enhanced tracking
CREATE TABLE IF NOT EXISTS _migration_history (
  migration_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  duration_ms BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  rows_affected INTEGER,
  rolled_back_at TIMESTAMPTZ,
  rollback_duration_ms BIGINT,
  metadata JSONB,
  error_message TEXT,
  environment VARCHAR(50) DEFAULT 'production',
  
  CONSTRAINT chk_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  CONSTRAINT chk_environment CHECK (environment IN ('development', 'staging', 'production', 'test'))
);

-- Create indexes for performance
CREATE INDEX idx_migration_history_applied_at ON _migration_history(applied_at DESC);
CREATE INDEX idx_migration_history_status ON _migration_history(status);
CREATE INDEX idx_migration_history_environment ON _migration_history(environment);

-- Migration rollback history
CREATE TABLE IF NOT EXISTS _migration_rollback_history (
  rollback_id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) NOT NULL REFERENCES _migration_history(migration_id),
  rolled_back_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rolled_back_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  reason TEXT,
  duration_ms BIGINT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX idx_rollback_history_migration_id ON _migration_rollback_history(migration_id);
CREATE INDEX idx_rollback_history_rolled_back_at ON _migration_rollback_history(rolled_back_at DESC);

-- Migration locks for preventing concurrent migrations
CREATE TABLE IF NOT EXISTS _migration_locks (
  lock_name VARCHAR(255) PRIMARY KEY,
  lock_id UUID NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acquired_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  hostname VARCHAR(255) NOT NULL,
  pid INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB
);

CREATE INDEX idx_migration_locks_expires_at ON _migration_locks(expires_at);

-- Backup history for pre-migration backups
CREATE TABLE IF NOT EXISTS _backup_history (
  backup_id VARCHAR(64) PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  type VARCHAR(50) NOT NULL,
  compressed BOOLEAN NOT NULL DEFAULT false,
  encrypted BOOLEAN NOT NULL DEFAULT false,
  retention_days INTEGER,
  metadata JSONB,
  
  CONSTRAINT chk_backup_type CHECK (type IN ('full', 'incremental', 'pre-migration', 'scheduled', 'critical'))
);

CREATE INDEX idx_backup_history_created_at ON _backup_history(created_at DESC);
CREATE INDEX idx_backup_history_type ON _backup_history(type);

-- Backup restoration history
CREATE TABLE IF NOT EXISTS _backup_restoration_history (
  restoration_id SERIAL PRIMARY KEY,
  backup_id VARCHAR(64) NOT NULL REFERENCES _backup_history(backup_id),
  restored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restored_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  target_database VARCHAR(255),
  duration_ms BIGINT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX idx_restoration_history_backup_id ON _backup_restoration_history(backup_id);
CREATE INDEX idx_restoration_history_restored_at ON _backup_restoration_history(restored_at DESC);

-- Migration performance metrics
CREATE TABLE IF NOT EXISTS _migration_performance_metrics (
  metric_id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) NOT NULL REFERENCES _migration_history(migration_id),
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit VARCHAR(50),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_performance_metrics_migration_id ON _migration_performance_metrics(migration_id);
CREATE INDEX idx_performance_metrics_recorded_at ON _migration_performance_metrics(recorded_at DESC);

-- Migration audit log for compliance
CREATE TABLE IF NOT EXISTS _migration_audit_log (
  audit_id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) REFERENCES _migration_history(migration_id),
  action VARCHAR(100) NOT NULL,
  actor VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  
  CONSTRAINT chk_action CHECK (action IN (
    'migration_started', 'migration_completed', 'migration_failed',
    'rollback_started', 'rollback_completed', 'rollback_failed',
    'backup_created', 'backup_restored', 'lock_acquired', 'lock_released'
  ))
);

CREATE INDEX idx_audit_log_migration_id ON _migration_audit_log(migration_id);
CREATE INDEX idx_audit_log_timestamp ON _migration_audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_action ON _migration_audit_log(action);

-- Create function to automatically log audit events
CREATE OR REPLACE FUNCTION log_migration_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO _migration_audit_log (migration_id, action, details)
  VALUES (
    NEW.migration_id,
    CASE 
      WHEN TG_TABLE_NAME = '_migration_history' THEN
        CASE NEW.status
          WHEN 'in_progress' THEN 'migration_started'
          WHEN 'completed' THEN 'migration_completed'
          WHEN 'failed' THEN 'migration_failed'
          WHEN 'rolled_back' THEN 'rollback_completed'
        END
      WHEN TG_TABLE_NAME = '_backup_history' THEN 'backup_created'
      WHEN TG_TABLE_NAME = '_backup_restoration_history' THEN 'backup_restored'
    END,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'new_data', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit logging
CREATE TRIGGER migration_history_audit
AFTER INSERT OR UPDATE ON _migration_history
FOR EACH ROW EXECUTE FUNCTION log_migration_audit_event();

CREATE TRIGGER backup_history_audit
AFTER INSERT ON _backup_history
FOR EACH ROW EXECUTE FUNCTION log_migration_audit_event();

-- Create view for migration status dashboard
CREATE OR REPLACE VIEW v_migration_status AS
SELECT 
  h.migration_id,
  h.name,
  h.status,
  h.applied_at,
  h.duration_ms,
  h.rows_affected,
  h.environment,
  COALESCE(r.rollback_count, 0) as rollback_attempts,
  b.backup_id as pre_migration_backup,
  h.metadata->>'risk' as risk_level,
  h.metadata->>'author' as author
FROM _migration_history h
LEFT JOIN (
  SELECT migration_id, COUNT(*) as rollback_count
  FROM _migration_rollback_history
  GROUP BY migration_id
) r ON h.migration_id = r.migration_id
LEFT JOIN _backup_history b ON b.created_at = (
  SELECT MAX(created_at) 
  FROM _backup_history 
  WHERE type = 'pre-migration' 
  AND created_at < h.applied_at
);

-- Create function to check migration dependencies
CREATE OR REPLACE FUNCTION check_migration_dependencies(p_migration_id VARCHAR)
RETURNS TABLE(
  dependency_id VARCHAR,
  dependency_name VARCHAR,
  is_satisfied BOOLEAN
) AS $$
BEGIN
  -- This would be implemented based on your specific dependency tracking
  -- For now, returning empty result set
  RETURN QUERY
  SELECT NULL::VARCHAR, NULL::VARCHAR, NULL::BOOLEAN
  WHERE FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function for migration health check
CREATE OR REPLACE FUNCTION migration_health_check()
RETURNS TABLE(
  check_name VARCHAR,
  status VARCHAR,
  details JSONB
) AS $$
BEGIN
  RETURN QUERY
  -- Check for stuck migrations
  SELECT 
    'stuck_migrations'::VARCHAR,
    CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'ok' END::VARCHAR,
    jsonb_build_object('count', COUNT(*), 'migrations', array_agg(migration_id))::JSONB
  FROM _migration_history
  WHERE status = 'in_progress'
  AND applied_at < NOW() - INTERVAL '1 hour'
  
  UNION ALL
  
  -- Check for expired locks
  SELECT 
    'expired_locks'::VARCHAR,
    CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'ok' END::VARCHAR,
    jsonb_build_object('count', COUNT(*), 'locks', array_agg(lock_name))::JSONB
  FROM _migration_locks
  WHERE expires_at < NOW()
  
  UNION ALL
  
  -- Check backup age
  SELECT 
    'backup_age'::VARCHAR,
    CASE 
      WHEN MAX(created_at) < NOW() - INTERVAL '7 days' THEN 'warning'
      ELSE 'ok' 
    END::VARCHAR,
    jsonb_build_object(
      'last_backup', MAX(created_at),
      'age_days', EXTRACT(DAY FROM NOW() - MAX(created_at))
    )::JSONB
  FROM _backup_history
  WHERE type IN ('full', 'scheduled');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON _migration_history TO service_role;
GRANT INSERT, UPDATE, DELETE ON _migration_locks TO service_role;
GRANT INSERT ON _backup_history TO service_role;
GRANT INSERT ON _migration_rollback_history TO service_role;
GRANT INSERT ON _migration_audit_log TO service_role;
GRANT INSERT ON _migration_performance_metrics TO service_role;

-- DOWN

-- Drop triggers
DROP TRIGGER IF EXISTS migration_history_audit ON _migration_history;
DROP TRIGGER IF EXISTS backup_history_audit ON _backup_history;

-- Drop functions
DROP FUNCTION IF EXISTS log_migration_audit_event();
DROP FUNCTION IF EXISTS check_migration_dependencies(VARCHAR);
DROP FUNCTION IF EXISTS migration_health_check();

-- Drop views
DROP VIEW IF EXISTS v_migration_status;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS _migration_audit_log;
DROP TABLE IF EXISTS _migration_performance_metrics;
DROP TABLE IF EXISTS _backup_restoration_history;
DROP TABLE IF EXISTS _backup_history;
DROP TABLE IF EXISTS _migration_locks;
DROP TABLE IF EXISTS _migration_rollback_history;
DROP TABLE IF EXISTS _migration_history;