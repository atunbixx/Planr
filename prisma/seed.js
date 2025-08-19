/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Find or create a seed user
  const email = process.env.SEED_EMAIL || 'seed@example.com'
  const password = process.env.SEED_PASSWORD || 'password123'
  const hashed = await bcrypt.hash(password, 10)

  let user = await prisma.user.findUnique({ where: { email } }).catch(() => null)
  if (!user) {
    user = await prisma.user.create({
      data: { email, password: hashed, role: 'couple', onboardingCompleted: true }
    })
    console.log(`Created user ${email} (password: ${password})`)
  } else {
    console.log(`Using existing user ${email}`)
  }

  // Wedding details
  await prisma.weddingDetails.upsert({
    where: { userId: user.id },
    update: { venue: 'Garden Wedding Venue', weddingDate: new Date('2025-06-15'), budget: 25000, guestCount: 120 },
    create: { userId: user.id, venue: 'Garden Wedding Venue', weddingDate: new Date('2025-06-15'), budget: 25000, guestCount: 120 }
  })

  // Guests
  const guests = [
    { name: 'Alice Johnson', side: 'bride', mealPreference: 'vegetarian' },
    { name: 'Bob Smith', side: 'groom', mealPreference: 'none' },
    { name: 'Carol White', side: 'bride', mealPreference: 'vegan' },
  ]
  for (const g of guests) {
    await prisma.guest.upsert({
      where: { id: `${user.id}_${g.name}`.slice(0, 36) }, // not real unique; using name to avoid duplicates in seed
      update: {},
      create: {
        userId: user.id,
        name: g.name,
        side: g.side,
        mealPreference: g.mealPreference,
        rsvpStatus: 'pending',
        invitationSent: false,
      }
    }).catch(async () => {
      // Fallback create without upsert key hack
      await prisma.guest.create({ data: { userId: user.id, name: g.name, side: g.side, mealPreference: g.mealPreference } })
    })
  }

  // Vendors
  const vendors = [
    { name: 'Sunset Photography', category: 'photographer', status: 'booked' },
    { name: 'Bloom Florals', category: 'florist', status: 'inquiry' },
    { name: 'Grand Catering', category: 'catering', status: 'quoted' },
  ]
  for (const v of vendors) {
    await prisma.vendor.create({ data: { userId: user.id, name: v.name, category: v.category, status: v.status } }).catch(() => {})
  }

  // Budget items
  const budgets = [
    { category: 'Venue', amount: 10000, allocated: 8000, actual: 0, status: 'planned' },
    { category: 'Catering', amount: 8000, allocated: 0, actual: 0, status: 'planned' },
    { category: 'Photography', amount: 3000, allocated: 0, actual: 0, status: 'planned' },
  ]
  for (const b of budgets) {
    await prisma.budget.create({ data: { userId: user.id, ...b } }).catch(() => {})
  }

  console.log('Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

