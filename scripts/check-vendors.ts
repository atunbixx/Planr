import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkVendors() {
  try {
    console.log('🔍 Checking vendors in database...')
    
    const vendors = await prisma.vendor.findMany({
      include: {
        couple: {
          select: {
            id: true,
            partner1Name: true,
            partner2Name: true
          }
        },
        vendorCategories: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`\n📊 Found ${vendors.length} vendors in database:`)
    vendors.forEach(vendor => {
      console.log(`- ${vendor.name} (${vendor.vendorCategories?.name || 'No category'})`)
      console.log(`  Couple: ${vendor.couple.partner1Name} & ${vendor.couple.partner2Name || 'N/A'}`)
      console.log(`  Status: ${vendor.status}`)
      console.log(`  Couple ID: ${vendor.couple.id}`)
      console.log('')
    })
    
    console.log('\n👫 All couples in database:')
    const couples = await prisma.couple.findMany({
      select: {
        id: true,
        partner1Name: true,
        partner2Name: true,
        userId: true
      }
    })
    
    couples.forEach(couple => {
      console.log(`- ${couple.partner1Name} & ${couple.partner2Name || 'N/A'}`)
      console.log(`  ID: ${couple.id}`)
      console.log(`  User ID: ${couple.userId}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVendors()