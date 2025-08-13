import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { VendorRepository } from '@/features/vendors/repo'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'

const coupleRepository = new CoupleRepository()
const vendorRepository = new VendorRepository()

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Creating vendor with admin privileges:', body)
    console.log('User:', user.id)

    // Get user's couple data using repository
    const couple = await coupleRepository.findByUserId(user.id)
    
    if (!couple) {
      return NextResponse.json({ 
        error: 'No couple data found. Please complete onboarding first.',
        redirect: '/onboarding'
      }, { status: 404 })
    }

    const coupleId = couple.id
    console.log('Found couple ID:', coupleId)

    // Create new vendor using repository
    const vendorData = {
      coupleId: coupleId,
      name: body.name,
      category: body.category || 'other',
      subcategory: body.subcategory,
      contactName: body.contactName || null,
      email: body.email || null,
      phone: body.phone || null,
      website: body.website || null,
      businessAddress: body.address || null,
      description: body.description,
      specialties: body.specialties || [],
      priceRange: body.priceRange || 'medium',
      estimatedCost: body.estimatedCost ? Number(body.estimatedCost) : null,
      currency: body.currency || 'USD',
      status: body.status || 'potential',
      contractSigned: body.contractSigned || false,
      contractDate: body.contractDate,
      contractAmount: body.actualCost ? Number(body.actualCost) : null,
      serviceDate: body.serviceDate,
      bookingDeadline: body.bookingDeadline,
      rating: body.rating || null,
      reviewNotes: body.reviewNotes,
      tags: body.tags || [],
      notes: body.notes || null,
      priority: body.priority || 'medium',
      isRecommended: body.isRecommended || false,
      externalId: body.externalId,
      source: body.source || 'manual'
    }

    console.log('Inserting vendor data:', vendorData)

    // Create vendor using repository
    const vendor = await vendorRepository.create(vendorData)

    if (!vendor) {
      console.error('Error creating vendor')
      return NextResponse.json({
        error: 'Failed to create vendor'
      }, { status: 500 })
    }

    console.log('Vendor created successfully:', vendor)

    return NextResponse.json({
      success: true,
      data: vendor,
      message: 'Vendor created successfully!'
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data using repository
    const couple = await coupleRepository.findByUserId(user.id)
    
    if (!couple) {
      return NextResponse.json({ error: 'No couple data found' }, { status: 404 })
    }

    const coupleId = couple.id

    // Get vendors for this couple using repository
    const vendors = await vendorRepository.findByCoupleId(coupleId)

    return NextResponse.json({
      success: true,
      data: {
        vendors: vendors || [],
        categoryStats: [], // We can add this later
        summary: {
          totalVendors: vendors?.length || 0,
          bookedVendors: vendors?.filter(v => v.status === 'booked').length || 0,
          pendingVendors: vendors?.filter(v => ['potential', 'contacted', 'quote_requested', 'in_discussion'].includes(v.status)).length || 0,
          totalEstimatedCost: vendors?.reduce((sum, v) => sum + (Number(v.estimatedCost) || 0), 0) || 0,
          totalActualCost: vendors?.reduce((sum, v) => sum + (Number(v.contractAmount) || 0), 0) || 0,
          contractsSigned: vendors?.filter(v => v.contractSigned).length || 0
        }
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}