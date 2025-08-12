import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createRealUserCouple() {
  console.log('🔄 Creating couple data for real users...')
  
  try {
    // Get real users (not test users)
    const realUsers = await prisma.user.findMany({
      where: {
        clerk_user_id: {
          not: {
            startsWith: 'user_test_'
          }
        }
      }
    })
    
    console.log(`Found ${realUsers.length} real users`)
    
    if (realUsers.length > 0) {
      const user = realUsers[0] // Use first real user
      console.log(`Creating couple for: ${user.first_name} ${user.last_name} (${user.clerk_user_id})`)
      
      // Check if user already has a couple
      const existingCouple = await prisma.couple.findFirst({
        where: { user_id: user.id }
      })
      
      if (existingCouple) {
        console.log('✅ User already has a couple!')
        return
      }
      
      // Create couple
      const couple = await prisma.couple.create({
        data: {
          user_id: user.id,
          partner1_name: `${user.first_name} ${user.last_name}`,
          partner2_name: 'Alex Johnson',
          wedding_date: new Date('2025-12-15'),
          venue_name: 'The Grand Ballroom',
          venue_location: 'San Francisco, CA',
          guest_count_estimate: 120,
          total_budget: 45000,
          currency: 'USD',
          wedding_style: 'modern',
          onboarding_completed: true
        }
      })
      console.log(`✅ Created couple: ${couple.partner1_name} & ${couple.partner2_name}`)
      
      // Get vendor categories
      const vendorCategories = await prisma.vendor_categories.findMany()
      
      // Create 5 vendors for the couple
      console.log('🏪 Creating vendors for the couple...')
      const vendorNames = ['Elite Venue', 'Perfect Catering', 'Dream Photography', 'Royal Flowers', 'Golden Music']
      
      for (let i = 0; i < 5; i++) {
        const category = vendorCategories[i % vendorCategories.length]
        
        await prisma.vendor.create({
          data: {
            couple_id: couple.id,
            name: vendorNames[i],
            contact_name: `Contact Person ${i + 1}`,
            phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            email: `contact${i + 1}@${vendorNames[i].toLowerCase().replace(' ', '')}.com`,
            website: `https://www.${vendorNames[i].toLowerCase().replace(' ', '')}.com`,
            address: `${Math.floor(Math.random() * 9999) + 1} Business St`,
            category_id: category.id,
            status: i === 0 ? 'booked' : i === 1 ? 'contacted' : 'potential',
            priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
            rating: Math.floor(Math.random() * 5) + 1,
            estimated_cost: Math.floor(Math.random() * 5000) + 2000,
            actual_cost: i === 0 ? Math.floor(Math.random() * 5000) + 2000 : null,
            notes: `Professional ${category.name} vendor with excellent reviews.`
          }
        })
      }
      console.log('✅ Created 5 vendors')
      
      // Create 8 guests for the couple
      console.log('👥 Creating guests for the couple...')
      const guestNames = [
        'Sarah Johnson', 'Mike Chen', 'Lisa Wang', 'David Brown',
        'Emily Davis', 'Chris Wilson', 'Anna Miller', 'Tom Garcia'
      ]
      
      for (let i = 0; i < 8; i++) {
        const [firstName, lastName] = guestNames[i].split(' ')
        
        await prisma.guest.create({
          data: {
            couple_id: couple.id,
            first_name: firstName,
            last_name: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
            phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            address: `${Math.floor(Math.random() * 9999) + 1} Guest St`,
            relationship: i < 2 ? 'Family' : i < 4 ? 'Friend' : i < 6 ? 'Colleague' : 'Relative',
            side: i % 2 === 0 ? 'bride' : 'groom',
            plus_one_allowed: i < 4,
            plus_one_name: i < 2 ? `Guest Partner ${i + 1}` : null,
            dietary_restrictions: i === 2 ? 'Vegetarian' : i === 5 ? 'Gluten-free' : null,
            attendingCount: i < 6 ? (i < 2 ? 2 : 1) : 0,
            notes: i < 2 ? 'VIP guest' : null
          }
        })
      }
      console.log('✅ Created 8 guests')
      
      console.log('\n🎉 Successfully created couple data for real user!')
      console.log('📊 Summary:')
      console.log(`👤 User: ${user.first_name} ${user.last_name}`)
      console.log(`💑 Couple: ${couple.partner1_name} & ${couple.partner2_name}`)
      console.log(`🏪 Vendors: 5 (1 booked, 1 contacted, 3 potential)`)
      console.log(`👥 Guests: 8 (6 attending, 2 not attending)`)
      console.log(`💰 Budget: $${couple.total_budget?.toLocaleString()}`)
      console.log(`📅 Wedding: ${couple.wedding_date?.toDateString()}`)
      console.log('\n✅ Dashboard should now show data when logged in!')
      
    } else {
      console.log('❌ No real users found in database')
    }
    
  } catch (error) {
    console.error('❌ Error creating couple for real user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createRealUserCouple()