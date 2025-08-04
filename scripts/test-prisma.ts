import { prisma } from '../src/lib/prisma'

async function testConnection() {
  try {
    console.log('🔌 Testing Prisma connection...');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Try to query users table
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Try to query couples table  
    const coupleCount = await prisma.couple.count();
    console.log(`✅ Found ${coupleCount} couples in database`);
    
    // Check if message tables exist by trying to count
    try {
      const templateCount = await prisma.messageTemplate.count();
      console.log(`✅ Found ${templateCount} message templates`);
    } catch (error) {
      console.log('⚠️  Message template table does not exist yet');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();