import { NextRequest, NextResponse } from 'next/server'
import { VendorsService } from '@/lib/services/vendors.service'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'

// GET /api/vendors - Search and filter vendors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      category: searchParams.get('category') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      verified: searchParams.get('verified') === 'true' ? true : undefined
    }

    const vendors = await VendorsService.searchVendors(filters)
    
    return createSuccessResponse({
      vendors,
      count: vendors.length,
      filters: filters
    })
  } catch (error) {
    console.error('Search vendors error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST /api/vendors - Create sample vendors (development only)
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return createErrorResponse('Not available in production', 403)
    }

    const vendors = await VendorsService.createSampleVendors()
    
    return createSuccessResponse({
      vendors,
      count: vendors.length
    }, 'Sample vendors created successfully')
  } catch (error) {
    console.error('Create sample vendors error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}