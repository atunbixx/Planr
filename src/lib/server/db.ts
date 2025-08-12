import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculatePercentage } from '@/lib/utils'

// Input validation schemas
const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

const SortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
})

const FilterSchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
})

// Core user and couple resolution
export async function getCurrentUserCouple() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore if called from Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore if called from Server Component
          }
        },
      },
    }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('User not authenticated')
  }

  if (!user.email) {
    throw new Error('User email not found')
  }

  // Get user data first using supabase_user_id
  const userData = await prisma.user.findUnique({
    where: {
      supabase_user_id: user.id
    }
  })

  if (!userData) {
    throw new Error('User not found in database')
  }

  // Get couple data separately using partner1_user_id field
  const coupleData = await prisma.wedding_couples.findFirst({
    where: {
      OR: [
        { partner1_user_id: userData.id },
        { partner2_user_id: userData.id }
      ]
    },
    select: {
      id: true,
      partner1_name: true,
      partner2_name: true,
      wedding_date: true,
      venue: true,
      total_budget: true,
      currency: true,
      onboarding_completed: true
    }
  })

  return {
    user: userData,
    couple: coupleData ? {
      id: coupleData.id,
      partner1Name: coupleData.partner1_name,
      partner2Name: coupleData.partner2_name,
      weddingDate: coupleData.wedding_date,
      venueName: coupleData.venue,
      venueLocation: null, // This field doesn't exist in wedding_couples
      totalBudget: coupleData.total_budget,
      currency: coupleData.currency,
      onboardingCompleted: coupleData.onboarding_completed
    } : null,
    coupleId: coupleData?.id || null
  }
}

// Vendors data layer
export async function getVendorsData(options?: {
  filters?: z.infer<typeof FilterSchema>
  sort?: z.infer<typeof SortSchema>
  pagination?: z.infer<typeof PaginationSchema>
}) {
  const { coupleId } = await getCurrentUserCouple()
  
  // Validate inputs
  const filters = FilterSchema.parse(options?.filters || {})
  const sort = SortSchema.parse(options?.sort || { field: 'createdAt', direction: 'desc' })
  const pagination = PaginationSchema.parse(options?.pagination || {})

  // Build where clause
  const where: any = {
    coupleId: coupleId
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.category) {
    where.categoryId = filters.category
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { contactName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  // Get vendors with category data
  const vendors = await prisma.vendor.findMany({
    where,
    include: {
      vendorCategories: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true
        }
      }
    },
    orderBy: {
      [sort.field]: sort.direction
    },
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit
  })

  // Get vendor categories
  const categories = await prisma.vendorCategory.findMany({
    orderBy: { name: 'asc' }
  })

  // Calculate summary statistics
  const allVendors = await prisma.vendor.findMany({
    where: { coupleId: coupleId },
    select: {
      status: true,
      estimatedCost: true,
      actualCost: true,
      contractSigned: true
    }
  })

  const summary = {
    total_vendors: allVendors.length,
    booked_vendors: allVendors.filter(v => v.status === 'booked').length,
    pending_vendors: allVendors.filter(v => 
      ['potential', 'contacted', 'quote_requested', 'in_discussion'].includes(v.status || '')
    ).length,
    total_estimated_cost: allVendors.reduce((sum, v) => sum + Number(v.estimatedCost || 0), 0),
    total_actual_cost: allVendors.reduce((sum, v) => sum + Number(v.actualCost || 0), 0),
    contracts_signed: allVendors.filter(v => v.contractSigned === true).length
  }

  // Get total count for pagination
  const totalCount = await prisma.vendor.count({ where })

  return {
    vendors,
    categories,
    summary,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: totalCount,
      pages: Math.ceil(totalCount / pagination.limit)
    }
  }
}

// Photos data layer
export async function getPhotosData(options?: {
  albumId?: string
  filters?: z.infer<typeof FilterSchema>
  sort?: z.infer<typeof SortSchema>
  pagination?: z.infer<typeof PaginationSchema>
}) {
  const { coupleId } = await getCurrentUserCouple()
  
  // Validate inputs
  const filters = FilterSchema.parse(options?.filters || {})
  const sort = SortSchema.parse(options?.sort || { field: 'createdAt', direction: 'desc' })
  const pagination = PaginationSchema.parse(options?.pagination || {})

  // Build where clause for photos
  const where: any = {
    coupleId: coupleId
  }

  if (options?.albumId) {
    where.albumId = options.albumId
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { hasSome: [filters.search] } }
    ]
  }

  // Get albums for this couple
  const albums = await prisma.photoAlbum.findMany({
    where: { coupleId: coupleId },
    include: {
      coverPhoto: {
        select: {
          id: true,
          cloudinarySecureUrl: true,
          title: true
        }
      },
      _count: {
        select: {
          photos: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get photos
  const photos = await prisma.photo.findMany({
    where,
    include: {
      photoAlbums: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      [sort.field]: sort.direction
    },
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit
  })

  // Calculate statistics
  const allPhotos = await prisma.photo.findMany({
    where: { coupleId: coupleId },
    select: {
      isFavorite: true,
      fileSize: true,
      isPrivate: true
    }
  })

  const stats = {
    total_photos: allPhotos.length,
    total_albums: albums.length,
    favorite_photos: allPhotos.filter(p => p.isFavorite).length,
    shared_photos: allPhotos.filter(p => !p.isPrivate).length, // Use isPrivate instead
    storage_used: allPhotos.reduce((sum, p) => sum + Number(p.fileSize || 0), 0)
  }

  // Get total count for pagination
  const totalCount = await prisma.photo.count({ where })

  return {
    photos,
    albums,
    stats,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: totalCount,
      pages: Math.ceil(totalCount / pagination.limit)
    }
  }
}

// Guests data layer
export async function getGuestsData(options?: {
  filters?: z.infer<typeof FilterSchema>
  sort?: z.infer<typeof SortSchema>
  pagination?: z.infer<typeof PaginationSchema>
}) {
  const { coupleId } = await getCurrentUserCouple()
  
  // Validate inputs
  const filters = FilterSchema.parse(options?.filters || {})
  const sort = SortSchema.parse(options?.sort || { field: 'createdAt', direction: 'desc' })
  const pagination = PaginationSchema.parse(options?.pagination || {})

  // Build where clause
  const where: any = {
    coupleId: coupleId
  }

  // Guest model doesn't have attendingStatus field
  // TODO: Add RSVP status tracking to Guest model or use Invitation status

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  // Get guests with invitations
  const guests = await prisma.guest.findMany({
    where,
    include: {
      invitations: {
        select: {
          invitationCode: true,
          status: true,
          attendingCount: true,
          plusOneAttending: true,
          plusOneName: true,
          dietaryRestrictions: true,
          rsvpNotes: true,
          rsvpDeadline: true,
          respondedAt: true
        }
      },
      // Seating assignments not yet implemented in schema
      // TODO: Add seating assignment relationships
    },
    orderBy: {
      [sort.field]: sort.direction
    },
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit
  })

  // Calculate RSVP statistics
  const allGuests = await prisma.guest.findMany({
    where: { coupleId: coupleId },
    select: {
      plusOneAllowed: true,
      invitations: {
        select: {
          status: true,
          attendingCount: true,
          plusOneAttending: true
        }
      }
    }
  })

  const rsvpStats = {
    total_guests: allGuests.length,
    confirmed_guests: allGuests.filter(g => g.invitations?.[0]?.status === 'attending').length,
    declined_guests: allGuests.filter(g => g.invitations?.[0]?.status === 'declined').length,
    pending_guests: allGuests.filter(g => !g.invitations?.[0] || g.invitations[0].status === 'pending').length,
    plus_ones_invited: allGuests.filter(g => g.plusOneAllowed).length,
    plus_ones_confirmed: allGuests.reduce((sum, g) => 
      sum + (g.invitations?.[0]?.plusOneAttending ? 1 : 0), 0
    ),
    total_attending: allGuests.reduce((sum, g) => 
      sum + Number(g.invitations?.[0]?.attendingCount || 0), 0
    )
  }

  // Get total count for pagination
  const totalCount = await prisma.guest.count({ where })

  return {
    guests,
    rsvpStats,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: totalCount,
      pages: Math.ceil(totalCount / pagination.limit)
    }
  }
}

// Budget data layer
export async function getBudgetData(options?: {
  filters?: z.infer<typeof FilterSchema>
  sort?: z.infer<typeof SortSchema>
}) {
  const { coupleId } = await getCurrentUserCouple()
  
  // Get budget categories with expenses
  const categories = await prisma.budgetCategory.findMany({
    where: { coupleId: coupleId },
    include: {
      budgetExpenses: {
        select: {
          id: true,
          description: true,
          amount: true,
          dueDate: true,
          paymentStatus: true
        },
        orderBy: { dueDate: 'desc' }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Get recent expenses across all categories
  const recentExpenses = await prisma.budgetExpense.findMany({
    where: { coupleId: coupleId },
    include: {
      budgetCategory: {
        select: {
          name: true,
          color: true,
          icon: true
        }
      }
    },
    orderBy: { dueDate: 'desc' },
    take: 10
  })

  // Calculate totals
  const totalBudget = categories.reduce((sum, cat) => sum + Number(cat.allocatedAmount || 0), 0)
  const totalSpent = categories.reduce((sum, cat) => sum + Number(cat.spentAmount || 0), 0)
  const totalRemaining = totalBudget - totalSpent

  // Category breakdown for charts
  const categoryBreakdown = categories.map(cat => ({
    category: cat.name,
    allocated: Number(cat.allocatedAmount || 0),
    spent: Number(cat.spentAmount || 0),
    remaining: Number(cat.allocatedAmount || 0) - Number(cat.spentAmount || 0),
    percentage: calculatePercentage(Number(cat.allocatedAmount || 0), totalBudget),
    color: cat.color || '#667eea',
    icon: cat.icon || '💰'
  }))

  return {
    categories,
    recentExpenses,
    summary: {
      totalBudget: totalBudget,
      total_spent: totalSpent,
      total_remaining: totalRemaining,
      percentage_spent: calculatePercentage(totalSpent, totalBudget)
    },
    categoryBreakdown
  }
}

// Dashboard stats data layer
export async function getDashboardStats() {
  const { user, couple, coupleId } = await getCurrentUserCouple()

  // If no couple found, return default stats for new users
  if (!couple || !coupleId) {
    return {
      daysUntilWedding: null,
      weddingDate: null,
      venue: null,
      totalBudget: 0,
      totalSpent: 0,
      budgetRemaining: 0,
      budgetUsedPercentage: 0,
      userInfo: {
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        partner1Name: 'Partner'
      },
      guestStats: { total: 0, confirmed: 0, pending: 0, declined: 0, needsRsvp: 0 },
      vendorStats: { total: 0, booked: 0, pending: 0, contacted: 0, potential: 0 },
      taskStats: { total: 0, completed: 0, thisWeek: 0, overdue: 0 },
      photoStats: { total: 0, withAlbums: 0, recent: 0 },
      upcomingPayments: [],
      recentActivity: []
    }
  }

  // Calculate days until wedding
  const daysUntilWedding = couple.weddingDate 
    ? Math.ceil((new Date(couple.weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Extract user info
  const partner1Parts = couple.partner1Name?.split(' ') || []
  const userInfo = {
    firstName: partner1Parts[0] || 'Bride',
    lastName: partner1Parts.slice(1).join(' ') || '',
    partner1Name: couple.partner2Name || 'Partner'
  }

  // Get detailed stats in parallel for performance
  const [
    vendorCounts,
    guestCounts,
    photoCounts,
    budgetData,
    taskCounts
  ] = await Promise.all([
    // Vendor stats with status breakdown - use simple aggregate if groupBy fails
    prisma.vendor.groupBy({
      by: ['status'],
      where: { coupleId: coupleId },
      _count: { id: true }
    }).catch(() => 
      prisma.vendor.aggregate({
        where: { coupleId: coupleId },
        _count: { id: true }
      }).then(result => [{ status: 'unknown', _count: { id: result._count.id || 0 } }])
    ),
    
    // Guest stats - count total guests and use invitations for RSVP status
    prisma.guest.findMany({
      where: { coupleId: coupleId },
      select: {
        id: true,
        invitations: {
          select: {
            status: true,
            attendingCount: true
          }
        }
      }
    }),
    
    // Photo stats
    prisma.photo.aggregate({
      where: { coupleId: coupleId },
      _count: { id: true }
    }),
    
    // Budget data
    Promise.all([
      prisma.budgetExpense.aggregate({
        where: { coupleId: coupleId },
        _sum: { amount: true }
      }),
      prisma.wedding_couples.findUnique({
        where: { id: coupleId },
        select: { total_budget: true }
      })
    ]),
    
    // Task stats (if tasks table exists)
    prisma.$queryRaw<Array<{ status: string, count: number }>>`
      SELECT status, COUNT(*)::int as count 
      FROM tasks 
      WHERE couple_id = ${coupleId}
      GROUP BY status
    `.catch(() => [])
  ])

  // Process vendor stats
  const vendorStatsMap = vendorCounts.reduce((acc: Record<string, number>, item) => {
    acc[item.status || 'unknown'] = item._count.id
    return acc
  }, {} as Record<string, number>)

  // Process guest stats from invitations
  const guestStatusCounts = {
    attending: 0,
    declined: 0,
    pending: 0,
    total: guestCounts.length
  }
  
  guestCounts.forEach(guest => {
    const invitation = guest.invitations?.[0]
    if (!invitation || invitation.status === 'pending') {
      guestStatusCounts.pending++
    } else if (invitation.status === 'attending') {
      guestStatusCounts.attending++
    } else if (invitation.status === 'declined') {
      guestStatusCounts.declined++
    }
  })

  // Process task stats
  const taskStatsMap = taskCounts.reduce((acc, item) => {
    acc[item.status || 'pending'] = item.count
    return acc
  }, {} as Record<string, number>)

  // Calculate budget info
  const totalSpent = Number(budgetData[0]._sum.amount || 0)
  const totalBudget = Number(budgetData[1]?.total_budget || 0)
  const budgetRemaining = totalBudget - totalSpent
  const budgetUsedPercentage = calculatePercentage(totalSpent, totalBudget)

  return {
    daysUntilWedding,
    weddingDate: couple.weddingDate?.toISOString() || null,
    venue: couple.venueName || null,
    totalBudget,
    totalSpent,
    budgetRemaining,
    budgetUsedPercentage,
    userInfo,
    vendorStats: {
      total: vendorCounts.reduce((sum, item) => sum + item._count.id, 0),
      booked: vendorStatsMap.booked || 0,
      pending: (vendorStatsMap.contacted || 0) + (vendorStatsMap.quote_requested || 0) + (vendorStatsMap.in_discussion || 0),
      contacted: vendorStatsMap.contacted || 0,
      potential: vendorStatsMap.potential || 0
    },
    guestStats: {
      total: guestStatusCounts.total,
      confirmed: guestStatusCounts.attending,
      pending: guestStatusCounts.pending,
      declined: guestStatusCounts.declined,
      needsRsvp: guestStatusCounts.pending
    },
    photoStats: {
      total: photoCounts._count.id || 0,
      withAlbums: 0, // TODO: Calculate albums
      recent: 0 // TODO: Calculate recent photos
    },
    taskStats: {
      total: taskCounts.reduce((sum, item) => sum + item.count, 0),
      completed: taskStatsMap.completed || 0,
      thisWeek: 0, // TODO: Calculate this week's tasks
      overdue: taskStatsMap.overdue || 0
    },
    upcomingPayments: [], // TODO: Implement upcoming payments
    recentActivity: [] // TODO: Implement recent activity
  }
}