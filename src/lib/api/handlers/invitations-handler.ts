import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/lib/db/services/couple.service'
import { FIELD_MAPPINGS } from '@/lib/db/field-mappings'
import { messagingService } from '@/lib/messaging/messaging-service'
import { randomBytes } from 'crypto'

// Validation schemas
const sendInvitationsSchema = z.object({
  guestIds: z.array(z.string()),
  message: z.string().optional(),
  sendEmail: z.boolean().optional().default(false),
  rsvpDeadline: z.string().datetime().optional()
})

const acceptCollaboratorInvitationSchema = z.object({
  token: z.string()
})

function generateInvitationCode(): string {
  return randomBytes(8).toString('hex').toUpperCase()
}

export class SendInvitationsHandler extends BaseAPIHandler {
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
    const validatedData = sendInvitationsSchema.parse(body)

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Verify all guests belong to this couple
    const guests = await prisma.guest.findMany({
      where: {
        id: { in: validatedData.guestIds },
        coupleId: couple.id
      },
      include: {
        invitations: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (guests.length !== validatedData.guestIds.length) {
      return this.errorResponse('INVALID_GUESTS', 'Invalid guest selection', 400)
    }

    let sent = 0
    let skipped = 0
    const errors: string[] = []
    const invitations = []

    // Process each guest
    for (const guest of guests) {
      try {
        // Skip if guest already has an invitation
        if (guest.invitations.length > 0) {
          console.log(`Guest ${guest.name || guest.firstName} already has invitation`)
          skipped++
          continue
        }

        // Generate unique invitation code
        let invitationCode = generateInvitationCode()
        
        // Ensure code is unique
        let codeExists = true
        let attempts = 0
        while (codeExists && attempts < 10) {
          const existing = await prisma.invitations.findUnique({
            where: { invitationCode }
          })
          if (!existing) {
            codeExists = false
          } else {
            invitationCode = generateInvitationCode()
            attempts++
          }
        }

        if (attempts >= 10) {
          errors.push(`Failed to generate unique code for ${guest.name || guest.firstName}`)
          continue
        }

        // Create invitation
        const invitation = await prisma.invitations.create({
          data: {
            guestId: guest.id,
            coupleId: couple.id,
            invitationCode,
            status: 'pending',
            sendDate: new Date(),
            rsvpDeadline: validatedData.rsvpDeadline 
              ? new Date(validatedData.rsvpDeadline)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          },
          include: {
            guests: true
          }
        })

        invitations.push(invitation)

        // Send email if requested and email is available
        if (validatedData.sendEmail && guest.email) {
          try {
            const rsvpUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/rsvp/${invitationCode}`
            
            await messagingService.sendMessage({
              to: {
                id: guest.id,
                name: guest.name || `${guest.firstName} ${guest.lastName}`.trim(),
                email: guest.email,
                phone: guest.phone,
                preferredChannel: 'email'
              },
              type: 'email',
              subject: `You're invited to ${couple.partner1Name}${couple.partner2Name ? ` & ${couple.partner2Name}` : ''}'s wedding!`,
              body: validatedData.message || `We would be honored by your presence at our wedding. Please RSVP at: ${rsvpUrl}`,
              variables: {
                rsvpUrl,
                coupleName: `${couple.partner1Name}${couple.partner2Name ? ` & ${couple.partner2Name}` : ''}`,
                weddingDate: couple.weddingDate,
                venueName: couple.venueName,
                venueLocation: couple.venueLocation
              }
            })

            // Log the message
            await messagingService.logMessage(
              couple.id,
              {
                id: guest.id,
                name: guest.name || `${guest.firstName} ${guest.lastName}`.trim(),
                email: guest.email,
                phone: guest.phone,
                preferredChannel: 'email'
              },
              'email',
              'Wedding Invitation',
              validatedData.message || 'Invitation sent',
              { status: 'sent', messageId: invitation.id }
            )
          } catch (emailError) {
            console.error(`Failed to send email to ${guest.email}:`, emailError)
            errors.push(`Failed to send email to ${guest.name || guest.firstName}`)
          }
        }
        
        sent++
      } catch (error) {
        console.error(`Error creating invitation for guest ${guest.id}:`, error)
        errors.push(`Failed to create invitation for ${guest.name || guest.firstName}`)
      }
    }

    // Return response
    return this.successResponse({
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      invitations,
      message: `Successfully created ${sent} invitation${sent !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} guests already had invitations)` : ''}`
    })
  }
}

export class AcceptCollaboratorInvitationHandler extends BaseAPIHandler {
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
    const validatedData = acceptCollaboratorInvitationSchema.parse(body)

    // Find the invitation
    const collaborator = await prisma.couple_collaborators.findFirst({
      where: {
        invitation_token: validatedData.token,
        status: 'pending'
      }
    })

    if (!collaborator) {
      return this.errorResponse('INVALID_INVITATION', 'Invalid or expired invitation', 404)
    }

    // Check if the email matches (if we have user email)
    if (authContext.email && authContext.email !== collaborator.email) {
      return this.errorResponse('EMAIL_MISMATCH', 'This invitation was sent to a different email address', 403)
    }

    // Update the collaborator status
    const updatedCollaborator = await prisma.couple_collaborators.update({
      where: { id: collaborator.id },
      data: {
        status: 'accepted',
        accepted_at: new Date(),
        userId: authContext.userId,
        updatedAt: new Date()
      }
    })

    // Create or update user record
    await prisma.user.upsert({
      where: { supabase_user_id: authContext.userId },
      update: {
        email: authContext.email || collaborator.email,
        firstName: authContext.firstName || authContext.email?.split('@')[0] || '',
        lastName: authContext.lastName || '',
        updatedAt: new Date()
      },
      create: {
        supabase_user_id: authContext.userId,
        email: authContext.email || collaborator.email,
        firstName: authContext.firstName || authContext.email?.split('@')[0] || '',
        lastName: authContext.lastName || ''
      }
    })

    // Check if this user needs to be added as a partner
    const couple = await prisma.couple.findUnique({
      where: { id: collaborator.coupleId }
    })

    if (couple) {
      // Update couple with partner user ID if applicable
      if (collaborator.role === 'partner' && !couple.partner1_user_id && couple.userId !== authContext.userId) {
        await prisma.couple.update({
          where: { id: couple.id },
          data: {
            partner1_user_id: authContext.userId
          }
        })
      } else if (collaborator.role === 'partner' && !couple.partner2_user_id && couple.userId !== authContext.userId && couple.partner1_user_id !== authContext.userId) {
        await prisma.couple.update({
          where: { id: couple.id },
          data: {
            partner2_user_id: authContext.userId
          }
        })
      }
    }

    return this.successResponse({
      message: 'Invitation accepted successfully',
      role: collaborator.role,
      coupleId: collaborator.coupleId
    }, { action: 'accepted' })
  }
}