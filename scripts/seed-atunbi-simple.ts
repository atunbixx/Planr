import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample data arrays
const VENDOR_CATEGORIES = [
  { name: 'Venue', icon: '🏛️', color: '#e74c3c', description: 'Reception and ceremony venues' },
  { name: 'Catering', icon: '🍽️', color: '#f39c12', description: 'Food and beverage services' },
  { name: 'Photography', icon: '📸', color: '#3498db', description: 'Photography and videography' },
  { name: 'Flowers', icon: '🌸', color: '#e91e63', description: 'Florists and floral arrangements' },
  { name: 'Music', icon: '🎵', color: '#9c27b0', description: 'DJs and live music' }
]

const SAMPLE_NAMES = {
  first: ['Emma', 'James', 'Olivia', 'William', 'Sophia', 'Alexander', 'Isabella', 'Michael', 'Charlotte', 'Daniel', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Anna', 'Mike', 'Grace', 'Ryan'],
  last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore']
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomName() {
  return {
    first: getRandomItem(SAMPLE_NAMES.first),
    last: getRandomItem(SAMPLE_NAMES.last)
  }
}

async function main() {
  console.log('🌱 Creating simple wedding data for Atunbi Adesanmi...')
  
  try {
    // Find Atunbi's user record
    const atunbiUser = await prisma.user.findFirst({
      where: {
        OR: [
          { first_name: 'Atunbi' },
          { last_name: 'Adesanmi' },
          { email: { contains: 'atunbi' } }
        ]
      }
    })

    if (!atunbiUser) {
      console.error('❌ Could not find Atunbi Adesanmi in the database')
      console.log('Available users:')
      const allUsers = await prisma.user.findMany({
        select: { first_name: true, last_name: true, email: true, clerk_user_id: true }
      })
      allUsers.forEach(user => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.email}) - ${user.clerk_user_id}`)
      })
      return
    }

    console.log(`✅ Found user: ${atunbiUser.first_name} ${atunbiUser.last_name} (${atunbiUser.email})`)
    console.log(`   Clerk ID: ${atunbiUser.clerk_user_id}`)

    // Check if Atunbi already has a couple
    const existingCouple = await prisma.couple.findFirst({
      where: { user_id: atunbiUser.id },
      include: {
        guests: true,
        vendors: true
      }
    })

    if (existingCouple) {
      console.log(`⚠️  User already has a couple: ${existingCouple.partner1_name} & ${existingCouple.partner2_name}`)
      console.log(`   Existing guests: ${existingCouple.guests.length}`)
      console.log(`   Existing vendors: ${existingCouple.vendors.length}`)
      
      // Clean up existing data to start fresh
      console.log('🧹 Cleaning up existing couple data to start fresh...')
      
      // Delete related records first (foreign key constraints)
      await prisma.guest.deleteMany({ where: { couple_id: existingCouple.id } })
      await prisma.vendor.deleteMany({ where: { couple_id: existingCouple.id } })
      
      // Delete the couple
      await prisma.couple.delete({ where: { id: existingCouple.id } })
      
      console.log('✅ Cleaned up existing data')
    }

    // Create or update Vendor Categories
    console.log('🏷️ Setting up vendor categories...')
    const vendorCategories = []
    for (const category of VENDOR_CATEGORIES) {
      const vendorCategory = await prisma.vendor_categories.upsert({
        where: { name: category.name },
        update: category,
        create: category
      })
      vendorCategories.push(vendorCategory)
    }
    console.log(`✅ Setup ${vendorCategories.length} vendor categories`)

    // Create Atunbi's couple
    console.log('💑 Creating Atunbi\'s wedding couple...')
    const couple = await prisma.couple.create({
      data: {
        user_id: atunbiUser.id,
        partner1_name: `${atunbiUser.first_name} ${atunbiUser.last_name}`, // The bride
        partner2_name: 'Michael Thompson', // Partner
        wedding_date: new Date('2025-06-21'), // Summer wedding
        venue_name: 'The Grand Ballroom at Fairmont',
        venue_location: 'San Francisco, CA',
        guest_count_estimate: 150,
        total_budget: 65000,
        currency: 'USD',
        wedding_style: 'elegant',
        onboarding_completed: true
      }
    })
    console.log(`✅ Created couple: ${couple.partner1_name} & ${couple.partner2_name}`)
    console.log(`   Wedding: ${couple.wedding_date?.toDateString()} at ${couple.venue_name}`)
    console.log(`   Budget: $${couple.total_budget?.toLocaleString()}`)

    // Create 10 vendors
    console.log('🏪 Creating 10 wedding vendors...')
    const vendorData = [
      { name: 'The Grand Ballroom', category: 'Venue', status: 'booked', priority: 'high', cost: 18000, contact: 'Sarah Williams' },
      { name: 'Garden Pavilion', category: 'Venue', status: 'contacted', priority: 'medium', cost: 15000, contact: 'James Miller' },
      { name: 'Elite Catering Co.', category: 'Catering', status: 'booked', priority: 'high', cost: 12000, contact: 'Maria Rodriguez' },
      { name: 'Gourmet Events', category: 'Catering', status: 'potential', priority: 'medium', cost: 10000, contact: 'David Chen' },
      { name: 'Timeless Photography', category: 'Photography', status: 'booked', priority: 'high', cost: 4500, contact: 'Emma Johnson' },
      { name: 'Artistic Visions', category: 'Photography', status: 'contacted', priority: 'medium', cost: 3800, contact: 'Alex Thompson' },
      { name: 'Bella Rosa Florists', category: 'Flowers', status: 'booked', priority: 'high', cost: 2800, contact: 'Isabella Garcia' },
      { name: 'Garden Dreams', category: 'Flowers', status: 'potential', priority: 'medium', cost: 2200, contact: 'Sophie Davis' },
      { name: 'Harmony Wedding Band', category: 'Music', status: 'contacted', priority: 'high', cost: 3200, contact: 'Michael Brown' },
      { name: 'DJ Supreme Events', category: 'Music', status: 'potential', priority: 'medium', cost: 1800, contact: 'Chris Wilson' }
    ]

    for (const vendor of vendorData) {
      const category = vendorCategories.find(cat => cat.name === vendor.category)
      if (!category) continue
      
      await prisma.vendor.create({
        data: {
          couple_id: couple.id,
          name: vendor.name,
          contact_name: vendor.contact,
          phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          email: `${vendor.contact.toLowerCase().replace(' ', '.')}@${vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          website: `https://www.${vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomItem(['Main', 'Oak', 'Pine', 'First', 'Market'])} St, San Francisco, CA`,
          category_id: category.id,
          status: vendor.status,
          priority: vendor.priority,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          estimated_cost: vendor.cost,
          actual_cost: vendor.status === 'booked' ? vendor.cost : null,
          notes: `Professional ${vendor.category.toLowerCase()} vendor. ${vendor.status === 'booked' ? 'CONFIRMED - Contract signed.' : vendor.status === 'contacted' ? 'Waiting for response.' : 'Potential option.'}`
        }
      })
    }
    console.log(`✅ Created ${vendorData.length} vendors`)

    // Create 15 wedding guests
    console.log('👥 Creating 15 wedding guests...')
    const guestData = [
      // Bride's family (Atunbi's side)
      { name: 'Adebayo Adesanmi', relationship: 'Father', side: 'bride', attending: 2, vip: true },
      { name: 'Folake Adesanmi', relationship: 'Mother', side: 'bride', attending: 2, vip: true },
      { name: 'Kemi Adesanmi-Johnson', relationship: 'Sister', side: 'bride', attending: 2, vip: true },
      { name: 'Tunde Adesanmi', relationship: 'Brother', side: 'bride', attending: 2, vip: true },
      { name: 'Bisi Adewale', relationship: 'Aunt', side: 'bride', attending: 2, dietary: 'Vegetarian' },
      
      // Bride's friends
      { name: 'Jessica Park', relationship: 'Best Friend', side: 'bride', attending: 2, vip: true },
      { name: 'Rachel Green', relationship: 'College Friend', side: 'bride', attending: 1 },
      { name: 'Monica Chen', relationship: 'Work Colleague', side: 'bride', attending: 2 },
      { name: 'Samantha Davis', relationship: 'Childhood Friend', side: 'bride', attending: 0 }, // Can't attend
      
      // Groom's family
      { name: 'Robert Thompson', relationship: 'Father', side: 'groom', attending: 2, vip: true },
      { name: 'Linda Thompson', relationship: 'Mother', side: 'groom', attending: 2, vip: true },
      { name: 'Kevin Thompson', relationship: 'Brother', side: 'groom', attending: 1, vip: true },
      
      // Groom's friends
      { name: 'Andrew Martinez', relationship: 'Best Friend', side: 'groom', attending: 2, vip: true },
      { name: 'Brandon Lee', relationship: 'College Friend', side: 'groom', attending: 2 },
      { name: 'Carlos Rodriguez', relationship: 'Work Friend', side: 'groom', attending: 1 }
    ]

    for (const guest of guestData) {
      const [firstName, lastName] = guest.name.split(' ')
      
      await prisma.guest.create({
        data: {
          couple_id: couple.id,
          first_name: firstName,
          last_name: lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomItem(['Elm', 'Maple', 'Cedar', 'Oak'])} ${getRandomItem(['Ave', 'St'])}, San Francisco, CA`,
          relationship: guest.relationship,
          side: guest.side,
          plus_one_allowed: guest.attending === 2,
          plus_one_name: guest.attending === 2 ? `Guest ${lastName}` : null,
          dietary_restrictions: guest.dietary || null,
          attendingCount: guest.attending,
          notes: guest.vip ? 'VIP guest - special seating' : null
        }
      })
    }
    console.log(`✅ Created ${guestData.length} guests`)

    // Final summary
    console.log('\n🎉 Wedding data created for Atunbi Adesanmi!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 WEDDING PLANNING SUMMARY:')
    console.log(`👤 Bride: ${atunbiUser.first_name} ${atunbiUser.last_name}`)
    console.log(`💑 Couple: ${couple.partner1_name} & ${couple.partner2_name}`)
    console.log(`📅 Wedding Date: ${couple.wedding_date?.toDateString()}`)
    console.log(`🏛️ Venue: ${couple.venue_name}`)
    console.log(`📍 Location: ${couple.venue_location}`)
    console.log(`💰 Budget: $${couple.total_budget?.toLocaleString()}`)
    console.log(`👥 Estimated Guests: ${couple.guest_count_estimate}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 DATA CREATED:')
    console.log(`🏪 Vendors: ${vendorData.length} (${vendorData.filter(v => v.status === 'booked').length} booked, ${vendorData.filter(v => v.status === 'contacted').length} contacted, ${vendorData.filter(v => v.status === 'potential').length} potential)`)
    console.log(`👥 Guests: ${guestData.length} (${guestData.filter(g => g.attending > 0).length} attending, ${guestData.filter(g => g.attending === 0).length} not attending)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Dashboard should now display wedding data when logged in as Atunbi!')
    console.log('🚀 Ready for wedding planning testing!')

  } catch (error) {
    console.error('❌ Error creating wedding data for Atunbi:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })