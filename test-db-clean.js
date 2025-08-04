// Clear any existing environment variables
delete process.env.DATABASE_URL

// Explicitly load .env.local
require('dotenv').config({ path: '.env.local' })

console.log('After loading .env.local:')
console.log('DATABASE_URL:', process.env.DATABASE_URL)

// Now load Prisma
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('\n🧪 Testing clean database connection...')
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test, current_database() as db_name`
    console.log('✅ Database connection successful!')
    console.log('Test query result:', result)
    
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()