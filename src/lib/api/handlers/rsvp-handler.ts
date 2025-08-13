import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/features/couples'
import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'
import { 
  rsvpSecurityMiddleware, 
  addSecurityHeaders, 
  validateInvitationCode,
  sanitizeRSVPData,
  detectBot,
  validateHoneypot
} from '@/lib/security/rsvp-middleware'
import { RSVPRateLimiter } from '@/lib/security/rsvp-rate-limiter'

// Validation schemas
const updateRSVPSchema = z.object({
  status: z.enum(['confirmed', 'declined', 'pending', 'yes', 'no', 'maybe']),
  attendingCount: z.number().int().min(0).optional(),
  plusOneAttending: z.boolean().optional(),
  plusOneName: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  rsvpNotes: z.string().optional()
})

const publicRSVPSchema = z.object({
  rsvpStatus: z.enum(['confirmed', 'declined', 'pending', 'yes', 'no', 'maybe']).optional(),
  attendingStatus: z.enum(['confirmed', 'declined', 'pending', 'yes', 'no', 'maybe']).optional(),
  dietaryNotes: z.string().optional(),
  dietaryRestrictions: z.string().optional(), 
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
  plusOneAttending: z.boolean().optional(),
  plusOneName: z.string().optional()
})

export class GuestRSVPHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    if (request.method !== 'PATCH') {
      return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }

    try {
      return await this.handlePatch(request, context)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handlePatch(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const guestId = context?.params?.id

    if (!guestId) {
      return this.errorResponse('INVALID_REQUEST', 'Guest ID required', 400)
    }

    const body = await this.parseBody<any>(request)
    const validatedData = updateRSVPSchema.parse(body)

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Check if invitation exists and belongs to this couple
    const invitation = await prisma.invitations.findFirst({
      where: {
        guestId: guestId,
        coupleId: couple.id
      },
      include: {
        guests: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            plusOneAllowed: true
          }
        }
      }
    })

    if (!invitation) {
      return this.errorResponse('INVITATION_NOT_FOUND', 'Invitation not found', 404)
    }

    // Update invitation RSVP status
    const updatedInvitation = await prisma.invitations.update({
      where: { id: invitation.id },
      data: {
        status: validatedData.status,
        attendingCount: validatedData.attendingCount || 0,
        plusOneAttending: validatedData.plusOneAttending || false,
        plusOneName: validatedData.plusOneName || null,
        dietaryRestrictions: validatedData.dietaryRestrictions || null,
        rsvpNotes: validatedData.rsvpNotes || null,
        respondedAt: validatedData.status !== 'pending' ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        guests: true
      }
    })

    // Also update guest attendingStatus for consistency
    if (invitation.guestId) {
      await prisma.guest.update({
        where: { id: invitation.guestId },
        data: {
          attendingStatus: validatedData.status,
          dietaryRestrictions: validatedData.dietaryRestrictions,
          updatedAt: new Date()
        }
      })
    }

    return this.successResponse(updatedInvitation, { action: 'updated' })
  }
}

export class PublicRSVPHandler extends BaseAPIHandler {
  // This handler doesn't require authentication since it's for public RSVP
  protected async requireAuth(request: NextRequest): Promise<any> {
    // Skip auth for public endpoint
    return null
  }

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    const method = request.method

    try {
      switch (method) {
        case 'GET':
          return await this.handleGet(request, context)
        case 'POST':
          return await this.handlePost(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest, context?: any): Promise<NextResponse> {
    const code = context?.params?.code

    if (!code) {
      return this.errorResponse('INVALID_REQUEST', 'Invitation code required', 400)
    }

    // Validate invitation code format
    if (!validateInvitationCode(code)) {
      return this.errorResponse('INVALID_CODE', 'Invalid invitation code format', 400)
    }

    // Apply rate limiting security middleware
    const securityResponse = await rsvpSecurityMiddleware(request, code)
    if (securityResponse) {
      return securityResponse
    }

    // Check for bot detection
    if (detectBot(request)) {
      await RSVPRateLimiter.addIPToBlocklist(
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        'Bot detection triggered',
        1,
        'auto-detection'
      )
      return this.errorResponse('BLOCKED', 'Request blocked', 429)
    }

    // Find invitation by code
    const invitation = await prisma.invitations.findUnique({
      where: { invitationCode: code },
      include: {
        guests: {
          include: {
            couple: {
              select: {
                id: true,
                partner1Name: true,
                partner2Name: true,
                weddingDate: true,
                venueName: true,
                venueLocation: true
              }
            }
          }
        }
      }
    })

    if (!invitation || !invitation.guests) {
      return this.errorResponse('NOT_FOUND', 'Guest not found', 404)
    }

    const guest = invitation.guests

    // Prepare response data
    const responseData = {
      guest: {
        name: guest.name || `${guest.firstName} ${guest.lastName}`.trim(),
        plusOne: guest.plusOneAllowed || false,
        rsvpStatus: invitation.status || guest.attendingStatus || 'pending',
        dietaryNotes: invitation.dietaryRestrictions || guest.dietaryRestrictions,
        specialRequests: invitation.rsvpNotes || guest.notes,
        plusOneName: invitation.plusOneName || guest.plusOneName,
        rsvpDeadline: invitation.rsvpDeadline || guest.rsvpDeadline,
        attendingCount: invitation.attendingCount
      },
      wedding: {
        coupleName: `${guest.couple.partner1Name}${guest.couple.partner2Name ? ` & ${guest.couple.partner2Name}` : ''}`,
        date: guest.couple.weddingDate,
        venue: guest.couple.venueName,
        location: guest.couple.venueLocation
      }
    }

    // Create response with security headers
    const response = NextResponse.json(responseData)
    return addSecurityHeaders(response, 999)
  }

  private async handlePost(request: NextRequest, context?: any): Promise<NextResponse> {
    const code = context?.params?.code

    if (!code) {
      return this.errorResponse('INVALID_REQUEST', 'Invitation code required', 400)
    }

    // Validate invitation code format
    if (!validateInvitationCode(code)) {
      return this.errorResponse('INVALID_CODE', 'Invalid invitation code format', 400)
    }

    // Apply rate limiting security middleware
    const securityResponse = await rsvpSecurityMiddleware(request, code)
    if (securityResponse) {
      return securityResponse
    }

    // Check for bot detection
    if (detectBot(request)) {
      await RSVPRateLimiter.addIPToBlocklist(
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        'Bot detection on POST request',
        2,
        'auto-detection'
      )
      return this.errorResponse('BLOCKED', 'Request blocked', 429)
    }

    const body = await this.parseBody<any>(request)
    
    // Validate honeypot fields
    if (!validateHoneypot(body)) {
      await RSVPRateLimiter.addIPToBlocklist(
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        'Honeypot validation failed',
        4,
        'auto-detection'
      )
      return this.errorResponse('INVALID_SUBMISSION', 'Invalid submission', 400)
    }

    // Sanitize and validate input data
    const sanitizedData = sanitizeRSVPData(body)
    const validatedData = publicRSVPSchema.parse(sanitizedData)
    
    // Determine status from either field
    const status = validatedData.rsvpStatus || validatedData.attendingStatus || 'pending'
    const dietaryRestrictions = validatedData.dietaryNotes || validatedData.dietaryRestrictions
    const notes = validatedData.specialRequests || validatedData.notes

    // Find invitation by code
    const invitation = await prisma.invitations.findUnique({
      where: { invitationCode: code },
      include: {
        guests: true
      }
    })

    if (!invitation || !invitation.guests) {
      return this.errorResponse('NOT_FOUND', 'Guest not found', 404)
    }

    // Update invitation
    const updatedInvitation = await prisma.invitations.update({
      where: { id: invitation.id },
      data: {
        status: status,
        dietaryRestrictions: dietaryRestrictions,
        rsvpNotes: notes,
        plusOneAttending: validatedData.plusOneAttending,
        plusOneName: validatedData.plusOneName,
        respondedAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Also update guest table for consistency
    await prisma.guest.update({
      where: { id: invitation.guestId },
      data: {
        attendingStatus: status,
        dietaryRestrictions: dietaryRestrictions,
        notes: notes,
        plusOneName: validatedData.plusOneName,
        updatedAt: new Date()
      }
    })

    const response = NextResponse.json({
      message: 'RSVP updated successfully',
      guest: {
        name: invitation.guests.name || `${invitation.guests.firstName} ${invitation.guests.lastName}`.trim(),
        rsvpStatus: status
      }
    })

    return addSecurityHeaders(response, 5)
  }
}