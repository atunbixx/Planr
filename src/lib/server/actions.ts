'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUserCouple } from './db'
import { z } from 'zod'

// Vendor actions
const VendorSchema = z.object({
  name: z.string().min(1).max(255),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['potential', 'contacted', 'quote_requested', 'in_discussion', 'booked', 'completed', 'cancelled']).default('potential'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  rating: z.number().min(1).max(5).optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  contractSigned: z.boolean().default(false)
})

export async function createVendor(data: z.infer<typeof VendorSchema>) {
  try {
    const { coupleId } = await getCurrentUserCouple()
    const validatedData = VendorSchema.parse(data)

    const vendor = await prisma.vendor.create({
      data: {
        ...validatedData,
        coupleId: coupleId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        vendorCategories: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    })

    revalidatePath('/dashboard/vendors')
    return { success: true, data: vendor }
  } catch (error) {
    console.error('Error creating vendor:', error)
    return { success: false, error: 'Failed to create vendor' }
  }
}

export async function updateVendor(id: string, data: Partial<z.infer<typeof VendorSchema>>) {
  try {
    const { coupleId } = await getCurrentUserCouple()
    const validatedData = VendorSchema.partial().parse(data)

    // Verify vendor belongs to user's couple
    const existingVendor = await prisma.vendor.findFirst({
      where: { id, coupleId: coupleId }
    })

    if (!existingVendor) {
      return { success: false, error: 'Vendor not found' }
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        vendorCategories: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true
          }
        }
      }
    })

    revalidatePath('/dashboard/vendors')
    return { success: true, data: vendor }
  } catch (error) {
    console.error('Error updating vendor:', error)
    return { success: false, error: 'Failed to update vendor' }
  }
}

export async function deleteVendor(id: string) {
  try {
    const { coupleId } = await getCurrentUserCouple()

    // Verify vendor belongs to user's couple
    const existingVendor = await prisma.vendor.findFirst({
      where: { id, coupleId: coupleId }
    })

    if (!existingVendor) {
      return { success: false, error: 'Vendor not found' }
    }

    await prisma.vendor.delete({
      where: { id }
    })

    revalidatePath('/dashboard/vendors')
    return { success: true }
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return { success: false, error: 'Failed to delete vendor' }
  }
}

// Guest actions
const GuestSchema = z.object({
  first_name: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  relationship: z.string().max(50).optional(),
  side: z.enum(['bride', 'groom', 'both']).optional(),
  plusOneAllowed: z.boolean().default(false),
  plusOneName: z.string().max(200).optional(),
  dietaryRestrictions: z.string().optional(),
  notes: z.string().optional(),
  age_group: z.enum(['child', 'teen', 'adult', 'senior']).optional(),
  attendingStatus: z.enum(['pending', 'yes', 'no', 'maybe']).default('pending')
})

export async function createGuest(data: z.infer<typeof GuestSchema>) {
  try {
    const { coupleId } = await getCurrentUserCouple()
    const validatedData = GuestSchema.parse(data)

    const guest = await prisma.guest.create({
      data: {
        ...validatedData,
        name: `${validatedData.firstName} ${validatedData.lastName}`.trim(),
        coupleId: coupleId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    revalidatePath('/dashboard/guests')
    return { success: true, data: guest }
  } catch (error) {
    console.error('Error creating guest:', error)
    return { success: false, error: 'Failed to create guest' }
  }
}

export async function updateGuest(id: string, data: Partial<z.infer<typeof GuestSchema>>) {
  try {
    const { coupleId } = await getCurrentUserCouple()
    const validatedData = GuestSchema.partial().parse(data)

    // Verify guest belongs to user's couple
    const existingGuest = await prisma.guest.findFirst({
      where: { id, coupleId: coupleId }
    })

    if (!existingGuest) {
      return { success: false, error: 'Guest not found' }
    }

    // Update name if first_name or last_name changed
    let updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    }

    if (validatedData.firstName || validatedData.lastName) {
      const firstName = validatedData.firstName || existingGuest.firstName
      const lastName = validatedData.lastName || existingGuest.lastName
      updateData.name = `${firstName} ${lastName}`.trim()
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/dashboard/guests')
    return { success: true, data: guest }
  } catch (error) {
    console.error('Error updating guest:', error)
    return { success: false, error: 'Failed to update guest' }
  }
}

export async function deleteGuest(id: string) {
  try {
    const { coupleId } = await getCurrentUserCouple()

    // Verify guest belongs to user's couple
    const existingGuest = await prisma.guest.findFirst({
      where: { id, coupleId: coupleId }
    })

    if (!existingGuest) {
      return { success: false, error: 'Guest not found' }
    }

    await prisma.guest.delete({
      where: { id }
    })

    revalidatePath('/dashboard/guests')
    return { success: true }
  } catch (error) {
    console.error('Error deleting guest:', error)
    return { success: false, error: 'Failed to delete guest' }
  }
}

// Budget actions
const BudgetCategorySchema = z.object({
  name: z.string().min(1).max(255),
  icon: z.string().default('💰'),
  color: z.string().default('#667eea'),
  allocatedAmount: z.number().min(0).default(0),
  priority: z.enum(['low', 'important', 'critical']).default('important'),
  percentageOfTotal: z.number().min(0).max(100).default(0)
})

export async function createBudgetCategory(data: z.infer<typeof BudgetCategorySchema>) {
  try {
    const { coupleId } = await getCurrentUserCouple()
    const validatedData = BudgetCategorySchema.parse(data)

    const category = await prisma.budgetCategory.create({
      data: {
        ...validatedData,
        coupleId: coupleId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    revalidatePath('/dashboard/budget')
    return { success: true, data: category }
  } catch (error) {
    console.error('Error creating budget category:', error)
    return { success: false, error: 'Failed to create budget category' }
  }
}

const BudgetExpenseSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().min(1).max(255),
  amount: z.number().min(0),
  date: z.date(),
  vendorName: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'check', 'bank_transfer', 'other']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional()
})

export async function createBudgetExpense(data: z.infer<typeof BudgetExpenseSchema>) {
  try {
    const { coupleId } = await getCurrentUserCouple()
    const validatedData = BudgetExpenseSchema.parse(data)

    // Verify category belongs to user's couple
    const category = await prisma.budgetCategory.findFirst({
      where: { id: validatedData.categoryId, coupleId: coupleId }
    })

    if (!category) {
      return { success: false, error: 'Budget category not found' }
    }

    // Create expense
    const expense = await prisma.budgetExpense.create({
      data: {
        ...validatedData,
        coupleId: coupleId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Update category spent amount
    await prisma.budgetCategory.update({
      where: { id: validatedData.categoryId },
      data: {
        spentAmount: {
          increment: validatedData.amount
        },
        updatedAt: new Date()
      }
    })

    revalidatePath('/dashboard/budget')
    return { success: true, data: expense }
  } catch (error) {
    console.error('Error creating budget expense:', error)
    return { success: false, error: 'Failed to create budget expense' }
  }
}

// Photo actions
const PhotoSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  altText: z.string().max(255).optional(),
  cloudinarySecureUrl: z.string().url(),
  cloudinaryPublicId: z.string(),
  albumId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  isShared: z.boolean().default(false),
  fileSize: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional()
})

export async function createPhoto(data: z.infer<typeof PhotoSchema>) {
  try {
    const { coupleId } = await getCurrentUserCouple()
    const validatedData = PhotoSchema.parse(data)

    // Verify album belongs to user's couple if album_id provided
    if (validatedData.albumId) {
      const album = await prisma.photoAlbum.findFirst({
        where: { id: validatedData.albumId, coupleId: coupleId }
      })

      if (!album) {
        return { success: false, error: 'Photo album not found' }
      }
    }

    const photo = await prisma.photo.create({
      data: {
        ...validatedData,
        coupleId: coupleId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    revalidatePath('/dashboard/photos')
    return { success: true, data: photo }
  } catch (error) {
    console.error('Error creating photo:', error)
    return { success: false, error: 'Failed to create photo' }
  }
}

// Album actions
const AlbumSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  coverPhotoId: z.string().uuid().optional()
})

export async function createAlbum(data: z.infer<typeof AlbumSchema>) {
  try {
    const { coupleId } = await getCurrentUserCouple()
    const validatedData = AlbumSchema.parse(data)

    const album = await prisma.photoAlbum.create({
      data: {
        ...validatedData,
        coupleId: coupleId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    revalidatePath('/dashboard/photos')
    return { success: true, data: album }
  } catch (error) {
    console.error('Error creating album:', error)
    return { success: false, error: 'Failed to create album' }
  }
}