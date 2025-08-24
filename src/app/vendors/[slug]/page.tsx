import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VendorService, PublicVendor } from '@/features/vendors/service/vendor.service'
import { ClientPage } from './ClientPage'

// Revalidate every 15 minutes (configurable via environment variable)
export const revalidate = parseInt(process.env.DEFAULT_REVALIDATE_SECONDS || '900')

// Enable ISR
export const dynamic = 'force-static'

interface VendorPageProps {
  params: {
    slug: string
  }
}

/**
 * Generate static params for popular vendors
 */
export async function generateStaticParams() {
  try {
    const vendorService = new VendorService()
    const result = await vendorService.getPopularVendors(50)
    
    if (!result.success || !result.data) {
      console.warn('Failed to get popular vendors for static generation')
      return []
    }

    const params = result.data.map(vendor => ({
      slug: vendor.slug
    }))

    console.log(`Generated static params for ${params.length} popular vendors`)
    return params
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  try {
    const vendorService = new VendorService()
    const result = await vendorService.getVendorBySlug(params.slug)

    if (!result.success || !result.data) {
      return {
        title: 'Vendor Not Found | Planr',
        description: 'The requested vendor could not be found.'
      }
    }

    const vendor = result.data
    const primaryImage = vendor.images.find(img => img.isPrimary) || vendor.images[0]

    return {
      title: `${vendor.businessName} | ${vendor.category} | Planr`,
      description: vendor.description.length > 160 
        ? vendor.description.substring(0, 157) + '...'
        : vendor.description,
      keywords: [
        vendor.businessName,
        vendor.category,
        vendor.location,
        'wedding',
        'vendor',
        'planning',
        ...vendor.features
      ].join(', '),
      authors: [{ name: 'Planr' }],
      openGraph: {
        title: `${vendor.businessName} | ${vendor.category}`,
        description: vendor.description,
        type: 'business.business',
        url: `/vendors/${vendor.slug}`,
        siteName: 'Planr',
        images: primaryImage ? [{
          url: primaryImage.url,
          width: 1200,
          height: 630,
          alt: primaryImage.alt
        }] : [],
        locale: 'en_US'
      },
      twitter: {
        card: 'summary_large_image',
        title: `${vendor.businessName} | ${vendor.category}`,
        description: vendor.description,
        images: primaryImage ? [primaryImage.url] : []
      },
      alternates: {
        canonical: `/vendors/${vendor.slug}`
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Vendor | Planr',
      description: 'Find the perfect wedding vendor for your special day.'
    }
  }
}

/**
 * Vendor page component (SSR)
 */
export default async function VendorPage({ params }: VendorPageProps) {
  try {
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(params.slug)) {
      notFound()
    }

    // Get vendor data
    const vendorService = new VendorService()
    const result = await vendorService.getVendorBySlug(params.slug)

    if (!result.success) {
      console.error('Failed to get vendor:', result.error)
      notFound()
    }

    if (!result.data) {
      notFound()
    }

    const vendor = result.data

    // Server-side rendered content for SEO
    return (
      <div className="min-h-screen bg-gray-50">
        {/* SEO-friendly server-rendered content */}
        <div className="hidden" itemScope itemType="https://schema.org/LocalBusiness">
          <h1 itemProp="name">{vendor.businessName}</h1>
          <div itemProp="description">{vendor.description}</div>
          <div itemProp="address">{vendor.location}</div>
          <div itemProp="telephone">{vendor.contactPhone}</div>
          <div itemProp="email">{vendor.contactEmail}</div>
          <div itemProp="url">{vendor.website}</div>
          <div itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
            <span itemProp="ratingValue">{vendor.rating}</span>
            <span itemProp="reviewCount">{vendor.reviewCount}</span>
          </div>
          {vendor.images.map((image, index) => (
            <img
              key={image.id}
              itemProp="image"
              src={image.url}
              alt={image.alt}
              style={{ display: 'none' }}
            />
          ))}
        </div>

        {/* Noscript fallback */}
        <noscript>
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {vendor.businessName}
              </h1>
              <p className="text-lg text-gray-600 mb-4">{vendor.category}</p>
              <p className="text-gray-700 mb-6">{vendor.description}</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
                  <p className="mb-2">
                    <strong>Location:</strong> {vendor.location}
                  </p>
                  <p className="mb-2">
                    <strong>Email:</strong> {vendor.contactEmail}
                  </p>
                  {vendor.contactPhone && (
                    <p className="mb-2">
                      <strong>Phone:</strong> {vendor.contactPhone}
                    </p>
                  )}
                  {vendor.website && (
                    <p className="mb-2">
                      <strong>Website:</strong>{' '}
                      <a href={vendor.website} className="text-blue-600 hover:underline">
                        {vendor.website}
                      </a>
                    </p>
                  )}
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-3">Pricing</h2>
                  <p className="mb-2">
                    <strong>Starting from:</strong> {vendor.pricing.currency} {vendor.pricing.startingPrice}
                  </p>
                  <p className="text-gray-600">{vendor.pricing.priceRange}</p>
                </div>
              </div>

              {vendor.features.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-3">Features</h2>
                  <ul className="list-disc list-inside text-gray-700">
                    {vendor.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  <strong>Note:</strong> This page requires JavaScript for full functionality. 
                  Please enable JavaScript to view the complete vendor profile with image gallery, 
                  contact form, and interactive features.
                </p>
              </div>
            </div>
          </div>
        </noscript>

        {/* Client-side hydrated component */}
        <ClientPage vendor={vendor} />
      </div>
    )
  } catch (error) {
    console.error('Error in vendor page:', error)
    notFound()
  }
}

/**
 * JSON-LD structured data for SEO
 */
function generateStructuredData(vendor: PublicVendor) {
  const primaryImage = vendor.images.find(img => img.isPrimary) || vendor.images[0]
  
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: vendor.businessName,
    description: vendor.description,
    image: vendor.images.map(img => img.url),
    address: {
      '@type': 'PostalAddress',
      addressLocality: vendor.location
    },
    telephone: vendor.contactPhone,
    email: vendor.contactEmail,
    url: vendor.website,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: vendor.rating,
      reviewCount: vendor.reviewCount,
      bestRating: 5,
      worstRating: 1
    },
    review: vendor.reviews.slice(0, 5).map(review => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      },
      author: {
        '@type': 'Person',
        name: review.reviewerName
      },
      reviewBody: review.comment,
      datePublished: review.createdAt.toISOString()
    })),
    priceRange: vendor.pricing.priceRange,
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    currenciesAccepted: vendor.pricing.currency
  }
}