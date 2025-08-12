# Production Migration Runbook

## Pre-Migration Checklist

### 1 Week Before Migration

- [ ] **Review Migration**
  - [ ] Code review completed by 2+ engineers
  - [ ] SQL validated against production schema copy
  - [ ] Performance impact assessed
  - [ ] Rollback script tested
  - [ ] Dependencies verified

- [ ] **Test Migration**
  - [ ] Run on staging environment
  - [ ] Load test with production-like data volume
  - [ ] Verify application compatibility
  - [ ] Test rollback procedure
  - [ ] Document test results

- [ ] **Communication**
  - [ ] Stakeholders notified of maintenance window
  - [ ] Customer communication drafted
  - [ ] Support team briefed
  - [ ] Incident response team on standby

### 24 Hours Before Migration

- [ ] **Final Checks**
  - [ ] Recent production backup verified
  - [ ] Monitoring dashboards configured
  - [ ] Rollback procedure documented
  - [ ] Team availability confirmed
  - [ ] Change request approved

- [ ] **System Health**
  - [ ] Database performance baseline recorded
  - [ ] Application metrics normal
  - [ ] No ongoing incidents
  - [ ] Disk space adequate (>50% free)

### 1 Hour Before Migration

- [ ] **Preparation**
  - [ ] Create manual backup
    ```bash
    npm run migrate:backup
    ```
  - [ ] Verify backup integrity
    ```bash
    npm run migrate:backup:list
    ```
  - [ ] Clear error logs
  - [ ] Start recording session
  - [ ] Open monitoring dashboards

## Migration Execution

### Step 1: Pre-Migration Validation

```bash
# Check current status
npm run migrate:status --verbose

# Validate pending migrations
npm run migrate:validate

# Perform dry run
npm run migrate:up -- --dry-run --env production
```

Expected output:
```
✓ All migrations are valid
Pending migrations: 1
- 009_add_notification_system.sql (risk: medium)
```

### Step 2: Enable Maintenance Mode

```bash
# Enable maintenance mode
kubectl set env deployment/api MAINTENANCE_MODE=true

# Verify traffic is redirected
curl https://api.example.com/health
```

### Step 3: Create Pre-Migration Snapshot

```bash
# Create timestamped backup
BACKUP_ID=$(npm run migrate:backup | grep "Backup created:" | cut -d: -f2)
echo "Backup ID: $BACKUP_ID" >> migration.log

# Verify backup
npm run migrate:backup:list | grep $BACKUP_ID
```

### Step 4: Execute Migration

```bash
# Start migration with monitoring
npm run migrate:up -- --env production 2>&1 | tee migration.log

# Monitor in real-time
tail -f migration.log
```

Monitor for:
- Execution time vs estimate
- Lock acquisition success
- Each SQL statement completion
- Final success message

### Step 5: Post-Migration Validation

```bash
# Verify migration applied
npm run migrate:status | grep "009_"

# Run application health checks
npm run health:check

# Test critical queries
psql $DATABASE_URL -f post-migration-tests.sql
```

### Step 6: Application Verification

```bash
# Disable maintenance mode
kubectl set env deployment/api MAINTENANCE_MODE=false

# Rolling restart
kubectl rollout restart deployment/api

# Monitor logs
kubectl logs -f deployment/api --tail=100
```

### Step 7: Performance Verification

Monitor for 15 minutes:
- Response time percentiles (p50, p95, p99)
- Error rates
- Database connection pool
- CPU and memory usage

## Rollback Procedures

### Scenario 1: Migration Fails During Execution

```bash
# Automatic rollback should trigger
# If not, manual rollback:
npm run migrate:down -- --force

# Verify rollback
npm run migrate:status
```

### Scenario 2: Application Issues Post-Migration

```bash
# 1. Enable maintenance mode
kubectl set env deployment/api MAINTENANCE_MODE=true

# 2. Rollback migration
npm run migrate:down

# 3. Verify rollback
npm run migrate:status

# 4. Restart application
kubectl rollout restart deployment/api

# 5. Disable maintenance mode
kubectl set env deployment/api MAINTENANCE_MODE=false
```

### Scenario 3: Data Corruption

```bash
# 1. Stop all traffic
kubectl scale deployment/api --replicas=0

# 2. Restore from backup
npm run migrate:backup --restore $BACKUP_ID

# 3. Verify data integrity
psql $DATABASE_URL -f data-integrity-check.sql

# 4. Resume traffic
kubectl scale deployment/api --replicas=3
```

## Post-Migration Tasks

### Immediate (0-1 hour)

- [ ] **Monitoring**
  - [ ] Error rates normal
  - [ ] Response times acceptable
  - [ ] No unusual database locks
  - [ ] Memory usage stable

- [ ] **Functional Testing**
  - [ ] Critical user flows working
  - [ ] API endpoints responding
  - [ ] Background jobs processing
  - [ ] No data inconsistencies

### Short-term (1-24 hours)

- [ ] **Performance Analysis**
  - [ ] Query performance report
  - [ ] Index usage statistics
  - [ ] Table size growth
  - [ ] Connection pool metrics

- [ ] **Documentation**
  - [ ] Update migration log
  - [ ] Document any issues
  - [ ] Record performance metrics
  - [ ] Update runbook if needed

### Long-term (1-7 days)

- [ ] **Cleanup**
  - [ ] Remove old backups (keep 1)
  - [ ] Archive migration logs
  - [ ] Clean up temporary tables
  - [ ] Update documentation

- [ ] **Review**
  - [ ] Post-mortem if issues occurred
  - [ ] Team retrospective
  - [ ] Update procedures
  - [ ] Share learnings

## Emergency Contacts

### Primary Team
- **DBA Lead**: +1-xxx-xxx-xxxx
- **Backend Lead**: +1-xxx-xxx-xxxx
- **DevOps Lead**: +1-xxx-xxx-xxxx

### Escalation
- **Engineering Manager**: +1-xxx-xxx-xxxx
- **VP Engineering**: +1-xxx-xxx-xxxx

### External
- **Database Vendor Support**: support@vendor.com
- **Cloud Provider**: +1-800-xxx-xxxx

## Command Reference

### Status Commands
```bash
# Check migration status
npm run migrate:status

# View health metrics
npm run migrate:health

# Check lock status
psql $DATABASE_URL -c "SELECT * FROM _migration_locks"
```

### Backup Commands
```bash
# Create backup
npm run migrate:backup

# List backups
npm run migrate:backup:list

# Restore specific backup
npm run migrate:backup --restore <backup-id>
```

### Rollback Commands
```bash
# Rollback last migration
npm run migrate:down

# Rollback to specific version
npm run migrate:down -- --target 1.2.3

# Force rollback
npm run migrate:down -- --force
```

### Debug Commands
```bash
# Enable debug logging
LOG_LEVEL=DEBUG npm run migrate:up

# Check migration history
psql $DATABASE_URL -c "SELECT * FROM _migration_history ORDER BY applied_at DESC LIMIT 10"

# View audit log
psql $DATABASE_URL -c "SELECT * FROM _migration_audit_log ORDER BY timestamp DESC LIMIT 20"
```

## Troubleshooting Guide

### Issue: Migration Lock Timeout

**Symptoms**: Migration hangs at "Attempting to acquire migration lock"

**Resolution**:
```bash
# Check for stuck locks
psql $DATABASE_URL -c "SELECT * FROM _migration_locks"

# If lock is expired, force release
psql $DATABASE_URL -c "DELETE FROM _migration_locks WHERE expires_at < NOW()"

# Retry migration
npm run migrate:up
```

### Issue: Out of Disk Space

**Symptoms**: "could not extend file" error

**Resolution**:
```bash
# Check disk usage
df -h

# Clean up old logs
find /var/log -name "*.log" -mtime +30 -delete

# Vacuum database
psql $DATABASE_URL -c "VACUUM FULL"
```

### Issue: Long-Running Migration

**Symptoms**: Migration exceeds estimated time

**Resolution**:
```bash
# Check active queries
psql $DATABASE_URL -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC"

# Monitor progress (if migration has progress logging)
tail -f migration.log | grep PROGRESS

# Do NOT kill the migration process unless absolutely necessary
```

### Issue: Application Won't Start After Migration

**Symptoms**: Application crashes on startup

**Resolution**:
```bash
# Check application logs
kubectl logs deployment/api --tail=100

# Verify schema compatibility
npm run schema:validate

# If incompatible, rollback
npm run migrate:down

# Update application code and retry
```

## Performance Optimization Tips

### For Large Tables (>1M rows)

```sql
-- Use CONCURRENTLY for index creation
CREATE INDEX CONCURRENTLY idx_name ON table(column);

-- Batch updates
DO $$
DECLARE
  batch_size INTEGER := 10000;
  offset_val INTEGER := 0;
BEGIN
  LOOP
    UPDATE large_table 
    SET new_column = calculated_value 
    WHERE id > offset_val 
    ORDER BY id 
    LIMIT batch_size;
    
    EXIT WHEN NOT FOUND;
    offset_val := offset_val + batch_size;
    
    -- Prevent long transactions
    COMMIT;
  END LOOP;
END $$;
```

### For High-Traffic Tables

```sql
-- Add column without default first
ALTER TABLE high_traffic_table ADD COLUMN new_field VARCHAR(100);

-- Backfill in application code gradually
-- Then add constraints after backfill
ALTER TABLE high_traffic_table 
ALTER COLUMN new_field SET NOT NULL;
```

### For Critical Tables

```sql
-- Use CREATE TABLE ... LIKE for safety
BEGIN;
CREATE TABLE critical_table_new (LIKE critical_table INCLUDING ALL);
-- Make changes to new table
INSERT INTO critical_table_new SELECT * FROM critical_table;
-- Atomic rename
DROP TABLE critical_table;
ALTER TABLE critical_table_new RENAME TO critical_table;
COMMIT;
```

## Appendix: SQL Scripts

### post-migration-tests.sql
```sql
-- Verify row counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'products', COUNT(*) FROM products;

-- Check constraints
SELECT conname, contype, convalidated 
FROM pg_constraint 
WHERE convalidated = false;

-- Verify indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### data-integrity-check.sql
```sql
-- Check for orphaned records
SELECT 'orphaned_orders' as check_name, COUNT(*) as count
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- Verify foreign keys
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';

-- Check for duplicates
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
```