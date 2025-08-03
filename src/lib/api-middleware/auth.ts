import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createErrorResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    return {
      authenticated: false,
      response: createErrorResponse('Authentication required', 401)
    }
  }
  
  return {
    authenticated: true,
    user: session.user
  }
}

export async function requireCoupleAuth(request: NextRequest) {
  const authResult = await requireAuth(request)
  
  if (!authResult.authenticated) {
    return authResult
  }
  
  const couple = await prisma.couples.findFirst({
    where: {
      OR: [
        { partner1_user_id: authResult.user.id },
        { partner2_user_id: authResult.user.id }
      ]
    }
  })
  
  if (!couple) {
    return {
      authenticated: false,
      response: createErrorResponse('Couple profile not found', 404)
    }
  }
  
  return {
    authenticated: true,
    user: authResult.user,
    couple
  }
}

export async function requireVendorAuth(vendorId: string, userId: string) {
  const vendorUser = await prisma.vendor_users.findFirst({
    where: {
      vendor_id: vendorId,
      user_id: userId
    }
  })
  
  if (!vendorUser) {
    return {
      authorized: false,
      response: createErrorResponse('Not authorized to modify this vendor', 403)
    }
  }
  
  return {
    authorized: true,
    role: vendorUser.role
  }
}

export async function requireCoupleVendorAuth(coupleId: string, vendorId: string) {
  const vendor = await prisma.vendors.findFirst({
    where: {
      id: vendorId,
      couple_id: coupleId
    }
  })
  
  if (!vendor) {
    return {
      authorized: false,
      response: createErrorResponse('Vendor not found or not authorized', 404)
    }
  }
  
  return {
    authorized: true,
    vendor
  }
}