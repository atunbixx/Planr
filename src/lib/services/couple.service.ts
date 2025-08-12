import { BaseService } from './base.service'
import { wedding_couples as Couple, User, Prisma } from '@prisma/client'
import { BadRequestException } from '@/lib/api/errors'

export class CoupleService extends BaseService<Couple> {
  protected modelName = 'wedding_couples' as const

  // Get couple by user ID - checks all possible user ID fields
  async getCoupleByUserId(userId: string): Promise<Couple | null> {
    return await this.prisma.wedding_couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: userId },
          { partner2_user_id: userId }
        ]
      }
    })
  }

  // Get couple by supabase user ID
  async getCoupleBySupabaseId(supabaseUserId: string): Promise<(Couple & { primaryUser: User }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { supabase_user_id: supabaseUserId }
    })

    if (!user) {
      return null
    }

    const couple = await this.prisma.wedding_couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: user.id },
          { partner2_user_id: user.id }
        ]
      }
    })

    if (!couple) {
      return null
    }

    return {
      ...couple,
      primaryUser: user
    }
  }

  // Create or update couple from onboarding
  async upsertCoupleFromOnboarding(data: {
    supabaseUserId: string
    email?: string
    partner1Name: string
    partner2Name?: string
    weddingStyle?: string
    weddingDate?: string
    venueName?: string
    venueLocation?: string
    guestCountEstimate?: number
    totalBudget?: number
    onboardingCompleted?: boolean
  }): Promise<Couple> {
    // Validate required fields
    if (!data.supabaseUserId || !data.partner1Name) {
      throw new BadRequestException('Missing required fields: supabaseUserId and partner1Name')
    }

    // First, ensure user exists
    const user = await this.prisma.user.upsert({
      where: { supabase_user_id: data.supabaseUserId },
      update: {
        email: data.email || undefined,
        firstName: data.partner1Name.split(' ')[0],
        lastName: data.partner1Name.split(' ').slice(1).join(' ') || undefined,
      },
      create: {
        supabase_user_id: data.supabaseUserId,
        email: data.email || `${data.supabaseUserId}@placeholder.com`,
        firstName: data.partner1Name.split(' ')[0],
        lastName: data.partner1Name.split(' ').slice(1).join(' ') || undefined,
      }
    })

    // Check if couple exists
    const existingCouple = await this.prisma.wedding_couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: user.id },
          { partner2_user_id: user.id }
        ]
      }
    })

    const coupleData = {
      partner1_name: data.partner1Name,
      partner2_name: data.partner2Name || null,
      wedding_style: data.weddingStyle || null,
      wedding_date: data.weddingDate ? new Date(data.weddingDate) : null,
      venue_name: data.venueName || null,
      venue_location: data.venueLocation || null,
      guest_count_estimate: data.guestCountEstimate || null,
      total_budget: data.totalBudget ? new Prisma.Decimal(data.totalBudget) : null,
      onboarding_completed: data.onboardingCompleted ?? true,
    }

    if (existingCouple) {
      // Update existing couple
      return await this.prisma.wedding_couples.update({
        where: { id: existingCouple.id },
        data: coupleData
      })
    } else {
      // Create new couple
      return await this.prisma.wedding_couples.create({
        data: {
          ...coupleData,
          partner1_user_id: user.id
        }
      })
    }
  }
}

// Export singleton instance
export const coupleService = new CoupleService()