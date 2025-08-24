'use client'

import { useState, useEffect, useCallback } from 'react'
import { VendorImage } from '@/features/vendors/service/vendor.service'

interface ImageGalleryProps {
  images: VendorImage[]
  vendorName: string
}

export function ImageGallery({ images, vendorName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

  // Sort images by order and primary status
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return a.order - b.order
  })

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isLightboxOpen) return

    switch (event.key) {
      case 'Escape':
        setIsLightboxOpen(false)
        break
      case 'ArrowLeft':
        event.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : sortedImages.length - 1
        )
        break
      case 'ArrowRight':
        event.preventDefault()
        setSelectedIndex(prev => 
          prev < sortedImages.length - 1 ? prev + 1 : 0
        )
        break
    }
  }, [isLightboxOpen, sortedImages.length])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle image loading states
  const handleImageLoad = (imageId: string) => {
    setIsLoading(prev => ({ ...prev, [imageId]: false }))
  }

  const handleImageLoadStart = (imageId: string) => {
    setIsLoading(prev => ({ ...prev, [imageId]: true }))
  }

  // Open lightbox
  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    setIsLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  // Close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false)
    document.body.style.overflow = 'unset'
  }

  // Navigate images
  const goToPrevious = () => {
    setSelectedIndex(prev => 
      prev > 0 ? prev - 1 : sortedImages.length - 1
    )
  }

  const goToNext = () => {
    setSelectedIndex(prev => 
      prev < sortedImages.length - 1 ? prev + 1 : 0
    )
  }

  if (sortedImages.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-500">No images available</p>
      </div>
    )
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
            onClick={() => openLightbox(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openLightbox(index)
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View ${image.alt} in full size`}
          >
            {/* Loading placeholder */}
            {isLoading[image.id] && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Image */}
            <img
              src={image.url}
              alt={image.alt}
              className={`w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105 ${
                isLoading[image.id] ? 'opacity-0' : 'opacity-100'
              }`}
              onLoadStart={() => handleImageLoadStart(image.id)}
              onLoad={() => handleImageLoad(image.id)}
              loading={index < 6 ? 'eager' : 'lazy'}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white rounded-full p-2">
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Primary badge */}
            {image.isPrimary && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Primary
              </div>
            )}

            {/* Caption */}
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <p className="text-white text-sm">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery lightbox"
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation buttons */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Previous image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Next image"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main image */}
          <div 
            className="max-w-7xl max-h-full mx-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={sortedImages[selectedIndex].url}
              alt={sortedImages[selectedIndex].alt}
              className="max-w-full max-h-[80vh] object-contain"
            />

            {/* Image info */}
            <div className="mt-4 text-center text-white">
              <p className="text-lg font-medium">
                {sortedImages[selectedIndex].alt}
              </p>
              {sortedImages[selectedIndex].caption && (
                <p className="text-gray-300 mt-1">
                  {sortedImages[selectedIndex].caption}
                </p>
              )}
              <p className="text-gray-400 text-sm mt-2">
                {selectedIndex + 1} of {sortedImages.length}
              </p>
            </div>
          </div>

          {/* Thumbnail navigation */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto px-4">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex(index)
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black ${
                    index === selectedIndex
                      ? 'border-white'
                      : 'border-transparent hover:border-gray-400'
                  }`}
                  aria-label={`View image ${index + 1}: ${image.alt}`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Keyboard instructions */}
          <div className="absolute bottom-4 right-4 text-white text-sm bg-black bg-opacity-50 rounded px-3 py-2">
            <p>Use ← → keys to navigate • ESC to close</p>
          </div>
        </div>
      )}
    </>
  )
}