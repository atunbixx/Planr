import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { vendorService } from '@/lib/db/services'
import { successResponse } from '@/lib/api/errors'
import { Vendor } from '@prisma/client'

// Vendor categories with icons
export const VENDOR_CATEGORIES = [
  { name: 'Venue', icon: '🏛️' },
  { name: 'Catering', icon: '🍽️' },
  { name: 'Photography', icon: '📸' },
  { name: 'Videography', icon: '🎥' },
  { name: 'Music/DJ', icon: '🎵' },
  { name: 'Flowers', icon: '💐' },
  { name: 'Transportation', icon: '🚗' },
  { name: 'Wedding Cake', icon: '🎂' },
  { name: 'Hair & Makeup', icon: '💄' },
  { name: 'Officiant', icon: '👨‍💼' },
  { name: 'Decorations', icon: '🎀' },
  { name: 'Other', icon: '📝' }
]

// GET /api/vendors - Get all vendors for the couple
export const GET = withAuth(async (request, context) => {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  
  // If searching, use the search method
  if (search || category || status) {
    const vendors = await vendorService.searchVendors(
      context.couple.id,
      search || '',
      { category: category || undefined, status: status || undefined }
    )
    return successResponse({ data: { vendors } })
  }
  
  // Otherwise, get all vendors with stats
  const result = await vendorService.getVendorsByCouple(context.couple.id)
  
  return successResponse({ data: result })
})

// POST /api/vendors - Create a new vendor
export const POST = withAuth<any, Vendor>(async (request, context) => {
  const body = await request.json()
  
  const vendor = await vendorService.createVendor(context.couple.id, body)
  
  return successResponse({
    message: 'Vendor created successfully',
    data: vendor
  })
})

// GET /api/vendors/categories - Get vendor categories
export const getCategories = withAuth(async () => {
  return successResponse({ data: VENDOR_CATEGORIES })
})