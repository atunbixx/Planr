/**
 * Couples API - Main couple profile management
 * POST /api/couples - Create couple profile (onboarding)
 * GET /api/couples - Search couples (Admin only)
 */

import { NextRequest } from 'next/server'
import { CouplesApiHandler } from '@/features/couples'

const handler = new CouplesApiHandler()

export async function POST(request: NextRequest) {
  return handler.createCouple(request)
}

export async function GET(request: NextRequest) {
  return handler.searchCouples(request)
}