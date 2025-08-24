import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'
import { RSVPRepository, InviteRSVPRecord, RSVPStats } from '../repo/rsvp.repository'
import { InviteRepository, InviteRecord } from '../repo/invite.repository'
import { 
  RSVPSubmissionData, 
  InviteCreateData, 
  InviteUpdateData,
  RSVPFilterData,
  InviteFilterData,
  BulkInviteCreateData,
  validateRSVPSubmission,
  validateInviteCreate,
  validateInviteUpdate,
  validateRSVPFilter,
  validateInviteFilter,
  validateBulkInviteCreate
} from '@/lib/validation/rsvp'
import { RsvpStatus } from '@prisma/client'
import { randomBytes } from 'crypto'

export interface RSVPServiceResult<T> extends RepositoryResult<T> {}

export interface InviteWithRSVP extends InviteRecord {
  rsvp?: InviteRSVPRecord
  rsvpCount?: number
}

export interface RSVPListResult {
  rsvps: InviteRSVPRecord[]
  total: number
  limit: number
  offset: number
}

export interface InviteListResult {
  invites: InviteWithRSVP[]
  total: number
  limit: number
  offset: number
}

export class RSVPService {
  private rsvpRepo: RSVPRepository
  private inviteRepo: InviteRepository

  constructor() {
    this.rsvpRepo = new RSVPRepository()
    this.inviteRepo = new InviteRepository()
  }

  /**
   * Submit RSVP (public endpoint - no authentication required)
   * Validates invite token and creates/updates RSVP with idempotency
   */
  async submitRSVP(data: unknown): Promise<RSVPServiceResult<InviteRSVPRecord>> {
    try {
      // Validate input data
      const validation = validateRSVPSubmission(data)
      if (!validation.success) {
        return createErrorResult(
          'Invalid RSVP data',
          'RSVP_VALIDATION_FAILED',
          400
        )
      }

      const rsvpData = validation.data

      // Validate invite exists and is active
      const inviteResult = await this.inviteRepo.getByToken(rsvpData.inviteId)
      if (!inviteResult.success) {
        return createErrorResult(
          'Failed to validate invite',
          'INVITE_VALIDATION_FAILED',
          500
        )
      }

      if (!inviteResult.data) {
        return createErrorResult(
          'Invalid or expired invite',
          'INVALID_INVITE',
          404
        )
      }

      const invite = inviteResult.data

      // Create or update RSVP with idempotency
      const rsvpCreateData = {
        userId: invite.userId,
        inviteId: invite.id,
        email: rsvpData.email,
        status: rsvpData.status as RsvpStatus,
        partySize: rsvpData.partySize,
        notes: rsvpData.notes
      }

      const result = await this.rsvpRepo.createOrUpdate(rsvpCreateData)
      
      if (!result.success) {
        return createErrorResult(
          'Failed to save RSVP',
          'RSVP_SAVE_FAILED',
          500
        )
      }

      // Log RSVP submission for analytics
      console.log('RSVP submitted', {
        userId: invite.userId,
        inviteId: invite.id,
        email: this.maskEmail(rsvpData.email),
        status: rsvpData.status,
        partySize: rsvpData.partySize,
        operation: 'rsvp_submit'
      })

      return createSuccessResult(result.data!)
    } catch (error) {
      console.error('Error submitting RSVP:', error)
      return createErrorResult(
        'Internal server error',
        'RSVP_SUBMIT_ERROR',
        500
      )
    }
  }

  /**
   * Get RSVP statistics for a user (authenticated)
   */
  async getStats(userId: string): Promise<RSVPServiceResult<RSVPStats>> {
    try {
      const result = await this.rsvpRepo.getStats(userId)
      
      if (!result.success) {
        return createErrorResult(
          'Failed to get RSVP statistics',
          'RSVP_STATS_FAILED',
          500
        )
      }

      return createSuccessResult(result.data!)
    } catch (error) {
      console.error('Error getting RSVP stats:', error)
      return createErrorResult(
        'Internal server error',
        'RSVP_STATS_ERROR',
        500
      )
    }
  }

  /**
   * List RSVPs for a user with filtering (authenticated)
   */
  async listRSVPs(userId: string, filters: unknown): Promise<RSVPServiceResult<RSVPListResult>> {
    try {
      // Validate filter parameters
      const validation = validateRSVPFilter(filters)
      if (!validation.success) {
        return createErrorResult(
          'Invalid filter parameters',
          'RSVP_FILTER_VALIDATION_FAILED',
          400
        )
      }

      const filterData = validation.data

      // Get RSVPs from repository
      const result = await this.rsvpRepo.list(userId, {
        status: filterData.status as RsvpStatus | undefined
      })

      if (!result.success) {
        return createErrorResult(
          'Failed to list RSVPs',
          'RSVP_LIST_FAILED',
          500
        )
      }

      const rsvps = result.data!
      
      // Apply pagination
      const total = rsvps.length
      const paginatedRsvps = rsvps.slice(filterData.offset, filterData.offset + filterData.limit)

      return createSuccessResult({
        rsvps: paginatedRsvps,
        total,
        limit: filterData.limit,
        offset: filterData.offset
      })
    } catch (error) {
      console.error('Error listing RSVPs:', error)
      return createErrorResult(
        'Internal server error',
        'RSVP_LIST_ERROR',
        500
      )
    }
  }

  /**
   * Create a new invite (authenticated)
   */
  async createInvite(userId: string, data: unknown): Promise<RSVPServiceResult<InviteRecord>> {
    try {
      // Validate input data
      const validation = validateInviteCreate(data)
      if (!validation.success) {
        return createErrorResult(
          'Invalid invite data',
          'INVITE_VALIDATION_FAILED',
          400
        )
      }

      const inviteData = validation.data

      // Generate unique token
      const token = await this.generateUniqueToken()

      // Create invite
      const createData = {
        userId,
        email: inviteData.email,
        token,
        country: inviteData.country
      }

      const result = await this.inviteRepo.create(createData)

      if (!result.success) {
        if (result.error?.code === 'INVITE_TOKEN_EXISTS') {
          // Retry with new token (very unlikely but possible)
          const newToken = await this.generateUniqueToken()
          const retryResult = await this.inviteRepo.create({
            ...createData,
            token: newToken
          })
          
          if (!retryResult.success) {
            return createErrorResult(
              'Failed to create invite after retry',
              'INVITE_CREATE_FAILED',
              500
            )
          }
          
          return createSuccessResult(retryResult.data!)
        }

        return createErrorResult(
          'Failed to create invite',
          'INVITE_CREATE_FAILED',
          500
        )
      }

      console.log('Invite created', {
        userId,
        inviteId: result.data!.id,
        email: this.maskEmail(inviteData.email),
        country: inviteData.country,
        operation: 'invite_create'
      })

      return createSuccessResult(result.data!)
    } catch (error) {
      console.error('Error creating invite:', error)
      return createErrorResult(
        'Internal server error',
        'INVITE_CREATE_ERROR',
        500
      )
    }
  }

  /**
   * Create multiple invites in batch (authenticated)
   */
  async createBulkInvites(userId: string, data: unknown): Promise<RSVPServiceResult<InviteRecord[]>> {
    try {
      // Validate input data
      const validation = validateBulkInviteCreate(data)
      if (!validation.success) {
        return createErrorResult(
          'Invalid bulk invite data',
          'BULK_INVITE_VALIDATION_FAILED',
          400
        )
      }

      const bulkData = validation.data
      const createdInvites: InviteRecord[] = []
      const errors: string[] = []

      // Create invites one by one (could be optimized with batch operations)
      for (const inviteData of bulkData.invites) {
        const result = await this.createInvite(userId, inviteData)
        
        if (result.success) {
          createdInvites.push(result.data!)
        } else {
          errors.push(`${inviteData.email}: ${result.error?.message}`)
        }
      }

      if (errors.length > 0 && createdInvites.length === 0) {
        return createErrorResult(
          `All invites failed: ${errors.join(', ')}`,
          'BULK_INVITE_ALL_FAILED',
          400
        )
      }

      if (errors.length > 0) {
        console.warn('Partial bulk invite success', {
          userId,
          successful: createdInvites.length,
          failed: errors.length,
          errors
        })
      }

      return createSuccessResult(createdInvites)
    } catch (error) {
      console.error('Error creating bulk invites:', error)
      return createErrorResult(
        'Internal server error',
        'BULK_INVITE_ERROR',
        500
      )
    }
  }

  /**
   * List invites for a user with filtering (authenticated)
   */
  async listInvites(userId: string, filters: unknown): Promise<RSVPServiceResult<InviteListResult>> {
    try {
      // Validate filter parameters
      const validation = validateInviteFilter(filters)
      if (!validation.success) {
        return createErrorResult(
          'Invalid filter parameters',
          'INVITE_FILTER_VALIDATION_FAILED',
          400
        )
      }

      const filterData = validation.data

      // Get invites from repository
      const result = await this.inviteRepo.list(userId)

      if (!result.success) {
        return createErrorResult(
          'Failed to list invites',
          'INVITE_LIST_FAILED',
          500
        )
      }

      let invites = result.data!

      // Apply search filter if provided
      if (filterData.search) {
        const searchTerm = filterData.search.toLowerCase()
        invites = invites.filter(invite => 
          invite.email.toLowerCase().includes(searchTerm)
        )
      }

      // Apply pagination
      const total = invites.length
      const paginatedInvites = invites.slice(filterData.offset, filterData.offset + filterData.limit)

      // TODO: Add RSVP count for each invite (requires join or separate queries)
      const invitesWithRSVP: InviteWithRSVP[] = paginatedInvites.map(invite => ({
        ...invite,
        rsvpCount: 0 // Placeholder - implement RSVP count if needed
      }))

      return createSuccessResult({
        invites: invitesWithRSVP,
        total,
        limit: filterData.limit,
        offset: filterData.offset
      })
    } catch (error) {
      console.error('Error listing invites:', error)
      return createErrorResult(
        'Internal server error',
        'INVITE_LIST_ERROR',
        500
      )
    }
  }

  /**
   * Update an invite (authenticated)
   */
  async updateInvite(userId: string, inviteId: string, data: unknown): Promise<RSVPServiceResult<InviteRecord | null>> {
    try {
      // Validate input data
      const validation = validateInviteUpdate(data)
      if (!validation.success) {
        return createErrorResult(
          'Invalid invite update data',
          'INVITE_UPDATE_VALIDATION_FAILED',
          400
        )
      }

      const updateData = validation.data

      // Update invite
      const result = await this.inviteRepo.update(inviteId, userId, updateData)

      if (!result.success) {
        return createErrorResult(
          'Failed to update invite',
          'INVITE_UPDATE_FAILED',
          500
        )
      }

      if (!result.data) {
        return createErrorResult(
          'Invite not found',
          'INVITE_NOT_FOUND',
          404
        )
      }

      console.log('Invite updated', {
        userId,
        inviteId,
        operation: 'invite_update'
      })

      return createSuccessResult(result.data)
    } catch (error) {
      console.error('Error updating invite:', error)
      return createErrorResult(
        'Internal server error',
        'INVITE_UPDATE_ERROR',
        500
      )
    }
  }

  /**
   * Delete an invite (authenticated)
   */
  async deleteInvite(userId: string, inviteId: string): Promise<RSVPServiceResult<boolean>> {
    try {
      const result = await this.inviteRepo.delete(inviteId, userId)

      if (!result.success) {
        return createErrorResult(
          'Failed to delete invite',
          'INVITE_DELETE_FAILED',
          500
        )
      }

      if (!result.data) {
        return createErrorResult(
          'Invite not found',
          'INVITE_NOT_FOUND',
          404
        )
      }

      console.log('Invite deleted', {
        userId,
        inviteId,
        operation: 'invite_delete'
      })

      return createSuccessResult(true)
    } catch (error) {
      console.error('Error deleting invite:', error)
      return createErrorResult(
        'Internal server error',
        'INVITE_DELETE_ERROR',
        500
      )
    }
  }

  /**
   * Get invite by token (for RSVP page validation)
   */
  async getInviteByToken(token: string): Promise<RSVPServiceResult<InviteRecord | null>> {
    try {
      const result = await this.inviteRepo.getByToken(token)

      if (!result.success) {
        return createErrorResult(
          'Failed to get invite',
          'INVITE_GET_FAILED',
          500
        )
      }

      return createSuccessResult(result.data)
    } catch (error) {
      console.error('Error getting invite by token:', error)
      return createErrorResult(
        'Internal server error',
        'INVITE_GET_ERROR',
        500
      )
    }
  }

  /**
   * Get RSVP by invite ID (for handler compatibility)
   */
  async getRSVPByInviteId(inviteId: string): Promise<RSVPServiceResult<InviteRSVPRecord | null>> {
    try {
      // Get RSVP for this invite ID
      const result = await this.rsvpRepo.getByInviteId(inviteId)
      
      if (!result.success) {
        // If RSVP not found, return null instead of error
        if (result.error?.code === 'RSVP_NOT_FOUND') {
          return createSuccessResult(null)
        }
        return result
      }

      return createSuccessResult(result.data)
    } catch (error) {
      console.error('Error getting RSVP by invite ID:', error)
      return createErrorResult(
        'Failed to get RSVP',
        'RSVP_RETRIEVAL_FAILED',
        500
      )
    }
  }

  /**
   * Validate invite token (for handler compatibility)
   */
  async validateInvite(token: string): Promise<RSVPServiceResult<{ valid: boolean; invite?: InviteRecord }>> {
    try {
      const result = await this.getInviteByToken(token)
      
      if (!result.success) {
        return createErrorResult(
          'Failed to validate invite',
          'INVITE_VALIDATION_FAILED',
          500
        )
      }

      if (!result.data) {
        return createSuccessResult({
          valid: false
        })
      }

      return createSuccessResult({
        valid: true,
        invite: result.data
      })
    } catch (error) {
      console.error('Error validating invite:', error)
      return createErrorResult(
        'Failed to validate invite',
        'INVITE_VALIDATION_ERROR',
        500
      )
    }
  }

  /**
   * Generate cryptographically secure unique token
   */
  private async generateUniqueToken(): Promise<string> {
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      // Generate random token
      const token = randomBytes(16).toString('hex')
      
      // Check if token is unique
      const uniqueResult = await this.inviteRepo.isTokenUnique(token)
      
      if (uniqueResult.success && uniqueResult.data) {
        return token
      }

      attempts++
    }

    // Fallback to timestamp-based token if random generation fails
    return `${Date.now()}_${randomBytes(8).toString('hex')}`
  }

  /**
   * Mask email for logging (privacy protection)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`
    }
    return `${local.slice(0, 2)}***@${domain}`
  }
}