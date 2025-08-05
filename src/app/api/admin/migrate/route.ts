import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting database migration...')

    // Execute migration SQL using Prisma's raw query capabilities
    const migrations = []

    try {
      // Add preferences field to users table
      console.log('Adding preferences field to users table...')
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "preferences" JSONB;`
      migrations.push('✅ Added preferences field to users table')
    } catch (error) {
      migrations.push(`⚠️ Users preferences field: ${error}`)
    }

    try {
      // Add address field to guests table
      console.log('Adding address field to guests table...')
      await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "address" TEXT;`
      migrations.push('✅ Added address field to guests table')
    } catch (error) {
      migrations.push(`⚠️ Guests address field: ${error}`)
    }

    try {
      // Add plusOneName field
      console.log('Adding plusOneName field...')
      await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "plusOneName" TEXT;`
      migrations.push('✅ Added plusOneName field to guests table')
    } catch (error) {
      migrations.push(`⚠️ Guests plusOneName field: ${error}`)
    }

    try {
      // Add attendingCount field
      console.log('Adding attendingCount field...')
      await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "attendingCount" INTEGER DEFAULT 0;`
      migrations.push('✅ Added attendingCount field to guests table')
    } catch (error) {
      migrations.push(`⚠️ Guests attendingCount field: ${error}`)
    }

    try {
      // Add invitationSentAt field
      console.log('Adding invitationSentAt field...')
      await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "invitationSentAt" TIMESTAMP(3);`
      migrations.push('✅ Added invitationSentAt field to guests table')
    } catch (error) {
      migrations.push(`⚠️ Guests invitationSentAt field: ${error}`)
    }

    try {
      // Add rsvpDeadline field
      console.log('Adding rsvpDeadline field...')
      await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "rsvpDeadline" TIMESTAMP(3);`
      migrations.push('✅ Added rsvpDeadline field to guests table')
    } catch (error) {
      migrations.push(`⚠️ Guests rsvpDeadline field: ${error}`)
    }

    try {
      // Update attendingCount for existing records
      console.log('Setting default values for attendingCount...')
      await prisma.$executeRaw`UPDATE "guests" SET "attendingCount" = 0 WHERE "attendingCount" IS NULL;`
      migrations.push('✅ Updated default values for attendingCount')
    } catch (error) {
      migrations.push(`⚠️ Default attendingCount values: ${error}`)
    }

    try {
      // Handle column renames - check if old columns exist
      console.log('Checking for column renames...')
      
      const checkPlusOne = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'guests' AND column_name = 'plusOne';
      `
      
      if (Array.isArray(checkPlusOne) && checkPlusOne.length > 0) {
        await prisma.$executeRaw`ALTER TABLE "guests" RENAME COLUMN "plusOne" TO "plusOneAllowed";`
        migrations.push('✅ Renamed plusOne to plusOneAllowed')
      } else {
        // Add the column if it doesn't exist
        await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "plusOneAllowed" BOOLEAN DEFAULT false;`
        migrations.push('✅ Added plusOneAllowed field (column did not exist)')
      }
    } catch (error) {
      migrations.push(`⚠️ PlusOne column handling: ${error}`)
    }

    try {
      const checkDietaryNotes = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'guests' AND column_name = 'dietaryNotes';
      `
      
      if (Array.isArray(checkDietaryNotes) && checkDietaryNotes.length > 0) {
        await prisma.$executeRaw`ALTER TABLE "guests" RENAME COLUMN "dietaryNotes" TO "dietaryRestrictions";`
        migrations.push('✅ Renamed dietaryNotes to dietaryRestrictions')
      } else {
        // Add the column if it doesn't exist
        await prisma.$executeRaw`ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "dietaryRestrictions" TEXT;`
        migrations.push('✅ Added dietaryRestrictions field (column did not exist)')
      }
    } catch (error) {
      migrations.push(`⚠️ DietaryNotes column handling: ${error}`)
    }

    // Verify the changes
    console.log('Verifying migration...')
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

    const verification = {
      usersPreferencesColumn: Array.isArray(userColumns) && userColumns.length > 0,
      guestNewColumns: Array.isArray(guestColumns) ? guestColumns.length : 0,
      guestColumnDetails: guestColumns
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed',
      migrations,
      verification
    })

  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}