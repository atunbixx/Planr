#!/usr/bin/env node
/*
  Import guests from temp-data/guests.json into the database using Prisma.
  Usage: node scripts/import-temp-guests.js
*/

const fs = require('fs')
const path = require('path')

async function main() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  const file = path.join(process.cwd(), 'temp-data', 'guests.json')

  if (!fs.existsSync(file)) {
    console.error('No temp-data/guests.json found. Nothing to import.')
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(raw) || raw.length === 0) {
    console.log('No guests to import.')
    process.exit(0)
  }

  let imported = 0
  for (const g of raw) {
    try {
      const mapped = {
        userId: g.userId,
        name: g.name,
        rsvpStatus: g.rsvpStatus || 'pending',
        mealPreference: g.mealPreference || null,
        side: g.side || null,
        invitationSent: !!g.invitationSent,
        plusOneAllowed: !!g.plusOneAllowed,
        plusOneName: g.plusOneName || null,
        householdId: g.householdId || null,
        relationshipCategory: g.relationshipCategory || null,
        // tags is String? in schema; store JSON string if array
        tags: Array.isArray(g.tags) ? JSON.stringify(g.tags) : (g.tags ?? null),
      }

      await prisma.guest.upsert({
        where: { id: g.id || 'missing_id' },
        update: mapped,
        create: { id: g.id, ...mapped },
      })
      imported++
    } catch (e) {
      console.error('Failed to import guest', g.id, e.message)
    }
  }

  await prisma.$disconnect()
  console.log(`Imported ${imported} guest(s) from temp-data.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

