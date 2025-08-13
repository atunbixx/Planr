/**
 * Couples API - Individual couple management
 * GET /api/couples/[id] - Get couple by ID
 * PATCH /api/couples/[id] - Update couple profile
 * DELETE /api/couples/[id] - Delete couple profile
 */

import { NextRequest } from 'next/server'
import { CouplesApiHandler } from '@/features/couples'

const handler = new CouplesApiHandler()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return handler.getCoupleById(request, params)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return handler.updateCouple(request, params)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return handler.deleteCouple(request, params)
}