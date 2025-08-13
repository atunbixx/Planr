/**
 * Vendors API - Statistics endpoint
 * GET /api/vendors/stats - Get vendor statistics
 */

import { NextRequest } from 'next/server'
import { VendorsApiHandler } from '@/features/vendors'

const handler = new VendorsApiHandler()

export async function GET(request: NextRequest) {
  return handler.getVendorStats(request)
}