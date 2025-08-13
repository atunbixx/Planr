import { NextRequest, NextResponse } from 'next/server'
import { BaseAPIHandler } from '../base-handler'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CoupleService } from '@/features/couples'
import { v4 as uuidv4 } from 'uuid'

// Validation schemas
const inviteCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['viewer', 'editor', 'admin']).optional().default('viewer'),
  message: z.string().optional(),
  permissions: z.object({
    canViewGuests: z.boolean().optional().default(true),
    canEditGuests: z.boolean().optional().default(false),
    canViewBudget: z.boolean().optional().default(true),
    canEditBudget: z.boolean().optional().default(false),
    canViewVendors: z.boolean().optional().default(true),
    canEditVendors: z.boolean().optional().default(false)
  }).optional()
})

const updateCollaboratorSchema = z.object({
  role: z.enum(['viewer', 'editor', 'admin']).optional(),
  permissions: z.object({
    canViewGuests: z.boolean().optional(),
    canEditGuests: z.boolean().optional(),
    canViewBudget: z.boolean().optional(),
    canEditBudget: z.boolean().optional(),
    canViewVendors: z.boolean().optional(),
    canEditVendors: z.boolean().optional()
  }).optional()
})

export class CollaboratorsHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    try {
      switch (request.method) {
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

    // Get couple using the service to check all user ID fields
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get all collaborators for the couple
    const collaborators = await prisma.collaborators.findMany({
      where: { couple_id: couple.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return this.successResponse({
      collaborators: collaborators.map(collab => ({
        id: collab.id,
        userId: collab.user_id,
        email: collab.user.email,
        name: `${collab.user.firstName || ''} ${collab.user.lastName || ''}`.trim() || collab.user.email,
        role: collab.role,
        permissions: collab.permissions || {},
        invitedAt: collab.created_at,
        acceptedAt: collab.accepted_at,
        status: collab.accepted_at ? 'active' : 'pending'
      }))
    })
  }

  private async handlePost(request: NextRequest): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = inviteCollaboratorSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Check if user is already a collaborator
    const existingCollaborator = await prisma.collaborators.findFirst({
      where: {
        couple_id: couple.id,
        user: {
          email: validatedData.email
        }
      }
    })

    if (existingCollaborator) {
      return this.errorResponse('ALREADY_COLLABORATOR', 'User is already a collaborator', 409)
    }

    // Find or create user by email
    let invitedUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!invitedUser) {
      // Create a placeholder user that will be completed when they sign up
      invitedUser = await prisma.user.create({
        data: {
          email: validatedData.email,
          supabase_user_id: `pending_${uuidv4()}`, // Temporary ID until they sign up
          firstName: '',
          lastName: ''
        }
      })
    }

    // Create collaborator invitation
    const collaborator = await prisma.collaborators.create({
      data: {
        couple_id: couple.id,
        user_id: invitedUser.id,
        role: validatedData.role,
        permissions: validatedData.permissions || {},
        invitation_token: uuidv4()
      },
      include: {
        user: true
      }
    })

    // TODO: Send invitation email
    // await sendCollaboratorInvitationEmail(invitedUser.email, {
    //   inviterName: authContext.user?.firstName || authContext.email,
    //   coupleName: `${couple.partner1Name} & ${couple.partner2Name}`,
    //   role: validatedData.role,
    //   message: validatedData.message,
    //   invitationToken: collaborator.invitation_token
    // })

    return this.successResponse({
      collaborator: {
        id: collaborator.id,
        userId: collaborator.user_id,
        email: collaborator.user.email,
        name: `${collaborator.user.firstName || ''} ${collaborator.user.lastName || ''}`.trim() || collaborator.user.email,
        role: collaborator.role,
        permissions: collaborator.permissions,
        invitedAt: collaborator.created_at,
        status: 'pending'
      },
      message: 'Invitation sent successfully'
    }, 201)
  }
}

export class CollaboratorDetailHandler extends BaseAPIHandler {
  private coupleService = new CoupleService()

  async handle(request: NextRequest, context?: any): Promise<NextResponse> {
    try {
      switch (request.method) {
        case 'GET':
          return await this.handleGet(request, context)
        case 'PUT':
          return await this.handlePut(request, context)
        case 'DELETE':
          return await this.handleDelete(request, context)
        default:
          return this.errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private async handleGet(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const collaboratorId = resolvedParams.id

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get collaborator
    const collaborator = await prisma.collaborators.findUnique({
      where: {
        id: collaboratorId,
        couple_id: couple.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!collaborator) {
      return this.errorResponse('COLLABORATOR_NOT_FOUND', 'Collaborator not found', 404)
    }

    return this.successResponse({
      collaborator: {
        id: collaborator.id,
        userId: collaborator.user_id,
        email: collaborator.user.email,
        name: `${collaborator.user.firstName || ''} ${collaborator.user.lastName || ''}`.trim() || collaborator.user.email,
        role: collaborator.role,
        permissions: collaborator.permissions || {},
        invitedAt: collaborator.created_at,
        acceptedAt: collaborator.accepted_at,
        status: collaborator.accepted_at ? 'active' : 'pending',
        lastActiveAt: collaborator.last_active_at
      }
    })
  }

  private async handlePut(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const collaboratorId = resolvedParams.id
    const body = await this.parseBody<any>(request)

    // Validate data
    const validatedData = updateCollaboratorSchema.parse(body)

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get collaborator
    const collaborator = await prisma.collaborators.findUnique({
      where: {
        id: collaboratorId,
        couple_id: couple.id
      }
    })

    if (!collaborator) {
      return this.errorResponse('COLLABORATOR_NOT_FOUND', 'Collaborator not found', 404)
    }

    // Update collaborator
    const updatedCollaborator = await prisma.collaborators.update({
      where: { id: collaboratorId },
      data: {
        role: validatedData.role,
        permissions: validatedData.permissions ? {
          ...(collaborator.permissions as any || {}),
          ...validatedData.permissions
        } : collaborator.permissions,
        updated_at: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return this.successResponse({
      collaborator: {
        id: updatedCollaborator.id,
        userId: updatedCollaborator.user_id,
        email: updatedCollaborator.user.email,
        name: `${updatedCollaborator.user.firstName || ''} ${updatedCollaborator.user.lastName || ''}`.trim() || updatedCollaborator.user.email,
        role: updatedCollaborator.role,
        permissions: updatedCollaborator.permissions,
        invitedAt: updatedCollaborator.created_at,
        acceptedAt: updatedCollaborator.accepted_at,
        status: updatedCollaborator.accepted_at ? 'active' : 'pending'
      }
    })
  }

  private async handleDelete(request: NextRequest, context?: any): Promise<NextResponse> {
    const authContext = await this.requireAuth(request)
    const { params } = context
    const resolvedParams = await params
    const collaboratorId = resolvedParams.id

    // Get couple using the service
    const couple = await this.coupleService.getCoupleBySupabaseId(authContext.userId)

    if (!couple) {
      return this.errorResponse('COUPLE_NOT_FOUND', 'No couple found for user', 404)
    }

    // Get collaborator
    const collaborator = await prisma.collaborators.findUnique({
      where: {
        id: collaboratorId,
        couple_id: couple.id
      }
    })

    if (!collaborator) {
      return this.errorResponse('COLLABORATOR_NOT_FOUND', 'Collaborator not found', 404)
    }

    // Delete collaborator
    await prisma.collaborators.delete({
      where: { id: collaboratorId }
    })

    return this.successResponse({
      message: 'Collaborator removed successfully'
    })
  }
}

export class AcceptCollaborationHandler extends BaseAPIHandler {
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

    const { invitationToken } = body
    if (!invitationToken) {
      return this.errorResponse('INVALID_REQUEST', 'Invitation token required', 400)
    }

    // Find collaborator invitation
    const collaborator = await prisma.collaborators.findFirst({
      where: {
        invitation_token: invitationToken,
        accepted_at: null
      },
      include: {
        couple: true
      }
    })

    if (!collaborator) {
      return this.errorResponse('INVALID_TOKEN', 'Invalid or expired invitation token', 404)
    }

    // Check if the current user matches the invited email
    const invitedUser = await prisma.user.findUnique({
      where: { id: collaborator.user_id }
    })

    if (!invitedUser || invitedUser.email !== authContext.email) {
      return this.errorResponse('UNAUTHORIZED', 'This invitation is for a different email address', 403)
    }

    // Update the collaborator to mark as accepted
    const updatedCollaborator = await prisma.collaborators.update({
      where: { id: collaborator.id },
      data: {
        accepted_at: new Date(),
        invitation_token: null, // Clear the token
        updated_at: new Date()
      }
    })

    // If the user was a placeholder, update their Supabase ID
    if (invitedUser.supabase_user_id.startsWith('pending_')) {
      await prisma.user.update({
        where: { id: invitedUser.id },
        data: {
          supabase_user_id: authContext.userId,
          updated_at: new Date()
        }
      })
    }

    return this.successResponse({
      message: 'Collaboration invitation accepted successfully',
      couple: {
        id: collaborator.couple.id,
        partner1Name: collaborator.couple.partner1Name,
        partner2Name: collaborator.couple.partner2Name,
        weddingDate: collaborator.couple.weddingDate
      },
      role: updatedCollaborator.role,
      permissions: updatedCollaborator.permissions
    })
  }
}