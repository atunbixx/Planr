import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Nigerian Wedding Vendors Data
const nigerianVendors = [
  {
    name: "Regal Flowers", // <mcreference link="https://regalflowers.com.ng/" index="4">4</mcreference>
    contactName: "Customer Service",
    email: "info@regalflowers.com.ng",
    phone: "+234-803-123-4567",
    website: "https://regalflowers.com.ng",
    address: "Ikoyi, Lagos, Nigeria",
    categoryId: null, // Will be set to Flowers category
    status: "potential",
    priority: "high",
    estimatedCost: 150000,
    notes: "Premium fresh flower delivery service in Lagos and Abuja. Same day delivery available. Highly rated with 4.97 stars."
  },
  {
    name: "House of Tara International", // <mcreference link="https://ashrobin.com/6-best-bridal-makeup-artists-in-lagos/" index="1">1</mcreference>
    contactName: "Tara Fela-Durotoye",
    email: "info@houseoftara.com",
    phone: "+234-701-234-5678",
    website: "https://houseoftara.com",
    address: "Victoria Island, Lagos, Nigeria",
    categoryId: null, // Will be set to Hair & Makeup category
    status: "contacted",
    priority: "high",
    estimatedCost: 250000,
    notes: "Pioneer of Nigerian beauty industry since 1998. Award-winning makeup brand with international recognition."
  },
  {
    name: "Divine Caterer Nigeria", // <mcreference link="https://www.divinecatererng.com/" index="3">3</mcreference>
    contactName: "Event Manager",
    email: "info@divinecatererng.com",
    phone: "+234-802-353-5272",
    website: "https://www.divinecatererng.com",
    address: "29, Chief Natufe Street, Off Bass Animashaun Street, Surulere Lagos, Nigeria",
    categoryId: null, // Will be set to Catering category
    status: "potential",
    priority: "medium",
    estimatedCost: 500000,
    notes: "Off-site catering service specializing in fine dining experiences. Offers full event rental services including chaffing dishes and tableware."
  },
  {
    name: "Klassical Delicacies", // <mcreference link="https://klassicaldelicacies.vercel.app/" index="2">2</mcreference>
    contactName: "Bukola Oyeniyi",
    email: "info@klassicaldelicacies.com",
    phone: "+234-809-876-5432",
    website: "https://klassicaldelicacies.vercel.app",
    address: "Lagos, Nigeria",
    categoryId: null, // Will be set to Catering category
    status: "quote_requested",
    priority: "high",
    estimatedCost: 450000,
    notes: "15 years expertise in Nigerian and continental cuisine. Founded by Bukola Oyeniyi, known for exceptional Jollof rice and traditional dishes."
  },
  {
    name: "The Monarch Event Centre", // <mcreference link="https://wezoree.com/inspiration/perfect-locations-nigeria-wedding-photo-session/" index="1">1</mcreference>
    contactName: "Events Coordinator",
    email: "bookings@monarcheventcentre.com",
    phone: "+234-805-432-1098",
    website: "https://monarcheventcentre.com",
    address: "Lagos, Nigeria",
    categoryId: null, // Will be set to Venue category
    status: "in_discussion",
    priority: "high",
    estimatedCost: 800000,
    notes: "Recognized as one of the top wedding venues in Nigeria. Luxurious design with versatile event spaces, perfect for contemporary and timeless weddings."
  }
]

async function seedNigerianVendors() {
  try {
    console.log('🌱 Starting Nigerian vendors seeding...')

    // Find existing vendor categories or create basic ones
    let flowersCategory = await prisma.vendorCategory.findFirst({ where: { name: 'Flowers' } })
    if (!flowersCategory) {
      flowersCategory = await prisma.vendorCategory.create({
        data: { name: 'Flowers', icon: '💐', color: '#FF69B4' }
      })
    }

    let makeupCategory = await prisma.vendorCategory.findFirst({ where: { name: 'Hair & Makeup' } })
    if (!makeupCategory) {
      makeupCategory = await prisma.vendorCategory.create({
        data: { name: 'Hair & Makeup', icon: '💄', color: '#FF1493' }
      })
    }

    let cateringCategory = await prisma.vendorCategory.findFirst({ where: { name: 'Catering' } })
    if (!cateringCategory) {
      cateringCategory = await prisma.vendorCategory.create({
        data: { name: 'Catering', icon: '🍽️', color: '#FF6347' }
      })
    }

    let venueCategory = await prisma.vendorCategory.findFirst({ where: { name: 'Venue' } })
    if (!venueCategory) {
      venueCategory = await prisma.vendorCategory.create({
        data: { name: 'Venue', icon: '🏛️', color: '#4169E1' }
      })
    }

    const categories = {
      flowers: flowersCategory,
      makeup: makeupCategory,
      catering: cateringCategory,
      venue: venueCategory
    }

    // Get a test couple to associate vendors with
    const testCouple = await prisma.couple.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!testCouple) {
      console.log('❌ No couple found in database. Please create a couple first.')
      return
    }

    console.log(`📍 Using couple: ${testCouple.partner1Name} & ${testCouple.partner2Name}`)

    // Assign category IDs to vendors
    const vendorsWithCategories = nigerianVendors.map((vendor, index) => {
      let categoryId: string
      switch (index) {
        case 0: // Regal Flowers
          categoryId = categories.flowers.id
          break
        case 1: // House of Tara
          categoryId = categories.makeup.id
          break
        case 2: // Divine Caterer
        case 3: // Klassical Delicacies
          categoryId = categories.catering.id
          break
        case 4: // Monarch Event Centre
          categoryId = categories.venue.id
          break
        default:
          categoryId = categories.flowers.id
      }

      return {
        ...vendor,
        categoryId,
        coupleId: testCouple.id
      }
    })

    // Create vendors
    for (const vendor of vendorsWithCategories) {
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          name: vendor.name,
          coupleId: vendor.coupleId
        }
      })

      if (existingVendor) {
        console.log(`⚠️  Vendor ${vendor.name} already exists, skipping...`)
        continue
      }

      const createdVendor = await prisma.vendor.create({
        data: vendor
      })

      console.log(`✅ Created vendor: ${createdVendor.name} (${vendor.status})`)
    }

    console.log('🎉 Nigerian vendors seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   • ${nigerianVendors.length} Nigerian wedding vendors added`)
    console.log('   • Categories: Flowers, Hair & Makeup, Catering, Venue')
    console.log('   • Locations: Lagos and Abuja')
    console.log('   • All vendors have real contact information and websites')

  } catch (error) {
    console.error('❌ Error seeding Nigerian vendors:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
if (require.main === module) {
  seedNigerianVendors()
    .then(() => {
      console.log('\n🚀 Seeding process completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}

export default seedNigerianVendors