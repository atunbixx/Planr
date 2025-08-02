import { prisma } from '@/lib/prisma'
import type { couples } from '@prisma/client'

export class CouplesService {
  // Get couple by user ID
  static async getCoupleByUserId(userId: string): Promise<couples | null> {
    return await prisma.couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: userId },
          { partner2_user_id: userId }
        ]
      }
    })
  }

  // Create a new couple
  static async createCouple(data: {
    partner1_user_id: string
    partner1_name: string
    partner2_name?: string
    wedding_date?: Date
    venue_name?: string
    venue_location?: string
    guest_count_estimate?: number
    total_budget?: number
    wedding_style?: string
  }): Promise<couples> {
    return await prisma.couples.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
  }

  // Update couple information
  static async updateCouple(coupleId: string, data: Partial<couples>): Promise<couples> {
    return await prisma.couples.update({
      where: { id: coupleId },
      data: {
        ...data,
        updated_at: new Date()
      }
    })
  }

  // Get couple with related data
  static async getCoupleWithDetails(coupleId: string) {
    return await prisma.couples.findUnique({
      where: { id: coupleId },
      include: {
        guests: true,
        vendors: true,
        budget_categories: true,
        tasks: true,
        timeline_items: true
      }
    })
  }
}