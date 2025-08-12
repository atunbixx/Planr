# Database Migrations Guide

## 🎯 Overview

This document provides the **complete migration ordering** and database setup guide for the Wedding Planner V2 application. Following this exact sequence ensures reliable schema consistency across development, staging, and production environments.

## 📋 Migration Order (CRITICAL - Execute in Exact Sequence)

### Phase 1: Foundation Tables (Base Schema)
Execute these migrations in the **exact order** specified:

```bash
# 1. Base schema with core tables (couples, users, vendors, guests, etc.)
npm run migrate:apply -- prisma/schema.prisma

# 2. Query optimization indexes and functions
npm run migrate:apply -- prisma/migrations/20240807_optimize_queries/migration.sql

# 3. RSVP security tables for rate limiting and IP blocking
npm run migrate:apply -- prisma/migrations/20240807_rsvp_security_tables/migration.sql

# 4. Dashboard performance composite indexes  
npm run migrate:apply -- prisma/migrations/20240807_dashboard_performance_indexes/migration.sql
```

### Phase 2: Advanced Features (Order-Dependent)
Execute these migrations **after Phase 1** completion:

```bash
# 4. Seating planner tables (depends on guests, couples)
npm run migrate:apply -- prisma/migrations/20240108_seating_planner/migration.sql

# 5. Day-of wedding dashboard tables (depends on vendors, guests, couples)
npm run migrate:apply -- prisma/migrations/20240108_day_of_dashboard/migration.sql

# 6. Communication and document management (depends on couples, guests, vendors)
npm run migrate:apply -- prisma/migrations/20240109_communication_documents/migration.sql
```

## 🚨 Critical Dependencies

### Migration Dependencies (Why Order Matters)

1. **Base Schema First**: `couples`, `users`, `guests`, `vendors` tables must exist before any feature migrations
2. **Seating Planner**: Requires `guests` and `couples` tables (references via foreign keys)
3. **Day-of Dashboard**: Requires `vendors`, `guests`, and `couples` tables
4. **Communication System**: Requires `couples`, `guests`, and `vendors` tables
5. **Security Tables**: Can be applied after base schema (no dependencies)

### Table Reference Chain
```
users → couples → [guests, vendors] → [seating, day_of, communication]
```

## 🛠️ NPM Scripts Reference

### Migration Scripts

```bash
# Apply specific migration file
npm run migrate:apply -- <migration-file-path>

# Apply all migrations in correct order
npm run migrate:full

# Reset database and apply all migrations
npm run migrate:reset

# Rollback last migration (if supported)
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

### Development Scripts

```bash
# Reset database and seed with development data
npm run db:reset

# Seed database with sample data
npm run db:seed

# Seed database for specific user (atunbi)
npm run db:seed:atunbi

# Reset and seed for development
npm run dev:setup
```

### Production Scripts

```bash
# Production-safe migration (with backup)
npm run migrate:prod

# Generate migration diff
npm run migrate:diff

# Validate schema consistency
npm run migrate:validate
```

## 🔧 Migration Runner Implementation

### Simple Migration Runner (`scripts/migrate-runner.js`)

```javascript
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

class MigrationRunner {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_POOLER_URL
    });
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to database');
  }

  async disconnect() {
    await this.client.end();
  }

  async runMigration(filePath) {
    console.log(`🔄 Running migration: ${filePath}`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      await this.client.query(sql);
      console.log(`✅ Migration completed: ${filePath}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${filePath}`);
      throw error;
    }
  }

  async runAllMigrations() {
    const migrations = [
      'prisma/migrations/20240807_optimize_queries/migration.sql',
      'prisma/migrations/20240807_rsvp_security_tables/migration.sql',
      'prisma/migrations/20240108_seating_planner/migration.sql',
      'prisma/migrations/20240108_day_of_dashboard/migration.sql',
      'prisma/migrations/20240109_communication_documents/migration.sql'
    ];

    for (const migration of migrations) {
      if (fs.existsSync(migration)) {
        await this.runMigration(migration);
      } else {
        console.warn(`⚠️  Migration file not found: ${migration}`);
      }
    }
  }
}

// Usage
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.connect()
    .then(() => runner.runAllMigrations())
    .then(() => runner.disconnect())
    .catch(console.error);
}

module.exports = MigrationRunner;
```

## 📊 Migration Status Tracking

### Track Applied Migrations

```sql
-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  checksum VARCHAR(64)
);

-- Function to record migration
CREATE OR REPLACE FUNCTION record_migration(
  p_migration_name VARCHAR(255),
  p_checksum VARCHAR(64) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO _migrations (migration_name, checksum)
  VALUES (p_migration_name, p_checksum)
  ON CONFLICT (migration_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
```

## 🧪 Testing Migrations

### Migration Test Script (`scripts/test-migrations.js`)

```javascript
const MigrationRunner = require('./migrate-runner');

async function testMigrations() {
  const runner = new MigrationRunner();
  
  try {
    await runner.connect();
    
    // Test each migration individually
    const migrations = [
      'prisma/migrations/20240807_optimize_queries/migration.sql',
      'prisma/migrations/20240807_rsvp_security_tables/migration.sql'
    ];

    for (const migration of migrations) {
      console.log(`Testing migration: ${migration}`);
      await runner.runMigration(migration);
      
      // Verify migration applied correctly
      const result = await runner.client.query(
        "SELECT count(*) FROM information_schema.tables WHERE table_name = 'rsvp_rate_limits'"
      );
      console.log(`Tables created: ${result.rows[0].count}`);
    }
    
    console.log('✅ All migrations tested successfully');
  } catch (error) {
    console.error('❌ Migration test failed:', error);
  } finally {
    await runner.disconnect();
  }
}

testMigrations();
```

## 🔐 Security Considerations

### Migration Security Best Practices

1. **Never store sensitive data in migrations**
2. **Use environment variables for configuration**
3. **Validate input parameters in migration functions**
4. **Enable Row Level Security (RLS) on all new tables**
5. **Grant minimum required permissions**

### Example Secure Migration

```sql
-- ✅ Good: Secure migration with RLS
CREATE TABLE secure_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS immediately
ALTER TABLE secure_table ENABLE ROW LEVEL SECURITY;

-- Create restrictive policy
CREATE POLICY "Users can only access own data" ON secure_table
  FOR ALL USING (couple_id IN (
    SELECT c.id FROM couples c
    JOIN users u ON u.id = c.user_id
    WHERE u.clerk_user_id = auth.uid()
  ));
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/migrate.yml`)

```yaml
name: Database Migrations
on:
  push:
    branches: [main, staging]
  
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run migrate:full
      
      - name: Validate schema
        run: npm run migrate:validate
```

## 🎯 Development Workflow

### Daily Development Process

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Check migration status**
   ```bash
   npm run migrate:status
   ```

3. **Apply any new migrations**
   ```bash
   npm run migrate:full
   ```

4. **Seed with fresh data if needed**
   ```bash
   npm run db:seed
   ```

### Creating New Migrations

1. **Create migration directory**
   ```bash
   mkdir prisma/migrations/$(date +%Y%m%d)_descriptive_name
   ```

2. **Write migration SQL**
   ```bash
   touch prisma/migrations/$(date +%Y%m%d)_descriptive_name/migration.sql
   ```

3. **Update this MIGRATIONS.md file**
   - Add to the appropriate phase
   - Document any dependencies
   - Update the migration order

4. **Test locally**
   ```bash
   npm run migrate:apply -- prisma/migrations/new_migration/migration.sql
   ```

## 🔍 Troubleshooting

### Common Issues

#### Issue: Foreign Key Constraint Errors
```bash
# Solution: Check migration order, ensure parent tables exist first
npm run migrate:status
```

#### Issue: Permission Denied
```bash
# Solution: Check database user permissions
psql $DATABASE_URL -c "SELECT current_user, session_user;"
```

#### Issue: Migration Already Applied
```bash
# Solution: Check migration tracking table
npm run migrate:status
```

### Emergency Recovery

```bash
# 1. Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Reset to clean state
npm run migrate:reset

# 3. Apply all migrations fresh
npm run migrate:full

# 4. Restore data if needed
npm run db:seed:production
```

## 📈 Performance Monitoring

### Monitor Migration Performance

```sql
-- Check migration history and timing
SELECT 
  migration_name,
  applied_at,
  extract(epoch from (applied_at - lag(applied_at) OVER (ORDER BY applied_at))) as seconds_taken
FROM _migrations 
ORDER BY applied_at DESC;
```

### Index Usage Analysis

```sql
-- Check if our indexes are being used
SELECT 
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## ✅ Migration Checklist

### Pre-Migration Checklist
- [ ] Database connection tested
- [ ] Backup created (production only)
- [ ] Migration order verified
- [ ] Dependencies checked
- [ ] Test environment validated

### Post-Migration Checklist
- [ ] All migrations applied successfully
- [ ] No errors in application logs
- [ ] Key queries tested and performing well
- [ ] Schema validation passed
- [ ] Seed data applied if needed

### Production Migration Checklist
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Backup verified
- [ ] Rollback plan ready
- [ ] Performance monitoring enabled
- [ ] Post-migration validation completed

---

## 📝 Migration History

| Date | Migration | Description | Dependencies |
|------|-----------|-------------|--------------|
| 2024-08-07 | optimize_queries | Added indexes and performance functions | Base schema |
| 2024-08-07 | rsvp_security_tables | Rate limiting and IP blocking | Base schema |
| 2024-01-08 | seating_planner | Seating charts and table management | guests, couples |
| 2024-01-08 | day_of_dashboard | Wedding day coordination | vendors, guests, couples |
| 2024-01-09 | communication_documents | Messaging and document system | couples, guests, vendors |

---

**⚠️ CRITICAL REMINDER**: Always execute migrations in the **exact order** specified above. Schema drift and dependency issues will occur if migrations are applied out of order.