/**
 * Couples API - Current user's couple profile
 * GET /api/couples/me - Get current user's couple profile
 */

import { NextRequest } from 'next/server'
import { CouplesApiHandler } from '@/features/couples'

const handler = new CouplesApiHandler()

export async function GET(request: NextRequest) {
  return handler.getCurrentCouple(request)
}