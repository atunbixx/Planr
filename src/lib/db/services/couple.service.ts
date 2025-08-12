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
      partner1Name: data.partner1Name,
      partner2Name: data.partner2Name || null,
      weddingStyle: data.weddingStyle || null,
      weddingDate: data.weddingDate ? new Date(data.weddingDate) : null,
      venueName: data.venueName || null,
      venueLocation: data.venueLocation || null,
      guestCountEstimate: data.guestCountEstimate || null,
      totalBudget: data.totalBudget ? new Prisma.Decimal(data.totalBudget) : null,
      onboardingCompleted: data.onboardingCompleted ?? true,
    }

    if (existingCouple) {
      // Update existing couple
      return await this.update(existingCouple.id, coupleData)
    } else {
      // Create new couple
      return await this.create({
        ...coupleData,
        partner1_user_id: user.id
      })
    }
  }

  // Update couple details
  async updateCoupleDetails(
    id: string,
    userId: string,
    data: Partial<{
      partner1Name: string
      partner2Name: string
      weddingStyle: string
      weddingDate: string
      venue: string
      location: string
      expectedGuests: number
      budgetTotal: number
      onboardingCompleted: boolean
    }>
  ): Promise<Couple> {
    // Verify ownership
    const couple = await this.prisma.wedding_couples.findFirst({
      where: {
        id,
        OR: [
          { partner1_user_id: userId },
          { partner2_user_id: userId }
        ]
      }
    })
    if (!couple) {
      throw new BadRequestException('Couple not found')
    }

    const updateData: any = { ...data }
    
    if (data.weddingDate !== undefined) {
      updateData.weddingDate = data.weddingDate ? new Date(data.weddingDate) : null
    }
    
    if (data.budgetTotal !== undefined) {
      updateData.budgetTotal = new Prisma.Decimal(data.budgetTotal)
    }

    return await this.update(id, updateData)
  }

  // Get couple with full user data
  async getCoupleWithUser(coupleId: string): Promise<Couple & { user: User | null }> {
    const couple = await this.prisma.wedding_couples.findUnique({
      where: { id: coupleId }
    })

    if (!couple) {
      throw new BadRequestException('Couple not found')
    }

    // Get the primary user (partner1)
    let user = null
    if (couple.partner1_user_id) {
      user = await this.prisma.user.findUnique({
        where: { id: couple.partner1_user_id }
      })
    }

    return {
      ...couple,
      user
    }
  }

  // Get couple statistics
  async getCoupleStatistics(coupleId: string) {
    const [guests, vendors, photos, expenses] = await Promise.all([
      this.prisma.guest.count({ where: { coupleId } }),
      this.prisma.vendor.count({ where: { coupleId } }),
      this.prisma.photo.count({ where: { coupleId } }),
      this.prisma.budgetExpense.aggregate({
        where: { coupleId },
        _sum: { amount: true }
      })
    ])

    const couple = await this.findById(coupleId)
    const daysUntilWedding = couple?.weddingDate 
      ? Math.ceil((new Date(couple.weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      guestCount: guests,
      vendorCount: vendors,
      photoCount: photos,
      totalExpenses: expenses._sum.amount?.toNumber() || 0,
      daysUntilWedding,
      budgetTotal: couple?.totalBudget?.toNumber() || 0
    }
  }

  // Check if a user owns or is part of a couple
  async userOwnsCouple(userId: string, coupleId: string): Promise<boolean> {
    const couple = await this.prisma.wedding_couples.findFirst({
      where: {
        id: coupleId,
        OR: [
          { partner1_user_id: userId },
          { partner2_user_id: userId }
        ]
      }
    })

    return !!couple
  }
}