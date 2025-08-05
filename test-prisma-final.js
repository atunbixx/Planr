const { Client } = require('pg')

async function testPrismaFinal() {
  console.log('🔍 Testing prisma user with proper SSL and wait time...')
  
  // Wait a moment for permission changes to propagate
  console.log('⏳ Waiting for permission changes to propagate...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const client = new Client({
    connectionString: "postgresql://prisma.gpfxxbhowailwllpgphe:PrismaWeddingPlanner2025!@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔗 Attempting connection...')
    
    await client.connect()
    console.log('✅ SUCCESS! Prisma user connected!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    // Test creating a simple table to verify permissions
    await client.query('CREATE TABLE IF NOT EXISTS test_prisma_permissions (id SERIAL PRIMARY KEY, test_column TEXT)')
    console.log('✅ Table creation successful - permissions work!')
    
    await client.query('DROP TABLE IF EXISTS test_prisma_permissions')
    console.log('✅ Table cleanup successful!')
    
    console.log('🎉 PERFECT! Ready for Prisma migrations!')
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'XX000') {
      console.log('\n💡 Still getting "Tenant or user not found"')
      console.log('💡 This might be a connection pooler configuration issue')
      console.log('💡 Let\'s try the direct connection instead of pooler')
    }
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testPrismaFinal()