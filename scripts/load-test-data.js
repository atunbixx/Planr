#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function loadTestData() {
  console.log('🔄 Loading test data for migration performance testing...');

  try {
    // Create test users
    console.log('Creating test users...');
    const users = [];
    for (let i = 0; i < 10000; i++) {
      users.push({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: faker.helpers.arrayElement(['admin', 'planner', 'vendor', 'guest']),
        createdAt: faker.date.past(),
      });
    }

    // Batch insert users
    await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, email, first_name, last_name, role, created_at)
      VALUES ${users.map(u => `('${u.id}', '${u.email}', '${u.firstName}', '${u.lastName}', '${u.role}', '${u.createdAt.toISOString()}')`).join(',')}
      ON CONFLICT (email) DO NOTHING
    `);

    // Create test weddings
    console.log('Creating test weddings...');
    const weddings = [];
    for (let i = 0; i < 1000; i++) {
      weddings.push({
        id: faker.string.uuid(),
        userId: faker.helpers.arrayElement(users).id,
        date: faker.date.future(),
        venue: faker.company.name(),
        budget: faker.number.int({ min: 10000, max: 100000 }),
        guestCount: faker.number.int({ min: 50, max: 300 }),
      });
    }

    // Create test guests
    console.log('Creating test guests...');
    const guests = [];
    for (let i = 0; i < 50000; i++) {
      guests.push({
        id: faker.string.uuid(),
        weddingId: faker.helpers.arrayElement(weddings).id,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        rsvpStatus: faker.helpers.arrayElement(['pending', 'accepted', 'declined']),
      });
    }

    // Create test vendors
    console.log('Creating test vendors...');
    const vendors = [];
    for (let i = 0; i < 5000; i++) {
      vendors.push({
        id: faker.string.uuid(),
        name: faker.company.name(),
        category: faker.helpers.arrayElement(['catering', 'photography', 'music', 'flowers', 'venue']),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        price: faker.number.int({ min: 500, max: 10000 }),
      });
    }

    // Create test messages
    console.log('Creating test messages...');
    const messages = [];
    for (let i = 0; i < 100000; i++) {
      messages.push({
        id: faker.string.uuid(),
        weddingId: faker.helpers.arrayElement(weddings).id,
        recipientId: faker.helpers.arrayElement(guests).id,
        type: faker.helpers.arrayElement(['invitation', 'reminder', 'update']),
        status: faker.helpers.arrayElement(['pending', 'sent', 'delivered', 'failed']),
        sentAt: faker.date.recent(),
      });
    }

    // Generate summary
    console.log('\n📊 Test Data Summary:');
    console.log(`   - Users: ${users.length.toLocaleString()}`);
    console.log(`   - Weddings: ${weddings.length.toLocaleString()}`);
    console.log(`   - Guests: ${guests.length.toLocaleString()}`);
    console.log(`   - Vendors: ${vendors.length.toLocaleString()}`);
    console.log(`   - Messages: ${messages.length.toLocaleString()}`);
    console.log(`   - Total records: ${(users.length + weddings.length + guests.length + vendors.length + messages.length).toLocaleString()}`);

    // Calculate database size
    const dbSize = await prisma.$queryRaw`
      SELECT pg_database_size(current_database()) as size
    `;
    console.log(`   - Database size: ${(dbSize[0].size / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n✅ Test data loaded successfully!');

  } catch (error) {
    console.error('❌ Failed to load test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  loadTestData();
}

module.exports = { loadTestData };