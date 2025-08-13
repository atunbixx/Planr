/**
 * Vendors API - Category filtering
 * GET /api/vendors/category/[category] - Get vendors by category
 */

import { NextRequest } from 'next/server'
import { VendorsApiHandler } from '@/features/vendors'

const handler = new VendorsApiHandler()

export async function GET(request: NextRequest, { params }: { params: { category: string } }) {
  return handler.getVendorsByCategory(request, params)
}