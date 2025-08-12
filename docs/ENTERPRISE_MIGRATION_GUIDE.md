# Enterprise Migration System Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Migration Workflow](#migration-workflow)
5. [CLI Commands](#cli-commands)
6. [Best Practices](#best-practices)
7. [Rollback Procedures](#rollback-procedures)
8. [Zero-Downtime Migrations](#zero-downtime-migrations)
9. [Monitoring & Alerts](#monitoring--alerts)
10. [Troubleshooting](#troubleshooting)

## Overview

The Enterprise Migration System provides a robust, scalable, and auditable database migration framework with the following features:

- **Automatic Rollback Support**: Every migration can be rolled back safely
- **Version Management**: Semantic versioning with dependency tracking
- **Pre-migration Backups**: Automatic database backups before migrations
- **Validation Framework**: Comprehensive validation before execution
- **Performance Monitoring**: Track migration performance and impact
- **Audit Logging**: Complete audit trail for compliance
- **Zero-Downtime Strategies**: Support for online schema changes
- **Multi-Environment Support**: Dev, staging, and production workflows

## Architecture

### Core Components

```
┌─────────────────────┐
│   CLI Interface     │
├─────────────────────┤
│  Migration Runner   │
├─────────────────────┤
│     Validator       │
├─────────────────────┤
│  Version Manager    │
├─────────────────────┤
│  Backup Manager     │
├─────────────────────┤
│   Lock Manager      │
├─────────────────────┤
│  Metrics Collector  │
└─────────────────────┘
```

### Database Schema

The system uses the following tables:
- `_migration_history`: Track applied migrations
- `_migration_versions`: Version management
- `_migration_locks`: Prevent concurrent migrations
- `_backup_history`: Backup tracking
- `_migration_audit_log`: Audit trail
- `_migration_rollback_history`: Rollback tracking

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run initial setup migration
npm run migrate:up
```

### Configuration

Create a `.env` file with:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
BACKUP_ENCRYPTION_KEY=your-32-byte-hex-key
LOG_LEVEL=INFO
METRICS_ENDPOINT=https://your-metrics-service.com
```

## Migration Workflow

### 1. Create a New Migration

```bash
npm run migrate:create "add user preferences table"

# For breaking changes
npm run migrate:create "remove legacy columns" -- --breaking
```

This creates a migration file with the template:

```sql
-- @metadata {
--   "author": "your-username",
--   "description": "add user preferences table",
--   "breakingChange": false,
--   "estimatedDuration": 1000,
--   "dataVolume": "small",
--   "risk": "low",
--   "tags": ["feature"]
-- }

-- UP
-- TODO: Add your migration SQL here

-- DOWN
-- TODO: Add your rollback SQL here
```

### 2. Write Migration SQL

#### Example: Adding a Table

```sql
-- UP
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- DOWN
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP TABLE IF EXISTS user_preferences;
```

### 3. Validate Migration

```bash
npm run migrate:validate
```

This checks for:
- SQL syntax errors
- Naming convention violations
- Missing indexes on foreign keys
- Destructive operations without rollback
- Performance impact on large tables

### 4. Test Migration

```bash
# Dry run to see what would happen
npm run migrate:up -- --dry-run

# Test on development database
npm run migrate:up -- --env development
```

### 5. Apply Migration

```bash
# Apply to production
npm run migrate:up -- --env production
```

## CLI Commands

### Core Commands

```bash
# Apply pending migrations
npm run migrate:up [options]
  --target <version>    Migrate to specific version
  --dry-run            Show what would be executed
  --force              Force migration with warnings
  --skip-backup        Skip automatic backup
  --env <environment>  Target environment

# Rollback migrations
npm run migrate:down [options]
  --steps <number>     Number of migrations to rollback
  --target <version>   Rollback to specific version
  --dry-run           Show what would be rolled back
  --force             Force rollback without scripts

# Show migration status
npm run migrate:status [options]
  --verbose           Show detailed information

# Validate migrations
npm run migrate:validate [options]
  --fix              Attempt to fix issues

# Create new migration
npm run migrate:create <name> [options]
  --type <type>      Migration type (ddl, dml, function)
  --breaking         Mark as breaking change
```

### Backup Commands

```bash
# Create manual backup
npm run migrate:backup

# List backups
npm run migrate:backup:list

# Restore backup
npm run migrate:backup --restore <backup-id>
```

### Advanced Commands

```bash
# Show migration health
npm run migrate:health

# Generate changelog
npm run migrate:changelog --from 1.0.0 --to 2.0.0

# Tag version
npm run migrate:tag <version> <tag>

# Create release
npm run migrate:release <version> <name>
```

## Best Practices

### 1. Migration Design

- **One Change Per Migration**: Keep migrations focused and atomic
- **Always Include Rollback**: Every UP should have a corresponding DOWN
- **Test on Copy**: Test migrations on production data copies
- **Estimate Duration**: Provide accurate time estimates in metadata
- **Document Changes**: Use clear descriptions and comments

### 2. Naming Conventions

```sql
-- Tables: lowercase_snake_case
CREATE TABLE user_accounts (...);

-- Indexes: idx_tablename_columns
CREATE INDEX idx_user_accounts_email ON user_accounts(email);

-- Foreign Keys: fk_tablename_column
CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES users(id);
```

### 3. Performance Considerations

```sql
-- Use CONCURRENTLY for large tables
CREATE INDEX CONCURRENTLY idx_large_table_column ON large_table(column);

-- Add columns with defaults in steps
ALTER TABLE users ADD COLUMN status VARCHAR(50);
UPDATE users SET status = 'active' WHERE status IS NULL;
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
```

### 4. Safety Rules

- Never modify `_migration_*` tables directly
- Always backup before major migrations
- Test rollback procedures
- Monitor application logs during migration
- Have a communication plan for breaking changes

## Rollback Procedures

### Automatic Rollback

The system automatically attempts rollback when:
- A migration fails during execution
- Validation fails post-migration
- Application health checks fail

### Manual Rollback

```bash
# Rollback last migration
npm run migrate:down

# Rollback specific number
npm run migrate:down -- --steps 3

# Rollback to version
npm run migrate:down -- --target 1.2.0
```

### Emergency Rollback

```bash
# Force rollback without validation
npm run migrate:down -- --force

# Restore from backup
npm run migrate:backup --restore <backup-id>
```

## Zero-Downtime Migrations

### Strategy 1: Blue-Green Deployment

```sql
-- Step 1: Add new column (backward compatible)
ALTER TABLE users ADD COLUMN email_new VARCHAR(255);

-- Step 2: Dual-write in application
-- Step 3: Backfill data
UPDATE users SET email_new = email WHERE email_new IS NULL;

-- Step 4: Switch reads to new column
-- Step 5: Drop old column
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users RENAME COLUMN email_new TO email;
```

### Strategy 2: Progressive Migration

```sql
-- Use feature flags to control migration
CREATE TABLE migration_progress (
  feature VARCHAR(100) PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  percentage INTEGER DEFAULT 0
);

-- Gradually increase percentage
UPDATE migration_progress 
SET percentage = 10 
WHERE feature = 'new_user_system';
```

### Strategy 3: Online Schema Change

```sql
-- Create new table with desired schema
CREATE TABLE users_new (LIKE users INCLUDING ALL);
ALTER TABLE users_new ADD COLUMN new_field VARCHAR(100);

-- Copy data in batches
INSERT INTO users_new 
SELECT *, NULL as new_field 
FROM users 
WHERE id > ? AND id <= ?
LIMIT 1000;

-- Atomic switch
BEGIN;
ALTER TABLE users RENAME TO users_old;
ALTER TABLE users_new RENAME TO users;
COMMIT;
```

## Monitoring & Alerts

### Key Metrics

```sql
-- Migration duration trends
SELECT 
  name,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as execution_count
FROM _migration_history
GROUP BY name
ORDER BY avg_duration DESC;

-- Failed migrations
SELECT * FROM _migration_history
WHERE status = 'failed'
ORDER BY applied_at DESC;

-- Lock contention
SELECT * FROM _migration_locks
WHERE expires_at > NOW();
```

### Alert Conditions

1. **Migration Duration**: Alert if migration exceeds estimated time by 2x
2. **Lock Timeout**: Alert if unable to acquire lock within 5 minutes
3. **Rollback Triggered**: Alert on any automatic rollback
4. **Validation Failure**: Alert on post-migration validation failures

### Monitoring Dashboard

The system provides metrics for:
- Migration success rate
- Average migration duration
- Rollback frequency
- Database size growth
- Performance impact

## Troubleshooting

### Common Issues

#### 1. Migration Lock Timeout

```bash
# Check lock status
SELECT * FROM _migration_locks;

# Force release if stuck
DELETE FROM _migration_locks WHERE lock_name = 'migration_lock';
```

#### 2. Checksum Mismatch

```bash
# Regenerate checksum
UPDATE _migration_history 
SET checksum = 'new-checksum' 
WHERE migration_id = '001';
```

#### 3. Dependency Issues

```sql
-- Check dependencies
SELECT * FROM validate_migration_dependencies('migration-id');

-- Force migration if safe
npm run migrate:up -- --force
```

#### 4. Performance Issues

```bash
# Analyze migration performance
npm run migrate:analyze <migration-id>

# Run with increased timeout
npm run migrate:up -- --timeout 600000
```

### Recovery Procedures

1. **Failed Migration Recovery**
   ```bash
   # 1. Check migration status
   npm run migrate:status
   
   # 2. Review error logs
   cat logs/migration-error.log
   
   # 3. Attempt rollback
   npm run migrate:down
   
   # 4. Fix issue and retry
   npm run migrate:up
   ```

2. **Data Corruption Recovery**
   ```bash
   # 1. Stop application
   systemctl stop app
   
   # 2. Restore from backup
   npm run migrate:backup --restore latest
   
   # 3. Verify data integrity
   npm run db:verify
   
   # 4. Resume operations
   systemctl start app
   ```

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=DEBUG npm run migrate:up
```

This provides:
- Detailed SQL execution logs
- Lock acquisition details
- Validation step results
- Performance metrics

## Appendix

### Migration Metadata Schema

```typescript
interface MigrationMetadata {
  author: string;
  description: string;
  breakingChange: boolean;
  estimatedDuration: number; // milliseconds
  dataVolume: 'small' | 'medium' | 'large';
  risk: 'low' | 'medium' | 'high';
  tags: string[];
  dependencies?: string[];
  requiresDowntime?: boolean;
  affectedTables?: string[];
  rollbackStrategy?: string;
}
```

### Environment Configuration

```yaml
# migration.config.yml
environments:
  development:
    skipBackup: true
    skipValidation: false
    autoRollback: true
    maxDuration: 60000
    
  staging:
    skipBackup: false
    skipValidation: false
    autoRollback: true
    maxDuration: 300000
    
  production:
    skipBackup: false
    skipValidation: false
    autoRollback: false
    maxDuration: 600000
    requireApproval: true
```

### Integration Examples

#### CI/CD Pipeline

```yaml
# .github/workflows/migration.yml
name: Database Migration
on:
  push:
    paths:
      - 'prisma/migrations/**'
      
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Validate Migrations
        run: npm run migrate:validate
        
      - name: Test Migrations
        run: npm run migrate:up -- --env test --dry-run
        
      - name: Apply to Staging
        if: github.ref == 'refs/heads/main'
        run: npm run migrate:up -- --env staging
        
      - name: Run E2E Tests
        run: npm run test:e2e
        
      - name: Apply to Production
        if: github.ref == 'refs/heads/main'
        run: npm run migrate:up -- --env production
        env:
          REQUIRE_APPROVAL: true
```

#### Monitoring Integration

```javascript
// datadog-integration.js
const { StatsD } = require('node-dogstatsd');
const client = new StatsD();

// Track migration metrics
metricsCollector.on('migration:complete', ({ results, duration }) => {
  client.gauge('migration.duration', duration);
  client.increment('migration.complete', 1, {
    status: results[0].status,
    migration: results[0].name,
  });
});

metricsCollector.on('migration:failed', ({ error, migration }) => {
  client.increment('migration.failed', 1, {
    migration: migration.name,
    error: error.message,
  });
});
```