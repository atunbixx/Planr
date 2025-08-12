#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes SQL migration files in the correct order with error handling and logging
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

class MigrationRunner {
  constructor(options = {}) {
    // For migrations, prefer DIRECT_URL (port 5432) over DATABASE_URL (port 6543 pooler)
    this.connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.POSTGRES_POOLER_URL;
    this.verbose = options.verbose || process.argv.includes('--verbose');
    this.dryRun = options.dryRun || process.argv.includes('--dry-run');
    
    if (!this.connectionString) {
      throw new Error('DIRECT_URL, DATABASE_URL, or POSTGRES_POOLER_URL must be set');
    }

    this.client = new Client({
      connectionString: this.connectionString,
      ssl: this.connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  error(message, error) {
    console.error(`[${new Date().toISOString()}] ❌ ${message}`);
    if (error && this.verbose) {
      console.error(error);
    }
  }

  async connect() {
    try {
      await this.client.connect();
      this.log('✅ Connected to database');
      
      // Test connection with simple query
      const result = await this.client.query('SELECT NOW()');
      this.log(`🕐 Database time: ${result.rows[0].now}`);
    } catch (error) {
      this.error('Failed to connect to database', error);
      
      // If dry-run mode, allow continuing without connection
      if (this.dryRun) {
        this.log('🧪 Continuing in DRY RUN mode without database connection');
        return;
      }
      
      throw error;
    }
  }

  async disconnect() {
    if (this.dryRun) {
      this.log('🧪 DRY RUN - Skipping database disconnect');
      return;
    }

    try {
      await this.client.end();
      this.log('🔌 Disconnected from database');
    } catch (error) {
      this.error('Error disconnecting from database', error);
    }
  }

  async setupMigrationTracking() {
    if (this.dryRun) {
      this.log('🧪 DRY RUN - Would setup migration tracking table');
      return;
    }

    const trackingSQL = `
      -- Create migrations tracking table if it doesn't exist
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT now(),
        checksum VARCHAR(64),
        execution_time_ms INTEGER
      );

      -- Function to record migration
      CREATE OR REPLACE FUNCTION record_migration(
        p_migration_name VARCHAR(255),
        p_checksum VARCHAR(64) DEFAULT NULL,
        p_execution_time_ms INTEGER DEFAULT NULL
      ) RETURNS VOID AS $$
      BEGIN
        INSERT INTO _migrations (migration_name, checksum, execution_time_ms)
        VALUES (p_migration_name, p_checksum, p_execution_time_ms)
        ON CONFLICT (migration_name) DO UPDATE SET
          applied_at = now(),
          checksum = EXCLUDED.checksum,
          execution_time_ms = EXCLUDED.execution_time_ms;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await this.client.query(trackingSQL);
      this.log('📊 Migration tracking table ready');
    } catch (error) {
      this.error('Failed to setup migration tracking', error);
      throw error;
    }
  }

  async isMigrationApplied(migrationName) {
    if (this.dryRun) {
      return false; // In dry-run, assume no migrations applied
    }

    try {
      const result = await this.client.query(
        'SELECT applied_at FROM _migrations WHERE migration_name = $1',
        [migrationName]
      );
      return result.rows.length > 0;
    } catch (error) {
      // If _migrations table doesn't exist, assume no migrations applied
      return false;
    }
  }

  generateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  async runMigration(filePath, force = false) {
    const migrationName = path.basename(path.dirname(filePath));
    const startTime = Date.now();
    
    this.log(`🔄 Running migration: ${migrationName}`);
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file not found: ${filePath}`);
      }

      // Read migration file
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = this.generateChecksum(sql);

      // Check if already applied (unless forced)
      if (!force && await this.isMigrationApplied(migrationName)) {
        this.log(`⏭️  Migration already applied: ${migrationName}`);
        return;
      }

      if (this.dryRun) {
        this.log(`🧪 DRY RUN - Would execute migration: ${migrationName}`);
        this.log(`📝 SQL Preview (first 200 chars): ${sql.substring(0, 200)}...`);
        return;
      }

      // Execute migration in transaction
      await this.client.query('BEGIN');
      
      try {
        await this.client.query(sql);
        
        // Record successful migration
        await this.client.query(
          'SELECT record_migration($1, $2, $3)',
          [migrationName, checksum, Date.now() - startTime]
        );
        
        await this.client.query('COMMIT');
        
        const executionTime = Date.now() - startTime;
        this.log(`✅ Migration completed: ${migrationName} (${executionTime}ms)`);
        
      } catch (error) {
        await this.client.query('ROLLBACK');
        throw error;
      }
      
    } catch (error) {
      this.error(`Migration failed: ${migrationName}`, error);
      throw error;
    }
  }

  async runAllMigrations(force = false) {
    this.log('🚀 Starting migration process...');
    
    // Define migration order (CRITICAL - do not change order)
    const migrations = [
      'prisma/migrations/20240807_optimize_queries/migration.sql',
      'prisma/migrations/20240807_rsvp_security_tables/migration.sql',
      'prisma/migrations/20240807_dashboard_performance_indexes/migration.sql',
      'prisma/migrations/20240108_seating_planner/migration.sql',
      'prisma/migrations/20240108_day_of_dashboard/migration.sql',
      'prisma/migrations/20240109_communication_documents/migration.sql'
    ];

    let successCount = 0;
    let skipCount = 0;

    for (const migration of migrations) {
      const fullPath = path.resolve(migration);
      
      if (fs.existsSync(fullPath)) {
        try {
          const migrationName = path.basename(path.dirname(migration));
          
          if (!force && await this.isMigrationApplied(migrationName)) {
            this.log(`⏭️  Skipping already applied: ${migrationName}`);
            skipCount++;
            continue;
          }
          
          await this.runMigration(fullPath, force);
          successCount++;
          
        } catch (error) {
          this.error(`Failed to run migration: ${migration}`, error);
          throw error;
        }
      } else {
        this.log(`⚠️  Migration file not found: ${migration}`);
      }
    }

    this.log(`🎉 Migration process completed!`);
    this.log(`   ✅ Applied: ${successCount}`);
    this.log(`   ⏭️  Skipped: ${skipCount}`);
    
    if (successCount === 0 && skipCount === migrations.length) {
      this.log('📋 All migrations were already applied');
    }
  }

  async getMigrationStatus() {
    try {
      const result = await this.client.query(`
        SELECT 
          migration_name,
          applied_at,
          execution_time_ms,
          checksum
        FROM _migrations 
        ORDER BY applied_at DESC
      `);
      
      this.log('📊 Migration Status:');
      if (result.rows.length === 0) {
        this.log('   No migrations recorded yet');
      } else {
        console.table(result.rows);
      }
      
      return result.rows;
    } catch (error) {
      this.log('📊 Migration tracking table not found - no migrations applied yet');
      return [];
    }
  }

  async validateSchema() {
    try {
      this.log('🔍 Validating schema...');
      
      // Check for required tables
      const requiredTables = [
        'users', 'couples', 'guests', 'vendors',
        'rsvp_rate_limits', 'rsvp_ip_blocklist', 
        'venue_layouts', 'tables', 'timeline_events'
      ];
      
      const result = await this.client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ANY($1)
      `, [requiredTables]);
      
      const existingTables = result.rows.map(row => row.table_name);
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      if (missingTables.length > 0) {
        this.error(`Missing required tables: ${missingTables.join(', ')}`);
        return false;
      }
      
      // Check for required functions
      const functionResult = await this.client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('check_rsvp_rate_limit', 'get_guest_stats', 'get_vendor_stats')
      `);
      
      const existingFunctions = functionResult.rows.map(row => row.routine_name);
      this.log(`✅ Schema validation passed`);
      this.log(`   📋 Tables: ${existingTables.length}/${requiredTables.length} present`);
      this.log(`   ⚙️  Functions: ${existingFunctions.length}/3 present`);
      
      return true;
    } catch (error) {
      this.error('Schema validation failed', error);
      return false;
    }
  }

  async rollbackLastMigration() {
    try {
      const result = await this.client.query(
        'SELECT migration_name FROM _migrations ORDER BY applied_at DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        this.log('📋 No migrations to rollback');
        return;
      }
      
      const lastMigration = result.rows[0].migration_name;
      this.log(`⏪ Rolling back migration: ${lastMigration}`);
      
      // Note: This is a simple implementation - actual rollback would require
      // rollback scripts for each migration
      this.log('⚠️  Rollback functionality requires manual rollback scripts');
      this.log('   Consider creating rollback SQL files for each migration');
      
    } catch (error) {
      this.error('Rollback failed', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Show help without database connection
  if (!command || command === 'help') {
    console.log(`
Usage: node migrate-runner.js <command>

Commands:
  status    - Show migration status
  validate  - Validate schema consistency
  apply     - Apply specific migration file
  full      - Apply all migrations in order
  rollback  - Rollback last migration (requires rollback scripts)

Options:
  --verbose - Show detailed output
  --dry-run - Show what would be executed without running
  --force   - Force re-run already applied migrations

Examples:
  npm run migrate:status
  npm run migrate:full
  npm run migrate:apply -- prisma/migrations/migration.sql
  npm run migrate:validate
    `);
    return;
  }

  const runner = new MigrationRunner();

  try {
    await runner.connect();
    await runner.setupMigrationTracking();

    switch (command) {
      case 'status':
        await runner.getMigrationStatus();
        break;
        
      case 'validate':
        await runner.validateSchema();
        break;
        
      case 'apply':
        const migrationFile = args[1];
        if (!migrationFile) {
          throw new Error('Migration file path required: npm run migrate:apply -- <file>');
        }
        await runner.runMigration(migrationFile, args.includes('--force'));
        break;
        
      case 'full':
        await runner.runAllMigrations(args.includes('--force'));
        break;
        
      case 'rollback':
        await runner.rollbackLastMigration();
        break;
        
      default:
        console.log(`
Usage: node migrate-runner.js <command>

Commands:
  status    - Show migration status
  validate  - Validate schema consistency
  apply     - Apply specific migration file
  full      - Apply all migrations in order
  rollback  - Rollback last migration (requires rollback scripts)

Options:
  --verbose - Show detailed output
  --dry-run - Show what would be executed without running
  --force   - Force re-run already applied migrations

Examples:
  npm run migrate:status
  npm run migrate:full
  npm run migrate:apply -- prisma/migrations/migration.sql
  npm run migrate:validate
        `);
    }
    
  } catch (error) {
    console.error('Migration runner failed:', error.message);
    process.exit(1);
  } finally {
    await runner.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MigrationRunner;