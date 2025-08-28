import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'
import { DEFAULT_CHECKLIST } from '@/data/dashboard-config'

function normalize(str?: string | null) {
  return (str || '').trim().toLowerCase()
}

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  try {
    // Gather facts to compute completion
    const [wedding, guestCount, vendors, budgets] = await Promise.all([
      prisma.weddingDetails.findUnique({ where: { userId } }),
      prisma.guest.count({ where: { userId } }),
      prisma.vendor.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } }),
    ])

    const facts = {
      hasDate: Boolean(wedding?.weddingDate),
      hasVenue: Boolean(normalize(wedding?.venue)),
      hasGuests: guestCount > 0,
      hasBudget: budgets.length > 0 || budgets.reduce((a, b) => a + Number(b.amount), 0) > 0,
      hasPhotographer: vendors.some(v => normalize(v.category) === 'photographer' && ['booked','contracted','paid'].includes((v.status as any) || '')),
    }

    const items = DEFAULT_CHECKLIST.map(i => {
      let completed = false
      if (i.key === 'set_date') completed = facts.hasDate
      else if (i.key === 'choose_venue') completed = facts.hasVenue
      else if (i.key === 'create_guest_list') completed = facts.hasGuests
      else if (i.key === 'set_budget') completed = facts.hasBudget
      else if (i.key === 'book_photographer') completed = facts.hasPhotographer
      return { ...i, completed }
    })

    const completed = items.filter(i => i.completed).length
    const total = items.length

    return NextResponse.json({ success: true, data: { items, completed, total } })
  } catch (_) {
    // Final safety: return checklist with all items pending rather than error
    try {
      const items = DEFAULT_CHECKLIST.map(i => ({ ...i, completed: false }))
      const completed = 0
      const total = items.length
      return NextResponse.json({ success: true, data: { items, completed, total } })
    } catch (err) {
      return NextResponse.json({ success: true, data: { items: [], completed: 0, total: 0 } })
    }
  }
}

export const GET = requireOnboarding(handler)
