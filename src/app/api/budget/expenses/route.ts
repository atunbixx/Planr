import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

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

    const expenses = await prisma.budgetExpense.findMany({
      where: { coupleId: couple.id },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        },
        vendor: {
          select: {
            businessName: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching budget expenses:', error)
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
    const { name, amount, categoryId, vendorId, description, date, isPaid } = body

    const expense = await prisma.budgetExpense.create({
      data: {
        coupleId: couple.id,
        categoryId,
        vendorId: vendorId || null,
        name,
        amount: Number(amount),
        description,
        date: date ? new Date(date) : new Date(),
        isPaid: isPaid || false
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        },
        vendor: {
          select: {
            businessName: true
          }
        }
      }
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error creating budget expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}