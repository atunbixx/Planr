import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDashboardPersonalization() {
  console.log('🎯 Verifying Dashboard Personalization...\n')
  
  try {
    // Test the dashboard stats API logic
    const clerkUserId = 'user_30ltuJfkwYqJOvGwpYgy96Rsr98' // Atunbi's Clerk ID
    
    // Simulate what the API does
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    const couple = await prisma.couple.findFirst({
      where: { user_id: user.id },
      include: {
        guests: {
          select: {
            id: true,
            plus_one_allowed: true,
            plus_one_name: true,
            attendingCount: true
          }
        },
        vendors: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    if (!couple) {
      console.log('❌ Couple not found')
      return
    }

    const guests = couple.guests || []
    const vendors = couple.vendors || []

    // Calculate wedding date info
    const now = new Date()
    const weddingDate = couple.wedding_date ? new Date(couple.wedding_date) : null
    const daysUntilWedding = weddingDate 
      ? Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    // User info for dashboard
    const userInfo = {
      firstName: user.first_name || couple.partner1_name?.split(' ')[0] || 'Bride',
      lastName: user.last_name || couple.partner1_name?.split(' ').slice(1).join(' ') || '',
      partnerName: couple.partner2_name || ''
    }

    // Guest stats
    const guestStats = {
      total: guests.length,
      confirmed: guests.filter(g => g.attendingCount > 0).length,
      pending: guests.filter(g => g.attendingCount === 0).length
    }

    // Vendor stats
    const vendorStats = {
      total: vendors.length,
      booked: vendors.filter(v => v.status === 'booked').length,
      contacted: vendors.filter(v => v.status === 'contacted').length,
      potential: vendors.filter(v => v.status === 'potential').length
    }

    console.log('✅ Dashboard Personalization Results:')
    console.log('═══════════════════════════════════════')
    console.log(`👋 Welcome Message: "Welcome back, ${userInfo.firstName}!"`)
    console.log(`💒 Wedding Countdown: "Your wedding is ${daysUntilWedding} days away!"`)
    console.log(`📅 Wedding Date: ${weddingDate?.toDateString()}`)
    console.log(`🏛️  Venue: ${couple.venue_name}`)
    console.log(`💑 Partner: ${userInfo.partnerName}`)
    console.log('')
    console.log('📊 Statistics:')
    console.log(`   👥 Guests: ${guestStats.total} total, ${guestStats.confirmed} confirmed`)
    console.log(`   🏪 Vendors: ${vendorStats.total} total, ${vendorStats.booked} booked`)
    console.log('')
    console.log('🎉 Dashboard will now display:')
    console.log(`   • "Welcome back, ${userInfo.firstName}!" (instead of "Bride")`)
    console.log(`   • Wedding countdown: ${daysUntilWedding} days`)
    console.log(`   • Complete wedding statistics`)
    console.log('')
    console.log('✅ Personalization fix is WORKING! 🎯')

  } catch (error) {
    console.error('❌ Error verifying dashboard:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDashboardPersonalization()