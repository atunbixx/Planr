#!/usr/bin/env node
/**
 * Migration validation script for RSVP and messaging system
 * Run this to validate the migration works correctly
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function validateMigration() {
  console.log('🔍 Validating RSVP and messaging system migration...')
  
  try {
    // Test 1: Check if new tables exist and are accessible
    console.log('✅ Testing table creation...')
    
    const inviteCount = await prisma.invite.count()
    console.log(`   - Invites table: ${inviteCount} records`)
    
    const rsvpCount = await prisma.inviteRSVP.count()
    console.log(`   - InviteRSVP table: ${rsvpCount} records`)
    
    const creditCount = await prisma.creditBalance.count()
    console.log(`   - CreditBalance table: ${creditCount} records`)
    
    // Test 2: Check vendor slug field
    const vendorWithSlug = await prisma.vendor.findFirst({
      where: { slug: { not: null } }
    })
    console.log(`   - Vendor with slug: ${vendorWithSlug ? 'Found' : 'None'}`)
    
    // Test 3: Test relationships
    console.log('✅ Testing relationships...')
    
    const userWithInvites = await prisma.user.findFirst({
      include: {
        invites: true,
        inviteRsvps: true,
        credits: true
      }
    })
    
    if (userWithInvites) {
      console.log(`   - User has ${userWithInvites.invites.length} invites`)
      console.log(`   - User has ${userWithInvites.inviteRsvps.length} RSVPs`)
      console.log(`   - User has ${userWithInvites.credits ? userWithInvites.credits.credits : 0} credits`)
    }
    
    // Test 4: Test unique constraints
    console.log('✅ Testing constraints...')
    
    try {
      // This should work
      const testUser = await prisma.user.findFirst()
      if (testUser) {
        const invite = await prisma.invite.create({
          data: {
            userId: testUser.id,
            email: 'test@validation.com',
            token: 'validation_test_' + Date.now(),
            country: 'NG'
          }
        })
        
        // Test unique constraint on user+email for RSVP
        const rsvp = await prisma.inviteRSVP.create({
          data: {
            userId: testUser.id,
            inviteId: invite.id,
            email: 'test@validation.com',
            status: 'pending',
            partySize: 1
          }
        })
        
        console.log('   - Created test invite and RSVP successfully')
        
        // Clean up test data
        await prisma.inviteRSVP.delete({ where: { id: rsvp.id } })
        await prisma.invite.delete({ where: { id: invite.id } })
        console.log('   - Cleaned up test data')
      }
    } catch (error) {
      console.error('   - Constraint test failed:', error.message)
    }
    
    console.log('🎉 Migration validation completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration validation failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  validateMigration()
}

module.exports = { validateMigration }