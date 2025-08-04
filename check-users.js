// Clear system environment variable
delete process.env.DATABASE_URL

// Load environment
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users in database...')
    
    // Check if users table exists and get count
    const userCount = await prisma.users.count()
    console.log(`Found ${userCount} users in database`)
    
    if (userCount > 0) {
      const users = await prisma.users.findMany({
        select: {
          id: true,
          clerk_user_id: true,
          email: true,
          first_name: true,
          last_name: true,
          created_at: true
        }
      })
      
      console.log('\n📋 Existing users:')
      users.forEach(user => {
        console.log(`- ${user.first_name} ${user.last_name} (${user.email})`)
        console.log(`  ID: ${user.id}, Clerk: ${user.clerk_user_id}`)
      })
    } else {
      console.log('\n✨ No users found. Creating a test user...')
      
      const newUser = await prisma.users.create({
        data: {
          clerk_user_id: 'user_test123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          phone: '+1234567890'
        }
      })
      
      console.log('✅ Created test user:', newUser)
    }
    
    console.log('\n🎉 Database connection working perfectly!')
    
  } catch (error) {
    console.error('❌ Database operation failed:')
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()