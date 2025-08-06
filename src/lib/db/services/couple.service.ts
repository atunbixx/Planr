import { BaseService } from './base.service'
import { Couple, User, Prisma } from '@prisma/client'
import { BadRequestException } from '@/lib/api/errors'

export class CoupleService extends BaseService<Couple> {
  protected modelName = 'couple' as const

  // Get couple by user ID
  async getCoupleByUserId(userId: string): Promise<Couple | null> {
    return await this.findFirst({ userId })
  }

  // Get couple by clerk user ID
  async getCoupleByClerkId(clerkId: string): Promise<(Couple & { user: User }) | null> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { couples: true }
    })

    if (!user || user.couples.length === 0) {
      return null
    }

    return {
      ...user.couples[0],
      user
    }
  }

  // Create or update couple from onboarding
  async upsertCoupleFromOnboarding(data: {
    clerk_user_id: string
    email?: string
    partner1_name: string
    partner2_name?: string
    wedding_style?: string
    wedding_date?: string
    venue_name?: string
    venue_location?: string
    guest_count_estimate?: number
    budget_total?: number
    onboarding_completed?: boolean
  }): Promise<Couple> {
    // Validate required fields
    if (!data.clerk_user_id || !data.partner1_name) {
      throw new BadRequestException('Missing required fields: clerk_user_id and partner1_name')
    }

    // First, ensure user exists
    const user = await this.prisma.user.upsert({
      where: { clerkId: data.clerk_user_id },
      update: {
        email: data.email || undefined,
        firstName: data.partner1_name.split(' ')[0],
        lastName: data.partner1_name.split(' ').slice(1).join(' ') || undefined,
      },
      create: {
        clerkId: data.clerk_user_id,
        email: data.email || `${data.clerk_user_id}@placeholder.com`,
        firstName: data.partner1_name.split(' ')[0],
        lastName: data.partner1_name.split(' ').slice(1).join(' ') || undefined,
      }
    })

    // Check if couple exists
    const existingCouple = await this.findFirst({ userId: user.id })

    const coupleData = {
      partnerName: data.partner1_name,
      partner2Name: data.partner2_name || null,
      weddingStyle: data.wedding_style || null,
      weddingDate: data.wedding_date ? new Date(data.wedding_date) : null,
      venue: data.venue_name || null,
      location: data.venue_location || null,
      expectedGuests: data.guest_count_estimate || null,
      budgetTotal: data.budget_total ? new Prisma.Decimal(data.budget_total) : null,
      onboardingCompleted: data.onboarding_completed ?? true,
    }

    if (existingCouple) {
      // Update existing couple
      return await this.update(existingCouple.id, coupleData)
    } else {
      // Create new couple
      return await this.create({
        ...coupleData,
        userId: user.id
      })
    }
  }

  // Update couple details
  async updateCoupleDetails(
    id: string,
    userId: string,
    data: Partial<{
      partnerName: string
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
    const couple = await this.findFirst({ id, userId })
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
  async getCoupleWithUser(coupleId: string): Promise<Couple & { user: User }> {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      include: { user: true }
    })

    if (!couple) {
      throw new BadRequestException('Couple not found')
    }

    return couple
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
      budgetTotal: couple?.budgetTotal?.toNumber() || 0
    }
  }
}