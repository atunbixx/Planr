// Test script to override system environment and use .env.local
console.log('🧪 Testing environment variable override...\n')

// Clear system DATABASE_URL
delete process.env.DATABASE_URL

console.log('System DATABASE_URL cleared')

// Load .env.local explicitly
require('dotenv').config({ path: '.env.local' })

console.log('After loading .env.local:')
console.log('DATABASE_URL:', process.env.DATABASE_URL)

if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co')) {
  console.log('✅ Using Supabase URL correctly')
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('aws')) {
  console.log('❌ Still using AWS URL - system override detected')
} else {
  console.log('❌ No DATABASE_URL found')
}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('\n🔌 Testing database connection...')
    const result = await prisma.$queryRaw`SELECT 1 as test, current_database() as db_name`
    console.log('✅ Database connection successful!')
    console.log('Query result:', result)
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()