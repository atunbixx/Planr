const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Read the service role key from the full .env.local file
const envContent = fs.readFileSync('.env.local', 'utf8')
const serviceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/)
const serviceKey = serviceKeyMatch ? serviceKeyMatch[1] : null

if (!supabaseUrl || !serviceKey) {
  console.error('Missing environment variables. Make sure SUPABASE_SERVICE_ROLE_KEY is in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runSetup() {
  console.log('🚀 Setting up SuperAdmin tables...\n')

  // Read the SQL file
  const sqlPath = path.join(__dirname, 'setup-superadmin-tables.sql')
  const sqlContent = fs.readFileSync(sqlPath, 'utf8')

  // Split SQL into individual statements and filter out comments and empty lines
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))

  let successCount = 0
  let errorCount = 0

  for (const statement of statements) {
    if (!statement) continue
    
    try {
      // For the final SELECT statement, we want to see the results
      if (statement.includes('SELECT') && statement.includes('FROM auth.users')) {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          // Try direct query
          const { data: users, error: selectError } = await supabase
            .from('users')
            .select('id, email, created_at')
            .order('created_at', { ascending: false })
            .limit(10)
          
          if (!selectError && users) {
            console.log('\n📋 Your existing users:')
            console.log('ID                                   | Email')
            console.log('-'.repeat(80))
            users.forEach(user => {
              console.log(`${user.id} | ${user.email || 'N/A'}`)
            })
          }
        } else if (data) {
          console.log('\n📋 Your existing users:', data)
        }
      } else {
        // For other statements, just execute them
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          // Some errors are expected (e.g., "already exists")
          if (error.message.includes('already exists')) {
            console.log(`✓ Skipped (already exists): ${statement.substring(0, 50)}...`)
          } else {
            console.error(`✗ Error: ${error.message}`)
            console.error(`  Statement: ${statement.substring(0, 50)}...`)
            errorCount++
          }
        } else {
          successCount++
          console.log(`✓ Executed: ${statement.substring(0, 50)}...`)
        }
      }
    } catch (err) {
      console.error(`✗ Unexpected error: ${err.message}`)
      errorCount++
    }
  }

  console.log(`\n📊 Summary: ${successCount} statements succeeded, ${errorCount} errors`)

  if (errorCount === 0 || (errorCount < 5 && successCount > 10)) {
    console.log('\n✅ SuperAdmin tables setup completed!')
    console.log('\n🔐 Next step: Grant yourself superAdmin access')
    console.log('1. Copy your user ID from the list above')
    console.log('2. Run this SQL in Supabase SQL Editor:')
    console.log("   INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'superAdmin');")
  } else {
    console.log('\n⚠️  Some errors occurred during setup. You may need to run the SQL manually in Supabase.')
  }
}

// Note: Supabase doesn't support direct SQL execution via the client library
// So we'll need to use a different approach
console.log('⚠️  The Supabase client doesn\'t support direct SQL execution.')
console.log('📝 Please run the SQL manually in Supabase SQL Editor:')
console.log('\n1. Go to your Supabase Dashboard')
console.log('2. Navigate to SQL Editor')
console.log('3. Copy and run the contents of: scripts/setup-superadmin-tables.sql')
console.log('\n4. After running the SQL, find your user ID in the output')
console.log('5. Grant yourself superAdmin access with:')
console.log("   INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'superAdmin');")

// Let's at least try to show the current users
async function showUsers() {
  console.log('\n📋 Attempting to fetch your current users...\n')
  
  // We need to query the users table directly
  const { data: couples, error } = await supabase
    .from('couples')
    .select('*')
    .limit(10)
  
  if (!error && couples) {
    console.log('Found couples in the database:')
    couples.forEach(couple => {
      console.log(`- ${couple.partner1_name} & ${couple.partner2_name || 'Partner'} (ID: ${couple.id})`)
    })
    
    console.log('\n💡 Tip: You can find your auth user ID in:')
    console.log('   Supabase Dashboard → Authentication → Users → Your User → User UID')
  }
}

showUsers()