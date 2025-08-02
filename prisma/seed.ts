import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a sample couple
  const couple = await prisma.couples.create({
    data: {
      partner1_name: 'Alice Johnson',
      partner2_name: 'Bob Smith',
    },
  })

  console.log('✅ Created couple:', couple.id)

  // Create sample vendors
  const vendors = await Promise.all([
    prisma.vendors.create({
      data: {
        couple_id: couple.id,
        name: 'Elegant Photography',
        business_name: 'Elegant Photography Studio',
        category: 'photography',
        status: 'booked',
        email: 'info@elegantphotography.com',
        phone: '+1-555-0123',
        estimated_cost: 3500,
        actual_cost: 3500,
        contract_signed: true,
        rating: 5,
      },
    }),
    prisma.vendors.create({
      data: {
        couple_id: couple.id,
        name: 'Delicious Catering',
        business_name: 'Delicious Catering Co.',
        category: 'catering',
        status: 'quoted',
        email: 'contact@deliciouscatering.com',
        phone: '+1-555-0456',
        estimated_cost: 8000,
        actual_cost: 8000,
        contract_signed: false,
        rating: 4,
      },
    }),
    prisma.vendors.create({
      data: {
        couple_id: couple.id,
        name: 'Bloom Florists',
        business_name: 'Bloom & Blossom Florists',
        category: 'florist',
        status: 'researching',
        email: 'hello@bloomflorists.com',
        phone: '+1-555-0789',
        estimated_cost: 2000,
        actual_cost: 0,
        contract_signed: false,
        rating: 0,
      },
    }),
  ])

  console.log('✅ Created vendors:', vendors.length)

  // Create sample budget categories
  const budgetCategories = await Promise.all([
    prisma.budget_categories.create({
      data: {
        couple_id: couple.id,
        name: 'Photography',
        allocated_amount: 4000,
        spent_amount: 3500,
      },
    }),
    prisma.budget_categories.create({
      data: {
        couple_id: couple.id,
        name: 'Catering',
        allocated_amount: 10000,
        spent_amount: 8000,
      },
    }),
    prisma.budget_categories.create({
      data: {
        couple_id: couple.id,
        name: 'Flowers',
        allocated_amount: 2500,
        spent_amount: 0,
      },
    }),
  ])

  console.log('✅ Created budget categories:', budgetCategories.length)

  // Create sample guests
  const guests = await Promise.all([
    prisma.guests.create({
      data: {
        couple_id: couple.id,
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah@example.com',
        category: 'family',
      },
    }),
    prisma.guests.create({
      data: {
        couple_id: couple.id,
        first_name: 'Mike',
        last_name: 'Davis',
        email: 'mike@example.com',
        category: 'friends',
      },
    }),
  ])

  console.log('✅ Created guests:', guests.length)

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.tasks.create({
      data: {
        couple_id: couple.id,
        title: 'Finalize photographer contract',
        description: 'Review and sign the photography contract',
        category: 'planning',
        priority: 'high',
        due_date: new Date('2025-03-15'),
        completed: true,
        completed_date: new Date('2025-02-15'),
      },
    }),
    prisma.tasks.create({
      data: {
        couple_id: couple.id,
        title: 'Book florist consultation',
        description: 'Schedule consultation with Bloom Florists',
        category: 'planning',
        priority: 'medium',
        due_date: new Date('2025-03-30'),
        completed: false,
      },
    }),
  ])

  console.log('✅ Created tasks:', tasks.length)

  // Create sample timeline items
  const timelineItems = await Promise.all([
    prisma.timeline_items.create({
      data: {
        couple_id: couple.id,
        title: 'Wedding Ceremony',
        description: 'Main wedding ceremony',
        start_time: new Date('2025-12-15T14:00:00'),
        end_time: new Date('2025-12-15T15:00:00'),
        location: 'Grand Ballroom',
      },
    }),
    prisma.timeline_items.create({
      data: {
        couple_id: couple.id,
        title: 'Reception',
        description: 'Wedding reception and dinner',
        start_time: new Date('2025-12-15T18:00:00'),
        end_time: new Date('2025-12-15T23:00:00'),
        location: 'Grand Ballroom',
      },
    }),
  ])

  console.log('✅ Created timeline items:', timelineItems.length)

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
