const { PrismaClient } = require('@prisma/client')

async function testPrismaConnection() {
  const prisma = new PrismaClient()

  try {
    console.log('🔍 Testing Prisma client connection...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Prisma client connected successfully!')
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('✅ Database query successful:', result[0].version.substring(0, 50) + '...')
    
    // Check if our User table exists and try to query it
    try {
      const userCount = await prisma.user.count()
      console.log('✅ User table accessible, count:', userCount)
    } catch (error) {
      console.log('⚠️ User table not yet created (expected for first run)')
    }
    
    console.log('🎉 Prisma is working perfectly!')
    console.log('Ready to start the development server!')
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaConnection()