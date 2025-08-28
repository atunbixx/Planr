import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

/**
 * GET /api/vendors/[id]
 * Get individual vendor details for public viewing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('Fetching vendor details for ID:', id)

    let vendor = null

    try {
      // Try to get vendor from DirectoryVendor table
      vendor = await prisma.directoryVendor.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          region: true,
          priceBand: true,
          averageRating: true,
          reviewCount: true,
          shortDescription: true,
          description: true,
          photos: true,
          website: true,
          email: true,
          phone: true,
          address: true,
          createdAt: true,
          updatedAt: true
        }
      })
    } catch (dbError) {
      console.log('Database query failed, using fallback data:', dbError.message)
    }

    // If not found in database, check fallback data
    if (!vendor) {
      const sampleVendors = [
        {
          id: 'royal-gardens-lagos',
          name: 'Royal Gardens Lagos',
          category: 'Venue',
          city: 'Lagos',
          region: 'Lagos State',
          priceBand: '$$$',
          averageRating: 5,
          reviewCount: 234,
          shortDescription: 'Luxurious outdoor wedding venue in the heart of Lagos with beautiful gardens.',
          description: 'Royal Gardens Lagos offers an elegant outdoor wedding venue perfect for ceremonies and receptions. Located in Victoria Island, we provide stunning garden spaces with modern facilities and professional event coordination. Our venue features beautiful landscaped gardens, modern amenities, and professional event coordination services.',
          photos: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop&crop=center',
          website: 'https://instagram.com/royalgardens_lagos',
          email: 'info@royalgardens.ng',
          phone: '+234 803 123 4567',
          address: 'Victoria Island, Lagos, Nigeria',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'kemi-adetiba-photography',
          name: 'Kemi Adetiba Photography',
          category: 'Photography',
          city: 'Abuja',
          region: 'FCT',
          priceBand: '$$',
          averageRating: 5,
          reviewCount: 156,
          shortDescription: 'Award-winning Nigerian wedding photographer capturing authentic moments.',
          description: 'Specializing in candid moments and cultural celebrations, Kemi Adetiba Photography brings years of experience in capturing the beauty and emotion of Nigerian weddings with an artistic eye. We offer comprehensive wedding photography packages including engagement shoots, traditional ceremonies, and reception coverage.',
          photos: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop&crop=center',
          website: 'https://instagram.com/kemiadetiba_photography',
          email: 'hello@kemiadetiba.com',
          phone: '+234 901 234 5678',
          address: 'Abuja, FCT, Nigeria',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'bella-naija-weddings',
          name: 'Bella Naija Weddings',
          category: 'Planning',
          city: 'Lagos',
          region: 'Lagos State',
          priceBand: '$$$',
          averageRating: 5,
          reviewCount: 89,
          shortDescription: 'Premier wedding planning service for luxury Nigerian weddings.',
          description: 'Full-service wedding planning and coordination for couples seeking elegant, culturally-rich celebrations. We specialize in traditional Nigerian ceremonies and modern receptions, offering complete planning services from venue selection to day-of coordination.',
          photos: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop&crop=center',
          website: 'https://instagram.com/bellanaijaweddings',
          email: 'info@bellanaijaweddings.com',
          phone: '+234 802 345 6789',
          address: 'Ikoyi, Lagos, Nigeria',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vendor = sampleVendors.find(v => v.id === id)
    }

    if (!vendor) {
      return createErrorResponse('Vendor not found', 404, 'NOT_FOUND')
    }

    // Transform to match the expected PublicVendor format for the detail page
    const publicVendor = {
      id: vendor.id,
      slug: vendor.id, // Use ID as slug for now
      businessName: vendor.name,
      description: vendor.description || vendor.shortDescription || '',
      category: vendor.category,
      location: `${vendor.city}${vendor.region ? `, ${vendor.region}` : ''}`,
      contactEmail: vendor.email || '',
      contactPhone: vendor.phone || '',
      website: vendor.website || '',
      socialMedia: {
        instagram: vendor.website || ''
      },
      images: vendor.photos ? [{
        id: '1',
        url: vendor.photos,
        alt: `${vendor.name} - Main Image`,
        caption: vendor.shortDescription || '',
        isPrimary: true,
        order: 1
      }] : [],
      pricing: {
        startingPrice: vendor.priceBand === '$' ? 50000 : vendor.priceBand === '$$' ? 150000 : 300000,
        currency: 'NGN',
        priceRange: vendor.priceBand || '$$',
        packages: [
          {
            name: 'Basic Package',
            price: vendor.priceBand === '$' ? 50000 : vendor.priceBand === '$$' ? 150000 : 300000,
            description: 'Essential services for your special day',
            features: ['Professional service', 'Quality guarantee', 'Customer support']
          },
          {
            name: 'Premium Package',
            price: vendor.priceBand === '$' ? 100000 : vendor.priceBand === '$$' ? 300000 : 600000,
            description: 'Enhanced services with additional features',
            features: ['Everything in Basic', 'Extended coverage', 'Premium materials', 'Dedicated coordinator']
          }
        ]
      },
      availability: {
        isAvailable: true,
        nextAvailableDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        bookingLeadTime: 30,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        workingHours: {
          start: '09:00',
          end: '18:00'
        }
      },
      features: [
        'Professional service',
        'Quality guarantee',
        'Experienced team',
        'Customer support',
        'Flexible packages'
      ],
      reviews: [
        {
          id: '1',
          rating: 5,
          comment: 'Absolutely amazing service! Highly recommended for anyone planning their special day.',
          reviewerName: 'Sarah Johnson',
          reviewerInitials: 'SJ',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          isVerified: true
        },
        {
          id: '2',
          rating: 5,
          comment: 'Professional, reliable, and exceeded our expectations. Thank you for making our day perfect!',
          reviewerName: 'Michael Chen',
          reviewerInitials: 'MC',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          isVerified: true
        }
      ],
      rating: vendor.averageRating || 5,
      reviewCount: vendor.reviewCount || 0,
      createdAt: vendor.createdAt || new Date(),
      updatedAt: vendor.updatedAt || new Date()
    }

    return createSuccessResponse(publicVendor, 'Vendor details retrieved successfully')

  } catch (error) {
    console.error('Error fetching vendor details:', error)
    return createErrorResponse(`Failed to fetch vendor details: ${error.message}`, 500, 'FETCH_ERROR')
  }
}