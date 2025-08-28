import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { RSVPService } from '../service/rsvp.service'
import { RSVPRepository } from '../repo/rsvp.repository'
import { InviteRepository } from '../repo/invite.repository'
import { createErrorResponse, createSuccessResponse } from '@/lib/api/response'


/**
 * RSVP API Handler
 * Handles RSVP submissions and statistics retrieval
 */
export class RSVPHandler {
  private rsvpService: RSVPService
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
    this.rsvpService = new RSVPService()
  }

  /**
   * Handle RSVP submission
   * POST /api/rsvp
   */
  async submitRSVP(request: NextRequest): Promise<NextResponse> {
    try {
      // Parse request body
      const body = await request.json()
      
      // Submit RSVP via service (service handles validation)
      const result = await this.rsvpService.submitRSVP(body)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Failed to submit RSVP',
          result.error?.statusCode || 500,
          result.error?.code || 'RSVP_SUBMISSION_FAILED'
        )
      }

      // Log successful RSVP submission
      console.log('RSVP submitted successfully', {
        rsvpId: result.data?.id,
        inviteId: result.data?.inviteId,
        email: result.data?.email,
        status: result.data?.status,
        partySize: result.data?.partySize,
        operation: 'rsvp_submitted'
      })

      return createSuccessResponse(result.data, undefined, 201)
    } catch (error) {
      console.error('Error in submitRSVP handler:', error)
      
      // Handle specific error types
      if (error instanceof SyntaxError) {
        return createErrorResponse(
          'Invalid JSON in request body',
          400,
          'INVALID_JSON'
        )
      }

      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Get RSVP statistics
   * GET /api/rsvp/stats?inviteId=xxx
   */
  async getStats(request: NextRequest): Promise<NextResponse> {
    try {
      // Extract invite ID from query parameters
      const { searchParams } = new URL(request.url)
      const inviteId = searchParams.get('inviteId')

      if (!inviteId) {
        return createErrorResponse(
          'Invite ID is required',
          400,
          'INVITE_ID_REQUIRED'
        )
      }

      // Validate invite ID format
      const inviteIdSchema = z.string().uuid('Invalid invite ID format')
      const validationResult = inviteIdSchema.safeParse(inviteId)
      
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid invite ID format',
          400,
          'INVALID_INVITE_ID'
        )
      }

      // TODO: Get stats via service - need to implement invite-specific stats
      // For now, return placeholder stats
      const result = {
        success: true,
        data: {
          totalInvited: 0,
          totalResponded: 0,
          totalAttending: 0,
          totalNotAttending: 0,
          responseRate: 0,
          attendanceRate: 0
        }
      }
      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in getStats handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Get RSVP by invite ID (for checking existing responses)
   * GET /api/rsvp/check?inviteId=xxx
   */
  async checkRSVP(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url)
      const inviteId = searchParams.get('inviteId')

      if (!inviteId) {
        return createErrorResponse(
          'Invite ID is required',
          400,
          'INVITE_ID_REQUIRED'
        )
      }

      // Validate invite ID format
      const inviteIdSchema = z.string().uuid('Invalid invite ID format')
      const validationResult = inviteIdSchema.safeParse(inviteId)
      
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid invite ID format',
          400,
          'INVALID_INVITE_ID'
        )
      }

      // Check existing RSVP
      const result = await this.rsvpService.getRSVPByInviteId(inviteId)

      if (!result.success) {
        // If RSVP not found, return null data instead of error
        if (result.error?.code === 'RSVP_NOT_FOUND') {
          return createSuccessResponse(null)
        }

        return createErrorResponse(
          result.error?.message || 'Failed to check RSVP',
          result.error?.statusCode || 500,
          result.error?.code || 'RSVP_CHECK_FAILED'
        )
      }

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in checkRSVP handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Validate invite token
   * GET /api/rsvp/validate?token=xxx
   */
  async validateInvite(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url)
      const token = searchParams.get('token')

      if (!token) {
        return createErrorResponse(
          'Invite token is required',
          400,
          'TOKEN_REQUIRED'
        )
      }

      // Validate token format (basic validation)
      const tokenSchema = z.string().min(1, 'Token cannot be empty')
      const validationResult = tokenSchema.safeParse(token)
      
      if (!validationResult.success) {
        return createErrorResponse(
          'Invalid token format',
          400,
          'INVALID_TOKEN'
        )
      }

      // Validate invite via service
      const result = await this.rsvpService.validateInvite(token)

      if (!result.success) {
        return createErrorResponse(
          result.error?.message || 'Invalid invite token',
          result.error?.statusCode || 400,
          result.error?.code || 'INVALID_INVITE'
        )
      }

      return createSuccessResponse(result.data)
    } catch (error) {
      console.error('Error in validateInvite handler:', error)
      return createErrorResponse(
        'Internal server error',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  /**
   * Health check endpoint
   * GET /api/rsvp/health
   */
  async healthCheck(request: NextRequest): Promise<NextResponse> {
    try {
      // Basic health check - verify database connection
      await this.prisma.$queryRaw`SELECT 1`
      
      return createSuccessResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'rsvp-api'
      })
    } catch (error) {
      console.error('RSVP API health check failed:', error)
      return createErrorResponse(
        'Service unhealthy',
        503,
        'SERVICE_UNHEALTHY'
      )
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect()
    } catch (error) {
      console.error('Error during RSVP handler cleanup:', error)
    }
  }
}

// Request/Response type definitions
export interface RSVPSubmissionRequest {
  inviteId: string
  guestName: string
  attending: boolean
  partySize?: number
  dietaryRestrictions?: string
  notes?: string
}

export interface RSVPStatsResponse {
  totalInvited: number
  totalResponded: number
  totalAttending: number
  totalNotAttending: number
  responseRate: number
  attendanceRate: number
}

export interface RSVPCheckResponse {
  id: string
  inviteId: string
  guestName: string
  attending: boolean
  partySize: number
  dietaryRestrictions?: string
  notes?: string
  submittedAt: Date
  updatedAt: Date
}

export interface InviteValidationResponse {
  valid: boolean
  invite?: {
    id: string
    token: string
    guestName: string
    guestEmail?: string
    guestPhone?: string
    maxPartySize: number
    vendorId: string
    createdAt: Date
    expiresAt?: Date
  }
}
