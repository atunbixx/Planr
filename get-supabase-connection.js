// Script to help identify the correct Supabase connection string
console.log('🔍 Finding your correct Supabase connection string...\n')

console.log('Step 1: Go to your Supabase Dashboard:')
console.log('https://supabase.com/dashboard/project/gpfxxbhowailwllpgphe/settings/database\n')

console.log('Step 2: Look for "Connection Info" section')
console.log('Find: "Connection string (URI)"\n')

console.log('Step 3: The correct format should be:')
console.log('postgresql://postgres:[YOUR_PASSWORD]@[ACTUAL_HOST]:6543/postgres\n')

console.log('Common Supabase hostname formats:')
console.log('✅ aws-0-[region].pooler.supabase.com')
console.log('✅ [region]-[number].supabase.co') 
console.log('✅ [project-id].supabase.co (without db. prefix)')
console.log('❌ db.[project-id].supabase.co (this is NOT valid)\n')

console.log('Step 4: Once you get the hostname, update your .env:')
console.log('DATABASE_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@[ACTUAL_HOST]:6543/postgres?pgbouncer=true"')
console.log('DIRECT_URL="postgresql://postgres:vM2Pn1lCaKsQrnCh@[ACTUAL_HOST]:5432/postgres"')

console.log('\n💡 Tip: The hostname should NOT start with "db." - that\'s the issue!')