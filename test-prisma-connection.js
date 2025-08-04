const { PrismaClient } = require('@prisma/client')

// Use the same connection string as in the API
const DATABASE_URL = "postgresql://postgres.gpfxxbhowailwllpgphe:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg4MzIxMiwiZXhwIjoyMDY4NDU5MjEyfQ.JpJUU-ZsuWQjAlTzNysTEGHNoIFnC_5x0CKhzk7H2Xk@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  console.log('🧪 Testing Prisma Connection to Supabase...\n')
  
  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...')
    await prisma.$connect()
    console.log('✅ Connected to database!\n')
    
    // Check if users table exists and count rows
    console.log('2️⃣ Checking users table...')
    const userCount = await prisma.user.count()
    console.log(`✅ Users table exists with ${userCount} records\n`)
    
    // Check if couples table exists and count rows
    console.log('3️⃣ Checking couples table...')
    const coupleCount = await prisma.couple.count()
    console.log(`✅ Couples table exists with ${coupleCount} records\n`)
    
    // Try to fetch a sample user
    console.log('4️⃣ Fetching sample user...')
    const sampleUser = await prisma.user.findFirst()
    if (sampleUser) {
      console.log('✅ Sample user:', {
        id: sampleUser.id,
        email: sampleUser.email,
        clerk_user_id: sampleUser.clerk_user_id
      })
    } else {
      console.log('ℹ️ No users found in database')
    }
    
    console.log('\n🎉 All tests passed! Prisma is properly configured with Supabase.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
    
    if (error.message.includes('Tenant or user not found')) {
      console.log('\n💡 This error suggests the database password might be incorrect.')
      console.log('   Please verify your Supabase service role key in the connection string.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()