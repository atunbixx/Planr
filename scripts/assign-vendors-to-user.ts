import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function assignVendorsToUser() {
  try {
    console.log('🔍 Looking for user atunbi1@gmail.com...')
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'atunbi1@gmail.com' }
    })
    
    if (!user) {
      console.log('❌ User not found with email atunbi1@gmail.com')
      return
    }
    
    console.log(`👤 User found: ${user.firstName} ${user.lastName}`)
    
    // Find the user's couple
    const couple = await prisma.couple.findFirst({
      where: { userId: user.id }
    })
    
    if (!couple) {
      console.log('❌ No couple found for this user')
      return
    }
    
    console.log(`💑 Couple: ${couple.partner1Name} & ${couple.partner2Name}`)
    console.log(`🆔 Couple ID: ${couple.id}`)
    
    // Check current vendors for this couple
    const existingVendors = await prisma.vendor.findMany({
      where: { coupleId: couple.id }
    })
    
    console.log(`🏪 Current vendors for this couple: ${existingVendors.length}`)
    existingVendors.forEach(v => console.log(`  - ${v.name}`))
    
    // Get vendor categories
    const flowersCategory = await prisma.vendorCategory.findFirst({ where: { name: 'Flowers' } })
    const makeupCategory = await prisma.vendorCategory.findFirst({ where: { name: 'Hair & Makeup' } })
    const cateringCategory = await prisma.vendorCategory.findFirst({ where: { name: 'Catering' } })
    const venueCategory = await prisma.vendorCategory.findFirst({ where: { name: 'Venue' } })
    
    // Nigerian vendors data
    const nigerianVendors = [
      {
        name: 'Regal Flowers',
        contactName: 'Customer Service',
        email: 'info@regalflowers.com.ng',
        phone: '+234-803-123-4567',
        website: 'https://regalflowers.com.ng',
        address: 'Ikoyi, Lagos, Nigeria',
        categoryId: flowersCategory?.id,
        status: 'potential',
        priority: 'high',
        estimatedCost: 150000,
        notes: 'Premium fresh flower delivery service in Lagos and Abuja. Same day delivery available.'
      },
      {
        name: 'House of Tara International',
        contactName: 'Tara Fela-Durotoye',
        email: 'info@houseoftara.com',
        phone: '+234-701-234-5678',
        website: 'https://houseoftara.com',
        address: 'Victoria Island, Lagos, Nigeria',
        categoryId: makeupCategory?.id,
        status: 'contacted',
        priority: 'high',
        estimatedCost: 250000,
        notes: 'Pioneer of Nigerian beauty industry since 1998. Award-winning makeup brand.'
      },
      {
        name: 'Divine Caterer Nigeria',
        contactName: 'Event Manager',
        email: 'info@divinecatererng.com',
        phone: '+234-802-353-5272',
        website: 'https://www.divinecatererng.com',
        address: '29, Chief Natufe Street, Surulere Lagos, Nigeria',
        categoryId: cateringCategory?.id,
        status: 'potential',
        priority: 'medium',
        estimatedCost: 500000,
        notes: 'Off-site catering service specializing in fine dining experiences.'
      },
      {
        name: 'Klassical Delicacies',
        contactName: 'Bukola Oyeniyi',
        email: 'info@klassicaldelicacies.com',
        phone: '+234-809-876-5432',
        website: 'https://klassicaldelicacies.vercel.app',
        address: 'Lagos, Nigeria',
        categoryId: cateringCategory?.id,
        status: 'quote_requested',
        priority: 'high',
        estimatedCost: 450000,
        notes: '15 years expertise in Nigerian and continental cuisine. Known for exceptional Jollof rice.'
      },
      {
        name: 'The Monarch Event Centre',
        contactName: 'Events Coordinator',
        email: 'bookings@monarcheventcentre.com',
        phone: '+234-805-432-1098',
        website: 'https://monarcheventcentre.com',
        address: 'Lagos, Nigeria',
        categoryId: venueCategory?.id,
        status: 'in_discussion',
        priority: 'high',
        estimatedCost: 800000,
        notes: 'Recognized as one of the top wedding venues in Nigeria. Luxurious design with versatile spaces.'
      }
    ]
    
    console.log('\n🌱 Adding Nigerian vendors to this couple...')
    
    // Add vendors to this couple
    for (const vendorData of nigerianVendors) {
      // Check if vendor already exists for this couple
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          name: vendorData.name,
          coupleId: couple.id
        }
      })
      
      if (existingVendor) {
        console.log(`⚠️  ${vendorData.name} already exists for this couple`)
        continue
      }
      
      if (!vendorData.categoryId) {
        console.log(`⚠️  Skipping ${vendorData.name} - category not found`)
        continue
      }
      
      const vendor = await prisma.vendor.create({
        data: {
          ...vendorData,
          coupleId: couple.id
        }
      })
      
      console.log(`✅ Added ${vendor.name} (${vendorData.status})`)
    }
    
    console.log('\n🎉 Nigerian vendors successfully assigned to atunbi1@gmail.com!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignVendorsToUser()