import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import bcrypt from 'bcryptjs'

/**
 * POST /api/test/setup-base-data
 * Set up base test data for E2E tests
 * Only available in development/test environments
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Not available in production', 403, 'FORBIDDEN')
  }

  try {
    const { createTestUser, createTestVendor, createTestInvite } = await request.json()

    const results: any = {}

    if (createTestUser) {
      // Create base test user
      const hashedPassword = await bcrypt.hash('testpassword123', 12)
      
      const testUser = await prisma.user.upsert({
        where: { email: 'test-user@example.com' },
        update: {},
        create: {
          email: 'test-user@example.com',
          password: hashedPassword,
          role: 'couple',
          onboardingCompleted: true,
          isActive: true
        }
      })

      // Create credit balance
      await prisma.creditBalance.upsert({
        where: { userId: testUser.id },
        update: { credits: 1000 },
        create: {
          userId: testUser.id,
          credits: 1000
        }
      })

      results.testUser = {
        id: testUser.id,
        email: testUser.email
      }
    }

    if (createTestVendor) {
      // Create Nigerian directory vendors
      const nigerianVendors = [
        {
          name: 'Royal Gardens Lagos',
          category: 'Venue',
          city: 'Lagos',
          region: 'Lagos State',
          priceBand: '$$$',
          averageRating: 5,
          reviewCount: 234,
          shortDescription: 'Luxurious outdoor wedding venue in the heart of Lagos with beautiful gardens.',
          description: 'Royal Gardens Lagos offers an elegant outdoor wedding venue perfect for ceremonies and receptions. Located in Victoria Island, we provide stunning garden spaces with modern facilities and professional event coordination.',
          photos: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop&crop=center',
          website: 'https://instagram.com/royalgardens_lagos',
          email: 'info@royalgardens.ng',
          phone: '+234 803 123 4567',
          address: 'Victoria Island, Lagos, Nigeria'
        },
        {
          name: 'Kemi Adetiba Photography',
          category: 'Photography',
          city: 'Abuja',
          region: 'FCT',
          priceBand: '$$',
          averageRating: 5,
          reviewCount: 156,
          shortDescription: 'Award-winning Nigerian wedding photographer capturing authentic moments.',
          description: 'Specializing in candid moments and cultural celebrations, Kemi Adetiba Photography brings years of experience in capturing the beauty and emotion of Nigerian weddings with an artistic eye.',
          photos: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop&crop=center',
          website: 'https://instagram.com/kemiadetiba_photography',
          email: 'hello@kemiadetiba.com',
          phone: '+234 901 234 5678',
          address: 'Abuja, FCT, Nigeria'
        },
        {
          name: 'Bella Naija Weddings',
          category: 'Planning',
          city: 'Lagos',
          region: 'Lagos State',
          priceBand: '$$$',
          averageRating: 5,
          reviewCount: 89,
          shortDescription: 'Premier wedding planning service for luxury Nigerian weddings.',
          description: 'Full-service wedding planning and coordination for couples seeking elegant, culturally-rich celebrations. We specialize in traditional Nigerian ceremonies and modern receptions.',
          photos: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop&crop=center',
          website: 'https://instagram.com/bellanaijaweddings',
          email: 'info@bellanaijaweddings.com',
          phone: '+234 802 345 6789',
          address: 'Ikoyi, Lagos, Nigeria'
        },
        {
          name: 'Afrobeats Wedding Band',
          category: 'Music',
          city: 'Lagos',
          region: 'Lagos State',
          priceBand: '$$',
          averageRating: 4,
          reviewCount: 67,
          shortDescription: 'Live Afrobeats and traditional music for unforgettable celebrations.',
          description: 'Professional wedding band specializing in Afrobeats, highlife, and traditional Nigerian music. Perfect for couples wanting authentic Nigerian musical entertainment.',
          photos: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&crop=center',
          website: 'https://instagram.com/afrobeatsweddingband',
          email: 'bookings@afrobeatswedding.ng',
          phone: '+234 805 456 7890',
          address: 'Surulere, Lagos, Nigeria'
        },
        {
          name: 'Ankara Couture Bridal',
          category: 'Attire',
          city: 'Abuja',
          region: 'FCT',
          priceBand: '$$',
          averageRating: 5,
          reviewCount: 123,
          shortDescription: 'Custom bridal wear featuring traditional Nigerian fabrics and modern designs.',
          description: 'Specializing in bespoke bridal gowns that blend traditional Nigerian textiles with contemporary fashion. From engagement to reception, we create stunning outfits for your special day.',
          photos: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=600&fit=crop&crop=center',
          website: 'https://instagram.com/ankaracouturebridal',
          email: 'orders@ankaracouture.ng',
          phone: '+234 807 567 8901',
          address: 'Wuse 2, Abuja, Nigeria'
        }
      ]

      // Create directory vendors
      const createdVendors = []
      for (const vendorData of nigerianVendors) {
        const vendor = await prisma.directoryVendor.upsert({
          where: { 
            id: `${vendorData.name.toLowerCase().replace(/\s+/g, '-')}-${vendorData.city.toLowerCase()}`
          },
          update: vendorData,
          create: {
            id: `${vendorData.name.toLowerCase().replace(/\s+/g, '-')}-${vendorData.city.toLowerCase()}`,
            ...vendorData
          }
        })
        createdVendors.push({
          id: vendor.id,
          name: vendor.name,
          category: vendor.category
        })
      }

      results.directoryVendors = createdVendors
    }

    if (createTestInvite && results.testUser) {
      // Create test invite
      const testInvite = await prisma.invite.upsert({
        where: { token: 'test-invite-token' },
        update: {},
        create: {
          userId: results.testUser.id,
          email: 'test-guest@example.com',
          token: 'test-invite-token',
          country: 'US'
        }
      })

      results.testInvite = {
        id: testInvite.id,
        token: testInvite.token,
        email: testInvite.email
      }
    }

    return createSuccessResponse(results, 'Base test data set up successfully')

  } catch (error) {
    console.error('Failed to setup base test data:', error)
    return createErrorResponse('Failed to setup base test data', 500, 'SETUP_ERROR')
  }
}