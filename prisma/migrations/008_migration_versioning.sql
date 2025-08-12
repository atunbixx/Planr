-- @metadata {
--   "author": "Enterprise Migration System",
--   "description": "Add version tracking and release management for migrations",
--   "breakingChange": false,
--   "estimatedDuration": 500,
--   "dataVolume": "small",
--   "risk": "low",
--   "tags": ["infrastructure", "versioning"],
--   "dependencies": ["007"]
-- }

-- UP

-- Migration version tracking
CREATE TABLE IF NOT EXISTS _migration_versions (
  id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) NOT NULL REFERENCES _migration_history(migration_id),
  version VARCHAR(100) NOT NULL UNIQUE,
  checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  metadata JSONB,
  
  CONSTRAINT chk_version_format CHECK (
    version ~ '^[0-9]+\.[0-9]+\.[0-9]+' OR  -- Semantic versioning
    version ~ '^[0-9]{14}' OR                 -- Timestamp versioning
    version ~ '^[a-z]+_[0-9]+'               -- Prefixed versioning
  )
);

CREATE INDEX idx_migration_versions_version ON _migration_versions(version);
CREATE INDEX idx_migration_versions_applied_at ON _migration_versions(applied_at DESC);
CREATE INDEX idx_migration_versions_tags ON _migration_versions USING gin ((metadata->'tags'));

-- Migration releases for grouping related migrations
CREATE TABLE IF NOT EXISTS _migration_releases (
  release_id SERIAL PRIMARY KEY,
  version VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  deployed_at TIMESTAMPTZ,
  deployed_by VARCHAR(255),
  environment VARCHAR(50),
  rollback_version VARCHAR(100),
  metadata JSONB,
  
  CONSTRAINT fk_rollback_version FOREIGN KEY (rollback_version) 
    REFERENCES _migration_versions(version) ON DELETE SET NULL
);

CREATE INDEX idx_releases_version ON _migration_releases(version);
CREATE INDEX idx_releases_created_at ON _migration_releases(created_at DESC);
CREATE INDEX idx_releases_deployed_at ON _migration_releases(deployed_at DESC);

-- Migration dependencies tracking
CREATE TABLE IF NOT EXISTS _migration_dependencies (
  dependency_id SERIAL PRIMARY KEY,
  migration_id VARCHAR(255) NOT NULL REFERENCES _migration_history(migration_id),
  depends_on_id VARCHAR(255) NOT NULL REFERENCES _migration_history(migration_id),
  dependency_type VARCHAR(50) NOT NULL DEFAULT 'required',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_no_self_dependency CHECK (migration_id != depends_on_id),
  CONSTRAINT chk_dependency_type CHECK (
    dependency_type IN ('required', 'optional', 'recommended')
  ),
  CONSTRAINT uq_migration_dependency UNIQUE (migration_id, depends_on_id)
);

CREATE INDEX idx_dependencies_migration_id ON _migration_dependencies(migration_id);
CREATE INDEX idx_dependencies_depends_on_id ON _migration_dependencies(depends_on_id);

-- Migration changelog for tracking changes between versions
CREATE TABLE IF NOT EXISTS _migration_changelog (
  changelog_id SERIAL PRIMARY KEY,
  version_from VARCHAR(100) REFERENCES _migration_versions(version),
  version_to VARCHAR(100) NOT NULL REFERENCES _migration_versions(version),
  change_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  breaking_change BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL DEFAULT CURRENT_USER,
  
  CONSTRAINT chk_change_type CHECK (
    change_type IN ('feature', 'fix', 'enhancement', 'security', 'performance', 'deprecation')
  )
);

CREATE INDEX idx_changelog_version_to ON _migration_changelog(version_to);
CREATE INDEX idx_changelog_created_at ON _migration_changelog(created_at DESC);

-- Create function to generate next version
CREATE OR REPLACE FUNCTION get_next_migration_version(
  p_version_type VARCHAR DEFAULT 'patch',
  p_breaking BOOLEAN DEFAULT false
) RETURNS VARCHAR AS $$
DECLARE
  v_current_version VARCHAR;
  v_major INT;
  v_minor INT;
  v_patch INT;
  v_next_version VARCHAR;
BEGIN
  -- Get current version
  SELECT version INTO v_current_version
  FROM _migration_versions
  ORDER BY applied_at DESC
  LIMIT 1;
  
  -- If no version exists, start with 1.0.0
  IF v_current_version IS NULL THEN
    RETURN '1.0.0';
  END IF;
  
  -- Parse semantic version (assuming format X.Y.Z)
  IF v_current_version ~ '^[0-9]+\.[0-9]+\.[0-9]+' THEN
    v_major := CAST(SPLIT_PART(v_current_version, '.', 1) AS INT);
    v_minor := CAST(SPLIT_PART(v_current_version, '.', 2) AS INT);
    v_patch := CAST(SPLIT_PART(v_current_version, '.', 3) AS INT);
    
    -- Increment based on type
    IF p_breaking OR p_version_type = 'major' THEN
      v_major := v_major + 1;
      v_minor := 0;
      v_patch := 0;
    ELSIF p_version_type = 'minor' THEN
      v_minor := v_minor + 1;
      v_patch := 0;
    ELSE -- patch
      v_patch := v_patch + 1;
    END IF;
    
    v_next_version := v_major || '.' || v_minor || '.' || v_patch;
  ELSE
    -- For non-semantic versions, just increment
    v_next_version := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
  END IF;
  
  RETURN v_next_version;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate version dependencies
CREATE OR REPLACE FUNCTION validate_migration_dependencies(
  p_migration_id VARCHAR
) RETURNS TABLE(
  is_valid BOOLEAN,
  missing_dependencies TEXT[]
) AS $$
DECLARE
  v_missing TEXT[];
BEGIN
  -- Find missing required dependencies
  SELECT ARRAY_AGG(d.depends_on_id)
  INTO v_missing
  FROM _migration_dependencies d
  WHERE d.migration_id = p_migration_id
  AND d.dependency_type = 'required'
  AND NOT EXISTS (
    SELECT 1 FROM _migration_history h
    WHERE h.migration_id = d.depends_on_id
    AND h.status = 'completed'
  );
  
  RETURN QUERY
  SELECT 
    v_missing IS NULL OR array_length(v_missing, 1) = 0,
    COALESCE(v_missing, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- Create view for version timeline
CREATE OR REPLACE VIEW v_migration_version_timeline AS
SELECT 
  v.version,
  v.migration_id,
  h.name as migration_name,
  v.applied_at,
  v.applied_by,
  r.name as release_name,
  r.deployed_at,
  h.metadata->>'breakingChange' as breaking_change,
  h.metadata->>'risk' as risk_level,
  COUNT(DISTINCT d.depends_on_id) as dependency_count
FROM _migration_versions v
JOIN _migration_history h ON v.migration_id = h.migration_id
LEFT JOIN _migration_releases r ON v.version = r.version
LEFT JOIN _migration_dependencies d ON v.migration_id = d.migration_id
GROUP BY v.version, v.migration_id, h.name, v.applied_at, v.applied_by, 
         r.name, r.deployed_at, h.metadata
ORDER BY v.applied_at DESC;

-- Create function to generate changelog between versions
CREATE OR REPLACE FUNCTION generate_migration_changelog(
  p_from_version VARCHAR DEFAULT NULL,
  p_to_version VARCHAR DEFAULT NULL
) RETURNS TABLE(
  version VARCHAR,
  migration_name VARCHAR,
  change_type VARCHAR,
  description TEXT,
  breaking_change BOOLEAN,
  applied_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.version,
    h.name,
    CASE 
      WHEN h.metadata->>'breakingChange' = 'true' THEN 'breaking'
      WHEN h.name LIKE '%fix%' THEN 'fix'
      WHEN h.name LIKE '%security%' THEN 'security'
      WHEN h.name LIKE '%perf%' THEN 'performance'
      ELSE 'feature'
    END as change_type,
    COALESCE(h.metadata->>'description', h.name) as description,
    COALESCE((h.metadata->>'breakingChange')::BOOLEAN, false) as breaking_change,
    v.applied_at
  FROM _migration_versions v
  JOIN _migration_history h ON v.migration_id = h.migration_id
  WHERE (p_from_version IS NULL OR v.version > p_from_version)
  AND (p_to_version IS NULL OR v.version <= p_to_version)
  ORDER BY v.applied_at;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON _migration_versions TO authenticated;
GRANT SELECT ON _migration_releases TO authenticated;
GRANT SELECT ON _migration_dependencies TO authenticated;
GRANT SELECT ON _migration_changelog TO authenticated;
GRANT SELECT ON v_migration_version_timeline TO authenticated;
GRANT INSERT, UPDATE ON _migration_versions TO service_role;
GRANT INSERT, UPDATE ON _migration_releases TO service_role;
GRANT INSERT, UPDATE ON _migration_dependencies TO service_role;
GRANT INSERT ON _migration_changelog TO service_role;

-- DOWN

-- Drop functions
DROP FUNCTION IF EXISTS get_next_migration_version(VARCHAR, BOOLEAN);
DROP FUNCTION IF EXISTS validate_migration_dependencies(VARCHAR);
DROP FUNCTION IF EXISTS generate_migration_changelog(VARCHAR, VARCHAR);

-- Drop views
DROP VIEW IF EXISTS v_migration_version_timeline;

-- Drop tables
DROP TABLE IF EXISTS _migration_changelog;
DROP TABLE IF EXISTS _migration_dependencies;
DROP TABLE IF EXISTS _migration_releases;
DROP TABLE IF EXISTS _migration_versions;