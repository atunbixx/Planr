import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// Vendor categories with icons
const VENDOR_CATEGORIES = [
  { name: 'Venue', icon: '🏛️' },
  { name: 'Catering', icon: '🍽️' },
  { name: 'Photography', icon: '📸' },
  { name: 'Videography', icon: '🎥' },
  { name: 'Music/DJ', icon: '🎵' },
  { name: 'Flowers', icon: '💐' },
  { name: 'Transportation', icon: '🚗' },
  { name: 'Wedding Cake', icon: '🎂' },
  { name: 'Hair & Makeup', icon: '💄' },
  { name: 'Officiant', icon: '👨‍💼' },
  { name: 'Decorations', icon: '🎀' },
  { name: 'Other', icon: '📝' }
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

    const vendors = await prisma.vendor.findMany({
      where: { coupleId: couple.id },
      orderBy: [
        { category: 'asc' },
        { businessName: 'asc' }
      ]
    })

    // Calculate statistics by status
    const stats = {
      total: vendors.length,
      potential: vendors.filter(v => v.status === 'potential').length,
      contacted: vendors.filter(v => v.status === 'contacted').length,
      quoted: vendors.filter(v => v.status === 'quoted').length,
      booked: vendors.filter(v => v.status === 'booked').length,
      completed: vendors.filter(v => v.status === 'completed').length
    }

    // Calculate total costs
    const costs = {
      estimated: vendors.reduce((sum, v) => sum + Number(v.estimatedCost || 0), 0),
      actual: vendors.reduce((sum, v) => sum + Number(v.actualCost || 0), 0)
    }

    return NextResponse.json({ vendors, stats, costs })
  } catch (error) {
    console.error('Error fetching vendors:', error)
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
    const { 
      businessName, 
      contactName, 
      email, 
      phone, 
      website, 
      category, 
      status, 
      estimatedCost, 
      actualCost, 
      contractSigned, 
      notes 
    } = body

    const vendor = await prisma.vendor.create({
      data: {
        coupleId: couple.id,
        businessName,
        contactName,
        email,
        phone,
        website,
        category,
        status: status || 'potential',
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        actualCost: actualCost ? Number(actualCost) : null,
        contractSigned: contractSigned || false,
        notes
      }
    })

    return NextResponse.json(vendor)
  } catch (error) {
    console.error('Error creating vendor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}