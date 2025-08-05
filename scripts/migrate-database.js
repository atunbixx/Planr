const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database migration...')

  try {
    // Check if we can connect to the database
    await prisma.$connect()
    console.log('✅ Connected to database')

    // Execute the migration SQL
    console.log('📝 Adding preferences field to users table...')
    await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" JSONB;`

    console.log('📝 Adding new fields to guests table...')
    
    // Add address field
    await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "address" TEXT;`
    
    // Add plusOneName field
    await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "plusOneName" TEXT;`
    
    // Add attendingCount field
    await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "attendingCount" INTEGER;`
    
    // Add invitationSentAt field
    await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "invitationSentAt" TIMESTAMP(3);`
    
    // Add rsvpDeadline field
    await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "rsvpDeadline" TIMESTAMP(3);`

    // Update attendingCount default for existing records
    console.log('📝 Setting default values for new fields...')
    await prisma.$executeRaw`UPDATE "guests" SET "attendingCount" = 0 WHERE "attendingCount" IS NULL;`
    
    // Make attendingCount NOT NULL with default
    await prisma.$executeRaw`ALTER TABLE "guests" ALTER COLUMN "attendingCount" SET NOT NULL;`
    await prisma.$executeRaw`ALTER TABLE "guests" ALTER COLUMN "attendingCount" SET DEFAULT 0;`

    // Handle column renames safely
    console.log('📝 Handling column renames...')
    
    // Check if old columns exist and rename them
    const checkPlusOne = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'guests' AND column_name = 'plusOne';
    `
    
    if (checkPlusOne.length > 0) {
      console.log('📝 Renaming plusOne to plusOneAllowed...')
      await prisma.$executeRaw`ALTER TABLE "guests" RENAME COLUMN "plusOne" TO "plusOneAllowed";`
    }

    const checkDietaryNotes = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'guests' AND column_name = 'dietaryNotes';
    `
    
    if (checkDietaryNotes.length > 0) {
      console.log('📝 Renaming dietaryNotes to dietaryRestrictions...')
      await prisma.$executeRaw`ALTER TABLE "guests" RENAME COLUMN "dietaryNotes" TO "dietaryRestrictions";`
    }

    console.log('✅ Database migration completed successfully!')

    // Verify the changes
    console.log('🔍 Verifying migration...')
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'preferences';
    `
    
    const guestColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'guests' 
      AND column_name IN ('address', 'plusOneAllowed', 'plusOneName', 'attendingCount', 'invitationSentAt', 'rsvpDeadline', 'dietaryRestrictions');
    `

    console.log('📊 Migration Results:')
    console.log('Users table - preferences column:', userColumns.length > 0 ? '✅ Added' : '❌ Missing')
    console.log('Guests table - new columns:', guestColumns.length, '/ 7 added')
    
    guestColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })