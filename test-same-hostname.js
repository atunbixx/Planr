const { Client } = require('pg')

async function testSameHostname() {
  // Since REST API works at gpfxxbhowailwllpgphe.supabase.co
  // Maybe the database is at the same hostname (without db. prefix)
  const client = new Client({
    connectionString: "postgresql://postgres:vM2Pn1lCaKsQrnCh@gpfxxbhowailwllpgphe.supabase.co:5432/postgres",
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔍 Testing same hostname as REST API (without db. prefix)...')
    await client.connect()
    console.log('✅ Connected successfully!')
    
    const result = await client.query('SELECT version()')
    console.log('✅ PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...')
    
    console.log('🎉 SUCCESS! Use this hostname: gpfxxbhowailwllpgphe.supabase.co')
    console.log('\nUpdate your .env with:')
    console.log('DATABASE_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@gpfxxbhowailwllpgphe.supabase.co:6543/postgres?pgbouncer=true"')
    console.log('DIRECT_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@gpfxxbhowailwllpgphe.supabase.co:5432/postgres"')
    
  } catch (error) {
    console.error('❌ Same hostname test failed:', error.message)
    console.error('Code:', error.code)
    console.log('\n💡 Please get the correct hostname from your Supabase dashboard.')
  } finally {
    try {
      await client.end()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testSameHostname()