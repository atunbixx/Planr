/**
 * Vendors API - Upcoming deadlines
 * GET /api/vendors/deadlines - Get vendors with upcoming deadlines
 */

import { NextRequest } from 'next/server'
import { VendorsApiHandler } from '@/features/vendors'

const handler = new VendorsApiHandler()

export async function GET(request: NextRequest) {
  return handler.getVendorsWithUpcomingDeadlines(request)
}