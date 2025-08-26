import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  try {
    // Guests total with filters? Simple count for now
    let [guestTotal, vendorTotal, vendorBookedTotal, budgetItems] = await Promise.all([
      prisma.guest.count({ where: { userId } }),
      prisma.vendor.count({ where: { userId } }),
      prisma.vendor.count({ where: { userId, status: 'booked' as any } }),
      prisma.budget.findMany({ where: { userId } })
    ])
    // Guest status breakdown
    let accepted = await prisma.guest.count({ where: { userId, rsvpStatus: 'accepted' as any } }).catch(() => 0)
    let pending = await prisma.guest.count({ where: { userId, rsvpStatus: 'pending' as any } }).catch(() => 0)
    let declined = await prisma.guest.count({ where: { userId, rsvpStatus: 'declined' as any } }).catch(() => 0)
    // Compute critical vendor statuses
    let vendorCritical = { venue: false, photographer: false, caterer: false, music: false, florist: false }
    try {
      const critical = await prisma.vendor.findMany({ where: { userId, status: { in: ['booked','contracted','paid'] as any } } })
      const norm = (s?: string|null) => (s||'').toLowerCase()
      vendorCritical.venue = critical.some(v => norm(v.category) === 'venue')
      vendorCritical.photographer = critical.some(v => norm(v.category) === 'photographer')
      vendorCritical.caterer = critical.some(v => norm(v.category) === 'catering' || norm(v.category) === 'caterer')
      vendorCritical.music = critical.some(v => ['music','dj','band'].includes(norm(v.category)))
      vendorCritical.florist = critical.some(v => norm(v.category) === 'florist')
    } catch {}

    // If Prisma has no data (dev/temp mode), fall back to temp storage metrics
    try {
      if (process.env.NODE_ENV === 'production') {
        // In production do not attempt temp fallbacks
        throw new Error('Skip temp fallback in production')
      }
      if (guestTotal === 0) {
        const guests = await tempStorage.findGuestsByUserId(userId)
        if (guests.length > 0) {
          guestTotal = guests.length
          accepted = guests.filter((g: any) => g.rsvpStatus === 'accepted').length
          pending = guests.filter((g: any) => g.rsvpStatus === 'pending').length
          declined = guests.filter((g: any) => g.rsvpStatus === 'declined').length
        }
      }
      if (vendorTotal === 0) {
        const { vendors } = await tempStorage.listVendors(userId)
        if (vendors.length > 0) {
          vendorTotal = vendors.length
          vendorBookedTotal = vendors.filter((v: any) => v.status === 'booked').length
        }
      }
      if (!budgetItems || budgetItems.length === 0) {
        const { items } = await tempStorage.listBudgets(userId)
        if (items.length > 0) budgetItems = items as any
      }
    } catch (_) {
      // ignore temp fallback errors; we'll use prisma results
    }

    const summary = (budgetItems || []).reduce(
      (acc, item) => {
        acc.totalAmount += Number(item.amount)
        acc.totalAllocated += Number(item.allocated)
        acc.totalActual += Number(item.actual)
        return acc
      },
      { totalAmount: 0, totalAllocated: 0, totalActual: 0 }
    )

    return NextResponse.json({
      success: true,
      data: {
        guestTotal,
        guests: { total: guestTotal, accepted, pending, declined },
        vendorTotal,
        vendorBookedTotal,
        vendorCritical,
        budget: {
          ...summary,
          remainingBudget: summary.totalAmount - summary.totalActual,
          percentSpent: summary.totalAmount > 0 ? (summary.totalActual / summary.totalAmount) * 100 : 0,
        },
      },
    })
  } catch (error) {
    // Fallback to temp storage (dev only)
    try {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: { message: 'Database unavailable' } }, { status: 503 })
      }
      const guests = await tempStorage.findGuestsByUserId(userId)
      const { vendors } = await tempStorage.listVendors(userId)
      const bookedVendors = vendors.filter((v: any) => v.status === 'booked').length
      const { items, summary } = await tempStorage.listBudgets(userId)

      return NextResponse.json({
        success: true,
        data: {
          guestTotal: guests.length,
          guests: {
            total: guests.length,
            accepted: guests.filter((g: any) => g.rsvpStatus === 'accepted').length,
            pending: guests.filter((g: any) => g.rsvpStatus === 'pending').length,
            declined: guests.filter((g: any) => g.rsvpStatus === 'declined').length,
          },
          vendorTotal: vendors.length,
          vendorBookedTotal: bookedVendors,
          budget: {
            ...summary,
            remainingBudget: summary.totalAmount - summary.totalActual,
            percentSpent: summary.totalAmount > 0 ? (summary.totalActual / summary.totalAmount) * 100 : 0,
          },
        },
      })
    } catch (err) {
      console.error('Overview error:', err)
      return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 })
    }
  }
}

export const GET = requireOnboarding(handler)
