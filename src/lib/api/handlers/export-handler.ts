import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/features/couples'
import QRCode from 'qrcode'

// Validation schemas
const exportOptionsSchema = z.object({
  includeGuests: z.boolean().optional().default(true),
  includeVendors: z.boolean().optional().default(true),
  includeBudget: z.boolean().optional().default(true),
  includeChecklist: z.boolean().optional().default(true),
  includePhotos: z.boolean().optional().default(false),
  includeMessages: z.boolean().optional().default(false),
  format: z.enum(['json', 'csv']).optional().default('json')
})

const generateQRSchema = z.object({
  type: z.enum(['rsvp', 'guest_check_in', 'vendor_check_in', 'website', 'custom']),
  data: z.any(),
  size: z.number().int().min(100).max(1000).optional().default(300),
  includeLabel: z.boolean().optional().default(true)
})

export class ExportHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'GET') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handleGet(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    
    // Parse export options
    const options = exportOptionsSchema.parse({
      includeGuests: searchParams.get('includeGuests') === 'true',
      includeVendors: searchParams.get('includeVendors') === 'true',
      includeBudget: searchParams.get('includeBudget') === 'true',
      includeChecklist: searchParams.get('includeChecklist') === 'true',
      includePhotos: searchParams.get('includePhotos') === 'true',
      includeMessages: searchParams.get('includeMessages') === 'true',
      format: searchParams.get('format') || 'json'
    })

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: authContext.userId }
    })

    if (!user) {
      return this.errorResponse('USER_NOT_FOUND', 'User not found', 404)
    }

    // Build export data based on options
    const exportData: any = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email || authContext.email || '',
        version: '2.0',
        options
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      },
      couple: {
        id: couple.id,
        partner1Name: couple.partner1Name,
        partner2Name: couple.partner2Name,
        weddingDate: couple.weddingDate,
        venueName: couple.venueName,
        venueLocation: couple.venueLocation,
        budget: couple.budget,
        createdAt: couple.createdAt,
        updatedAt: couple.updatedAt
      }
    }

    // Include guests if requested
    if (options.includeGuests) {
      const guests = await prisma.guest.findMany({
        where: { coupleId: couple.id },
        orderBy: { lastName: 'asc' }
      })

      exportData.guests = guests.map(guest => ({
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        address: guest.address,
        tableAssignment: guest.tableAssignment,
        dietaryRestrictions: guest.dietaryRestrictions,
        plusOneAllowed: guest.plusOneAllowed,
        plusOneName: guest.plusOneName,
        attendingStatus: guest.attendingStatus,
        rsvpDeadline: guest.rsvpDeadline,
        notes: guest.notes,
        createdAt: guest.createdAt
      }))
    }

    // Include vendors if requested
    if (options.includeVendors) {
      const vendors = await prisma.vendor.findMany({
        where: { coupleId: couple.id },
        orderBy: { name: 'asc' }
      })

      exportData.vendors = vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        categoryId: vendor.categoryId,
        contactName: vendor.contactName,
        email: vendor.email,
        phone: vendor.phone,
        website: vendor.website,
        address: vendor.address,
        status: vendor.status,
        priority: vendor.priority,
        rating: vendor.rating,
        estimatedCost: vendor.estimatedCost,
        actualCost: vendor.actualCost,
        contractSigned: vendor.contractSigned,
        notes: vendor.notes,
        createdAt: vendor.createdAt
      }))
    }

    // Include budget if requested
    if (options.includeBudget) {
      const [categories, expenses] = await Promise.all([
        prisma.budgetCategory.findMany({
          where: { coupleId: couple.id },
          orderBy: { name: 'asc' }
        }),
        prisma.budgetExpense.findMany({
          where: { coupleId: couple.id },
          orderBy: { createdAt: 'desc' }
        })
      ])

      exportData.budget = {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          allocatedAmount: cat.allocatedAmount,
          color: cat.color,
          icon: cat.icon,
          spentAmount: cat.spentAmount
        })),
        expenses: expenses.map(exp => ({
          id: exp.id,
          categoryId: exp.categoryId,
          vendorId: exp.vendorId,
          description: exp.description,
          amount: exp.amount,
          dueDate: exp.dueDate,
          paymentStatus: exp.paymentStatus,
          paymentMethod: exp.paymentMethod,
          notes: exp.notes
        }))
      }
    }

    // Include checklist if requested
    if (options.includeChecklist) {
      const tasks = await prisma.tasks.findMany({
        where: { couple_id: couple.id },
        orderBy: [
          { category: 'asc' },
          { created_at: 'asc' }
        ]
      })

      exportData.checklist = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        dueDate: task.due_date,
        isCompleted: task.completed,
        completedAt: task.completed_at,
        notes: task.notes
      }))
    }

    // Include photos if requested
    if (options.includePhotos) {
      const photos = await prisma.photo.findMany({
        where: { coupleId: couple.id },
        orderBy: { createdAt: 'desc' }
      })

      exportData.photos = photos.map(photo => ({
        id: photo.id,
        albumId: photo.albumId,
        url: photo.imageUrl,
        title: photo.title,
        caption: photo.caption,
        tags: photo.tags,
        isFavorite: photo.isFavorite,
        uploadedAt: photo.createdAt
      }))
    }

    // Include messages if requested
    if (options.includeMessages) {
      const messageLogs = await prisma.messageLog.findMany({
        where: { coupleId: couple.id },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limit to prevent huge exports
      })

      exportData.messageLogs = messageLogs.map(log => ({
        id: log.id,
        event: log.event,
        status: log.status,
        details: log.details,
        createdAt: log.createdAt
      }))
    }

    // Handle different formats
    if (options.format === 'csv') {
      // For CSV, we'll just export guests as it's the most common use case
      if (!options.includeGuests || !exportData.guests) {
        return this.errorResponse('INVALID_REQUEST', 'CSV export requires guests data', 400)
      }

      const csv = this.convertToCSV(exportData.guests)
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wedding-guests-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Default to JSON
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="wedding-data-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    // Get headers from first object
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')

    // Convert data rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma or newline
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }
}

export class QRGenerateHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handlePost(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = generateQRSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    let qrData: string
    let label: string = ''

    // Generate QR data based on type
    switch (validatedData.type) {
      case 'rsvp':
        const guestId = validatedData.data.guestId
        if (!guestId) {
          return this.errorResponse('INVALID_REQUEST', 'Guest ID required for RSVP QR code', 400)
        }

        // Get guest to verify ownership and get invitation code
        const guest = await prisma.guest.findFirst({
          where: {
            id: guestId,
            coupleId: couple.id
          },
          include: {
            invitations: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        })

        if (!guest) {
          return this.errorResponse('GUEST_NOT_FOUND', 'Guest not found', 404)
        }

        const invitationCode = guest.invitations[0]?.invitationCode
        if (!invitationCode) {
          return this.errorResponse('NO_INVITATION', 'Guest has no invitation code', 400)
        }

        qrData = `${process.env.NEXT_PUBLIC_BASE_URL}/rsvp/${invitationCode}`
        label = `RSVP - ${guest.name || `${guest.firstName} ${guest.lastName}`.trim()}`
        break

      case 'guest_check_in':
        const checkInGuestId = validatedData.data.guestId
        if (!checkInGuestId) {
          return this.errorResponse('INVALID_REQUEST', 'Guest ID required for check-in QR code', 400)
        }

        qrData = JSON.stringify({
          type: 'guest_check_in',
          guestId: checkInGuestId,
          coupleId: couple.id
        })
        label = 'Guest Check-In'
        break

      case 'vendor_check_in':
        const vendorId = validatedData.data.vendorId
        if (!vendorId) {
          return this.errorResponse('INVALID_REQUEST', 'Vendor ID required for vendor check-in QR code', 400)
        }

        qrData = JSON.stringify({
          type: 'vendor_check_in',
          vendorId: vendorId,
          coupleId: couple.id
        })
        label = 'Vendor Check-In'
        break

      case 'website':
        const url = validatedData.data.url
        if (!url) {
          return this.errorResponse('INVALID_REQUEST', 'URL required for website QR code', 400)
        }
        qrData = url
        label = validatedData.data.label || 'Wedding Website'
        break

      case 'custom':
        qrData = JSON.stringify(validatedData.data)
        label = validatedData.data.label || 'Custom QR Code'
        break

      default:
        return this.errorResponse('INVALID_TYPE', 'Invalid QR code type', 400)
    }

    try {
      // Generate QR code
      const qrOptions = {
        width: validatedData.size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }

      const qrCodeDataURL = await QRCode.toDataURL(qrData, qrOptions)

      // If label is requested, we'd need to add it to the image
      // For now, we'll return the QR code and label separately

      return this.successResponse({
        qrCode: qrCodeDataURL,
        type: validatedData.type,
        label: validatedData.includeLabel ? label : undefined,
        data: qrData,
        size: validatedData.size
      })
    } catch (error) {
      console.error('Error generating QR code:', error)
      return this.errorResponse('QR_GENERATION_FAILED', 'Failed to generate QR code', 500)
    }
  }
}

export class QRScanHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handlePost(request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    const { qrData } = body
    if (!qrData) {
      return this.errorResponse('INVALID_REQUEST', 'QR data required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    try {
      // Try to parse as JSON first
      const parsedData = JSON.parse(qrData)
      
      if (parsedData.type === 'guest_check_in' && parsedData.guestId) {
        // Handle guest check-in
        if (parsedData.coupleId !== couple.id) {
          return this.errorResponse('INVALID_QR', 'QR code belongs to different wedding', 403)
        }

        const guest = await prisma.guest.findFirst({
          where: {
            id: parsedData.guestId,
            coupleId: couple.id
          }
        })

        if (!guest) {
          return this.errorResponse('GUEST_NOT_FOUND', 'Guest not found', 404)
        }

        // TODO: Create check-in record when guest_check_ins table is added
        // const checkIn = await prisma.guest_check_ins.create({
        //   data: {
        //     guest_id: guest.id,
        //     couple_id: couple.id,
        //     check_in_time: new Date()
        //   }
        // })

        return this.successResponse({
          type: 'guest_check_in',
          guest: {
            id: guest.id,
            name: guest.name || `${guest.firstName} ${guest.lastName}`.trim(),
            tableAssignment: guest.tableAssignment
          },
          checkIn: {
            // id: checkIn.id,
            time: new Date()
          }
        })
      } else if (parsedData.type === 'vendor_check_in' && parsedData.vendorId) {
        // Handle vendor check-in
        if (parsedData.coupleId !== couple.id) {
          return this.errorResponse('INVALID_QR', 'QR code belongs to different wedding', 403)
        }

        const vendor = await prisma.vendor.findFirst({
          where: {
            id: parsedData.vendorId,
            coupleId: couple.id
          }
        })

        if (!vendor) {
          return this.errorResponse('VENDOR_NOT_FOUND', 'Vendor not found', 404)
        }

        // TODO: Create or update vendor check-in when vendor_check_ins table is added
        // const checkIn = await prisma.vendor_check_ins.upsert({
        //   where: {
        //     vendor_id_couple_id: {
        //       vendor_id: vendor.id,
        //       couple_id: couple.id
        //     }
        //   },
        //   update: {
        //     status: 'checked_in',
        //     check_in_time: new Date(),
        //     updated_at: new Date()
        //   },
        //   create: {
        //     vendor_id: vendor.id,
        //     couple_id: couple.id,
        //     status: 'checked_in',
        //     check_in_time: new Date()
        //   }
        // })

        return this.successResponse({
          type: 'vendor_check_in',
          vendor: {
            id: vendor.id,
            name: vendor.name,
            contactName: vendor.contactName
          },
          checkIn: {
            // id: checkIn.id,
            time: new Date()
          }
        })
      }
    } catch (parseError) {
      // Not JSON, might be a URL or plain text
      if (qrData.startsWith('http')) {
        return this.successResponse({
          type: 'url',
          data: qrData
        })
      }
    }

    return this.errorResponse('UNKNOWN_QR', 'Unknown QR code format', 400)
  }
}