/**
 * Couples API - Upcoming weddings
 * GET /api/couples/upcoming - Get upcoming weddings
 */

import { NextRequest } from 'next/server'
import { CouplesApiHandler } from '@/features/couples'

const handler = new CouplesApiHandler()

export async function GET(request: NextRequest) {
  return handler.getUpcomingWeddings(request)
}