/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// --- HELPERS ---
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const hashData = (data) => crypto.createHash('sha256').update(data).digest('hex');

// --- DATA DEFINITIONS ---
const ROLES = ['USER', 'USER', 'USER', 'USER', 'MODERATOR', 'SUPPORT', 'ADMIN', 'OWNER']; // Skewed towards USER
const PLANS = ['free', 'pro', 'enterprise'];
const LOCATIONS = [
  { country: 'NG', state: 'Lagos', city: 'Ikeja' },
  { country: 'NG', state: 'Abuja', city: 'Garki' },
  { country: 'UK', state: 'London', city: 'London' },
  { country: 'US', state: 'California', city: 'Los Angeles' },
  { country: 'US', state: 'New York', city: 'New York City' },
];
const VENDOR_CATEGORIES = ['photographer', 'caterer', 'venue', 'makeup', 'decorator', 'music'];
const VENDOR_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED', 'UNLISTED'];
const VERIFICATION_STATUSES = ['NONE', 'PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'];
const SANCTION_TYPES = ['WARN', 'THROTTLE', 'SUSPEND', 'BAN'];
const APPROVAL_TYPES = ['VENDOR', 'LISTING', 'KYC', 'QUOTA'];
const CREDIT_TYPES = ['SYSTEM', 'PROMO', 'MANUAL', 'REFUND'];
const VENDOR_EVENT_TYPES = ['LEAD_ACCEPTED', 'LEAD_IGNORED', 'DISPUTE', 'DOC_UPLOADED', 'VERIFIED'];

async function main() {
  console.log('Starting seed...');

  // --- CLEAN UP ---
  console.log('Cleaning up old data...');
  // In reverse order of dependency
  await prisma.vendorEvent.deleteMany().catch(e => console.log('ignore vendor event cleanup'));
  await prisma.vendorSanction.deleteMany().catch(e => console.log('ignore vendor sanction cleanup'));
  await prisma.vendorVerification.deleteMany().catch(e => console.log('ignore vendor verification cleanup'));
  await prisma.vendorSignal.deleteMany().catch(e => console.log('ignore vendor signal cleanup'));
  await prisma.auditLog.deleteMany().catch(e => console.log('ignore audit log cleanup'));
  await prisma.featureFlag.deleteMany().catch(e => console.log('ignore feature flag cleanup'));
  await prisma.approvalQueue.deleteMany().catch(e => console.log('ignore approval queue cleanup'));
  await prisma.sanction.deleteMany().catch(e => console.log('ignore sanction cleanup'));
  await prisma.broadcast.deleteMany().catch(e => console.log('ignore broadcast cleanup'));
  await prisma.creditLedger.deleteMany().catch(e => console.log('ignore credit ledger cleanup'));

  // Have to delete vendors before user profiles because of the relation
  await prisma.vendor.deleteMany().catch(e => console.log('ignore vendor cleanup'));
  await prisma.userProfile.deleteMany().catch(e => console.log('ignore user profile cleanup'));

  // Delete all other tables that might have relations to User
  await prisma.weddingDetails.deleteMany().catch(e => console.log('ignore wedding details cleanup'));
  await prisma.session.deleteMany().catch(e => console.log('ignore session cleanup'));
  await prisma.guest.deleteMany().catch(e => console.log('ignore guest cleanup'));
  await prisma.budget.deleteMany().catch(e => console.log('ignore budget cleanup'));
  await prisma.task.deleteMany().catch(e => console.log('ignore task cleanup'));
  await prisma.invite.deleteMany().catch(e => console.log('ignore invite cleanup'));
  await prisma.creditBalance.deleteMany().catch(e => console.log('ignore credit balance cleanup'));
  await prisma.message.deleteMany().catch(e => console.log('ignore message cleanup'));

  await prisma.user.deleteMany().catch(e => console.log('ignore user cleanup'));


  // --- CREATE USERS & PROFILES ---
  console.log('Creating users and profiles...');
  const users = [];
  const hashedPassword = await bcrypt.hash('password123', 10);
  for (let i = 0; i < 300; i++) {
    const email = `user${i}@planr.dev`;
    const location = getRandomElement(LOCATIONS);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        onboardingCompleted: true,
        profile: {
          create: {
            role: getRandomElement(ROLES),
            plan: getRandomElement(PLANS),
            country: location.country,
            state: location.state,
            city: location.city,
          },
        },
      },
      include: {
        profile: true,
      },
    });
    users.push(user);
  }
  console.log(`Created ${users.length} users.`);
  const adminUser = users.find(u => u.profile.role === 'ADMIN') || users[0];

  // --- CREATE VENDORS ---
  console.log('Creating vendors...');
  const vendors = [];
  for (let i = 0; i < 100; i++) {
    const owner = getRandomElement(users);
    const location = getRandomElement(LOCATIONS);
    const vendor = await prisma.vendor.create({
      data: {
        ownerUserId: owner.id,
        name: `${location.city} ${getRandomElement(VENDOR_CATEGORIES)} ${i}`,
        slug: `${location.city.toLowerCase().replace(/ /g, '-')}-${getRandomElement(VENDOR_CATEGORIES)}-${i}`,
        category: getRandomElement(VENDOR_CATEGORIES),
        country: location.country,
        state: location.state,
        city: location.city,
        status: getRandomElement(VENDOR_STATUSES),
        verification: getRandomElement(VERIFICATION_STATUSES),
        score: getRandomInt(20, 95),
        flagged: Math.random() > 0.9,
      },
    });
    vendors.push(vendor);
  }
  console.log(`Created ${vendors.length} vendors.`);

  // --- CREATE DUPLICATE VENDOR CLUSTERS ---
  console.log('Creating duplicate vendor clusters...');
  for (let i = 0; i < 10; i++) {
    const sharedEmail = `cluster${i}@planr.dev`;
    const sharedPhone = `+1-555-CLUSTER-${i}`;
    const sharedIp = `192.168.1.${i}`;
    const sharedDevice = `device-cluster-${i}`;

    const emailHash = hashData(sharedEmail);
    const phoneHash = hashData(sharedPhone);
    const ipHash = hashData(sharedIp);
    const deviceHash = hashData(sharedDevice);

    // Create 2-3 vendors in this cluster
    for (let j = 0; j < getRandomInt(2, 3); j++) {
      const owner = getRandomElement(users);
      const location = getRandomElement(LOCATIONS);
      const vendor = await prisma.vendor.create({
        data: {
          ownerUserId: owner.id,
          name: `Cluster ${i} Vendor ${j}`,
          slug: `cluster-${i}-vendor-${j}`,
          category: 'venue',
          country: location.country,
          state: location.state,
          city: location.city,
          flagged: true, // Auto-flag clusters
          signals: {
            create: {
              emailHash: j === 0 ? emailHash : null, // one has email
              phoneHash: j === 1 ? phoneHash : null, // another has phone
              ipHash: ipHash, // all share ip
              deviceHash: deviceHash, // all share device
            }
          }
        },
      });
    }
  }
  console.log('Created 10 duplicate vendor clusters.');

  // --- CREATE OTHER ADMIN-RELATED DATA ---
  console.log('Creating sanctions, approvals, broadcasts, etc...');

  // Sanctions
  for (let i = 0; i < 10; i++) {
    await prisma.sanction.create({
      data: {
        userId: getRandomElement(users).id,
        type: getRandomElement(SANCTION_TYPES),
        reasonCode: `SEED_REASON_${i}`,
        notes: 'This is a seed sanction.',
        createdBy: adminUser.id,
        expiresAt: Math.random() > 0.5 ? getRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) : null,
      },
    });
  }

  // Approval Queue
  for (let i = 0; i < 20; i++) {
    await prisma.approvalQueue.create({
      data: {
        targetType: getRandomElement(APPROVAL_TYPES),
        targetId: getRandomElement(vendors).id,
        status: getRandomElement(['PENDING', 'APPROVED', 'REJECTED']),
        submittedBy: getRandomElement(users).id,
        reviewedBy: adminUser.id,
        notes: 'Seed approval item.',
        reviewedAt: new Date(),
      },
    });
  }

  // Broadcasts
  await prisma.broadcast.create({
    data: {
      title: 'Welcome to Planr Pro!',
      body: 'Here are the new features you have access to...',
      channel: 'EMAIL',
      segmentJson: { plan: 'pro' },
      createdBy: adminUser.id,
    },
  });

  // Feature Flags
  await prisma.featureFlag.create({
    data: {
      key: 'new-dashboard',
      type: 'BOOLEAN',
      enabled: true,
    },
  });
  await prisma.featureFlag.create({
    data: {
      key: 'new-vendor-scoring',
      type: 'PERCENT_ROLL',
      percent: 50,
    },
  });

  // Credit Ledger
  for (let i = 0; i < 50; i++) {
    await prisma.creditLedger.create({
      data: {
        userId: getRandomElement(users).id,
        delta: getRandomInt(-100, 100),
        type: getRandomElement(CREDIT_TYPES),
        reason: 'Seed credit entry',
        createdBy: adminUser.id,
      },
    });
  }

  // Vendor Events
  for (const vendor of vendors) {
    if (!vendor) continue;
    for (let i = 0; i < getRandomInt(1, 5); i++) {
      await prisma.vendorEvent.create({
        data: {
          vendorId: vendor.id,
          type: getRandomElement(VENDOR_EVENT_TYPES),
          meta: { seed: true, detail: `Event #${i}` },
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
