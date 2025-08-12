import { BaseRepository } from './base.repository'
import { Couple } from '@prisma/client'

export class CoupleRepository extends BaseRepository<Couple> {
  protected model = this.prisma.couple

  async findByUserId(userId: string): Promise<Couple | null> {
    return await this.model.findFirst({
      where: {
        OR: [
          { partner1_user_id: userId },
          { partner2_user_id: userId }
        ]
      }
    })
  }

  async findByPartnerEmail(email: string): Promise<Couple | null> {
    return await this.model.findFirst({
      where: {
        OR: [
          { partner1_email: email },
          { partner2_email: email }
        ]
      }
    })
  }

  async findWithAllRelations(coupleId: string): Promise<Couple | null> {
    return await this.model.findUnique({
      where: { id: coupleId },
      include: {
        guests: true,
        vendors: true,
        budgetCategories: {
          include: {
            budgetExpenses: true
          }
        },
        checklistItems: true
      }
    })
  }

  async updateWeddingDetails(coupleId: string, details: {
    weddingDate?: Date
    venueName?: string
    venueLocation?: string
    guestCountEstimate?: number
  }): Promise<Couple> {
    return await this.update(coupleId, details)
  }

  async updateBudget(coupleId: string, totalBudget: number): Promise<Couple> {
    return await this.update(coupleId, { totalBudget })
  }

  async exists(userId: string): Promise<boolean> {
    const couple = await this.findByUserId(userId)
    return couple !== null
  }
}

// Export singleton instance
export const coupleRepository = new CoupleRepository()