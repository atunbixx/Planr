import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { successResponse } from '@/lib/api/errors'
import { prisma } from '@/lib/prisma'
import { differenceInDays } from 'date-fns'

interface DashboardStats {
  daysUntilWedding: number | null
  weddingDate: string | null
  venue: string | null
  totalBudget: number
  totalSpent: number
  budgetRemaining: number
  budgetUsedPercentage: number
  guestStats: {
    total: number
    confirmed: number
    pending: number
    declined: number
    needsRsvp: number
  }
  vendorStats: {
    total: number
    booked: number
    pending: number
    contacted: number
    potential: number
  }
  taskStats: {
    total: number
    completed: number
    thisWeek: number
    overdue: number
  }
  photoStats: {
    total: number
    withAlbums: number
    recent: number
  }
  upcomingPayments: Array<{
    id: string
    vendor: string
    amount: number
    dueDate: string
    daysUntil: number
  }>
  recentActivity: Array<{
    type: 'vendor' | 'guest' | 'budget' | 'photo' | 'task'
    action: string
    description: string
    timestamp: string
  }>
}

export const GET = withAuth(async (request, context) => {
  const couple = context.couple

  // If user hasn't created couple profile yet, return default/empty stats
  if (!couple) {
    const defaultStats: DashboardStats = {
      daysUntilWedding: null,
      weddingDate: null,
      venue: null,
      totalBudget: 0,
      totalSpent: 0,
      budgetRemaining: 0,
      budgetUsedPercentage: 0,
      guestStats: { total: 0, confirmed: 0, pending: 0, declined: 0, needsRsvp: 0 },
      vendorStats: { total: 0, booked: 0, pending: 0, contacted: 0, potential: 0 },
      taskStats: { total: 0, completed: 0, thisWeek: 0, overdue: 0 },
      photoStats: { total: 0, withAlbums: 0, recent: 0 },
      upcomingPayments: [],
      recentActivity: []
    }
    return successResponse({ data: defaultStats })
  }
  
  // Calculate days until wedding
  const daysUntilWedding = couple.weddingDate 
    ? differenceInDays(new Date(couple.weddingDate), new Date())
    : null

  // Get budget statistics
  const expenses = await prisma.budgetExpense.findMany({
    where: { coupleId: couple.id },
    select: { 
      amount: true, 
      isPaid: true,
      date: true,
      vendor: {
        select: {
          businessName: true
        }
      }
    }
  })

  const totalBudget = couple.totalBudget?.toNumber() || 0
  const totalSpent = expenses
    .filter(e => e.isPaid)
    .reduce((sum, e) => sum + e.amount.toNumber(), 0)
  const totalEstimated = expenses
    .reduce((sum, e) => sum + e.amount.toNumber(), 0)
  const budgetRemaining = totalBudget - totalEstimated
  const budgetUsedPercentage = totalBudget > 0 
    ? Math.round((totalEstimated / totalBudget) * 100)
    : 0

  // Get guest statistics
  const guests = await prisma.guest.findMany({
    where: { coupleId: couple.id },
    select: { rsvpStatus: true, inviteSent: true }
  })

  const guestStats = {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvpStatus === 'attending').length,
    pending: guests.filter(g => g.rsvpStatus === 'pending').length,
    declined: guests.filter(g => g.rsvpStatus === 'not_attending').length,
    needsRsvp: guests.filter(g => g.inviteSent && g.rsvpStatus === 'pending').length
  }

  // Get vendor statistics
  const vendors = await prisma.vendor.findMany({
    where: { coupleId: couple.id },
    select: { status: true }
  })

  const vendorStats = {
    total: vendors.length,
    booked: vendors.filter(v => v.status === 'booked').length,
    pending: vendors.filter(v => v.status === 'quoted').length,
    contacted: vendors.filter(v => v.status === 'contacted').length,
    potential: vendors.filter(v => v.status === 'potential').length
  }

  // Get task statistics (checklist items)
  // For now, return mock data as checklist might not be implemented yet
  const taskStats = {
    total: 45,
    completed: 28,
    thisWeek: 5,
    overdue: 2
  }

  // Get photo statistics
  const [photoCount, photoWithAlbum, recentPhotos] = await Promise.all([
    prisma.photo.count({ where: { coupleId: couple.id } }),
    prisma.photo.count({ where: { coupleId: couple.id, albumId: { not: null } } }),
    prisma.photo.count({ 
      where: { 
        coupleId: couple.id,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      } 
    })
  ])

  const photoStats = {
    total: photoCount,
    withAlbums: photoWithAlbum,
    recent: recentPhotos
  }

  // Get upcoming payments (unpaid expenses with future dates)
  const upcomingPayments = expenses
    .filter(e => !e.isPaid && e.date && new Date(e.date) > new Date())
    .map(e => ({
      id: e.date.toISOString(), // temporary ID
      vendor: e.vendor?.businessName || 'Unknown Vendor',
      amount: e.amount.toNumber(),
      dueDate: e.date.toISOString(),
      daysUntil: differenceInDays(new Date(e.date), new Date())
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5) // Top 5 upcoming payments

  // Get recent activity (last 10 items across different tables)
  const recentActivity: DashboardStats['recentActivity'] = []

  // Recent vendors
  const recentVendors = await prisma.vendor.findMany({
    where: { coupleId: couple.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { businessName: true, status: true, createdAt: true }
  })

  recentVendors.forEach(v => {
    recentActivity.push({
      type: 'vendor',
      action: v.status === 'booked' ? 'confirmed' : 'added',
      description: `${v.businessName} ${v.status === 'booked' ? 'confirmed' : 'added'}`,
      timestamp: v.createdAt.toISOString()
    })
  })

  // Recent guests
  const recentGuests = await prisma.guest.findMany({
    where: { 
      coupleId: couple.id,
      rsvpDate: { not: null }
    },
    orderBy: { rsvpDate: 'desc' },
    take: 3,
    select: { firstName: true, lastName: true, rsvpStatus: true, rsvpDate: true }
  })

  recentGuests.forEach(g => {
    recentActivity.push({
      type: 'guest',
      action: 'rsvp',
      description: `${g.firstName} ${g.lastName || ''} ${g.rsvpStatus === 'attending' ? 'confirmed attendance' : 'declined'}`,
      timestamp: g.rsvpDate!.toISOString()
    })
  })

  // Recent photos
  const recentPhotoCount = await prisma.photo.count({
    where: { 
      coupleId: couple.id,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  })

  if (recentPhotoCount > 0) {
    recentActivity.push({
      type: 'photo',
      action: 'uploaded',
      description: `${recentPhotoCount} new photo${recentPhotoCount > 1 ? 's' : ''} uploaded`,
      timestamp: new Date().toISOString()
    })
  }

  // Sort recent activity by timestamp
  recentActivity.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 5)

  const stats: DashboardStats = {
    daysUntilWedding,
    weddingDate: couple.weddingDate?.toISOString() || null,
    venue: couple.venue,
    totalBudget,
    totalSpent,
    budgetRemaining,
    budgetUsedPercentage,
    guestStats,
    vendorStats,
    taskStats,
    photoStats,
    upcomingPayments,
    recentActivity
  }

  return successResponse({ data: stats })
})