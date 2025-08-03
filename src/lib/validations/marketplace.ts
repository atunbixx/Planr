import { z } from 'zod'

// Vendor category enum
export const vendorCategorySchema = z.enum([
  'venue', 'catering', 'photography', 'videography', 'florist', 
  'music_dj', 'band', 'transportation', 'beauty', 'attire', 
  'jewelry', 'invitations', 'decoration', 'lighting', 'rentals', 
  'officiant', 'planner', 'cake', 'entertainment', 'security', 
  'insurance', 'other'
])

// Vendor search/filter validation
export const vendorSearchSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 12),
  category: z.string().optional(),
  location: z.string().optional(),
  lat: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  lng: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  radius: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  minRating: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  verified: z.string().optional().transform(val => val === 'true'),
  featured: z.string().optional().transform(val => val === 'true'),
  search: z.string().optional(),
  sortBy: z.enum(['rating', 'price', 'newest', 'distance']).optional().default('rating'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
}).refine(data => {
  // Validate page and limit are positive
  if (data.page && data.page < 1) return false
  if (data.limit && (data.limit < 1 || data.limit > 100)) return false
  
  // Validate rating range
  if (data.minRating && (data.minRating < 0 || data.minRating > 5)) return false
  
  // Validate price
  if (data.maxPrice && data.maxPrice < 0) return false
  
  // Validate location coordinates
  if (data.lat !== undefined && (data.lat < -90 || data.lat > 90)) return false
  if (data.lng !== undefined && (data.lng < -180 || data.lng > 180)) return false
  if (data.radius !== undefined && (data.radius < 1 || data.radius > 200)) return false
  
  // If sortBy is distance, lat and lng must be provided
  if (data.sortBy === 'distance' && (!data.lat || !data.lng)) return false
  
  return true
}, {
  message: "Invalid search parameters"
})

// Vendor inquiry validation
export const vendorInquirySchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  eventDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  eventType: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  budgetRange: z.string().optional(),
  message: z.string().min(10).max(2000),
  specificQuestions: z.string().optional().max(1000)
})

// Vendor review validation
export const vendorReviewSchema = z.object({
  vendorId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  review: z.string().min(10).max(5000),
  eventDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  photos: z.array(z.string().url()).optional()
})

// Vendor contact validation
export const vendorContactSchema = z.object({
  vendorId: z.string().uuid(),
  action: z.enum(['email', 'call', 'website', 'inquiry']),
  message: z.string().optional(),
  eventDate: z.string().optional(),
  guestCount: z.number().int().positive().optional()
})

// Vendor package validation (for vendor dashboard)
export const vendorPackageSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  priceUnit: z.enum(['flat', 'hourly', 'per_person']).default('flat'),
  includedItems: z.array(z.string()).default([]),
  excludedItems: z.array(z.string()).default([]),
  minGuests: z.number().int().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  durationHours: z.number().positive().optional(),
  isPopular: z.boolean().default(false),
  displayOrder: z.number().int().default(0)
})

// Vendor profile update validation (for vendor dashboard)
export const vendorProfileUpdateSchema = z.object({
  businessName: z.string().min(3).max(200).optional(),
  contactName: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  priceRange: z.string().max(50).optional(),
  specialties: z.array(z.string()).optional(),
  portfolioImages: z.array(z.string().url()).optional(),
  portfolioVideos: z.array(z.string().url()).optional(),
  yearsInBusiness: z.number().int().positive().optional(),
  teamSize: z.number().int().positive().optional(),
  bookingLeadTimeDays: z.number().int().positive().optional(),
  requiresDeposit: z.boolean().optional(),
  depositPercentage: z.number().int().min(0).max(100).optional(),
  cancellationPolicy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
})

// Vendor availability update validation
export const vendorAvailabilitySchema = z.object({
  date: z.string().transform(val => new Date(val)),
  isAvailable: z.boolean(),
  isBooked: z.boolean().optional(),
  priceAdjustmentPercentage: z.number().int().min(-50).max(200).optional(),
  notes: z.string().optional()
})

// Batch availability update
export const vendorAvailabilityBatchSchema = z.object({
  dates: z.array(z.string().transform(val => new Date(val))),
  isAvailable: z.boolean(),
  priceAdjustmentPercentage: z.number().int().min(-50).max(200).optional()
})

// Type exports
export type VendorCategory = z.infer<typeof vendorCategorySchema>
export type VendorSearchParams = z.infer<typeof vendorSearchSchema>
export type VendorInquiry = z.infer<typeof vendorInquirySchema>
export type VendorReview = z.infer<typeof vendorReviewSchema>
export type VendorContact = z.infer<typeof vendorContactSchema>
export type VendorPackage = z.infer<typeof vendorPackageSchema>
export type VendorProfileUpdate = z.infer<typeof vendorProfileUpdateSchema>
export type VendorAvailability = z.infer<typeof vendorAvailabilitySchema>
export type VendorAvailabilityBatch = z.infer<typeof vendorAvailabilityBatchSchema>