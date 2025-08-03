import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET /api/marketplace/vendors/[id]/quotes - Get vendor quotes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const quotes = await prisma.vendor_quotes.findMany({
      where: { vendor_id: vendorId },
      include: {
        couples: {
          select: {
            id: true,
            display_name: true,
            wedding_date: true
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit
    })

    const totalCount = await prisma.vendor_quotes.count({
      where: { vendor_id: vendorId }
    })

    const transformedQuotes = quotes.map(quote => ({
      id: quote.id,
      service_type: quote.service_type,
      description: quote.description,
      budget: quote.budget,
      event_date: quote.event_date,
      guest_count: quote.guest_count,
      status: quote.status,
      response: quote.response,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      couple: quote.couples ? {
        id: quote.couples.id,
        name: quote.couples.display_name,
        wedding_date: quote.couples.wedding_date
      } : null
    }))

    const hasMore = offset + limit < totalCount

    return createSuccessResponse({
      data: transformedQuotes,
      total: totalCount,
      page,
      limit,
      hasMore
    })
  } catch (error) {
    console.error('Quotes error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST /api/marketplace/vendors/[id]/quotes - Request vendor quote
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    const body = await request.json()
    const { 
      service_type, 
      description, 
      budget, 
      event_date, 
      guest_count, 
      contact_email, 
      contact_phone 
    } = body

    if (!service_type || !description) {
      return createErrorResponse('Service type and description are required', 400)
    }

    // In a real app, we'd get the couple ID from the authenticated user
    // For now, we'll use a placeholder
    const coupleId = 'placeholder-couple-id'

    const quote = await prisma.vendor_quotes.create({
      data: {
        vendor_id: vendorId,
        couple_id: coupleId,
        service_type,
        description,
        budget: budget || null,
        event_date: event_date ? new Date(event_date) : null,
        guest_count: guest_count || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      },
      include: {
        couples: {
          select: {
            id: true,
            display_name: true,
            wedding_date: true
          }
        },
        vendors: {
          select: {
            id: true,
            business_name: true,
            contact_email: true
          }
        }
      }
    })

    // Send notification to vendor (in real app, this would use a notification service)
    console.log(`New quote request for vendor ${vendorId}: ${service_type}`)

    const transformedQuote = {
      id: quote.id,
      service_type: quote.service_type,
      description: quote.description,
      budget: quote.budget,
      event_date: quote.event_date,
      guest_count: quote.guest_count,
      status: quote.status,
      response: quote.response,
      created_at: quote.created_at,
      updated_at: quote.updated_at,
      couple: quote.couples ? {
        id: quote.couples.id,
        name: quote.couples.display_name,
        wedding_date: quote.couples.wedding_date
      } : null,
      vendor: quote.vendors ? {
        id: quote.vendors.id,
        name: quote.vendors.business_name,
        email: quote.vendors.contact_email
      } : null
    }

    return createSuccessResponse(transformedQuote, 201)
  } catch (error) {
    console.error('Create quote error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}