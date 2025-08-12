import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample data arrays
const VENDOR_CATEGORIES = [
  { name: 'Venue', icon: '🏛️', color: '#e74c3c', description: 'Reception and ceremony venues' },
  { name: 'Catering', icon: '🍽️', color: '#f39c12', description: 'Food and beverage services' },
  { name: 'Photography', icon: '📸', color: '#3498db', description: 'Photography and videography' },
  { name: 'Flowers', icon: '🌸', color: '#e91e63', description: 'Florists and floral arrangements' },
  { name: 'Music', icon: '🎵', color: '#9c27b0', description: 'DJs and live music' },
  { name: 'Transportation', icon: '🚗', color: '#2ecc71', description: 'Transportation and limousines' },
  { name: 'Decoration', icon: '🎨', color: '#f1c40f', description: 'Wedding decorations and styling' }
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

function getRandomDate(daysFromNow: number = 365) {
  const now = new Date()
  const randomDays = Math.floor(Math.random() * daysFromNow)
  const date = new Date(now)
  date.setDate(date.getDate() + randomDays)
  return date
}

function getRandomPastDate(daysAgo: number = 30) {
  const now = new Date()
  const randomDays = Math.floor(Math.random() * daysAgo)
  const date = new Date(now)
  date.setDate(date.getDate() - randomDays)
  return date
}

async function main() {
  console.log('🌱 Creating comprehensive test data for Atunbi Adesanmi...')
  
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
      
      // Ask if we should clean up first
      console.log('🧹 Cleaning up existing couple data to start fresh...')
      
      // Delete related records first (foreign key constraints)
      await prisma.guest.deleteMany({ where: { couple_id: existingCouple.id } })
      await prisma.vendor.deleteMany({ where: { couple_id: existingCouple.id } })
      await prisma.tasks.deleteMany({ where: { couple_id: existingCouple.id } })
      await prisma.message.deleteMany({ where: { couple_id: existingCouple.id } })
      await prisma.activity_feed.deleteMany({ where: { couple_id: existingCouple.id } })
      await prisma.notifications.deleteMany({ where: { couple_id: existingCouple.id } })
      
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

    // Create Atunbi's couple with comprehensive wedding details
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

    // Create 15 comprehensive vendors across all categories
    console.log('🏪 Creating 15 vendors across all categories...')
    const vendorData = [
      // Venues
      { name: 'The Grand Ballroom', category: 'Venue', status: 'booked', priority: 'high', cost: 18000, contact: 'Sarah Williams' },
      { name: 'Garden Pavilion Backup', category: 'Venue', status: 'contacted', priority: 'medium', cost: 15000, contact: 'James Miller' },
      
      // Catering
      { name: 'Elite Catering Co.', category: 'Catering', status: 'booked', priority: 'high', cost: 12000, contact: 'Maria Rodriguez' },
      { name: 'Gourmet Events', category: 'Catering', status: 'potential', priority: 'low', cost: 10000, contact: 'David Chen' },
      
      // Photography
      { name: 'Timeless Memories Photography', category: 'Photography', status: 'booked', priority: 'high', cost: 4500, contact: 'Emma Johnson' },
      { name: 'Artistic Visions', category: 'Photography', status: 'contacted', priority: 'medium', cost: 3800, contact: 'Alex Thompson' },
      
      // Flowers
      { name: 'Bella Rosa Florists', category: 'Flowers', status: 'booked', priority: 'high', cost: 2800, contact: 'Isabella Garcia' },
      { name: 'Garden Dreams', category: 'Flowers', status: 'potential', priority: 'medium', cost: 2200, contact: 'Sophie Davis' },
      { name: 'Wildflower Studio', category: 'Flowers', status: 'potential', priority: 'low', cost: 1800, contact: 'Lily Anderson' },
      
      // Music
      { name: 'Harmony Wedding Band', category: 'Music', status: 'contacted', priority: 'high', cost: 3200, contact: 'Michael Brown' },
      { name: 'DJ Supreme Events', category: 'Music', status: 'potential', priority: 'medium', cost: 1800, contact: 'Chris Wilson' },
      
      // Transportation
      { name: 'Luxury Limos SF', category: 'Transportation', status: 'contacted', priority: 'medium', cost: 800, contact: 'Robert Taylor' },
      { name: 'Classic Car Rentals', category: 'Transportation', status: 'potential', priority: 'low', cost: 1200, contact: 'Thomas White' },
      
      // Decoration
      { name: 'Elegant Occasions Decor', category: 'Decoration', status: 'contacted', priority: 'high', cost: 2500, contact: 'Grace Martinez' },
      { name: 'Creative Celebrations', category: 'Decoration', status: 'potential', priority: 'medium', cost: 2000, contact: 'Anna Jackson' }
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
          address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomItem(['Main', 'Oak', 'Pine', 'First', 'Market', 'Union', 'Mission'])} St, San Francisco, CA`,
          category_id: category.id,
          status: vendor.status,
          priority: vendor.priority,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars for good vendors
          estimated_cost: vendor.cost,
          actual_cost: vendor.status === 'booked' ? vendor.cost : null,
          notes: `Professional ${vendor.category.toLowerCase()} vendor. ${vendor.status === 'booked' ? 'CONFIRMED - Contract signed.' : vendor.status === 'contacted' ? 'Waiting for response to inquiry.' : 'Potential option - need to reach out.'}`
        }
      })
    }
    console.log(`✅ Created ${vendorData.length} vendors`)

    // Create 20 diverse guests (bride's side, groom's side, mixed relationships)
    console.log('👥 Creating 20 diverse wedding guests...')
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
      { name: 'Samantha Davis', relationship: 'Childhood Friend', side: 'bride', attending: 1 },
      { name: 'Nicole Thompson', relationship: 'Friend', side: 'bride', attending: 0 }, // Can't attend
      
      // Groom's family
      { name: 'Robert Thompson', relationship: 'Father', side: 'groom', attending: 2, vip: true },
      { name: 'Linda Thompson', relationship: 'Mother', side: 'groom', attending: 2, vip: true },
      { name: 'Kevin Thompson', relationship: 'Brother', side: 'groom', attending: 1, vip: true },
      { name: 'Margaret Thompson', relationship: 'Grandmother', side: 'groom', attending: 1, dietary: 'Gluten-free' },
      { name: 'John Thompson', relationship: 'Uncle', side: 'groom', attending: 2 },
      
      // Groom's friends
      { name: 'Andrew Martinez', relationship: 'Best Friend', side: 'groom', attending: 2, vip: true },
      { name: 'Brandon Lee', relationship: 'College Friend', side: 'groom', attending: 2 },
      { name: 'Carlos Rodriguez', relationship: 'Work Friend', side: 'groom', attending: 1 },
      { name: 'Daniel Kim', relationship: 'Childhood Friend', side: 'groom', attending: 2 },
      { name: 'Eric Wilson', relationship: 'Friend', side: 'groom', attending: 1 }
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
          address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomItem(['Elm', 'Maple', 'Cedar', 'Birch', 'Willow', 'Oak', 'Pine'])} ${getRandomItem(['Ave', 'St', 'Dr', 'Rd'])}, ${getRandomItem(['San Francisco, CA', 'Oakland, CA', 'Berkeley, CA', 'San Jose, CA'])}`,
          relationship: guest.relationship,
          side: guest.side,
          plus_one_allowed: guest.attending === 2,
          plus_one_name: guest.attending === 2 ? `${getRandomName().first} ${lastName}` : null,
          dietary_restrictions: guest.dietary || null,
          attendingCount: guest.attending,
          notes: guest.vip ? 'VIP guest - special seating arrangement' : null
        }
      })
    }
    console.log(`✅ Created ${guestData.length} guests`)

    // Create 12 comprehensive wedding tasks
    console.log('📋 Creating 12 wedding planning tasks...')
    const taskData = [
      { title: 'Send Save-the-Dates', category: 'Planning', priority: 'high', dueDate: 120, completed: true, cost: 150 },
      { title: 'Order Wedding Dress & Alterations', category: 'Planning', priority: 'high', dueDate: 90, completed: true, cost: 2500 },
      { title: 'Book Honeymoon Flights & Hotel', category: 'Planning', priority: 'high', dueDate: 60, completed: false, cost: 4500 },
      { title: 'Send Wedding Invitations', category: 'Guests', priority: 'high', dueDate: 45, completed: false, cost: 300 },
      { title: 'Finalize Wedding Menu Tasting', category: 'Vendors', priority: 'high', dueDate: 30, completed: false, cost: 0 },
      { title: 'Order Wedding Cake', category: 'Vendors', priority: 'medium', dueDate: 30, completed: false, cost: 800 },
      { title: 'Get Marriage License', category: 'Legal', priority: 'high', dueDate: 14, completed: false, cost: 100 },
      { title: 'Confirm Final Guest Count', category: 'Guests', priority: 'high', dueDate: 21, completed: false, cost: 0 },
      { title: 'Plan Rehearsal Dinner', category: 'Planning', priority: 'medium', dueDate: 21, completed: false, cost: 1200 },
      { title: 'Create Seating Chart', category: 'Planning', priority: 'medium', dueDate: 14, completed: false, cost: 0 },
      { title: 'Prepare Wedding Day Timeline', category: 'Planning', priority: 'medium', dueDate: 7, completed: false, cost: 0 },
      { title: 'Confirm All Vendor Details', category: 'Vendors', priority: 'high', dueDate: 3, completed: false, cost: 0 }
    ]

    for (const task of taskData) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + task.dueDate)
      
      await prisma.tasks.create({
        data: {
          couple_id: couple.id,
          title: task.title,
          description: `Important wedding planning task: ${task.title}. Make sure to complete this before the wedding date.`,
          due_date: dueDate,
          priority: task.priority,
          completed: task.completed,
          category: task.category,
          estimated_duration_minutes: Math.floor(Math.random() * 180) + 60, // 60-240 minutes
          cost: task.cost > 0 ? task.cost : null,
          notes: task.completed ? 'Completed successfully!' : 'Pending completion',
          completed_at: task.completed ? getRandomPastDate(30) : null
        }
      })
    }
    console.log(`✅ Created ${taskData.length} tasks`)

    // Create 8 realistic messages/communications
    console.log('📧 Creating 8 wedding-related messages...')
    const messageData = [
      { sender: 'Sarah Williams', email: 'sarah@grandfairmont.com', subject: 'Wedding Venue Confirmation - June 21st', type: 'vendor', status: 'read' },
      { sender: 'Emma Johnson', email: 'emma@timelessmemories.com', subject: 'Photography Package Details & Timeline', type: 'vendor', status: 'read' },
      { sender: 'Maria Rodriguez', email: 'maria@elitecatering.com', subject: 'Final Menu Selections Due', type: 'vendor', status: 'delivered' },
      { sender: 'Jessica Park', email: 'jessica.park@email.com', subject: 'Bachelorette Party Planning!', type: 'guest', status: 'replied' },
      { sender: 'Michael Brown', email: 'mike@harmonywedding.com', subject: 'Song List & Special Requests', type: 'vendor', status: 'read' },
      { sender: 'Grace Martinez', email: 'grace@elegantoccasions.com', subject: 'Decoration Setup Schedule', type: 'vendor', status: 'sent' },
      { sender: 'Robert Thompson', email: 'robert.thompson@email.com', subject: 'Rehearsal Dinner Guest List', type: 'family', status: 'read' },
      { sender: 'Isabella Garcia', email: 'isabella@bellarosa.com', subject: 'Bridal Bouquet Final Design', type: 'vendor', status: 'delivered' }
    ]

    for (const message of messageData) {
      await prisma.message.create({
        data: {
          couple_id: couple.id,
          sender_id: atunbiUser.id,
          sender_name: message.sender,
          sender_email: message.email,
          recipient_name: `${atunbiUser.first_name} ${atunbiUser.last_name}`,
          recipient_email: atunbiUser.email!,
          subject: message.subject,
          content: `Hi ${atunbiUser.first_name},\n\nI hope this message finds you well! I wanted to follow up regarding your upcoming wedding.\n\nRegarding: ${message.subject}\n\nPlease let me know if you have any questions or need any clarifications.\n\nBest regards,\n${message.sender}`,
          message_type: message.type,
          status: message.status,
          sent_at: getRandomPastDate(14),
          read_at: ['read', 'replied'].includes(message.status) ? getRandomPastDate(10) : null
        }
      })
    }
    console.log(`✅ Created ${messageData.length} messages`)

    // Create 10 activity feed entries
    console.log('📊 Creating 10 activity feed entries...')
    const activityData = [
      { type: 'vendor', action: 'booked', entity: 'The Grand Ballroom - Venue Confirmed' },
      { type: 'guest', action: 'added', entity: '20 Wedding Guests Added to List' },
      { type: 'vendor', action: 'contacted', entity: 'Harmony Wedding Band - Inquiry Sent' },
      { type: 'task', action: 'completed', entity: 'Wedding Dress Ordered & Fitted' },
      { type: 'vendor', action: 'booked', entity: 'Elite Catering Co. - Menu Confirmed' },
      { type: 'task', action: 'completed', entity: 'Save-the-Dates Sent to All Guests' },
      { type: 'guest', action: 'updated', entity: 'RSVP Responses - 15 Confirmed' },
      { type: 'vendor', action: 'booked', entity: 'Timeless Memories Photography Booked' },
      { type: 'task', action: 'added', entity: 'Marriage License - Added to Timeline' },
      { type: 'budget', action: 'updated', entity: 'Wedding Budget Updated - $65,000' }
    ]

    for (const activity of activityData) {
      await prisma.activity_feed.create({
        data: {
          couple_id: couple.id,
          user_id: atunbiUser.id,
          user_email: atunbiUser.email!,
          user_name: `${atunbiUser.first_name} ${atunbiUser.last_name}`,
          action_type: activity.action,
          entity_type: activity.type,
          entity_id: couple.id,
          entity_name: activity.entity,
          details: {
            description: `${activity.entity} - Wedding planning progress for ${couple.partner1_name} & ${couple.partner2_name}`,
            timestamp: new Date().toISOString(),
            category: activity.type
          },
          is_read: Math.random() > 0.3
        }
      })
    }
    console.log(`✅ Created ${activityData.length} activity feed entries`)

    // Create 6 wedding notifications
    console.log('🔔 Creating 6 wedding notifications...')
    const notificationData = [
      { title: 'Wedding Countdown: 45 Days!', message: 'Your special day is approaching! Review your timeline and vendor confirmations.', type: 'reminder' },
      { title: 'RSVP Update', message: '15 guests have confirmed attendance. 5 responses still pending.', type: 'guest' },
      { title: 'Vendor Message', message: 'New message from Elite Catering Co. regarding menu finalization.', type: 'vendor' },
      { title: 'Task Reminder', message: 'Marriage license appointment is due in 2 weeks.', type: 'task' },
      { title: 'Budget Update', message: 'You\'ve spent $42,500 of your $65,000 budget (65% used).', type: 'budget' },
      { title: 'New RSVP Response', message: 'Jessica Park just confirmed attendance with +1.', type: 'guest' }
    ]

    for (const notification of notificationData) {
      await prisma.notifications.create({
        data: {
          couple_id: couple.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: Math.random() > 0.6,
          action_url: `/dashboard/${notification.type}s`
        }
      })
    }
    console.log(`✅ Created ${notificationData.length} notifications`)

    // Final summary
    console.log('\n🎉 Comprehensive wedding data created for Atunbi Adesanmi!')
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
    console.log(`📋 Tasks: ${taskData.length} (${taskData.filter(t => t.completed).length} completed, ${taskData.filter(t => !t.completed).length} pending)`)
    console.log(`📧 Messages: ${messageData.length}`)
    console.log(`📊 Activities: ${activityData.length}`)
    console.log(`🔔 Notifications: ${notificationData.length}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Dashboard should now display all wedding data when logged in as Atunbi!')
    console.log('🚀 Ready for comprehensive wedding planning testing!')

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