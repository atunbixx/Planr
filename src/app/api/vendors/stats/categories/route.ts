/**
 * Vendors API - Category statistics
 * GET /api/vendors/stats/categories - Get vendor statistics by category
 */

import { NextRequest } from 'next/server'
import { VendorsApiHandler } from '@/features/vendors'

const handler = new VendorsApiHandler()

export async function GET(request: NextRequest) {
  return handler.getVendorStatsByCategory(request)
}