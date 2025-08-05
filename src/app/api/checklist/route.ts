import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// Default checklist items by timeframe
const DEFAULT_CHECKLIST_ITEMS = [
  // 12+ months before
  { title: 'Set wedding date', category: 'Planning', timeframe: '12+ months', priority: 'high' },
  { title: 'Create wedding budget', category: 'Budget', timeframe: '12+ months', priority: 'high' },
  { title: 'Book ceremony venue', category: 'Venue', timeframe: '12+ months', priority: 'high' },
  { title: 'Book reception venue', category: 'Venue', timeframe: '12+ months', priority: 'high' },
  { title: 'Hire wedding photographer', category: 'Photography', timeframe: '12+ months', priority: 'high' },
  { title: 'Start guest list', category: 'Guests', timeframe: '12+ months', priority: 'medium' },
  
  // 6-12 months before
  { title: 'Book caterer or wedding cake', category: 'Catering', timeframe: '6-12 months', priority: 'high' },
  { title: 'Hire band or DJ', category: 'Music', timeframe: '6-12 months', priority: 'high' },
  { title: 'Order wedding dress', category: 'Attire', timeframe: '6-12 months', priority: 'high' },
  { title: 'Book florist', category: 'Flowers', timeframe: '6-12 months', priority: 'medium' },
  { title: 'Send save the dates', category: 'Invitations', timeframe: '6-12 months', priority: 'medium' },
  { title: 'Book honeymoon', category: 'Honeymoon', timeframe: '6-12 months', priority: 'medium' },
  
  // 3-6 months before
  { title: 'Order wedding invitations', category: 'Invitations', timeframe: '3-6 months', priority: 'high' },
  { title: 'Plan wedding menu tasting', category: 'Catering', timeframe: '3-6 months', priority: 'medium' },
  { title: 'Shop for wedding rings', category: 'Rings', timeframe: '3-6 months', priority: 'high' },
  { title: 'Book wedding transportation', category: 'Transportation', timeframe: '3-6 months', priority: 'medium' },
  { title: 'Register for gifts', category: 'Gifts', timeframe: '3-6 months', priority: 'low' },
  
  // 1-3 months before
  { title: 'Send wedding invitations', category: 'Invitations', timeframe: '1-3 months', priority: 'high' },
  { title: 'Finalize guest count', category: 'Guests', timeframe: '1-3 months', priority: 'high' },
  { title: 'Plan rehearsal dinner', category: 'Events', timeframe: '1-3 months', priority: 'medium' },
  { title: 'Write wedding vows', category: 'Ceremony', timeframe: '1-3 months', priority: 'medium' },
  { title: 'Apply for marriage license', category: 'Legal', timeframe: '1-3 months', priority: 'high' },
  
  // 1-4 weeks before
  { title: 'Confirm all vendors', category: 'Vendors', timeframe: '1-4 weeks', priority: 'high' },
  { title: 'Final dress fitting', category: 'Attire', timeframe: '1-4 weeks', priority: 'high' },
  { title: 'Pack for honeymoon', category: 'Honeymoon', timeframe: '1-4 weeks', priority: 'medium' },
  { title: 'Prepare welcome bags', category: 'Guests', timeframe: '1-4 weeks', priority: 'low' }
]

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    const checklistItems = await prisma.checklistItem.findMany({
      where: { coupleId: couple.id },
      orderBy: [
        { timeframe: 'desc' },
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    // Calculate progress statistics
    const stats = {
      total: checklistItems.length,
      completed: checklistItems.filter(item => item.isCompleted).length,
      pending: checklistItems.filter(item => !item.isCompleted).length,
      byTimeframe: DEFAULT_CHECKLIST_ITEMS.reduce((acc, item) => {
        const timeframe = item.timeframe
        if (!acc[timeframe]) {
          acc[timeframe] = { total: 0, completed: 0 }
        }
        acc[timeframe].total++
        
        const existing = checklistItems.find(ci => ci.title === item.title)
        if (existing?.isCompleted) {
          acc[timeframe].completed++
        }
        
        return acc
      }, {} as Record<string, { total: number, completed: number }>)
    }

    return NextResponse.json({ items: checklistItems, stats })
  } catch (error) {
    console.error('Error fetching checklist items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (!couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, category, timeframe, priority, dueDate, initializeDefaults } = body

    // If initializing defaults, create all default items
    if (initializeDefaults) {
      const defaultItems = await Promise.all(
        DEFAULT_CHECKLIST_ITEMS.map((item, index) => 
          prisma.checklistItem.create({
            data: {
              coupleId: couple.id,
              title: item.title,
              category: item.category,
              timeframe: item.timeframe,
              priority: item.priority,
              sortOrder: index
            }
          })
        )
      )

      return NextResponse.json(defaultItems)
    }

    // Create single checklist item
    const item = await prisma.checklistItem.create({
      data: {
        coupleId: couple.id,
        title,
        description,
        category: category || 'Other',
        timeframe: timeframe || '1-3 months',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating checklist item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}