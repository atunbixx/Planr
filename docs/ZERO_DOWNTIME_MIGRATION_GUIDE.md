# Zero-Downtime Migration Strategies Guide

## Overview

Zero-downtime migrations allow database schema changes without interrupting service availability. This guide covers enterprise-grade strategies for maintaining 100% uptime during migrations.

## Available Strategies

### 1. Expand-Contract Pattern

Used for removing columns or deprecated features.

**Process:**
1. **Expand**: Add new structure alongside old
2. **Migrate**: Dual-write to both structures
3. **Contract**: Remove old structure after migration

**Example: Removing a Column**

```sql
-- Phase 1: Deprecate column (Expand)
-- @metadata {"zeroDowntime": true, "phase": "expand"}
COMMENT ON COLUMN users.legacy_field IS 'DEPRECATED: Will be removed in v2.0';
INSERT INTO _migration_deprecations (table_name, column_name, removal_date)
VALUES ('users', 'legacy_field', NOW() + INTERVAL '30 days');

-- Phase 2: Application stops reading column (Deploy app v1.1)
-- No database changes

-- Phase 3: Drop column (Contract)
-- @metadata {"zeroDowntime": true, "phase": "contract"}
ALTER TABLE users DROP COLUMN legacy_field;
```

### 2. Dual-Write Pattern

Used for renaming columns or changing data types.

**Process:**
1. Add new column
2. Dual-write to both columns
3. Migrate reads to new column
4. Stop writing to old column
5. Drop old column

**Example: Renaming a Column**

```sql
-- Phase 1: Add new column with trigger
-- @metadata {"zeroDowntime": true, "phase": "dual-write-setup"}
ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255);

-- Copy existing data
UPDATE orders SET customer_email = user_email WHERE customer_email IS NULL;

-- Create dual-write trigger
CREATE TRIGGER dual_write_email
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
BEGIN
  NEW.customer_email := COALESCE(NEW.customer_email, NEW.user_email);
  NEW.user_email := COALESCE(NEW.user_email, NEW.customer_email);
END;

-- Phase 2: Switch application reads (Deploy app v1.1)
-- App reads from customer_email, writes to both

-- Phase 3: Switch application writes (Deploy app v1.2)
-- App reads/writes only customer_email

-- Phase 4: Cleanup
-- @metadata {"zeroDowntime": true, "phase": "dual-write-cleanup"}
DROP TRIGGER dual_write_email;
ALTER TABLE orders DROP COLUMN user_email;
```

### 3. Progressive Rollout

Used for large data migrations or risky changes.

**Configuration:**
```typescript
const progressiveOptions = {
  batchSize: 10000,        // Records per batch
  delayMs: 100,           // Delay between batches
  maxDuration: 3600000,   // 1 hour max
  rolloutPercentage: 10,  // Start with 10% of records
};
```

**Example: Adding Index to Large Table**

```sql
-- @metadata {"zeroDowntime": true, "progressive": true, "batchSize": 10000}
DO $$
DECLARE
  batch_count INTEGER;
BEGIN
  -- Create partial index first
  CREATE INDEX CONCURRENTLY idx_orders_date_partial 
  ON orders(created_at) 
  WHERE created_at > NOW() - INTERVAL '30 days';

  -- Monitor impact
  PERFORM pg_sleep(60);

  -- Create full index if metrics are good
  IF (SELECT avg(lock_wait_time) FROM pg_stat_activity) < 100 THEN
    CREATE INDEX CONCURRENTLY idx_orders_date ON orders(created_at);
    DROP INDEX idx_orders_date_partial;
  END IF;
END $$;
```

### 4. Blue-Green Schema

Used for major structural changes.

**Process:**
1. Create "green" table with new structure
2. Sync data from "blue" to "green"
3. Switch traffic atomically
4. Remove "blue" table

**Example: Restructuring Table**

```sql
-- Phase 1: Create green table
-- @metadata {"zeroDowntime": true, "phase": "blue-green-create"}
CREATE TABLE users_green (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  profile JSONB NOT NULL DEFAULT '{}',
  -- New structure with JSONB instead of separate columns
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: Sync data with trigger
-- @metadata {"zeroDowntime": true, "phase": "blue-green-sync"}
CREATE FUNCTION sync_users_to_green() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users_green (id, email, profile)
  VALUES (
    NEW.id, 
    NEW.email,
    jsonb_build_object(
      'firstName', NEW.first_name,
      'lastName', NEW.last_name,
      'phone', NEW.phone
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    profile = EXCLUDED.profile;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_to_green 
AFTER INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION sync_users_to_green();

-- Initial data copy
INSERT INTO users_green (id, email, profile)
SELECT id, email, jsonb_build_object(
  'firstName', first_name,
  'lastName', last_name,
  'phone', phone
) FROM users;

-- Phase 3: Atomic switch
-- @metadata {"zeroDowntime": true, "phase": "blue-green-switch"}
BEGIN;
ALTER TABLE users RENAME TO users_old;
ALTER TABLE users_green RENAME TO users;
COMMIT;

-- Phase 4: Cleanup (after verification)
DROP TABLE users_old CASCADE;
```

### 5. Feature Flag Control

Used for gradual rollout of new features.

**Setup:**
```sql
-- Enable feature for percentage of users
INSERT INTO _migration_feature_flags (flag_name, enabled, rollout_percentage)
VALUES ('new_search_algorithm', true, 10);

-- Check in application
SELECT check_feature_flag('new_search_algorithm', user_id);
```

**Progressive Rollout:**
```sql
-- Start with 10%
UPDATE _migration_feature_flags 
SET rollout_percentage = 10 
WHERE flag_name = 'new_search_algorithm';

-- Monitor metrics...

-- Increase to 50%
UPDATE _migration_feature_flags 
SET rollout_percentage = 50 
WHERE flag_name = 'new_search_algorithm';

-- Full rollout
UPDATE _migration_feature_flags 
SET rollout_percentage = 100 
WHERE flag_name = 'new_search_algorithm';
```

## Implementation Guide

### 1. Analyze Migration

```typescript
const analyzer = new ZeroDowntimeMigration(prisma, logger, metrics);
const analysis = await analyzer.analyzeMigration(migration);

console.log('Requires zero-downtime:', analysis.requiresZeroDowntime);
console.log('Recommended strategy:', analysis.recommendedStrategy);
console.log('Estimated downtime:', analysis.estimatedDowntime);
```

### 2. Transform Migration

```typescript
if (analysis.recommendedStrategy) {
  const transformedMigrations = await analyzer.transformMigration(
    migration,
    analysis.recommendedStrategy
  );
  
  // Execute each phase
  for (const phase of transformedMigrations) {
    await runner.run({ migrations: [phase] });
    
    // Wait for application deployment between phases
    if (phase.metadata.requiresDeployment) {
      await waitForDeployment(phase.metadata.deploymentVersion);
    }
  }
}
```

### 3. Monitor Progress

```sql
-- Check deprecation status
SELECT * FROM _migration_deprecations 
WHERE removal_date < NOW() + INTERVAL '7 days';

-- Monitor progressive migrations
SELECT * FROM _migration_progress 
WHERE status = 'running';

-- Check feature flags
SELECT * FROM _migration_feature_flags 
WHERE enabled = true AND rollout_percentage < 100;

-- View overall status
SELECT * FROM v_zero_downtime_status;
```

## Circuit Breaker Pattern

Protect against cascading failures during migrations:

```typescript
// Check circuit breaker before operations
const breakerState = await prisma.$queryRaw`
  SELECT state FROM _migration_circuit_breakers 
  WHERE breaker_name = 'migration_executor'
`;

if (breakerState[0].state === 'open') {
  throw new Error('Circuit breaker is open - migrations paused');
}

// Update breaker after operation
await prisma.$queryRaw`
  SELECT update_circuit_breaker('migration_executor', ${success})
`;
```

## Best Practices

### 1. Pre-Migration Checklist

- [ ] Analyze migration for zero-downtime requirements
- [ ] Choose appropriate strategy
- [ ] Test strategy on staging environment
- [ ] Prepare application code for all phases
- [ ] Set up monitoring and alerts
- [ ] Create rollback plan

### 2. Phase Coordination

```yaml
migration_phases:
  expand:
    - database: Add new structures
    - application: Deploy code that writes to both
    - validation: Verify dual-write working
    
  migrate:
    - database: Sync data if needed
    - application: Switch reads to new structure
    - validation: Verify no data loss
    
  contract:
    - application: Stop using old structure
    - database: Remove old structure
    - validation: Verify cleanup complete
```

### 3. Monitoring During Migration

```sql
-- Real-time migration metrics
SELECT 
  m.migration_id,
  m.batches_completed,
  m.rows_affected,
  m.status,
  EXTRACT(EPOCH FROM (NOW() - m.started_at)) as duration_seconds,
  (m.rows_affected / NULLIF(
    EXTRACT(EPOCH FROM (NOW() - m.started_at)), 0
  ))::INT as rows_per_second
FROM _migration_progress m
WHERE m.status = 'running';

-- Lock monitoring
SELECT 
  pid,
  usename,
  application_name,
  wait_event_type,
  wait_event,
  query_start,
  NOW() - query_start as duration,
  query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock'
ORDER BY query_start;
```

### 4. Rollback Procedures

Each strategy has specific rollback approaches:

**Expand-Contract Rollback:**
```sql
-- Remove deprecation notice
DELETE FROM _migration_deprecations 
WHERE table_name = 'users' AND column_name = 'legacy_field';

COMMENT ON COLUMN users.legacy_field IS NULL;
```

**Dual-Write Rollback:**
```sql
-- Re-enable old column
ALTER TABLE orders ADD COLUMN user_email VARCHAR(255);
UPDATE orders SET user_email = customer_email;
-- Redeploy old application version
```

**Progressive Rollback:**
```sql
-- Stop progressive migration
UPDATE _migration_progress 
SET status = 'cancelled' 
WHERE migration_id = 'current_migration';

-- Execute rollback script
npm run migrate:down --target last_stable_version
```

## Common Patterns

### Adding NOT NULL Column

```sql
-- Phase 1: Add nullable column
ALTER TABLE users ADD COLUMN status VARCHAR(50);

-- Phase 2: Backfill with default
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Phase 3: Add NOT NULL constraint
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
```

### Changing Column Type

```sql
-- Phase 1: Add new column
ALTER TABLE products ADD COLUMN price_new DECIMAL(10,2);

-- Phase 2: Dual-write (in application)
-- Write to both price and price_new

-- Phase 3: Migrate data
UPDATE products SET price_new = price::DECIMAL(10,2);

-- Phase 4: Switch reads (deploy app)

-- Phase 5: Drop old column
ALTER TABLE products DROP COLUMN price;
ALTER TABLE products RENAME COLUMN price_new TO price;
```

### Creating Index on Large Table

```sql
-- Use CONCURRENTLY to avoid locks
CREATE INDEX CONCURRENTLY idx_orders_user_date 
ON orders(user_id, created_at);

-- Monitor progress
SELECT 
  phase,
  blocks_done,
  blocks_total,
  tuples_done,
  tuples_total
FROM pg_stat_progress_create_index;
```

## Performance Considerations

### Resource Management

```typescript
const resourceLimits = {
  maxConcurrentMigrations: 1,
  maxCPUPercent: 50,
  maxIOPS: 1000,
  maxMemoryMB: 2048,
};

// Check resources before migration
const canProceed = await checkResourceAvailability(resourceLimits);
```

### Batch Processing

```sql
-- Template for batch updates
DO $$
DECLARE
  batch_size CONSTANT INTEGER := 10000;
  total_updated INTEGER := 0;
  batch_updated INTEGER;
BEGIN
  LOOP
    UPDATE target_table
    SET new_column = calculated_value
    WHERE id IN (
      SELECT id FROM target_table
      WHERE new_column IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );
    
    GET DIAGNOSTICS batch_updated = ROW_COUNT;
    total_updated := total_updated + batch_updated;
    
    EXIT WHEN batch_updated = 0;
    
    -- Progress tracking
    RAISE NOTICE 'Updated % rows', total_updated;
    
    -- Brief pause to reduce load
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
```

## Troubleshooting

### Common Issues

1. **Lock Timeout**
   ```sql
   -- Find blocking queries
   SELECT * FROM pg_blocking_pids(locked_pid);
   
   -- Cancel blocking query if safe
   SELECT pg_cancel_backend(pid);
   ```

2. **Replication Lag**
   ```sql
   -- Check replication lag
   SELECT 
     client_addr,
     state,
     sent_lsn,
     write_lsn,
     flush_lsn,
     replay_lsn,
     write_lag,
     flush_lag,
     replay_lag
   FROM pg_stat_replication;
   ```

3. **Circuit Breaker Tripped**
   ```sql
   -- Reset circuit breaker
   UPDATE _migration_circuit_breakers
   SET state = 'closed', failure_count = 0
   WHERE breaker_name = 'migration_executor';
   ```

### Recovery Procedures

1. **Stuck Progressive Migration**
   ```bash
   # Mark as failed
   npm run migrate:progress --cancel migration_id
   
   # Clean up partial changes
   npm run migrate:cleanup migration_id
   
   # Retry with smaller batches
   npm run migrate:up --batch-size 1000
   ```

2. **Failed Blue-Green Switch**
   ```sql
   -- Revert to blue table
   BEGIN;
   ALTER TABLE users RENAME TO users_failed;
   ALTER TABLE users_old RENAME TO users;
   COMMIT;
   
   -- Investigate and fix issues
   -- Retry when ready
   ```