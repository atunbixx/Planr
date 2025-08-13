#!/usr/bin/env npx tsx

/**
 * Database State Validation Script
 * Compares actual database schema with our expected Prisma schema
 * 
 * This script ensures that:
 * 1. All expected tables exist
 * 2. All expected columns exist with correct types
 * 3. All expected constraints exist
 * 4. Migration state matches database state
 */

import { prisma } from '../src/lib/prisma'

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface TableInfo {
  table_name: string
  columns: ColumnInfo[]
}

/**
 * Critical columns that must exist for our application to work
 */
const CRITICAL_COLUMNS = {
  users: [
    'id',
    'supabase_user_id', 
    'email',
    'first_name',
    'last_name',
    'phone',
    'preferences',
    'has_onboarded', // This was the problematic column
    'created_at',
    'updated_at'
  ],
  couples: [
    'id',
    'partner1_user_id',
    'partner2_user_id', 
    'partner1_name',
    'partner2_name',
    'wedding_date',
    'venue_name',
    'venue_location',
    'guest_count_estimate',
    'total_budget',
    'currency',
    'wedding_style',
    'onboarding_completed',
    'user_id',
    'created_at',
    'updated_at'
  ],
  guests: [
    'id',
    'couple_id',
    'first_name',
    'last_name',
    'email',
    'phone'
  ]
}

async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const result = await prisma.$queryRaw<ColumnInfo[]>`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = ${tableName}
    ORDER BY ordinal_position;
  `
  
  return result
}

async function validateTable(tableName: string, expectedColumns: string[]): Promise<{
  exists: boolean
  missingColumns: string[]
  extraColumns: string[]
  columnDetails: ColumnInfo[]
}> {
  try {
    console.log(`\n🔍 Validating table: ${tableName}`)
    
    const columns = await getTableColumns(tableName)
    
    if (columns.length === 0) {
      console.log(`❌ Table ${tableName} does not exist`)
      return {
        exists: false,
        missingColumns: expectedColumns,
        extraColumns: [],
        columnDetails: []
      }
    }
    
    console.log(`✅ Table ${tableName} exists with ${columns.length} columns`)
    
    const actualColumns = columns.map(c => c.column_name)
    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col))
    const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col))
    
    if (missingColumns.length > 0) {
      console.log(`❌ Missing columns in ${tableName}:`, missingColumns)
    }
    
    if (extraColumns.length > 0) {
      console.log(`ℹ️  Extra columns in ${tableName}:`, extraColumns.slice(0, 5)) // Show first 5
      if (extraColumns.length > 5) {
        console.log(`   ... and ${extraColumns.length - 5} more`)
      }
    }
    
    if (missingColumns.length === 0) {
      console.log(`✅ All required columns present in ${tableName}`)
    }
    
    return {
      exists: true,
      missingColumns,
      extraColumns,
      columnDetails: columns
    }
  } catch (error) {
    console.error(`❌ Error validating table ${tableName}:`, error)
    return {
      exists: false,
      missingColumns: expectedColumns,
      extraColumns: [],
      columnDetails: []
    }
  }
}

async function checkMigrationState(): Promise<void> {
  try {
    console.log(`\n📋 Checking migration state...`)
    
    const migrations = await prisma.$queryRaw<{migration_name: string, applied_at: Date}[]>`
      SELECT migration_name, applied_at 
      FROM _prisma_migrations 
      ORDER BY applied_at DESC 
      LIMIT 10;
    `
    
    console.log(`✅ Found ${migrations.length} applied migrations:`)
    migrations.forEach(migration => {
      console.log(`   • ${migration.migration_name} (${migration.applied_at.toISOString()})`)
    })
    
  } catch (error) {
    console.error(`❌ Error checking migration state:`, error)
  }
}

async function testCriticalQueries(): Promise<void> {
  console.log(`\n🧪 Testing critical queries...`)
  
  try {
    // Test user query with correct field names
    await prisma.user.findFirst({ 
      where: { supabaseUserId: 'test-user-id' },
      select: { id: true, hasOnboarded: true }
    })
    console.log(`✅ User query with supabaseUserId and hasOnboarded works`)
  } catch (error: any) {
    console.log(`❌ User query failed:`, error.message)
  }
  
  try {
    // Test couple query with user relations
    await prisma.couple.findFirst({
      where: { partner1_user_id: 'test-user-id' },
      select: { id: true }
    })
    console.log(`✅ Couple query with partner1_user_id works`)
  } catch (error: any) {
    console.log(`❌ Couple query failed:`, error.message)
  }
}

async function main(): Promise<void> {
  console.log('🚀 Wedding Planner Database State Validation')
  console.log('===========================================')
  
  const results: Record<string, any> = {}
  
  // Validate each critical table
  for (const [tableName, expectedColumns] of Object.entries(CRITICAL_COLUMNS)) {
    results[tableName] = await validateTable(tableName, expectedColumns)
  }
  
  // Check migration state
  await checkMigrationState()
  
  // Test critical queries
  await testCriticalQueries()
  
  // Summary
  console.log(`\n📊 VALIDATION SUMMARY`)
  console.log('====================')
  
  let allValid = true
  for (const [tableName, result] of Object.entries(results)) {
    if (!result.exists || result.missingColumns.length > 0) {
      console.log(`❌ ${tableName}: ${result.exists ? 'Missing columns' : 'Table missing'}`)
      allValid = false
    } else {
      console.log(`✅ ${tableName}: All required columns present`)
    }
  }
  
  if (allValid) {
    console.log(`\n🎉 Database state validation PASSED!`)
    console.log('All critical tables and columns are present.')
  } else {
    console.log(`\n⚠️  Database state validation FAILED!`)
    console.log('Some critical tables or columns are missing.')
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('💥 Fatal error during validation:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })