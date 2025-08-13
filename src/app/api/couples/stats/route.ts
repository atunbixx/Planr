/**
 * Couples API - Statistics endpoint
 * GET /api/couples/stats - Get couple statistics (Admin only)
 */

import { NextRequest } from 'next/server'
import { CouplesApiHandler } from '@/features/couples'

const handler = new CouplesApiHandler()

export async function GET(request: NextRequest) {
  return handler.getCoupleStats(request)
}