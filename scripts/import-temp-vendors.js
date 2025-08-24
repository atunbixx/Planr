#!/usr/bin/env node
/*
  Import vendors from temp-data/vendors.json into the database using Prisma.
  Usage: node scripts/import-temp-vendors.js
*/

const fs = require('fs')
const path = require('path')

async function main() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  const file = path.join(process.cwd(), 'temp-data', 'vendors.json')

  if (!fs.existsSync(file)) {
    console.error('No temp-data/vendors.json found. Nothing to import.')
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(raw) || raw.length === 0) {
    console.log('No vendors to import.')
    process.exit(0)
  }

  let imported = 0
  for (const v of raw) {
    try {
      await prisma.vendor.upsert({
        where: { id: v.id || 'missing_id' },
        update: {
          userId: v.userId,
          name: v.name,
          category: v.category,
          priceRange: v.priceRange,
          contact: v.contact,
          website: v.website,
          status: v.status,
          rating: typeof v.rating === 'number' ? v.rating : null,
          isfavorite: !!v.isfavorite,
          email: v.email,
          phone: v.phone,
          address: v.address,
          city: v.city,
          tags: Array.isArray(v.tags) ? v.tags : [],
          notes: v.notes,
          quoteamount: typeof v.quoteamount === 'number' ? v.quoteamount : null,
          bookeddate: v.bookeddate ? new Date(v.bookeddate) : null,
          instagramurl: v.instagramurl,
          logourl: v.logourl,
        },
        create: {
          id: v.id,
          userId: v.userId,
          name: v.name,
          category: v.category,
          priceRange: v.priceRange,
          contact: v.contact,
          website: v.website,
          status: v.status,
          rating: typeof v.rating === 'number' ? v.rating : undefined,
          isfavorite: !!v.isfavorite,
          email: v.email,
          phone: v.phone,
          address: v.address,
          city: v.city,
          tags: Array.isArray(v.tags) ? v.tags : [],
          notes: v.notes,
          quoteamount: typeof v.quoteamount === 'number' ? v.quoteamount : undefined,
          bookeddate: v.bookeddate ? new Date(v.bookeddate) : undefined,
          instagramurl: v.instagramurl,
          logourl: v.logourl,
        }
      })
      imported++
    } catch (e) {
      console.error('Failed to import vendor', v.id, e.message)
    }
  }

  await prisma.$disconnect()
  console.log(`Imported ${imported} vendor(s) from temp-data.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

