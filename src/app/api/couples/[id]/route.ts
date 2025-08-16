/**
 * Couples API - Individual couple management
 * GET /api/couples/[id] - Get couple by ID
 * PATCH /api/couples/[id] - Update couple profile
 * DELETE /api/couples/[id] - Delete couple profile
 */

import { NextRequest } from 'next/server'
import { CouplesApiHandler } from '@/features/couples'

const handler = new CouplesApiHandler()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.getCoupleById(request, resolvedParams)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.updateCouple(request, resolvedParams)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return handler.deleteCouple(request, resolvedParams)
}