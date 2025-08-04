const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  try {
    // Extract database credentials from the connection URL
    const dbUrl = new URL(process.env.DATABASE_URL);
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;
    const dbHost = dbUrl.hostname;
    const dbName = dbUrl.pathname.replace(/^\/+/, '');
    const dbPort = dbUrl.port || '5432';

    // Create Supabase client
    const supabaseUrl = `https://${dbHost}`.replace('.supabase.co:5432', '.supabase.co');
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      console.error('❌ SUPABASE_ANON_KEY not found in environment variables');
      return;
    }

    console.log(`🔗 Connecting to Supabase project: ${dbHost.split('.')[0]}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: process.env.SUPABASE_EMAIL || 'test@example.com',
      password: process.env.SUPABASE_PASSWORD || 'test-password',
    });

    if (authError) {
      console.log('ℹ️ Could not authenticate (this is normal for public access):', authError.message);
    } else {
      console.log('✅ Authenticated with Supabase');
    }

    // Test a simple query
    console.log('\n🔍 Testing database connection...');
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      console.error('❌ Database query failed:', error);
      console.log('\nTroubleshooting tips:');
      console.log('1. Check your Supabase project status at https://app.supabase.com/project/' + dbHost.split('.')[0]);
      console.log('2. Verify your DATABASE_URL in .env file');
      console.log('3. Check if Row Level Security (RLS) is enabled and properly configured');
      console.log('4. Try using the connection pooling URL from Supabase dashboard');
    } else {
      console.log('✅ Database connection successful!');
      console.log('Database version:', data);
      
      // Try to list tables (if permissions allow)
      try {
        const { data: tables, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
          
        if (!tablesError && tables && tables.length > 0) {
          console.log('\nTables in your database:');
          console.table(tables.map(t => ({ 'Table Name': t.tablename })));
        }
      } catch (e) {
        console.log('\nCould not list tables (might need RLS adjustment):', e.message);
      }
    }
  } catch (error) {
    console.error('❌ An error occurred:', error);
    console.log('\nPlease check:');
    console.log('1. Your internet connection');
    console.log('2. Supabase project status at https://status.supabase.com/');
    console.log('3. Database credentials in your .env file');
  }
}

testSupabaseConnection();
