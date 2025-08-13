/**
 * Vendors API - Main vendor management
 * GET /api/vendors - Get vendors for current user's couple
 * POST /api/vendors - Create vendor
 */

import { NextRequest } from 'next/server'
import { VendorsApiHandler } from '@/features/vendors'

const handler = new VendorsApiHandler()

export async function GET(request: NextRequest) {
  return handler.getVendors(request)
}

export async function POST(request: NextRequest) {
  return handler.createVendor(request)
}