const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔍 Testing FIXED database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Connected to database successfully!')
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query test successful:', result)
    
    console.log('🎉 Database connection is working perfectly!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.error('Error details:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()