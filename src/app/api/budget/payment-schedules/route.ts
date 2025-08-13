'use server'

import { NextRequest, NextResponse } from 'next/server'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { VendorRepository } from '@/features/vendors/repo'
import { BudgetCategoryRepository, BudgetExpenseRepository } from '@/features/budget/repo'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const coupleRepository = new CoupleRepository()
const vendorRepository = new VendorRepository()
const budgetCategoryRepository = new BudgetCategoryRepository()
const budgetExpenseRepository = new BudgetExpenseRepository()

// Validation schemas
const paymentItemSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  amount: z.number().min(0),
  dueDate: z.string(),
  status: z.enum(['pending', 'paid', 'overdue']),
  notes: z.string().optional()
})

const paymentScheduleSchema = z.object({
  vendorId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  totalAmount: z.number().min(0),
  currency: z.string().default('USD'),
  schedule: z.array(paymentItemSchema).min(1)
})

async function getCoupleId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Find couple by user ID using repository
  const couple = await coupleRepository.findByUserId(user.id)

  if (!couple) {
    throw new Error('No couple found for user')
  }

  return couple.id
}

export async function GET(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    
    const url = new URL(request.url)
    const vendorId = url.searchParams.get('vendorId')
    const categoryId = url.searchParams.get('categoryId')

    // For now, we'll store payment schedules in a JSON field in existing tables
    // In a production app, you'd want a dedicated payment_schedules table
    
    let paymentSchedules: any[] = []

    if (vendorId) {
      // Get payment schedules from vendor using repository
      const vendor = await vendorRepository.findById(vendorId)
      
      if (vendor && vendor.coupleId === coupleId && vendor.paymentSchedule) {
        paymentSchedules.push({
          id: `vendor_${vendorId}`,
          vendorId: vendorId,
          vendorName: vendor.name,
          totalAmount: vendor.estimatedCost || 0,
          currency: 'USD',
          schedule: Array.isArray(vendor.paymentSchedule) ? vendor.paymentSchedule : []
        })
      }
    }

    if (categoryId) {
      // Get payment schedules from budget category using repository
      const category = await budgetCategoryRepository.findById(categoryId)
      
      if (!category || category.coupleId !== coupleId) {
        // Skip if category doesn't belong to this couple
        return NextResponse.json({
          success: true,
          data: paymentSchedules
        })
      }
      
      // Get pending expenses for this category
      const expenses = await budgetExpenseRepository.findByCategoryId(categoryId, {
        paymentStatus: ['pending', 'deposit_paid', 'partial'],
        orderBy: 'dueDate'
      })

      // Create schedule from upcoming expenses
      const schedule = expenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: Number(expense.amount),
        dueDate: expense.dueDate?.toISOString().split('T')[0] || '',
        status: expense.paymentStatus === 'pending' ? 'pending' : 
                expense.paymentStatus === 'deposit_paid' ? 'paid' : 'pending',
        notes: expense.notes
      }))

      paymentSchedules.push({
        id: `category_${categoryId}`,
        categoryId: categoryId,
        categoryName: category.name,
        totalAmount: Number(category.allocatedAmount || 0),
        currency: 'USD',
        schedule: schedule
      })
    }

    return NextResponse.json({
      success: true,
      data: paymentSchedules
    })
  } catch (error) {
    console.error('Error fetching payment schedules:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment schedules'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    const body = await request.json()
    
    const validatedData = paymentScheduleSchema.parse(body)

    if (validatedData.vendorId) {
      // Update vendor payment schedule using repository
      const vendor = await vendorRepository.findById(validatedData.vendorId)
      if (!vendor || vendor.coupleId !== coupleId) {
        return NextResponse.json({
          success: false,
          error: 'Vendor not found'
        }, { status: 404 })
      }
      
      await vendorRepository.update(validatedData.vendorId, {
        paymentSchedule: validatedData.schedule,
        estimatedCost: validatedData.totalAmount
      })

      return NextResponse.json({
        success: true,
        data: {
          id: `vendor_${validatedData.vendorId}`,
          ...validatedData
        }
      })
    }

    if (validatedData.categoryId) {
      // Verify category belongs to couple
      const category = await budgetCategoryRepository.findById(validatedData.categoryId)
      if (!category || category.coupleId !== coupleId) {
        return NextResponse.json({
          success: false,
          error: 'Category not found'
        }, { status: 404 })
      }
      
      // Delete existing pending expenses to replace with new schedule
      await budgetExpenseRepository.deletePendingByCategoryId(validatedData.categoryId)

      // Create new expenses for each payment using repository
      const pendingPayments = validatedData.schedule.filter(item => item.status === 'pending')
      
      for (const item of pendingPayments) {
        await budgetExpenseRepository.create({
          coupleId: coupleId,
          categoryId: validatedData.categoryId!,
          description: item.description,
          amount: item.amount,
          dueDate: new Date(item.dueDate),
          paymentStatus: 'pending',
          notes: item.notes,
          expenseType: 'planned'
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          id: `category_${validatedData.categoryId}`,
          ...validatedData
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Either vendorId or categoryId must be provided'
    }, { status: 400 })

  } catch (error) {
    console.error('Error creating payment schedule:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data provided',
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment schedule'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Schedule ID is required'
      }, { status: 400 })
    }

    const validatedData = paymentScheduleSchema.parse(updateData)

    if (id.startsWith('vendor_')) {
      const vendorId = id.replace('vendor_', '')
      const vendor = await vendorRepository.findById(vendorId)
      if (!vendor || vendor.coupleId !== coupleId) {
        return NextResponse.json({
          success: false,
          error: 'Vendor not found'
        }, { status: 404 })
      }
      
      await vendorRepository.update(vendorId, {
        paymentSchedule: validatedData.schedule,
        estimatedCost: validatedData.totalAmount
      })
    } else if (id.startsWith('category_')) {
      const categoryId = id.replace('category_', '')
      
      // Verify category belongs to couple
      const category = await budgetCategoryRepository.findById(categoryId)
      if (!category || category.coupleId !== coupleId) {
        return NextResponse.json({
          success: false,
          error: 'Category not found'
        }, { status: 404 })
      }
      
      // Update existing expenses and create new ones as needed
      await budgetExpenseRepository.deletePendingByCategoryId(categoryId)

      const pendingPayments = validatedData.schedule.filter(item => item.status === 'pending')
      for (const item of pendingPayments) {
        await budgetExpenseRepository.create({
          coupleId: coupleId,
          categoryId: categoryId,
          description: item.description,
          amount: item.amount,
          dueDate: new Date(item.dueDate),
          paymentStatus: 'pending',
          notes: item.notes,
          expenseType: 'planned'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: { id, ...validatedData }
    })

  } catch (error) {
    console.error('Error updating payment schedule:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data provided',
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payment schedule'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const coupleId = await getCoupleId()
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Schedule ID is required'
      }, { status: 400 })
    }

    if (id.startsWith('vendor_')) {
      const vendorId = id.replace('vendor_', '')
      const vendor = await vendorRepository.findById(vendorId)
      if (!vendor || vendor.coupleId !== coupleId) {
        return NextResponse.json({
          success: false,
          error: 'Vendor not found'
        }, { status: 404 })
      }
      
      await vendorRepository.update(vendorId, {
        paymentSchedule: []
      })
    } else if (id.startsWith('category_')) {
      const categoryId = id.replace('category_', '')
      const category = await budgetCategoryRepository.findById(categoryId)
      if (!category || category.coupleId !== coupleId) {
        return NextResponse.json({
          success: false,
          error: 'Category not found'
        }, { status: 404 })
      }
      
      await budgetExpenseRepository.deletePendingByCategoryId(categoryId)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment schedule deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting payment schedule:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete payment schedule'
    }, { status: 500 })
  }
}