const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    // Try to connect to the database and run a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log('Test query result:', result);
    
    // Try to count users (or any other table)
    try {
      const userCount = await prisma.user.count();
      console.log(`👥 Total users in database: ${userCount}`);
    } catch (e) {
      console.log('ℹ️ Could not count users (table might not exist yet):', e.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.meta) {
      console.error('Error metadata:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
