const { Client } = require('pg')

async function main() {
  console.log('Starting database migration with pooled connection...')

  // Use the pooled connection from DATABASE_URL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database via pooler')

    // Execute the migration SQL one by one
    console.log('📝 Adding preferences field to users table...')
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" JSONB;')

    console.log('📝 Adding new fields to guests table...')
    
    // Add address field
    await client.query('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "address" TEXT;')
    
    // Add plusOneName field
    await client.query('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "plusOneName" TEXT;')
    
    // Add attendingCount field
    await client.query('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "attendingCount" INTEGER;')
    
    // Add invitationSentAt field
    await client.query('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "invitationSentAt" TIMESTAMP(3);')
    
    // Add rsvpDeadline field
    await client.query('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "rsvpDeadline" TIMESTAMP(3);')

    // Update attendingCount default for existing records
    console.log('📝 Setting default values for new fields...')
    await client.query('UPDATE "guests" SET "attendingCount" = 0 WHERE "attendingCount" IS NULL;')
    
    // Make attendingCount NOT NULL with default
    await client.query('ALTER TABLE "guests" ALTER COLUMN "attendingCount" SET NOT NULL;')
    await client.query('ALTER TABLE "guests" ALTER COLUMN "attendingCount" SET DEFAULT 0;')

    // Handle column renames safely
    console.log('📝 Handling column renames...')
    
    // Check if old columns exist and rename them
    const checkPlusOne = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'guests' AND column_name = 'plusOne';
    `)
    
    if (checkPlusOne.rows.length > 0) {
      console.log('📝 Renaming plusOne to plusOneAllowed...')
      await client.query('ALTER TABLE "guests" RENAME COLUMN "plusOne" TO "plusOneAllowed";')
    } else {
      // Column might already be renamed or not exist, add it if missing
      await client.query('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "plusOneAllowed" BOOLEAN DEFAULT false;')
    }

    const checkDietaryNotes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'guests' AND column_name = 'dietaryNotes';
    `)
    
    if (checkDietaryNotes.rows.length > 0) {
      console.log('📝 Renaming dietaryNotes to dietaryRestrictions...')
      await client.query('ALTER TABLE "guests" RENAME COLUMN "dietaryNotes" TO "dietaryRestrictions";')
    } else {
      // Column might already be renamed or not exist, add it if missing
      await client.query('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "dietaryRestrictions" TEXT;')
    }

    console.log('✅ Database migration completed successfully!')

    // Verify the changes
    console.log('🔍 Verifying migration...')
    const userColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'preferences';
    `)
    
    const guestColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'guests' 
      AND column_name IN ('address', 'plusOneAllowed', 'plusOneName', 'attendingCount', 'invitationSentAt', 'rsvpDeadline', 'dietaryRestrictions');
    `)

    console.log('📊 Migration Results:')
    console.log('Users table - preferences column:', userColumns.rows.length > 0 ? '✅ Added' : '❌ Missing')
    console.log('Guests table - new columns:', guestColumns.rows.length, '/ 7 added')
    
    guestColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })