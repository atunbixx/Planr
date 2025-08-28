const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting guest migration from JSON...');

  // 1. Get the seed user
  const seedUser = await prisma.user.findUnique({
    where: { email: 'seed@example.com' },
  });

  if (!seedUser) {
    console.error('Error: Seed user (seed@example.com) not found.');
    console.error('Please run `npx prisma db seed` first.');
    return;
  }
  console.log(`Found seed user with ID: ${seedUser.id}. All guests will be assigned to this user.`);

  const jsonPath = path.join(__dirname, '..', 'temp-data', 'guests.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Error: temp-data/guests.json not found.');
    return;
  }

  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const oldGuests = JSON.parse(jsonData);

  console.log(`Found ${oldGuests.length} guests in JSON file.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const oldGuest of oldGuests) {
    try {
      const nameParts = oldGuest.name ? oldGuest.name.trim().split(' ') : ['', ''];
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || '';

      const guestData = {
        userId: seedUser.id, // Use the seed user's ID
        firstName,
        lastName,
        rsvpStatus: oldGuest.rsvpStatus || 'pending',
        side: oldGuest.side || null,
        dietaryRestrictions: oldGuest.mealPreference || null,
        invitationSent: oldGuest.invitationSent || false,
        plusOneAllowed: oldGuest.plusOneAllowed || false,
        plusOneName: oldGuest.plusOneName || null,
        attendingCount: 1,
        householdId: oldGuest.householdId || null,
        relationshipCategory: oldGuest.relationshipCategory || null,
        tags: Array.isArray(oldGuest.tags) ? oldGuest.tags.join(',') : null,
      };

      // Since we are creating new records, we can't check for duplicates based on old IDs.
      // A simple check for existing name for this user can prevent duplicates during this run.
      const existing = await prisma.guest.findFirst({
        where: { userId: seedUser.id, firstName, lastName },
      });

      if (existing) {
        console.warn(`Skipping guest "${oldGuest.name}" - already exists for this user.`);
        skippedCount++;
        continue;
      }

      await prisma.guest.create({
        data: guestData,
      });

      migratedCount++;
      console.log(`Successfully migrated guest: ${firstName} ${lastName}`);

    } catch (error) {
      console.error(`Failed to migrate guest with old ID ${oldGuest.id} and name "${oldGuest.name}":`, error.message);
      skippedCount++;
    }
  }

  console.log('\nGuest migration finished.');
  console.log(`Successfully migrated ${migratedCount} guests.`);
  console.log(`Skipped ${skippedCount} guests.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
