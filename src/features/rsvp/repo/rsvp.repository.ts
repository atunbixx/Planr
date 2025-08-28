import { BaseRepository, RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'
import { RsvpStatus } from '@prisma/client'

export type InviteRecord = {
  id: string
  userId: string
  email: string
  token: string
  country?: string
  createdAt: Date
  updatedAt: Date
}

export type InviteRSVPRecord = {
  id: string
  userId: string
  inviteId: string
  email: string
  status: RsvpStatus
  partySize: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type RSVPStats = {
  total: number
  pending: number
  accepted: number
  declined: number
  totalGuests: number
}

export type RSVPCreateData = {
  userId: string
  inviteId: string
  email: string
  status: RsvpStatus
  partySize: number
  notes?: string
}

export class RSVPRepository extends BaseRepository {
  /**
   * Create or update RSVP with idempotency based on userId + email
   */
  async createOrUpdate(data: RSVPCreateData): Promise<RepositoryResult<InviteRSVPRecord>> {
    try {
      const rsvp = await this.db.inviteRSVP.upsert({
        where: { 
          userId_email: { 
            userId: data.userId, 
            email: data.email 
          } 
        },
        update: {
          status: data.status,
          partySize: data.partySize,
          notes: data.notes,
          updatedAt: new Date()
        },
        create: {
          userId: data.userId,
          inviteId: data.inviteId,
          email: data.email,
          status: data.status,
          partySize: data.partySize,
          notes: data.notes
        }
      })
      
      return createSuccessResult(rsvp as InviteRSVPRecord)
    } catch (error) {
      console.error('Failed to create/update RSVP:', error)
      return createErrorResult('Failed to create/update RSVP', 'RSVP_UPSERT_FAILED', 500)
    }
  }

  /**
   * Get RSVP statistics for a user (couple)
   */
  async getStats(userId: string): Promise<RepositoryResult<RSVPStats>> {
    try {
      const stats = await this.db.inviteRSVP.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
        _sum: { partySize: true }
      })

      const formattedStats = this.formatStats(stats)
      return createSuccessResult(formattedStats)
    } catch (error) {
      console.error('Failed to get RSVP stats:', error)
      return createErrorResult('Failed to get RSVP stats', 'RSVP_STATS_FAILED', 500)
    }
  }

  /**
   * Get all RSVPs for a user with optional filtering
   */
  async list(userId: string, filters?: { status?: RsvpStatus }): Promise<RepositoryResult<InviteRSVPRecord[]>> {
    try {
      const where: any = { userId }
      if (filters?.status) {
        where.status = filters.status
      }

      const rsvps = await this.db.inviteRSVP.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          invite: {
            select: {
              token: true,
              country: true
            }
          }
        }
      })

      return createSuccessResult(rsvps as InviteRSVPRecord[])
    } catch (error) {
      console.error('Failed to list RSVPs:', error)
      return createErrorResult('Failed to list RSVPs', 'RSVP_LIST_FAILED', 500)
    }
  }

  /**
   * Find RSVP by invite and email
   */
  async findByInviteAndEmail(inviteId: string, email: string): Promise<RepositoryResult<InviteRSVPRecord | null>> {
    try {
      const rsvp = await this.db.inviteRSVP.findFirst({
        where: {
          inviteId,
          email
        }
      })

      return createSuccessResult(rsvp as InviteRSVPRecord | null)
    } catch (error) {
      console.error('Failed to find RSVP by invite and email:', error)
      return createErrorResult('Failed to find RSVP', 'RSVP_FIND_FAILED', 500)
    }
  }

  /**
   * Get RSVP by invite ID (latest entry)
   */
  async getByInviteId(inviteId: string): Promise<RepositoryResult<InviteRSVPRecord | null>> {
    try {
      const rsvp = await this.db.inviteRSVP.findFirst({
        where: { inviteId },
        orderBy: { updatedAt: 'desc' }
      })
      return createSuccessResult(rsvp as InviteRSVPRecord | null)
    } catch (error) {
      console.error('Failed to get RSVP by invite ID:', error)
      return createErrorResult('Failed to get RSVP', 'RSVP_GET_FAILED', 500)
    }
  }

  /**
   * Delete RSVP by ID (for user's own RSVPs only)
   */
  async delete(userId: string, rsvpId: string): Promise<RepositoryResult<boolean>> {
    try {
      const deleted = await this.db.inviteRSVP.deleteMany({
        where: {
          id: rsvpId,
          userId
        }
      })

      return createSuccessResult(deleted.count > 0)
    } catch (error) {
      console.error('Failed to delete RSVP:', error)
      return createErrorResult('Failed to delete RSVP', 'RSVP_DELETE_FAILED', 500)
    }
  }

  /**
   * Format raw stats from database groupBy into structured format
   */
  private formatStats(rawStats: any[]): RSVPStats {
    const stats: RSVPStats = {
      total: 0,
      pending: 0,
      accepted: 0,
      declined: 0,
      totalGuests: 0
    }

    for (const stat of rawStats) {
      const count = stat._count._all
      const guestCount = stat._sum.partySize || 0
      
      stats.total += count
      stats.totalGuests += guestCount

      switch (stat.status) {
        case 'pending':
          stats.pending += count
          break
        case 'accepted':
          stats.accepted += count
          break
        case 'declined':
          stats.declined += count
          break
      }
    }

    return stats
  }
}
