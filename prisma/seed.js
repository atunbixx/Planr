/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Try creating a local seed user if schema supports it
  let user = null
  try {
    const email = process.env.SEED_EMAIL || 'seed@example.com'
    const password = process.env.SEED_PASSWORD || 'password123'
    const hashed = await bcrypt.hash(password, 10)
    user = await prisma.user.findUnique({ where: { email } }).catch(() => null)
    if (!user) {
      user = await prisma.user.create({ data: { email, password: hashed, role: 'couple', onboardingCompleted: true } })
      console.log(`Created user ${email} (password: ${password})`)
    } else {
      console.log(`Using existing user ${email}`)
    }
  } catch (e) {
    console.warn('Skipping seed user creation (schema may differ):', e?.meta?.column || e?.message)
  }

  if (user) {
    try {
      await prisma.weddingDetails.upsert({
        where: { userId: user.id },
        update: { venue: 'Garden Wedding Venue', weddingDate: new Date('2025-06-15'), budget: 25000, guestCount: 120 },
        create: { userId: user.id, venue: 'Garden Wedding Venue', weddingDate: new Date('2025-06-15'), budget: 25000, guestCount: 120 }
      })

      const guests = [
        { name: 'Alice Johnson', side: 'bride', mealPreference: 'vegetarian' },
        { name: 'Bob Smith', side: 'groom', mealPreference: 'none' },
        { name: 'Carol White', side: 'bride', mealPreference: 'vegan' },
      ]
      for (const g of guests) {
        await prisma.guest.create({ data: { userId: user.id, name: g.name, side: g.side, mealPreference: g.mealPreference } }).catch(() => {})
      }

      const vendors = [
        { name: 'Sunset Photography', category: 'photographer', status: 'booked', slug: 'sunset-photography' },
        { name: 'Bloom Florals', category: 'florist', status: 'inquiry', slug: 'bloom-florals' },
        { name: 'Grand Catering', category: 'catering', status: 'quoted', slug: 'grand-catering' },
      ]
      for (const v of vendors) {
        await prisma.vendor.create({ data: { userId: user.id, name: v.name, category: v.category, status: v.status, slug: v.slug } }).catch(() => {})
      }

      const budgets = [
        { category: 'Venue', amount: 10000, allocated: 8000, actual: 0, status: 'planned' },
        { category: 'Catering', amount: 8000, allocated: 0, actual: 0, status: 'planned' },
        { category: 'Photography', amount: 3000, allocated: 0, actual: 0, status: 'planned' },
      ]
      for (const b of budgets) {
        await prisma.budget.create({ data: { userId: user.id, ...b } }).catch(() => {})
      }

      // Seed RSVP and messaging data if new schema is available
      try {
        // Create credit balance
        await prisma.creditBalance.upsert({
          where: { userId: user.id },
          update: { credits: 100 },
          create: { userId: user.id, credits: 100 }
        })

        // Create sample invites
        const invites = [
          { email: 'alice@example.com', token: 'invite_alice_123', country: 'NG' },
          { email: 'bob@example.com', token: 'invite_bob_456', country: 'US' },
          { email: 'carol@example.com', token: 'invite_carol_789', country: 'NG' }
        ]
        
        for (const invite of invites) {
          const createdInvite = await prisma.invite.create({
            data: { userId: user.id, ...invite }
          }).catch(() => null)

          // Create sample RSVP for first invite
          if (createdInvite && invite.email === 'alice@example.com') {
            await prisma.inviteRSVP.create({
              data: {
                userId: user.id,
                inviteId: createdInvite.id,
                email: invite.email,
                status: 'accepted',
                partySize: 2,
                notes: 'Looking forward to celebrating with you!'
              }
            }).catch(() => {})
          }
        }

        console.log('Seeded RSVP and messaging data')
      } catch (e) {
        console.warn('Skipping RSVP/messaging seed data (new schema not applied yet):', e?.message)
      }
    } catch (e) {
      console.warn('Skipping couple-specific seed data due to schema constraints')
    }
    // Seed demo tasks for the user
    try {
      const in14d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      const in21d = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
      const in30d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const demoTasks = [
        { title: 'Book photographer', category: 'Photography', priority: 'high', status: 'in_progress', dueDate: in14d },
        { title: 'Send invites', category: 'Invitations', priority: 'medium', status: 'pending', dueDate: in21d },
        { title: 'Finalize menu', category: 'Catering', priority: 'medium', status: 'pending', dueDate: in30d },
      ]
      for (const t of demoTasks) {
        await prisma.task.create({ data: { userId: user.id, ...t } }).catch(() => {})
      }
      console.log('Seeded demo tasks')
    } catch (e) {
      console.warn('Skipping demo tasks seeding:', e?.message)
    }
  }

  // Directory Vendors (public directory) - seed a few if table exists and empty
  try {
    const count = await prisma.directoryVendor.count()
    if (count === 0) {
      const dirVendors = [
        {
          name: 'Lumiere Photography', category: 'photographer', city: 'Lagos', region: 'NG', priceBand: '$$', averageRating: 5, reviewCount: 42,
          shortDescription: 'Editorial wedding photography with timeless style.',
          description: 'We capture authentic moments with refined artistry across Nigeria and destination weddings.',
          photos: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop'],
          website: 'https://example.com/lumiere', email: 'hello@lumiere.com', phone: '+2348000000000', tags: ['editorial','timeless']
        },
        {
          name: 'Emerald Events Venue', category: 'venue', city: 'Abuja', region: 'NG', priceBand: '$$$', averageRating: 4, reviewCount: 28,
          shortDescription: 'Garden venue for ceremonies and receptions.',
          description: 'Beautiful landscaped grounds with indoor and outdoor options for up to 300 guests.',
          photos: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop'],
          website: 'https://example.com/emerald', email: 'bookings@emerald.com', phone: '+2348000000001', tags: ['garden','outdoor']
        },
        {
          name: 'Silk & Stone Catering', category: 'catering', city: 'Lagos', region: 'NG', priceBand: '$$', averageRating: 5, reviewCount: 61,
          shortDescription: 'Modern menus with classic flavors.',
          description: 'Custom wedding menus, tastings, and full-service staffing available.',
          photos: ['https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop'],
          website: 'https://example.com/silkstone', email: 'events@silkstone.com', phone: '+2348000000002', tags: ['modern','fusion']
        },
      ]
      for (const v of dirVendors) {
        await prisma.directoryVendor.create({ data: v })
      }
      console.log('Seeded directory vendors')
    }
  } catch (e) {
    console.log('DirectoryVendor table not ready, skipping seed')
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
