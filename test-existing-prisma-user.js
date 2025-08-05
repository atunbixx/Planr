const { Client } = require('pg')

async function testExistingPrismaUser() {
  // Test with existing prisma user
  const client = new Client({
    connectionString: "postgresql://prisma.gpfxxbhowailwllpgphe:PrismaWeddingPlanner2025!@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔍 Testing existing prisma user...')
    
    await client.connect()
    console.log('✅ Prisma user connection successful!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    // Test existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    console.log('✅ Found tables:', tables.rows.map(r => r.table_name))
    
    // Test permissions
    const permissions = await client.query(`
      SELECT table_name, privilege_type 
      FROM information_schema.table_privileges 
      WHERE grantee = 'prisma' 
      AND table_schema = 'public'
      LIMIT 5
    `)
    console.log('✅ Prisma user permissions:', permissions.rows)
    
    console.log('🎉 Existing prisma user works perfectly!')
    
  } catch (error) {
    console.error('❌ Prisma user connection failed:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'XX000' && error.message.includes('Tenant or user not found')) {
      console.log('💡 The prisma user exists but password might be different')
      console.log('💡 Need to check what password was used when it was created')
    }
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testExistingPrismaUser()