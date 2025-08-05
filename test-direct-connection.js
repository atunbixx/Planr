const { Client } = require('pg')

async function testDirectConnection() {
  // According to official Supabase guide, custom users should use direct connection
  // Format: postgresql://prisma.PROJECT_ID:PASSWORD@HOST:5432/postgres
  // But for direct connection, it might be a different hostname
  
  console.log('🔍 Testing direct connection (not pooler) as per Supabase guide...')
  
  // Try the original hostname with custom user (direct connection)
  const client = new Client({
    connectionString: "postgresql://prisma.gpfxxbhowailwllpgphe:PrismaWeddingPlanner2025!@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres",
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('Host: db.gpfxxbhowailwllpgphe.supabase.co (direct)')
    
    await client.connect()
    console.log('✅ SUCCESS! Direct connection with custom user works!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    console.log('🎉 PERFECT! Use direct connection for custom users!')
    
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message)
    console.error('Code:', error.code)
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Still DNS issue with db.gpfxxbhowailwllpgphe.supabase.co')
      console.log('💡 Let me check the official Supabase connection string format')
    }
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testDirectConnection()