/**
 * Guests API - Table assignments
 * GET /api/guests/table-assignments - Get table assignments overview
 * POST /api/guests/table-assignments - Update table assignments
 */

import { NextRequest } from 'next/server'
import { GuestsApiHandler } from '@/features/guests'

const handler = new GuestsApiHandler()

export async function GET(request: NextRequest) {
  return handler.getTableAssignments(request)
}

export async function POST(request: NextRequest) {
  return handler.updateTableAssignments(request)
}