const { Pool } = require('pg');
require('dotenv').config();

async function testPgConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('Current database time:', result.rows[0].current_time);
    
    // Try to get database version
    const version = await client.query('SELECT version()');
    console.log('Database version:', version.rows[0].version.split(' ').slice(0, 4).join(' '));
    
    // Try to list tables
    try {
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log('\nTables in your database:');
      console.table(tables.rows.map(row => ({ 'Table Name': row.table_name })));
    } catch (e) {
      console.log('\nCould not list tables (you might not have permissions):', e.message);
    }
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting tips:');
    console.log('1. Check if your IP is whitelisted in Supabase dashboard');
    console.log('2. Verify your DATABASE_URL in .env file');
    console.log('3. Check if your Supabase project is active and running');
    console.log('4. Try using the connection pooling URL from Supabase dashboard');
  } finally {
    await pool.end();
  }
}

testPgConnection();
