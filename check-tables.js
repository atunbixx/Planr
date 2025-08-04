// Clear system environment variable
delete process.env.DATABASE_URL

// Load environment
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...')
    
    // Get all table names
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
    
    console.log('\n📋 Available tables:')
    tables.forEach(table => {
      console.log(`- ${table.table_name}`)
    })
    
    // Try to find user-related tables
    const userTables = tables.filter(table => 
      table.table_name.toLowerCase().includes('user')
    )
    
    if (userTables.length > 0) {
      console.log('\n👤 User-related tables found:')
      userTables.forEach(table => {
        console.log(`- ${table.table_name}`)
      })
      
      // Try to check the first user table
      const userTableName = userTables[0].table_name
      console.log(`\n🔍 Checking records in ${userTableName}...`)
      
      const count = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`"${userTableName}"`)}
      `
      
      console.log(`Found ${count[0].count} records in ${userTableName}`)
      
      if (count[0].count > 0) {
        const records = await prisma.$queryRaw`
          SELECT * FROM ${prisma.$queryRawUnsafe(`"${userTableName}"`)} LIMIT 3
        `
        console.log('\nSample records:')
        console.log(records)
      }
    }
    
    console.log('\n🎉 Database connection and schema check successful!')
    
  } catch (error) {
    console.error('❌ Database operation failed:')
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()