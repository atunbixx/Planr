import { BaseRepository, RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'

export type InviteRecord = {
  id: string
  userId: string
  email: string
  token: string
  country?: string
  createdAt: Date
  updatedAt: Date
}

export type InviteCreateData = {
  userId: string
  email: string
  token: string
  country?: string
}

export class InviteRepository extends BaseRepository {
  /**
   * Create a new invite
   */
  async create(data: InviteCreateData): Promise<RepositoryResult<InviteRecord>> {
    try {
      const invite = await this.db.invite.create({
        data: {
          userId: data.userId,
          email: data.email,
          token: data.token,
          country: data.country
        }
      })

      return createSuccessResult(invite as InviteRecord)
    } catch (error) {
      console.error('Failed to create invite:', error)
      
      // Handle unique constraint violation for token
      if (error instanceof Error && error.message.includes('token')) {
        return createErrorResult('Invite token already exists', 'INVITE_TOKEN_EXISTS', 409)
      }
      
      return createErrorResult('Failed to create invite', 'INVITE_CREATE_FAILED', 500)
    }
  }

  /**
   * Get invite by token (for RSVP page access)
   */
  async getByToken(token: string): Promise<RepositoryResult<InviteRecord | null>> {
    try {
      const invite = await this.db.invite.findUnique({
        where: { token }
      })

      return createSuccessResult(invite as InviteRecord | null)
    } catch (error) {
      console.error('Failed to get invite by token:', error)
      return createErrorResult('Failed to get invite', 'INVITE_GET_FAILED', 500)
    }
  }

  /**
   * Get invite by ID
   */
  async getById(id: string): Promise<RepositoryResult<InviteRecord | null>> {
    try {
      const invite = await this.db.invite.findUnique({
        where: { id }
      })

      return createSuccessResult(invite as InviteRecord | null)
    } catch (error) {
      console.error('Failed to get invite by ID:', error)
      return createErrorResult('Failed to get invite', 'INVITE_GET_FAILED', 500)
    }
  }

  /**
   * List all invites for a user
   */
  async list(userId: string): Promise<RepositoryResult<InviteRecord[]>> {
    try {
      const invites = await this.db.invite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      return createSuccessResult(invites as InviteRecord[])
    } catch (error) {
      console.error('Failed to list invites:', error)
      return createErrorResult('Failed to list invites', 'INVITE_LIST_FAILED', 500)
    }
  }

  /**
   * Find or create invite by email for a user
   */
  async findOrCreateByEmail(userId: string, email: string, token: string, country?: string): Promise<RepositoryResult<InviteRecord>> {
    try {
      // First try to find existing invite
      const existing = await this.db.invite.findFirst({
        where: {
          userId,
          email
        }
      })

      if (existing) {
        return createSuccessResult(existing as InviteRecord)
      }

      // Create new invite if not found
      const invite = await this.db.invite.create({
        data: {
          userId,
          email,
          token,
          country
        }
      })

      return createSuccessResult(invite as InviteRecord)
    } catch (error) {
      console.error('Failed to find or create invite:', error)
      
      // Handle unique constraint violation for token
      if (error instanceof Error && error.message.includes('token')) {
        return createErrorResult('Invite token already exists', 'INVITE_TOKEN_EXISTS', 409)
      }
      
      return createErrorResult('Failed to find or create invite', 'INVITE_FIND_CREATE_FAILED', 500)
    }
  }

  /**
   * Update invite
   */
  async update(id: string, userId: string, data: Partial<InviteCreateData>): Promise<RepositoryResult<InviteRecord | null>> {
    try {
      const updated = await this.db.invite.updateMany({
        where: {
          id,
          userId
        },
        data: {
          email: data.email,
          country: data.country,
          updatedAt: new Date()
        }
      })

      if (updated.count === 0) {
        return createSuccessResult(null)
      }

      const invite = await this.db.invite.findUnique({
        where: { id }
      })

      return createSuccessResult(invite as InviteRecord)
    } catch (error) {
      console.error('Failed to update invite:', error)
      return createErrorResult('Failed to update invite', 'INVITE_UPDATE_FAILED', 500)
    }
  }

  /**
   * Delete invite (and cascade delete RSVPs)
   */
  async delete(id: string, userId: string): Promise<RepositoryResult<boolean>> {
    try {
      const deleted = await this.db.invite.deleteMany({
        where: {
          id,
          userId
        }
      })

      return createSuccessResult(deleted.count > 0)
    } catch (error) {
      console.error('Failed to delete invite:', error)
      return createErrorResult('Failed to delete invite', 'INVITE_DELETE_FAILED', 500)
    }
  }

  /**
   * Check if token is unique (for validation)
   */
  async isTokenUnique(token: string): Promise<RepositoryResult<boolean>> {
    try {
      const existing = await this.db.invite.findUnique({
        where: { token },
        select: { id: true }
      })

      return createSuccessResult(!existing)
    } catch (error) {
      console.error('Failed to check token uniqueness:', error)
      return createErrorResult('Failed to check token', 'INVITE_TOKEN_CHECK_FAILED', 500)
    }
  }
}