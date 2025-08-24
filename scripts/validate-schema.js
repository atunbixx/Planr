#!/usr/bin/env node
/**
 * Schema validation script - validates Prisma schema without database connection
 */

const fs = require('fs')
const path = require('path')

function validateSchema() {
  console.log('🔍 Validating Prisma schema...')
  
  try {
    // Check if schema file exists and is readable
    const schemaPath = path.join(__dirname, '../prisma/schema.prisma')
    const schemaContent = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('✅ Schema file readable')
    
    // Check for required models
    const requiredModels = ['User', 'Invite', 'InviteRSVP', 'CreditBalance', 'Vendor']
    const missingModels = []
    
    for (const model of requiredModels) {
      if (!schemaContent.includes(`model ${model}`)) {
        missingModels.push(model)
      }
    }
    
    if (missingModels.length > 0) {
      throw new Error(`Missing required models: ${missingModels.join(', ')}`)
    }
    
    console.log('✅ All required models present')
    
    // Check for required fields
    const requiredFields = [
      { model: 'User', fields: ['invites', 'inviteRsvps', 'credits'] },
      { model: 'Vendor', fields: ['slug'] },
      { model: 'Invite', fields: ['token', 'country'] },
      { model: 'InviteRSVP', fields: ['status', 'partySize'] },
      { model: 'CreditBalance', fields: ['credits'] }
    ]
    
    for (const { model, fields } of requiredFields) {
      const modelMatch = schemaContent.match(new RegExp(`model ${model}\\s*{([^}]+)}`, 's'))
      if (!modelMatch) {
        throw new Error(`Model ${model} not found`)
      }
      
      const modelContent = modelMatch[1]
      for (const field of fields) {
        if (!modelContent.includes(field)) {
          throw new Error(`Field ${field} missing from model ${model}`)
        }
      }
    }
    
    console.log('✅ All required fields present')
    
    // Check for required indexes
    const requiredIndexes = [
      'invites_token_idx',
      'invite_rsvps_user_idx',
      'vendors_slug_idx'
    ]
    
    for (const index of requiredIndexes) {
      if (!schemaContent.includes(index)) {
        console.warn(`⚠️  Index ${index} not found - may impact performance`)
      }
    }
    
    console.log('✅ Schema validation completed successfully!')
    
    // Check migration files
    const migrationDir = path.join(__dirname, '../prisma/migrations/20250824_000000_rsvp_messaging_system')
    const migrationFiles = ['migration.sql', 'rollback.sql', 'README.md']
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationDir, file)
      if (!fs.existsSync(filePath)) {
        throw new Error(`Migration file ${file} not found`)
      }
    }
    
    console.log('✅ Migration files present')
    
    console.log('🎉 Schema and migration validation completed successfully!')
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  validateSchema()
}

module.exports = { validateSchema }