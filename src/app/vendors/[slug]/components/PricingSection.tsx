'use client'

import { useState } from 'react'
import { PricingInfo } from '@/features/vendors/service/vendor.service'

interface PricingSectionProps {
  pricing: PricingInfo
}

export function PricingSection({ pricing }: PricingSectionProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Pricing</h3>
      
      {/* Starting Price */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-blue-600 font-medium mb-1">Starting from</p>
          <p className="text-3xl font-bold text-blue-900">
            {pricing.currency === 'NGN' ? '₦' : pricing.currency} {pricing.startingPrice.toLocaleString()}
          </p>
          <p className="text-sm text-blue-700 mt-1">{pricing.priceRange}</p>
        </div>
      </div>

      {/* Pricing Packages */}
      {pricing.packages && pricing.packages.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Available Packages</h4>
          
          {pricing.packages.map((pkg, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPackage === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPackage(selectedPackage === index ? null : index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedPackage(selectedPackage === index ? null : index)
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={selectedPackage === index}
              aria-label={`${pkg.name} package details`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-gray-900">{pkg.name}</h5>
                  <p className="text-2xl font-bold text-blue-600">
                    {pricing.currency === 'NGN' ? '₦' : pricing.currency} {pkg.price.toLocaleString()}
                  </p>
                </div>
                
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedPackage === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <p className="text-gray-600 text-sm mt-1">{pkg.description}</p>

              {/* Package Features (Expandable) */}
              {selectedPackage === index && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h6 className="font-medium text-gray-900 mb-2">What's included:</h6>
                  <ul className="space-y-1">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pricing Notes */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">Pricing Information</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Prices may vary based on event size and requirements</li>
          <li>• Custom packages available upon request</li>
          <li>• Final pricing confirmed after consultation</li>
          <li>• Payment plans may be available</li>
        </ul>
      </div>

      {/* Call to Action */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-3">
          Get a personalized quote for your event
        </p>
        <button
          onClick={() => {
            // Scroll to contact section
            const contactSection = document.getElementById('contact')
            if (contactSection) {
              contactSection.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Request Quote
        </button>
      </div>

      {/* Payment Methods */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h5 className="font-medium text-gray-900 mb-3">Accepted Payment Methods</h5>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Cards
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cash
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            Transfer
          </div>
        </div>
      </div>
    </div>
  )
}