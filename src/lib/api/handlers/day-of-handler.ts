import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/lib/db/services/couple.service'
import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'

// Validation schemas
const timelineEventSchema = z.object({
  time: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['ceremony', 'reception', 'preparation', 'photo', 'meal', 'entertainment', 'other']),
  duration: z.number().int().positive().optional(),
  location: z.string().optional(),
  vendorId: z.string().optional(),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional()
})

const vendorCheckInSchema = z.object({
  vendorId: z.string(),
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  status: z.enum(['pending', 'checked_in', 'checked_out', 'no_show']),
  notes: z.string().optional()
})

const guestCheckInSchema = z.object({
  guestId: z.string(),
  checkInTime: z.string().datetime().optional(),
  tableNumber: z.string().optional(),
  mealChoice: z.string().optional(),
  notes: z.string().optional()
})

const emergencyContactSchema = z.object({
  name: z.string(),
  role: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  isPrimary: z.boolean().optional()
})

const issueSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  category: z.enum(['vendor', 'guest', 'venue', 'catering', 'technical', 'weather', 'other']),
  assignedTo: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolution: z.string().optional()
})

export class DayOfTimelineHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get timeline events
    const timeline = await prisma.timeline_events.findMany({
      where: { couple_id: couple.id },
      orderBy: { time: 'asc' },
      include: {
        vendors: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true
          }
        }
      }
    })

    // Format timeline for response
    const formattedTimeline = timeline.map(event => ({
      id: event.id,
      time: event.time,
      title: event.title,
      description: event.description,
      type: event.type,
      duration: event.duration,
      location: event.location,
      vendor: event.vendors,
      notes: event.notes,
      isCompleted: event.is_completed,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }))

    return this.successResponse({ timeline: formattedTimeline })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = timelineEventSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Create timeline event
    const event = await prisma.timeline_events.create({
      data: {
        couple_id: couple.id,
        time: new Date(validatedData.time),
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        duration: validatedData.duration,
        location: validatedData.location,
        vendor_id: validatedData.vendorId,
        notes: validatedData.notes,
        is_completed: validatedData.isCompleted || false
      },
      include: {
        vendors: true
      }
    })

    return this.successResponse({
      id: event.id,
      time: event.time,
      title: event.title,
      description: event.description,
      type: event.type,
      duration: event.duration,
      location: event.location,
      vendor: event.vendors,
      notes: event.notes,
      isCompleted: event.is_completed
    }, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const eventId = context?.params?.id

    if (!eventId) {
      return this.errorResponse('INVALID_REQUEST', 'Event ID required', 400)
    }

    const body = await this.parseBody<any>(request)
    const updates = timelineEventSchema.partial().parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Update timeline event
    const event = await prisma.timeline_events.update({
      where: { 
        id: eventId,
        couple_id: couple.id
      },
      data: {
        time: updates.time ? new Date(updates.time) : undefined,
        title: updates.title,
        description: updates.description,
        type: updates.type,
        duration: updates.duration,
        location: updates.location,
        vendor_id: updates.vendorId,
        notes: updates.notes,
        is_completed: updates.isCompleted,
        updated_at: new Date()
      },
      include: {
        vendors: true
      }
    })

    return this.successResponse({
      id: event.id,
      time: event.time,
      title: event.title,
      description: event.description,
      type: event.type,
      duration: event.duration,
      location: event.location,
      vendor: event.vendors,
      notes: event.notes,
      isCompleted: event.is_completed
    }, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const eventId = context?.params?.id

    if (!eventId) {
      return this.errorResponse('INVALID_REQUEST', 'Event ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Delete timeline event
    await prisma.timeline_events.delete({
      where: { 
        id: eventId,
        couple_id: couple.id
      }
    })

    return this.successResponse({ id: eventId }, { action: 'deleted' })
  }
}

export class VendorCheckInHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get vendor check-ins
    const vendorCheckIns = await prisma.vendor_check_ins.findMany({
      where: { couple_id: couple.id },
      include: {
        vendors: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
            categoryId: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    // Also get vendors without check-ins
    const allVendors = await prisma.vendor.findMany({
      where: { 
        coupleId: couple.id,
        status: 'booked'
      },
      select: {
        id: true,
        name: true,
        contactName: true,
        phone: true,
        categoryId: true
      }
    })

    // Map check-in data
    const checkInMap = new Map(vendorCheckIns.map(ci => [ci.vendor_id, ci]))
    
    const vendorStatuses = allVendors.map(vendor => {
      const checkIn = checkInMap.get(vendor.id)
      return {
        vendor,
        checkIn: checkIn ? {
          id: checkIn.id,
          status: checkIn.status,
          checkInTime: checkIn.check_in_time,
          checkOutTime: checkIn.check_out_time,
          notes: checkIn.notes
        } : null
      }
    })

    return this.successResponse({ vendorStatuses })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = vendorCheckInSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify vendor belongs to couple
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: validatedData.vendorId,
        coupleId: couple.id
      }
    })

    if (!vendor) {
      return this.errorResponse('VENDOR_NOT_FOUND', 'Vendor not found', 404)
    }

    // Create or update vendor check-in
    const checkIn = await prisma.vendor_check_ins.upsert({
      where: {
        vendor_id_couple_id: {
          vendor_id: validatedData.vendorId,
          couple_id: couple.id
        }
      },
      update: {
        status: validatedData.status,
        check_in_time: validatedData.checkInTime ? new Date(validatedData.checkInTime) : undefined,
        check_out_time: validatedData.checkOutTime ? new Date(validatedData.checkOutTime) : undefined,
        notes: validatedData.notes,
        updated_at: new Date()
      },
      create: {
        vendor_id: validatedData.vendorId,
        couple_id: couple.id,
        status: validatedData.status,
        check_in_time: validatedData.checkInTime ? new Date(validatedData.checkInTime) : new Date(),
        check_out_time: validatedData.checkOutTime ? new Date(validatedData.checkOutTime) : null,
        notes: validatedData.notes
      }
    })

    return this.successResponse(checkIn, { action: 'updated' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    // Alias for POST to handle updates
    return this.handlePost(request)
  }
}

export class GuestCheckInHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    const search = searchParams.get('search')

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Build query
    let whereClause: any = {
      coupleId: couple.id,
      attendingStatus: { in: ['confirmed', 'yes'] }
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get guests with check-in status
    const guests = await prisma.guest.findMany({
      where: whereClause,
      include: {
        guest_check_ins: {
          orderBy: { check_in_time: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    // Format response
    const guestCheckIns = guests.map(guest => ({
      guest: {
        id: guest.id,
        name: guest.name || `${guest.firstName} ${guest.lastName}`.trim(),
        email: guest.email,
        phone: guest.phone,
        tableAssignment: guest.tableAssignment,
        dietaryRestrictions: guest.dietaryRestrictions,
        plusOneAllowed: guest.plusOneAllowed,
        plusOneName: guest.plusOneName
      },
      checkIn: guest.guest_check_ins[0] ? {
        checkInTime: guest.guest_check_ins[0].check_in_time,
        tableNumber: guest.guest_check_ins[0].table_number,
        mealChoice: guest.guest_check_ins[0].meal_choice,
        notes: guest.guest_check_ins[0].notes
      } : null
    }))

    const stats = {
      total: guests.length,
      checkedIn: guests.filter(g => g.guest_check_ins.length > 0).length,
      pending: guests.filter(g => g.guest_check_ins.length === 0).length
    }

    return this.successResponse({ guests: guestCheckIns, stats })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = guestCheckInSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify guest belongs to couple
    const guest = await prisma.guest.findFirst({
      where: {
        id: validatedData.guestId,
        coupleId: couple.id
      }
    })

    if (!guest) {
      return this.errorResponse('GUEST_NOT_FOUND', 'Guest not found', 404)
    }

    // Create guest check-in
    const checkIn = await prisma.guest_check_ins.create({
      data: {
        guest_id: validatedData.guestId,
        couple_id: couple.id,
        check_in_time: validatedData.checkInTime ? new Date(validatedData.checkInTime) : new Date(),
        table_number: validatedData.tableNumber || guest.tableAssignment,
        meal_choice: validatedData.mealChoice,
        notes: validatedData.notes
      }
    })

    return this.successResponse(checkIn, { action: 'checked_in' })
  }
}

export class EmergencyContactsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get emergency contacts
    const contacts = await prisma.emergency_contacts.findMany({
      where: { couple_id: couple.id },
      orderBy: [
        { is_primary: 'desc' },
        { created_at: 'asc' }
      ]
    })

    return this.successResponse({ contacts })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = emergencyContactSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // If setting as primary, unset others
    if (validatedData.isPrimary) {
      await prisma.emergency_contacts.updateMany({
        where: { couple_id: couple.id },
        data: { is_primary: false }
      })
    }

    // Create emergency contact
    const contact = await prisma.emergency_contacts.create({
      data: {
        couple_id: couple.id,
        name: validatedData.name,
        role: validatedData.role,
        phone: validatedData.phone,
        email: validatedData.email,
        is_primary: validatedData.isPrimary || false
      }
    })

    return this.successResponse(contact, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const contactId = context?.params?.id

    if (!contactId) {
      return this.errorResponse('INVALID_REQUEST', 'Contact ID required', 400)
    }

    const body = await this.parseBody<any>(request)
    const updates = emergencyContactSchema.partial().parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // If setting as primary, unset others
    if (updates.isPrimary) {
      await prisma.emergency_contacts.updateMany({
        where: { couple_id: couple.id },
        data: { is_primary: false }
      })
    }

    // Update contact
    const contact = await prisma.emergency_contacts.update({
      where: {
        id: contactId,
        couple_id: couple.id
      },
      data: {
        name: updates.name,
        role: updates.role,
        phone: updates.phone,
        email: updates.email,
        is_primary: updates.isPrimary,
        updated_at: new Date()
      }
    })

    return this.successResponse(contact, { action: 'updated' })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const contactId = context?.params?.id

    if (!contactId) {
      return this.errorResponse('INVALID_REQUEST', 'Contact ID required', 400)
    }

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Delete contact
    await prisma.emergency_contacts.delete({
      where: {
        id: contactId,
        couple_id: couple.id
      }
    })

    return this.successResponse({ id: contactId }, { action: 'deleted' })
  }
}

export class DayOfIssuesHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request)
        case 'POST':
          return await this.handlePost(request)
        case 'PATCH':
          return await this.handlePatch(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const searchParams = this.getSearchParams(request)
    const status = searchParams.get('status')

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Build query
    let whereClause: any = { couple_id: couple.id }
    if (status) {
      whereClause.status = status
    }

    // Get issues
    const issues = await prisma.day_of_issues.findMany({
      where: whereClause,
      orderBy: [
        { severity: 'desc' },
        { created_at: 'desc' }
      ]
    })

    // Get stats
    const stats = {
      total: issues.length,
      open: issues.filter(i => i.status === 'open').length,
      inProgress: issues.filter(i => i.status === 'in_progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      closed: issues.filter(i => i.status === 'closed').length,
      bySeverity: {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length
      }
    }

    return this.successResponse({ issues, stats })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = issueSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Create issue
    const issue = await prisma.day_of_issues.create({
      data: {
        couple_id: couple.id,
        title: validatedData.title,
        description: validatedData.description,
        severity: validatedData.severity,
        status: validatedData.status,
        category: validatedData.category,
        assigned_to: validatedData.assignedTo,
        resolved_at: validatedData.resolvedAt ? new Date(validatedData.resolvedAt) : null,
        resolution: validatedData.resolution
      }
    })

    return this.successResponse(issue, { action: 'created' })
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const issueId = context?.params?.id

    if (!issueId) {
      return this.errorResponse('INVALID_REQUEST', 'Issue ID required', 400)
    }

    const body = await this.parseBody<any>(request)
    const updates = issueSchema.partial().parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Update issue
    const issue = await prisma.day_of_issues.update({
      where: {
        id: issueId,
        couple_id: couple.id
      },
      data: {
        title: updates.title,
        description: updates.description,
        severity: updates.severity,
        status: updates.status,
        category: updates.category,
        assigned_to: updates.assignedTo,
        resolved_at: updates.resolvedAt ? new Date(updates.resolvedAt) : undefined,
        resolution: updates.resolution,
        updated_at: new Date()
      }
    })

    return this.successResponse(issue, { action: 'updated' })
  }
}