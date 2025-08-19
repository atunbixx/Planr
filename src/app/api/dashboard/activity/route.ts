import { NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db/prisma'
import { tempStorage } from '@/lib/db/temp-storage'

type ActivityItem = { type: 'guest'|'vendor'|'budget'; title: string; when: string; detail?: string }

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  try {
    const [guests, vendors, budgets] = await Promise.all([
      prisma.guest.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 5 }),
      prisma.vendor.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 5 }),
      prisma.budget.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: 5 }),
    ])
    let items: ActivityItem[] = []
    items.push(...guests.map(g => ({ type: 'guest', title: `Guest updated: ${g.name}`, when: g.updatedAt.toISOString(), detail: g.rsvpStatus as any })))
    items.push(...vendors.map(v => ({ type: 'vendor', title: `Vendor ${v.status ? 'updated' : 'added'}: ${v.name}`, when: v.updatedAt.toISOString(), detail: v.status as any })))
    items.push(...budgets.map(b => ({ type: 'budget', title: `Budget item updated: ${b.category}`, when: b.updatedAt.toISOString(), detail: `$${Number(b.actual).toLocaleString()}` })))
    items.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    items = items.slice(0, 8)
    return NextResponse.json({ success: true, data: { items } })
  } catch (err) {
    try {
      const guests = await tempStorage.findGuestsByUserId(userId)
      const { vendors } = await tempStorage.listVendors(userId)
      const { items: budgets } = await tempStorage.listBudgets(userId)
      let items: ActivityItem[] = []
      items.push(...guests.sort((a,b)=> new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()).slice(0,5)
        .map(g => ({ type: 'guest' as const, title: `Guest updated: ${g.name}`, when: g.updatedAt, detail: g.rsvpStatus })))
      items.push(...vendors.sort((a:any,b:any)=> new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()).slice(0,5)
        .map((v:any) => ({ type: 'vendor' as const, title: `Vendor ${v.status ? 'updated' : 'added'}: ${v.name}`, when: v.updatedAt, detail: v.status })))
      items.push(...budgets.sort((a:any,b:any)=> new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()).slice(0,5)
        .map((b:any) => ({ type: 'budget' as const, title: `Budget item updated: ${b.category}`, when: b.updatedAt, detail: `$${Number(b.actual).toLocaleString()}` })))
      items.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
      items = items.slice(0, 8)
      return NextResponse.json({ success: true, data: { items } })
    } catch (e) {
      return NextResponse.json({ success: true, data: { items: [] } })
    }
  }
}

export const GET = requireOnboarding(handler)

