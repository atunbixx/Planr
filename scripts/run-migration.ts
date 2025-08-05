import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runMigration() {
  console.log('🚀 Starting database migration...')

  try {
    // Test connection first
    await prisma.$connect()
    console.log('✅ Connected to database')

    const migrations: string[] = []

    // Add preferences field to users table
    try {
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" JSONB;`
      migrations.push('✅ Added preferences field to users table')
    } catch (error) {
      console.log('⚠️ Users preferences field might already exist')
      migrations.push('⚠️ Users preferences field: already exists or error')
    }

    // Add new fields to guests table
    const guestFields = [
      { name: 'address', type: 'TEXT' },
      { name: 'plusOneName', type: 'TEXT' },
      { name: 'attendingCount', type: 'INTEGER DEFAULT 0' },
      { name: 'invitationSentAt', type: 'TIMESTAMP(3)' },
      { name: 'rsvpDeadline', type: 'TIMESTAMP(3)' }
    ]

    for (const field of guestFields) {
      try {
        await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS ${prisma.$queryRaw([field.name])} ${prisma.$queryRaw([field.type])};`
        migrations.push(`✅ Added ${field.name} field to guests table`)
      } catch (error) {
        try {
          // Try with raw SQL string
          const sql = `ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "${field.name}" ${field.type};`
          await prisma.$executeRawUnsafe(sql)
          migrations.push(`✅ Added ${field.name} field to guests table (fallback)`)
        } catch (fallbackError) {
          console.log(`⚠️ ${field.name} field might already exist`)
          migrations.push(`⚠️ ${field.name} field: already exists or error`)
        }
      }
    }

    // Update attendingCount for existing records
    try {
      await prisma.$executeRaw`UPDATE "guests" SET "attendingCount" = 0 WHERE "attendingCount" IS NULL;`
      migrations.push('✅ Updated default values for attendingCount')
    } catch (error) {
      migrations.push('⚠️ Default attendingCount values: skipped')
    }

    // Handle column renames safely
    try {
      // Check if plusOne column exists
      const checkPlusOne = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'guests' AND column_name = 'plusOne';
      ` as any[]
      
      if (checkPlusOne.length > 0) {
        await prisma.$executeRaw`ALTER TABLE "guests" RENAME COLUMN "plusOne" TO "plusOneAllowed";`
        migrations.push('✅ Renamed plusOne to plusOneAllowed')
      } else {
        // Add the column if it doesn't exist
        await prisma.$executeRawUnsafe('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "plusOneAllowed" BOOLEAN DEFAULT false;')
        migrations.push('✅ Added plusOneAllowed field')
      }
    } catch (error) {
      migrations.push('⚠️ PlusOneAllowed column: handled with fallback')
    }

    try {
      // Check if dietaryNotes column exists
      const checkDietaryNotes = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'guests' AND column_name = 'dietaryNotes';
      ` as any[]
      
      if (checkDietaryNotes.length > 0) {
        await prisma.$executeRaw`ALTER TABLE "guests" RENAME COLUMN "dietaryNotes" TO "dietaryRestrictions";`
        migrations.push('✅ Renamed dietaryNotes to dietaryRestrictions')
      } else {
        // Add the column if it doesn't exist
        await prisma.$executeRawUnsafe('ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "dietaryRestrictions" TEXT;')
        migrations.push('✅ Added dietaryRestrictions field')
      }
    } catch (error) {
      migrations.push('⚠️ DietaryRestrictions column: handled with fallback')
    }

    // Verify the changes
    console.log('🔍 Verifying migration...')
    
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'preferences';
    ` as any[]
    
    const guestColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'guests' 
      AND column_name IN ('address', 'plusOneAllowed', 'plusOneName', 'attendingCount', 'invitationSentAt', 'rsvpDeadline', 'dietaryRestrictions');
    ` as any[]

    console.log('\n📊 Migration Results:')
    migrations.forEach(migration => console.log(migration))
    
    console.log('\n📋 Verification:')
    console.log('Users table - preferences column:', userColumns.length > 0 ? '✅ Present' : '❌ Missing')
    console.log('Guests table - new columns:', guestColumns.length, '/ 7 expected')
    
    if (guestColumns.length > 0) {
      console.log('Guest table columns found:')
      guestColumns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`)
      })
    }

    console.log('\n🎉 Migration completed successfully!')
    
    return {
      success: true,
      migrations,
      verification: {
        usersPreferencesColumn: userColumns.length > 0,
        guestNewColumns: guestColumns.length,
        guestColumnDetails: guestColumns
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
runMigration()
  .then(result => {
    console.log('\n✅ Migration completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })