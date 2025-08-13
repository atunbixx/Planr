'use server'

import { NextRequest, NextResponse } from 'next/server'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const coupleRepository = new CoupleRepository()

// Validation schema
const contractSchema = z.object({
  vendorId: z.string().uuid().optional(),
  contractType: z.enum(['service', 'rental', 'venue', 'other']),
  contractValue: z.number().min(0),
  currency: z.string().default('USD'),
  signedDate: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  paymentSchedule: z.string(),
  cancellationPolicy: z.string().optional(),
  notes: z.string().optional(),
  contractUrl: z.string().optional(),
  status: z.enum(['draft', 'sent', 'signed', 'expired']).default('draft'),
  paymentStatus: z.enum(['pending', 'deposit_paid', 'partial', 'paid_full']).default('pending')
})

async function getCoupleId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Find couple by user ID using repository
  const couple = await coupleRepository.findByUserId(user.id)

  if (!couple) {
    throw new Error('No couple found for user')
  }

  return couple.id
}

export async function GET(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    
    const url = new URL(request.url)
    const vendorId = url.searchParams.get('vendorId')

    const whereClause: any = {
      couple_id: coupleId
    }

    if (vendorId) {
      whereClause.vendor_id = vendorId
    }

    const contracts = await prisma.contracts.findMany({
      where: whereClause,
      include: {
        couple_vendors: {
          select: {
            id: true,
            name: true,
            business_name: true,
            category: true,
            contact_person: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Transform data to match ContractDialog interface
    const transformedContracts = contracts.map(contract => ({
      id: contract.id,
      vendorId: contract.vendor_id || '',
      contractType: mapContractType(contract.title), // Map from title since we don't have contractType field
      contractValue: Number(contract.amount),
      currency: 'USD', // Default since not stored
      signedDate: contract.signed_date?.toISOString(),
      startDate: contract.due_date?.toISOString() || '',
      paymentSchedule: 'full_upfront', // Default since not stored
      cancellationPolicy: contract.terms,
      notes: contract.notes,
      contractUrl: contract.contract_url,
      status: contract.status as any,
      paymentStatus: 'pending', // Default since not stored
      vendor: contract.couple_vendors ? {
        name: contract.couple_vendors.name,
        contactName: contract.couple_vendors.contact_person
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: transformedContracts
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contracts'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    const body = await request.json()
    
    const validatedData = contractSchema.parse(body)

    // Create contract record
    const contract = await prisma.contracts.create({
      data: {
        couple_id: coupleId,
        vendor_id: validatedData.vendorId || null,
        title: `${validatedData.contractType} Contract`,
        description: validatedData.notes,
        contract_url: validatedData.contractUrl,
        amount: validatedData.contractValue,
        signed_date: validatedData.signedDate ? new Date(validatedData.signedDate) : null,
        due_date: new Date(validatedData.startDate),
        terms: validatedData.cancellationPolicy,
        notes: validatedData.notes,
        status: validatedData.status
      },
      include: {
        couple_vendors: {
          select: {
            id: true,
            name: true,
            business_name: true,
            contact_person: true
          }
        }
      }
    })

    // Transform response to match ContractDialog interface
    const transformedContract = {
      id: contract.id,
      vendorId: contract.vendor_id || '',
      contractType: validatedData.contractType,
      contractValue: validatedData.contractValue,
      currency: validatedData.currency,
      signedDate: contract.signed_date?.toISOString(),
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      paymentSchedule: validatedData.paymentSchedule,
      cancellationPolicy: validatedData.cancellationPolicy,
      notes: validatedData.notes,
      contractUrl: validatedData.contractUrl,
      status: validatedData.status,
      paymentStatus: validatedData.paymentStatus,
      vendor: contract.couple_vendors ? {
        name: contract.couple_vendors.name,
        contactName: contract.couple_vendors.contact_person
      } : null
    }

    return NextResponse.json({
      success: true,
      data: transformedContract
    })
  } catch (error) {
    console.error('Error creating contract:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data provided',
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contract'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Contract ID is required'
      }, { status: 400 })
    }

    const validatedData = contractSchema.parse(updateData)

    // Check if contract belongs to this couple
    const existingContract = await prisma.contracts.findFirst({
      where: {
        id: id,
        couple_id: coupleId
      }
    })

    if (!existingContract) {
      return NextResponse.json({
        success: false,
        error: 'Contract not found'
      }, { status: 404 })
    }

    // Update contract
    const contract = await prisma.contracts.update({
      where: { id: id },
      data: {
        vendor_id: validatedData.vendorId || null,
        title: `${validatedData.contractType} Contract`,
        description: validatedData.notes,
        contract_url: validatedData.contractUrl,
        amount: validatedData.contractValue,
        signed_date: validatedData.signedDate ? new Date(validatedData.signedDate) : null,
        due_date: new Date(validatedData.startDate),
        terms: validatedData.cancellationPolicy,
        notes: validatedData.notes,
        status: validatedData.status,
        updated_at: new Date()
      },
      include: {
        couple_vendors: {
          select: {
            id: true,
            name: true,
            business_name: true,
            contact_person: true
          }
        }
      }
    })

    // Transform response
    const transformedContract = {
      id: contract.id,
      vendorId: contract.vendor_id || '',
      contractType: validatedData.contractType,
      contractValue: validatedData.contractValue,
      currency: validatedData.currency,
      signedDate: contract.signed_date?.toISOString(),
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      paymentSchedule: validatedData.paymentSchedule,
      cancellationPolicy: validatedData.cancellationPolicy,
      notes: validatedData.notes,
      contractUrl: validatedData.contractUrl,
      status: validatedData.status,
      paymentStatus: validatedData.paymentStatus,
      vendor: contract.couple_vendors ? {
        name: contract.couple_vendors.name,
        contactName: contract.couple_vendors.contact_person
      } : null
    }

    return NextResponse.json({
      success: true,
      data: transformedContract
    })
  } catch (error) {
    console.error('Error updating contract:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data provided',
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contract'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Contract ID is required'
      }, { status: 400 })
    }

    // Check if contract belongs to this couple
    const existingContract = await prisma.contracts.findFirst({
      where: {
        id: id,
        couple_id: coupleId
      }
    })

    if (!existingContract) {
      return NextResponse.json({
        success: false,
        error: 'Contract not found'
      }, { status: 404 })
    }

    // Delete contract
    await prisma.contracts.delete({
      where: { id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contract'
    }, { status: 500 })
  }
}

// Helper function to map contract titles to types
function mapContractType(title: string): 'service' | 'rental' | 'venue' | 'other' {
  if (!title) return 'other'
  
  const lowerTitle = title.toLowerCase()
  if (lowerTitle.includes('venue') || lowerTitle.includes('location')) return 'venue'
  if (lowerTitle.includes('rental') || lowerTitle.includes('equipment')) return 'rental'
  if (lowerTitle.includes('service')) return 'service'
  return 'other'
}