import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET /api/marketplace/vendors/[id]/packages - Get vendor packages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    const { searchParams } = new URL(request.url)
    
    const featuredOnly = searchParams.get('featured') === 'true'

    const whereClause: any = {
      vendor_id: vendorId
    }

    if (featuredOnly) {
      whereClause.is_featured = true
    }

    const packages = await prisma.vendor_packages.findMany({
      where: whereClause,
      orderBy: [
        { is_featured: 'desc' },
        { price: 'asc' }
      ]
    })

    const transformedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      duration: pkg.duration,
      includes: Array.isArray(pkg.includes) ? pkg.includes : [],
      image_url: pkg.image_url,
      is_featured: pkg.is_featured,
      created_at: pkg.created_at,
      updated_at: pkg.updated_at,
      features: Array.isArray(pkg.includes) ? pkg.includes : [],
      popular: pkg.is_featured,
      savings: calculateSavings(pkg.price, Array.isArray(pkg.includes) ? pkg.includes.length : 0)
    }))

    return createSuccessResponse(transformedPackages)
  } catch (error) {
    console.error('Packages error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

function calculateSavings(price: number, featureCount: number): string {
  // Simple savings calculation based on features
  const estimatedValue = price * 1.5 + (featureCount * 100)
  const savings = estimatedValue - price
  return savings > 0 ? `Save $${Math.round(savings)}` : ''
}