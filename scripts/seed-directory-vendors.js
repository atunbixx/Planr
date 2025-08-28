#!/usr/bin/env node
/*
  Seed a small set of public directory vendors (DirectoryVendor table).
  Usage: node scripts/seed-directory-vendors.js
*/

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const vendors = [
  {
    id: 'royal-gardens-lagos',
    name: 'Royal Gardens Lagos',
    category: 'venue',
    city: 'Lagos',
    region: 'Lagos State',
    priceBand: '$$$',
    averageRating: 5,
    reviewCount: 234,
    shortDescription: 'Luxurious outdoor wedding venue in the heart of Lagos with beautiful gardens.',
    description: 'Royal Gardens Lagos offers an elegant outdoor wedding venue perfect for ceremonies and receptions. Located in Victoria Island, we provide stunning garden spaces with modern facilities and professional event coordination.',
    photos: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&auto=format&fit=crop',
    website: 'https://instagram.com/royalgardens_lagos',
    email: 'info@royalgardens.ng',
    phone: '+234 803 123 4567',
    address: 'Victoria Island, Lagos, Nigeria',
  },
  {
    id: 'kemi-adetiba-photography',
    name: 'Kemi Adetiba Photography',
    category: 'photography',
    city: 'Abuja',
    region: 'FCT',
    priceBand: '$$',
    averageRating: 5,
    reviewCount: 156,
    shortDescription: 'Award-winning Nigerian wedding photographer capturing authentic moments.',
    description: 'Specializing in candid moments and cultural celebrations, Kemi Adetiba Photography brings years of experience in capturing the beauty and emotion of Nigerian weddings with an artistic eye.',
    photos: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&auto=format&fit=crop',
    website: 'https://instagram.com/kemiadetiba_photography',
    email: 'hello@kemiadetiba.com',
    phone: '+234 901 234 5678',
    address: 'Abuja, FCT, Nigeria',
  },
  {
    id: 'bella-naija-weddings',
    name: 'Bella Naija Weddings',
    category: 'planning',
    city: 'Lagos',
    region: 'Lagos State',
    priceBand: '$$$',
    averageRating: 5,
    reviewCount: 89,
    shortDescription: 'Premier wedding planning service for luxury Nigerian weddings.',
    description: 'Full-service wedding planning and coordination for couples seeking elegant, culturally-rich celebrations. We specialize in traditional Nigerian ceremonies and modern receptions.',
    photos: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop',
    website: 'https://instagram.com/bellanaijaweddings',
    email: 'info@bellanaijaweddings.com',
    phone: '+234 802 345 6789',
    address: 'Ikoyi, Lagos, Nigeria',
  },
]

async function main() {
  let upserted = 0
  for (const v of vendors) {
    try {
      await prisma.directoryVendor.upsert({
        where: { id: v.id },
        update: v,
        create: v,
      })
      upserted++
    } catch (e) {
      console.error('Failed to upsert directory vendor', v.id, e.message)
    }
  }
  console.log(`Seeded ${upserted} directory vendor(s)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

