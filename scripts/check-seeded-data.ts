import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSeededData() {
  console.log('🔍 Checking seeded data in database...\n')
  
  try {
    // Check Users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerk_user_id: true,
        first_name: true,
        last_name: true,
        email: true
      }
    })
    console.log(`👥 Users found: ${users.length}`)
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.first_name} ${user.last_name} (${user.clerk_user_id})`)
    })

    // Check Couples and their relationships
    const couples = await prisma.couple.findMany({
      select: {
        id: true,
        partner1_name: true,
        partner2_name: true,
        wedding_date: true,
        venue_name: true,
        user_id: true,
        guests: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            attendingCount: true
          }
        },
        vendors: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })
    
    console.log(`\n💑 Couples found: ${couples.length}`)
    couples.forEach((couple, i) => {
      console.log(`   ${i + 1}. ${couple.partner1_name} & ${couple.partner2_name}`)
      console.log(`       Wedding: ${couple.wedding_date?.toDateString()} at ${couple.venue_name}`)
      console.log(`       User ID: ${couple.user_id}`)
      console.log(`       Guests: ${couple.guests.length}`)
      couple.guests.forEach(guest => {
        console.log(`         - ${guest.first_name} ${guest.last_name} (attending: ${guest.attendingCount})`)
      })
      console.log(`       Vendors: ${couple.vendors.length}`)
      couple.vendors.forEach(vendor => {
        console.log(`         - ${vendor.name} (${vendor.status})`)
      })
      console.log('')
    })

    // Check if any User has a matching Couple
    console.log('🔗 Checking User-Couple relationships:')
    for (const user of users) {
      const userCouples = couples.filter(c => c.user_id === user.id)
      console.log(`   ${user.first_name} ${user.last_name} has ${userCouples.length} couple(s)`)
      if (userCouples.length > 0) {
        userCouples.forEach(couple => {
          console.log(`     → ${couple.partner1_name} & ${couple.partner2_name} (${couple.guests.length} guests, ${couple.vendors.length} vendors)`)
        })
      }
    }

    // Test dashboard stats logic manually
    console.log('\n📊 Testing Dashboard Stats Logic:')
    if (users.length > 0 && couples.length > 0) {
      const testUser = users[0]
      console.log(`Testing with user: ${testUser.first_name} ${testUser.last_name} (${testUser.clerk_user_id})`)
      
      // Simulate the dashboard API logic
      const userCouples = couples.filter(c => c.user_id === testUser.id)
      if (userCouples.length > 0) {
        const couple = userCouples[0]
        console.log(`   Found couple: ${couple.partner1_name} & ${couple.partner2_name}`)
        console.log(`   Guests: ${couple.guests.length}`)
        console.log(`   Vendors: ${couple.vendors.length}`)
        
        const guestStats = {
          total: couple.guests.length,
          confirmed: couple.guests.filter(g => g.attendingCount > 0).length,
          pending: couple.guests.filter(g => g.attendingCount === 0).length
        }
        console.log(`   Guest Stats:`, guestStats)
        
        const vendorStats = {
          total: couple.vendors.length,
          potential: couple.vendors.filter(v => v.status === 'potential').length,
          contacted: couple.vendors.filter(v => v.status === 'contacted').length,
          booked: couple.vendors.filter(v => v.status === 'booked').length
        }
        console.log(`   Vendor Stats:`, vendorStats)
      } else {
        console.log('   ❌ No couples found for this user!')
      }
    }

  } catch (error) {
    console.error('❌ Error checking seeded data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSeededData()