'use client'

import { useState, useEffect, useRef } from 'react'
import { PublicVendor } from '@/features/vendors/service/vendor.service'
import { ImageGallery } from './components/ImageGallery'
import { ContactForm } from './components/ContactForm'
import { VendorInfo } from './components/VendorInfo'
import { ReviewsSection } from './components/ReviewsSection'
import { PricingSection } from './components/PricingSection'

interface ClientPageProps {
  vendor: PublicVendor
}

export function ClientPage({ vendor }: ClientPageProps) {
  const [activeSection, setActiveSection] = useState('overview')
  const [isContactFormOpen, setIsContactFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Refs for scroll-to-section functionality
  const overviewRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Handle client-side hydration
  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Handle scroll-to-section
  const scrollToSection = (section: string) => {
    const refs = {
      overview: overviewRef,
      gallery: galleryRef,
      pricing: pricingRef,
      reviews: reviewsRef,
      contact: contactRef
    }

    const targetRef = refs[section as keyof typeof refs]
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      setActiveSection(section)
    }
  }

  // Handle intersection observer for active section
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    
    const sections = [
      { ref: overviewRef, id: 'overview' },
      { ref: galleryRef, id: 'gallery' },
      { ref: pricingRef, id: 'pricing' },
      { ref: reviewsRef, id: 'reviews' },
      { ref: contactRef, id: 'contact' }
    ]

    sections.forEach(({ ref, id }) => {
      if (ref.current) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setActiveSection(id)
            }
          },
          { threshold: 0.3 }
        )
        
        observer.observe(ref.current)
        observers.push(observer)
      }
    })

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isContactFormOpen) {
        setIsContactFormOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isContactFormOpen])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vendor.businessName}
              </h1>
              <p className="text-gray-600">{vendor.category} • {vendor.location}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                <span className="text-gray-500">({vendor.reviewCount} reviews)</span>
              </div>
              
              <button
                onClick={() => setIsContactFormOpen(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Contact ${vendor.businessName}`}
              >
                Contact Vendor
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="border-t border-gray-200">
            <div className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'gallery', label: 'Gallery' },
                { id: 'pricing', label: 'Pricing' },
                { id: 'reviews', label: 'Reviews' },
                { id: 'contact', label: 'Contact' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    activeSection === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-current={activeSection === id ? 'page' : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Section */}
            <section ref={overviewRef} id="overview" className="scroll-mt-32">
              <VendorInfo vendor={vendor} />
            </section>

            {/* Gallery Section */}
            <section ref={galleryRef} id="gallery" className="scroll-mt-32">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Gallery</h2>
                <ImageGallery images={vendor.images} vendorName={vendor.businessName} />
              </div>
            </section>

            {/* Reviews Section */}
            <section ref={reviewsRef} id="reviews" className="scroll-mt-32">
              <ReviewsSection 
                reviews={vendor.reviews}
                rating={vendor.rating}
                reviewCount={vendor.reviewCount}
              />
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing Section */}
            <section ref={pricingRef} id="pricing" className="scroll-mt-32">
              <PricingSection pricing={vendor.pricing} />
            </section>

            {/* Quick Contact */}
            <section ref={contactRef} id="contact" className="scroll-mt-32">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-32">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Contact
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400">📧</span>
                    <a 
                      href={`mailto:${vendor.contactEmail}`}
                      className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    >
                      {vendor.contactEmail}
                    </a>
                  </div>
                  
                  {vendor.contactPhone && (
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400">📞</span>
                      <a 
                        href={`tel:${vendor.contactPhone}`}
                        className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        {vendor.contactPhone}
                      </a>
                    </div>
                  )}
                  
                  {vendor.website && (
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400">🌐</span>
                      <a 
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsContactFormOpen(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Send Inquiry
                </button>

                {/* Availability Info */}
                {vendor.availability && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                    <div className="text-sm text-gray-600">
                      <p className={`mb-1 ${vendor.availability.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {vendor.availability.isAvailable ? '✓ Available' : '✗ Currently Unavailable'}
                      </p>
                      {vendor.availability.nextAvailableDate && (
                        <p>Next available: {new Date(vendor.availability.nextAvailableDate).toLocaleDateString()}</p>
                      )}
                      <p>Booking lead time: {vendor.availability.bookingLeadTime} days</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Contact Form Modal */}
      {isContactFormOpen && (
        <ContactForm
          vendor={vendor}
          isOpen={isContactFormOpen}
          onClose={() => setIsContactFormOpen(false)}
        />
      )}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
            priceRange: vendor.pricing.priceRange
          })
        }}
      />
    </div>
  )
}